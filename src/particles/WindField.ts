import { Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { ShaderProgram } from '../engine/Shader'
import { mat4, vec3 } from '../engine/math'
import { windVert, windFrag } from './shaders'

interface Particle {
  position: vec3
  velocity: vec3
  life: number
  size: number
}

/**
 * GPU-accelerated wind field particle system.
 * Simulates swirling wind patterns around a center point (typhoon/hurricane).
 * Uses instanced rendering for performance.
 */
export class WindField implements Renderable {
  gl: WebGL2RenderingContext
  program: ShaderProgram
  modelMatrix: mat4
  radius: number

  particleCount: number
  private particles: Float32Array // [pos(3), vel(3), life(1), size(1)] * N
  private posBuffer: WebGLBuffer | null = null
  private vao: WebGLVertexArrayObject | null = null

  // Wind field parameters
  centerLat = 25
  centerLng = 130
  fieldRadius = 3.0 // in world units
  fieldStrength = 1.0
  spiralFactor = 0.8
  color: [number, number, number] = [0.8, 0.9, 1.0]

  enabled = false

  constructor(gl: WebGL2RenderingContext, particleCount = 2000, radius = 1.5) {
    this.gl = gl
    this.radius = radius
    this.particleCount = particleCount
    this.program = new ShaderProgram(gl, windVert, windFrag)
    this.modelMatrix = mat4.create()

    this.particles = new Float32Array(particleCount * 8) // pos(3) + vel(3) + life(1) + size(1)

    this.initParticles()
    this.setupBuffers()
  }

  private initParticles(): void {
    const particles = this.particles
    const center = this.latLngToVec3(this.centerLat, this.centerLng)

    for (let i = 0; i < this.particleCount; i++) {
      const offset = i * 8
      // Random position within field radius around center
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * this.fieldRadius
      const height = (Math.random() - 0.5) * this.fieldRadius * 0.5

      // Generate position on a tangent plane around center
      const up: vec3 = vec3.create(0, 1, 0)
      const radial = vec3.create(Math.cos(angle), 0, Math.sin(angle))
      vec3.normalize(radial, radial)

      const pos = vec3.create(
        center[0] + radial[0] * dist,
        center[1] + height,
        center[2] + radial[2] * dist
      )

      // Tangential velocity (spiral)
      const tangent = vec3.create(-radial[2], 0, radial[0])
      const speed = (1 - dist / this.fieldRadius) * this.fieldStrength
      const vel = vec3.create(
        tangent[0] * speed * this.spiralFactor + radial[0] * speed * 0.3,
        (Math.random() - 0.5) * 0.2,
        tangent[2] * speed * this.spiralFactor + radial[2] * speed * 0.3
      )

      particles[offset] = pos[0]
      particles[offset + 1] = pos[1]
      particles[offset + 2] = pos[2]
      particles[offset + 3] = vel[0]
      particles[offset + 4] = vel[1]
      particles[offset + 5] = vel[2]
      particles[offset + 6] = Math.random() // life
      particles[offset + 7] = 0.02 + Math.random() * 0.04 // size
    }
  }

  private latLngToVec3(lat: number, lng: number): vec3 {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return vec3.create(
      -this.radius * Math.sin(phi) * Math.cos(theta),
      this.radius * Math.cos(phi),
      this.radius * Math.sin(phi) * Math.sin(theta)
    )
  }

  private setupBuffers(): void {
    const gl = this.gl
    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)

    this.posBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.particles, gl.DYNAMIC_DRAW)

    // Position: 3 floats, offset 0
    const posLoc = this.program.getAttribLocation('a_position')
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 32, 0)
    }

    // Velocity: 3 floats, offset 12
    const velLoc = this.program.getAttribLocation('a_velocity')
    if (velLoc >= 0) {
      gl.enableVertexAttribArray(velLoc)
      gl.vertexAttribPointer(velLoc, 3, gl.FLOAT, false, 32, 12)
    }

    // Life: 1 float, offset 24
    const lifeLoc = this.program.getAttribLocation('a_life')
    if (lifeLoc >= 0) {
      gl.enableVertexAttribArray(lifeLoc)
      gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 32, 24)
    }

    // Size: 1 float, offset 28
    const sizeLoc = this.program.getAttribLocation('a_size')
    if (sizeLoc >= 0) {
      gl.enableVertexAttribArray(sizeLoc)
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 32, 28)
    }

    gl.bindVertexArray(null)
  }

  setCenter(lat: number, lng: number): void {
    this.centerLat = lat
    this.centerLng = lng
    this.enabled = true
    this.initParticles()
    if (this.posBuffer) {
      const gl = this.gl
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.particles)
    }
  }

  render(gl: WebGL2RenderingContext, camera: Camera, time: number, viewProj: mat4): void {
    if (!this.enabled || !this.vao || this.particleCount === 0) return

    // Update particles on CPU (for now — GPU transform feedback would be ideal)
    const particles = this.particles
    const center = this.latLngToVec3(this.centerLat, this.centerLng)
    const dt = 0.016

    for (let i = 0; i < this.particleCount; i++) {
      const offset = i * 8
      const px = particles[offset]
      const py = particles[offset + 1]
      const pz = particles[offset + 2]

      // Compute wind force at particle position
      const toCenterX = center[0] - px
      const toCenterY = center[1] - py
      const toCenterZ = center[2] - pz
      const dist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY + toCenterZ * toCenterZ)

      const influence = Math.max(0, 1 - dist / this.fieldRadius)

      // Radial + tangential force
      const invDist = 1 / Math.max(dist, 0.001)
      const rx = toCenterX * invDist
      const ry = toCenterY * invDist
      const rz = toCenterZ * invDist

      // Tangent: cross with up vector
      const tx = -rz
      const ty = 0
      const tz = rx

      const forceX = (rx * 0.3 + tx * this.spiralFactor) * influence * this.fieldStrength * 5
      const forceY = ry * influence * 0.1
      const forceZ = (rz * 0.3 + tz * this.spiralFactor) * influence * this.fieldStrength * 5

      // Update velocity
      particles[offset + 3] += forceX * dt - particles[offset + 3] * 0.1 * dt
      particles[offset + 4] += forceY * dt - particles[offset + 4] * 0.1 * dt
      particles[offset + 5] += forceZ * dt - particles[offset + 5] * 0.1 * dt

      // Update position
      particles[offset] += particles[offset + 3] * dt
      particles[offset + 1] += particles[offset + 4] * dt
      particles[offset + 2] += particles[offset + 5] * dt

      // Reset if too far
      if (dist > this.fieldRadius * 2) {
        const angle = Math.random() * Math.PI * 2
        const newDist = Math.random() * this.fieldRadius * 0.5
        particles[offset] = center[0] + Math.cos(angle) * newDist
        particles[offset + 1] = center[1] + (Math.random() - 0.5) * 0.5
        particles[offset + 2] = center[2] + Math.sin(angle) * newDist

        const t2 = Math.cos(angle) * this.spiralFactor
        const tz2 = -Math.sin(angle) * this.spiralFactor
        particles[offset + 3] = (Math.cos(angle) * 0.3 + (-Math.sin(angle)) * this.spiralFactor) * 0.5
        particles[offset + 4] = (Math.random() - 0.5) * 0.1
        particles[offset + 5] = (Math.sin(angle) * 0.3 + Math.cos(angle) * this.spiralFactor) * 0.5
      }

      // Update life
      particles[offset + 6] += dt * 0.5
      if (particles[offset + 6] > 1) particles[offset + 6] -= 1
    }

    // Upload updated particles
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, particles)

    // Render
    const p = this.program
    p.use()

    const mvp = mat4.create()
    mat4.multiply(viewProj, this.modelMatrix, mvp)

    p.uniform('u_viewProj', mvp)
    p.uniform('u_time', time)
    p.uniform('u_deltaTime', dt)
    p.uniform('u_fieldCenter', center)
    p.uniform('u_fieldRadius', this.fieldRadius)
    p.uniform('u_fieldStrength', this.fieldStrength)
    p.uniform('u_spiralFactor', this.spiralFactor)
    p.uniform('u_particleColor', new Float32Array(this.color))

    gl.bindVertexArray(this.vao)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.depthMask(false)

    gl.drawArrays(gl.POINTS, 0, this.particleCount)

    gl.depthMask(true)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.bindVertexArray(null)
  }

  dispose(gl: WebGL2RenderingContext): void {
    this.program.dispose()
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.posBuffer) gl.deleteBuffer(this.posBuffer)
  }
}
