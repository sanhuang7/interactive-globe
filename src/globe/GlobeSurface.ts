import { Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { ShaderProgram } from '../engine/Shader'
import { createMesh, GLMesh, drawMesh, disposeMesh } from '../engine/Mesh'
import { mat4, vec3 } from '../engine/math'
import { earthVert, earthFrag } from './shaders'
import { createWorldTexture } from './WorldTexture'

export class GlobeSurface implements Renderable {
  gl: WebGL2RenderingContext
  program: ShaderProgram
  mesh: GLMesh
  modelMatrix: mat4
  radius: number
  texture: WebGLTexture | null = null
  private _loggedTex = false

  constructor(gl: WebGL2RenderingContext, radius = 1.5, segments = 64) {
    this.gl = gl
    this.radius = radius
    this.program = new ShaderProgram(gl, earthVert, earthFrag)
    this.modelMatrix = mat4.create()

    // Generate world map texture
    this.texture = createWorldTexture(gl)

    const { positions, normals, uvs, indices } = this.buildSphere(radius, segments, segments / 2)
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
    const p = this.program
    p.use()

    const mvp = mat4.create()
    mat4.multiply(viewProj, this.modelMatrix, mvp)

    const mv = mat4.create()
    mat4.multiply(camera.viewMatrix, this.modelMatrix, mv)

    const nm = mat4.create()
    mat4.multiply(camera.viewMatrix, this.modelMatrix, nm)
    const normalMatrix = new Float32Array([
      nm[0], nm[1], nm[2],
      nm[4], nm[5], nm[6],
      nm[8], nm[9], nm[10],
    ])

    p.uniform('u_modelViewProj', mvp)
    p.uniform('u_modelView', mv)
    p.uniform('u_normalMatrix', normalMatrix)
    p.uniform('u_lightDir', new Float32Array([1, 0.5, 1]))
    p.uniform('u_lightColor', new Float32Array([1, 0.95, 0.85]))
    p.uniform('u_ambientColor', new Float32Array([0.35, 0.38, 0.45]))
    p.uniform('u_time', time)

    // Bind world texture via shader uniform
    if (this.texture) {
      const result = p.uniform('u_earthTex', this.texture)
      if (!this._loggedTex) {
        console.log('[GlobeSurface] Texture uniform set, tex valid:', !!this.texture)
        this._loggedTex = true
      }
    } else {
      // Fallback: generate texture on first render if needed
      this.texture = createWorldTexture(gl)
      if (this.texture) p.uniform('u_earthTex', this.texture)
    }

    drawMesh(gl, this.mesh)
  }

  dispose(gl: WebGL2RenderingContext): void {
    this.program.dispose()
    disposeMesh(gl, this.mesh)
    if (this.texture) gl.deleteTexture(this.texture)
  }
}
