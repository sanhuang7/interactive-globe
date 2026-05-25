import { Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { ShaderProgram } from '../engine/Shader'
import { createMesh, GLMesh, drawMesh, disposeMesh } from '../engine/Mesh'
import { mat4 } from '../engine/math'
import { cloudVert, cloudFrag } from './shaders'

export class CloudLayer implements Renderable {
  gl: WebGL2RenderingContext
  program: ShaderProgram
  mesh: GLMesh
  modelMatrix: mat4
  radius: number
  cloudCover: number = 0.6
  rotationSpeed: number = 0.003

  constructor(gl: WebGL2RenderingContext, radius = 1.5, segments = 48) {
    this.gl = gl
    this.radius = radius
    this.program = new ShaderProgram(gl, cloudVert, cloudFrag)
    this.modelMatrix = mat4.create()

    const { positions, normals, uvs, indices } = this.buildSphere(radius * 1.03, segments, segments / 2)
    this.mesh = createMesh(gl, this.program, [
      { name: 'a_position', data: positions, size: 3 },
      { name: 'a_normal', data: normals, size: 3 },
      { name: 'a_uv', data: uvs, size: 2 },
    ], indices)
  }

  private buildSphere(r: number, segs: number, rings: number) {
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let y = 0; y <= rings; y++) {
      const phi = Math.PI * y / rings
      for (let x = 0; x <= segs; x++) {
        const theta = 2 * Math.PI * x / segs
        const px = -r * Math.sin(phi) * Math.cos(theta)
        const py = r * Math.cos(phi)
        const pz = r * Math.sin(phi) * Math.sin(theta)
        positions.push(px, py, pz)
        const len = Math.sqrt(px * px + py * py + pz * pz)
        normals.push(px / len, py / len, pz / len)
        uvs.push(x / segs, y / rings)
      }
    }

    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < segs; x++) {
        const a = y * (segs + 1) + x
        const b = a + segs + 1
        indices.push(a, b, a + 1)
        indices.push(a + 1, b, b + 1)
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices),
    }
  }

  render(gl: WebGL2RenderingContext, camera: Camera, time: number, viewProj: mat4): void {
    // Rotate clouds slowly for animation
    const rotY = mat4.create()
    mat4.fromRotation([0, 1, 0], time * this.rotationSpeed, rotY)
    const cloudModel = mat4.create()
    mat4.multiply(rotY, this.modelMatrix, cloudModel)

    const p = this.program
    p.use()

    const mvp = mat4.create()
    mat4.multiply(viewProj, cloudModel, mvp)

    const mv = mat4.create()
    mat4.multiply(camera.viewMatrix, cloudModel, mv)

    const nm = new Float32Array([
      mv[0], mv[1], mv[2],
      mv[4], mv[5], mv[6],
      mv[8], mv[9], mv[10],
    ])

    p.uniform('u_modelViewProj', mvp)
    p.uniform('u_modelView', mv)
    p.uniform('u_normalMatrix', nm)
    p.uniform('u_time', time)
    p.uniform('u_cloudCover', this.cloudCover)
    p.uniform('u_lightDir', new Float32Array([1, 0.5, 1]))
    p.uniform('u_lightColor', new Float32Array([1, 0.95, 0.85]))
    p.uniform('u_ambientColor', new Float32Array([0.08, 0.12, 0.25]))

    gl.depthMask(false)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    drawMesh(gl, this.mesh)

    gl.depthMask(true)
  }

  dispose(gl: WebGL2RenderingContext): void {
    this.program.dispose()
    disposeMesh(gl, this.mesh)
  }
}
