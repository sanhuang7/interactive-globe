import { ShaderProgram } from './Shader'

export interface Attribute {
  name: string
  data: Float32Array
  size: number
  divisor?: number
}

export interface GLMesh {
  vao: WebGLVertexArrayObject
  vertexCount: number
  indexBuffer?: WebGLBuffer
  indexCount?: number
  mode: number
  attributes: Attribute[]
}

export function createMesh(
  gl: WebGL2RenderingContext,
  program: ShaderProgram,
  attributes: Attribute[],
  indices?: Uint16Array | Uint32Array,
  mode: number = gl.TRIANGLES
): GLMesh {
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)

  for (const attr of attributes) {
    const loc = program.getAttribLocation(attr.name)
    if (loc === -1) continue

    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, 0, 0)
    if (attr.divisor !== undefined) {
      gl.vertexAttribDivisor(loc, attr.divisor)
    }
  }

  let indexBuffer: WebGLBuffer | undefined
  let indexCount = 0
  if (indices) {
    indexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
    indexCount = indices.length
  }

  gl.bindVertexArray(null)

  const vertexCount = indices ? indexCount : attributes[0].data.length / attributes[0].size

  return { vao, vertexCount, indexBuffer, indexCount, mode, attributes }
}

export function drawMesh(gl: WebGL2RenderingContext, mesh: GLMesh, instances = 0): void {
  gl.bindVertexArray(mesh.vao)
  if (mesh.indexBuffer) {
    if (instances > 0) {
      gl.drawElementsInstanced(mesh.mode, mesh.indexCount!, gl.UNSIGNED_SHORT, 0, instances)
    } else {
      gl.drawElements(mesh.mode, mesh.indexCount!, gl.UNSIGNED_SHORT, 0)
    }
  } else {
    if (instances > 0) {
      gl.drawArraysInstanced(mesh.mode, 0, mesh.vertexCount, instances)
    } else {
      gl.drawArrays(mesh.mode, 0, mesh.vertexCount)
    }
  }
  gl.bindVertexArray(null)
}

export function disposeMesh(gl: WebGL2RenderingContext, mesh: GLMesh): void {
  gl.deleteVertexArray(mesh.vao)
  if (mesh.indexBuffer) gl.deleteBuffer(mesh.indexBuffer)
}
