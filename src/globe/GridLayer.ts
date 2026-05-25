import { Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { ShaderProgram } from '../engine/Shader'
import { createMesh, GLMesh, drawMesh, disposeMesh } from '../engine/Mesh'
import { mat4 } from '../engine/math'
import { gridVert, gridFrag } from './shaders'

export class GridLayer implements Renderable {
  gl: WebGL2RenderingContext
  program: ShaderProgram
  mesh: GLMesh
  modelMatrix: mat4
  radius: number

  constructor(gl: WebGL2RenderingContext, radius = 1.5) {
    this.gl = gl
    this.radius = radius
    this.program = new ShaderProgram(gl, gridVert, gridFrag)
    this.modelMatrix = mat4.create()

    const { positions, indices } = this.buildWireframe(radius * 1.002, 72, 36)
    this.mesh = createMesh(gl, this.program, [
      { name: 'a_position', data: positions, size: 3 },
    ], indices, gl.LINES)
  }

  private buildWireframe(r: number, segs: number, rings: number) {
    const positions: number[] = []
    const indices: number[] = []

    for (let y = 0; y <= rings; y++) {
      const phi = Math.PI * y / rings
      for (let x = 0; x <= segs; x++) {
        const theta = 2 * Math.PI * x / segs
        positions.push(
          -r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        )
      }
    }

    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < segs; x++) {
        const a = y * (segs + 1) + x
        const b = a + segs + 1
        indices.push(a, b)
        indices.push(a, a + 1)
      }
    }

    return {
      positions: new Float32Array(positions),
      indices: new Uint16Array(indices),
    }
  }

  render(gl: WebGL2RenderingContext, camera: Camera, time: number, viewProj: mat4): void {
    const p = this.program
    p.use()

    const mvp = mat4.create()
    mat4.multiply(viewProj, this.modelMatrix, mvp)

    p.uniform('u_modelViewProj', mvp)
    p.uniform('u_gridColor', new Float32Array([0.25, 0.35, 0.55]))

    gl.depthMask(true)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    drawMesh(gl, this.mesh)

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  dispose(gl: WebGL2RenderingContext): void {
    this.program.dispose()
    disposeMesh(gl, this.mesh)
  }
}
