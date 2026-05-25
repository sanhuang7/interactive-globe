import { mat4, vec3 } from './math'

export class Camera {
  fov: number
  near: number
  far: number
  aspect: number
  position: vec3
  target: vec3
  up: vec3

  viewMatrix: mat4
  projMatrix: mat4

  // Orbit state
  theta: number
  phi: number
  distance: number
  minDistance: number
  maxDistance: number
  autoRotate: boolean
  autoRotateSpeed: number
  private baseTheta: number

  constructor(fov = 45, near = 0.1, far = 100) {
    this.fov = fov
    this.near = near
    this.far = far
    this.aspect = 1
    this.position = [0, 0.3, 4.5]
    this.target = [0, 0, 0]
    this.up = [0, 1, 0]
    this.viewMatrix = mat4.create()
    this.projMatrix = mat4.create()

    this.theta = 0
    this.phi = Math.PI / 2.5
    this.distance = 4.5
    this.minDistance = 2
    this.maxDistance = 10
    this.autoRotate = true
    this.autoRotateSpeed = 0.3
    this.baseTheta = 0

    this.updateFromSpherical()
  }

  private updateFromSpherical(): void {
    const sp = Math.sin(this.phi)
    const cp = Math.cos(this.phi)
    const st = Math.sin(this.theta)
    const ct = Math.cos(this.theta)

    this.position[0] = this.target[0] + this.distance * sp * st
    this.position[1] = this.target[1] + this.distance * cp
    this.position[2] = this.target[2] + this.distance * sp * ct

    this.updateMatrices()
  }

  updateMatrices(): void {
    mat4.lookAt(this.position, this.target, this.up, this.viewMatrix)
    mat4.perspective(
      (this.fov * Math.PI) / 180,
      this.aspect,
      this.near,
      this.far,
      this.projMatrix
    )
  }

  updateAspect(w: number, h: number): void {
    this.aspect = w / Math.max(h, 1)
    this.updateMatrices()
  }

  // --- Orbit Controls ---
  private dragStart = { x: 0, y: 0, theta: 0, phi: 0 }
  private pinchStartDist = 0
  private pinchStartZoom = 0
  private isDragging = false
  private isPinching = false

  onPointerDown(x: number, y: number): void {
    this.dragStart = { x, y, theta: this.theta, phi: this.phi }
    this.isDragging = true
    this.autoRotate = false
  }

  onPointerMove(x: number, y: number, isTouch = false): void {
    if (!this.isDragging) return
    const dx = x - this.dragStart.x
    const dy = y - this.dragStart.y
    const sensitivity = 0.005

    this.theta = this.dragStart.theta - dx * sensitivity
    this.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.dragStart.phi - dy * sensitivity))
    this.updateFromSpherical()
  }

  onPointerUp(): void {
    this.isDragging = false
    this.baseTheta = this.theta
  }

  onWheel(delta: number): void {
    this.distance *= 1 + delta * 0.001
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))
    this.updateFromSpherical()
  }

  onPinchStart(dist: number): void {
    this.pinchStartDist = dist
    this.pinchStartZoom = this.distance
    this.isPinching = true
  }

  onPinchMove(dist: number): void {
    if (!this.isPinching) return
    const scale = this.pinchStartDist / Math.max(dist, 1)
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.pinchStartZoom * scale)
    )
    this.updateFromSpherical()
  }

  onPinchEnd(): void {
    this.isPinching = false
  }

  update(dt: number): void {
    if (this.autoRotate && !this.isDragging) {
      this.theta += this.autoRotateSpeed * dt
      this.updateFromSpherical()
    }
  }

  flyTo(lat: number, lng: number, targetDist = 2.5, duration = 0.8): void {
    this.autoRotate = false
    const targetTheta = (lng * Math.PI) / 180
    const targetPhi = ((90 - lat) * Math.PI) / 180
    const startTheta = this.theta
    const startPhi = this.phi
    const startDist = this.distance
    const startTime = performance.now() / 1000

    const animate = () => {
      const t = Math.min((performance.now() / 1000 - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // easeOutCubic

      this.theta = startTheta + (targetTheta - startTheta) * ease
      this.phi = startPhi + (targetPhi - startPhi) * ease
      this.distance = startDist + (targetDist - startDist) * ease
      this.updateFromSpherical()

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }
}
