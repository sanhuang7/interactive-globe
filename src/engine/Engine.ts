import { Camera } from './Camera'
import { mat4 } from './math'
import { checkGLError } from './GLUtils'

export interface Renderable {
  render(gl: WebGL2RenderingContext, camera: Camera, time: number, viewProj: mat4): void
  dispose(gl: WebGL2RenderingContext): void
}

export class Engine {
  gl: WebGL2RenderingContext
  camera: Camera
  canvas: HTMLCanvasElement
  private renderables: Renderable[] = []
  private animId = 0
  private lastTime = 0
  private _running = false
  private viewProj: mat4 = mat4.create()

  // Performance
  frameCount = 0
  fps = 60
  private fpsTime = 0
  private fpsCount = 0

  // Performance mode
  quality: 'high' | 'medium' | 'low' = 'high'

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('WebGL2 not available')
    this.gl = gl

    // Detect device capability
    this.detectQuality()

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0.02, 0.05, 0.12, 1)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    this.camera = new Camera()
    this.camera.updateAspect(canvas.width, canvas.height)

    this.setupInput()
    this.resize()
  }

  private detectQuality(): void {
    const gl = this.gl
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const gpu = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : ''
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    const isLowGPU = /Intel.*HD Graphics [1-4]\d{2}|Mali-4|Adreno [3-5]\d{2}/i.test(gpu)

    if (isMobile || isLowGPU) {
      this.quality = 'low'
    } else if (/Intel|Mali-|Adreno/i.test(gpu)) {
      this.quality = 'medium'
    }
  }

  addRenderable(r: Renderable): void {
    this.renderables.push(r)
  }

  removeRenderable(r: Renderable): void {
    const idx = this.renderables.indexOf(r)
    if (idx >= 0) this.renderables.splice(idx, 1)
  }

  start(): void {
    this._running = true
    this.lastTime = performance.now() / 1000
    this.fpsTime = this.lastTime

    const loop = () => {
      if (!this._running) return
      this.animId = requestAnimationFrame(loop)

      const now = performance.now() / 1000
      const dt = Math.min(now - this.lastTime, 0.1)
      this.lastTime = now

      // FPS counter
      this.fpsCount++
      if (now - this.fpsTime >= 1) {
        this.fps = this.fpsCount
        this.fpsCount = 0
        this.fpsTime = now
      }

      this.camera.update(dt)

      // Compute view-projection once per frame
      mat4.multiply(this.camera.projMatrix, this.camera.viewMatrix, this.viewProj)

      const gl = this.gl
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      for (const r of this.renderables) {
        r.render(gl, this.camera, now, this.viewProj)
      }
    }
    loop()
  }

  stop(): void {
    this._running = false
    cancelAnimationFrame(this.animId)
  }

  resize(): void {
    const w = this.canvas.clientWidth * devicePixelRatio
    const h = this.canvas.clientHeight * devicePixelRatio
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      this.gl.viewport(0, 0, w, h)
      this.camera.updateAspect(this.canvas.clientWidth, this.canvas.clientHeight)
    }
  }

  private setupInput(): void {
    const c = this.canvas

    // Mouse
    c.addEventListener('pointerdown', (e) => {
      this.camera.onPointerDown(e.clientX, e.clientY)
    })
    window.addEventListener('pointermove', (e) => {
      this.camera.onPointerMove(e.clientX, e.clientY)
    })
    window.addEventListener('pointerup', () => {
      this.camera.onPointerUp()
    })
    c.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.camera.onWheel(e.deltaY)
    })

    // Touch
    c.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        this.camera.onPinchStart(dist)
      }
    }, { passive: true })
    c.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        this.camera.onPinchMove(dist)
      }
    }, { passive: true })
    c.addEventListener('touchend', () => {
      this.camera.onPinchEnd()
    })
  }

  dispose(): void {
    this.stop()
    for (const r of this.renderables) {
      r.dispose(this.gl)
    }
    this.renderables = []
  }
}

// Re-export for convenience
export { Camera }
export type { mat4 }
export { mat4 as mat4Instance }
