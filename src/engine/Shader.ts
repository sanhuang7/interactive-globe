import { createProgram, createShader } from './GLUtils'

type UniformType = '1f' | '1i' | '2f' | '3f' | '4f' | 'mat3' | 'mat4' | 'tex'

interface UniformInfo {
  location: WebGLUniformLocation | null
  type: UniformType
}

export class ShaderProgram {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  private uniforms: Map<string, UniformInfo> = new Map()
  private attributes: Map<string, number> = new Map()

  constructor(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string) {
    this.gl = gl
    this.program = createProgram(gl, vertSrc, fragSrc)
    this.reflect()
  }

  private reflect(): void {
    const gl = this.gl
    const p = this.program

    const numUniforms = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(p, i)
      if (!info) continue
      const loc = gl.getUniformLocation(p, info.name)
      let type: UniformType = '1f'
      switch (info.type) {
        case gl.FLOAT: type = '1f'; break
        case gl.FLOAT_VEC2: type = '2f'; break
        case gl.FLOAT_VEC3: type = '3f'; break
        case gl.FLOAT_VEC4: type = '4f'; break
        case gl.FLOAT_MAT3: type = 'mat3'; break
        case gl.FLOAT_MAT4: type = 'mat4'; break
        case gl.SAMPLER_2D: type = 'tex'; break
        case gl.INT: case gl.BOOL: type = '1i'; break
      }
      this.uniforms.set(info.name, { location: loc, type })
    }
    // Log texture uniforms for debugging
    const texUniforms = [...this.uniforms.entries()].filter(([, v]) => v.type === 'tex').map(([k]) => k)
    if (texUniforms.length > 0) {
      console.log(`[Shader] Texture uniforms found:`, texUniforms)
    }

    const numAttribs = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES)
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(p, i)
      if (!info) continue
      this.attributes.set(info.name, gl.getAttribLocation(p, info.name))
    }
  }

  use(): void {
    this.gl.useProgram(this.program)
  }

  uniform(name: string, value: Float32Array | Array<number> | number | WebGLTexture): void {
    const u = this.uniforms.get(name)
    if (!u || u.location === null) return
    const gl = this.gl

    switch (u.type) {
      case '1f':
        gl.uniform1f(u.location, value as number)
        break
      case '1i':
        gl.uniform1i(u.location, value as number)
        break
      case '2f': {
        const v = value as Array<number> | Float32Array
        gl.uniform2f(u.location, v[0], v[1])
        break
      }
      case '3f': {
        const v = value as Array<number> | Float32Array
        gl.uniform3f(u.location, v[0], v[1], v[2])
        break
      }
      case '4f': {
        const v = value as Array<number> | Float32Array
        gl.uniform4f(u.location, v[0], v[1], v[2], v[3])
        break
      }
      case 'mat3':
        gl.uniformMatrix3fv(u.location, false, value as Float32Array)
        break
      case 'mat4':
        gl.uniformMatrix4fv(u.location, false, value as Float32Array)
        break
      case 'tex': {
        if (!(value instanceof WebGLTexture)) return
        // Find this uniform's index among all texture uniforms
        const texNames: string[] = []
        for (const [k, v] of this.uniforms) {
          if (v.type === 'tex') texNames.push(k)
        }
        const texIdx = texNames.indexOf(name)
        if (texIdx < 0) {
          console.warn(`[Shader] Texture uniform '${name}' not found in:`, texNames)
          return
        }
        gl.activeTexture(gl.TEXTURE0 + texIdx)
        gl.bindTexture(gl.TEXTURE_2D, value)
        gl.uniform1i(u.location, texIdx)
        const err = gl.getError()
        if (err !== gl.NO_ERROR) {
          console.error(`[Shader] Error setting texture '${name}' at unit ${texIdx}:`, err)
        }
        break
      }
    }
  }

  getAttribLocation(name: string): number {
    return this.attributes.get(name) ?? -1
  }

  dispose(): void {
    this.gl.deleteProgram(this.program)
  }
}
