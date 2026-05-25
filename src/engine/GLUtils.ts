export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}\n${source.slice(0, 500)}`)
  }
  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog)
    gl.deleteProgram(prog)
    throw new Error(`Program link error: ${info}`)
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return prog
}

export function createBuffer(
  gl: WebGL2RenderingContext,
  data: Float32Array | Uint16Array,
  target: number = gl.ARRAY_BUFFER,
  usage: number = gl.STATIC_DRAW
): WebGLBuffer {
  const buf = gl.createBuffer()!
  gl.bindBuffer(target, buf)
  gl.bufferData(target, data, usage)
  return buf
}

export function createVAO(
  gl: WebGL2RenderingContext,
  setup: () => void
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  setup()
  gl.bindVertexArray(null)
  return vao
}

export function createTexture2D(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number,
  width: number,
  height: number,
  data: ArrayBufferView | null,
  wrap: number = gl.CLAMP_TO_EDGE,
  filter: number = gl.LINEAR
): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  return tex
}

export function checkGLError(gl: WebGL2RenderingContext, label?: string): void {
  const err = gl.getError()
  if (err !== gl.NO_ERROR) {
    const errors: Record<number, string> = {
      [gl.INVALID_ENUM]: 'INVALID_ENUM',
      [gl.INVALID_VALUE]: 'INVALID_VALUE',
      [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
    }
    console.warn(`WebGL Error${label ? ` [${label}]` : ''}: ${errors[err] ?? err}`)
  }
}

export function loadImageTexture(
  gl: WebGL2RenderingContext,
  url: string
): Promise<WebGLTexture | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const tex = createTexture2D(
        gl, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img.width, img.height, null, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR
      )
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
      resolve(tex)
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function createFramebuffer(
  gl: WebGL2RenderingContext,
  colorTex: WebGLTexture,
  depthTex?: WebGLTexture
): WebGLFramebuffer {
  const fb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0)
  if (depthTex) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return fb
}
