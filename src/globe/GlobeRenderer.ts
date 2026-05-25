import { Engine, Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { GlobeSurface } from './GlobeSurface'
import { Atmosphere } from './Atmosphere'
import { GridLayer } from './GridLayer'
import { CloudLayer } from './CloudLayer'
import { WindField } from '../particles/WindField'
import { ShaderProgram } from '../engine/Shader'
import { mat4, vec3 } from '../engine/math'
import { createTexture2D } from '../engine/GLUtils'

// Starfield shaders (inline for simplicity)
const STAR_VERT = `#version 300 es
precision highp float;
in vec3 a_position;
uniform mat4 u_viewProj;
uniform float u_time;
out float v_twinkle;
void main() {
  gl_Position = u_viewProj * vec4(a_position, 1.0);
  gl_PointSize = 2.5;
  v_twinkle = fract(sin(dot(a_position.xy, vec2(12.9898, 78.233))) * 43758.5453);
}`

const STAR_FRAG = `#version 300 es
precision highp float;
in float v_twinkle;
uniform float u_time;
out vec4 fragColor;
void main() {
  float alpha = 0.4 + 0.6 * sin(u_time * 2.0 + v_twinkle * 6.28);
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  float point = 1.0 - smoothstep(0.0, 1.0, d);
  alpha *= point;
  fragColor = vec4(1.0, 0.95, 0.85, alpha * 0.8);
}`

// Marker point-sprite shaders
const MARKER_VERT = `#version 300 es
precision highp float;
in vec3 a_markerPos;
in vec4 a_markerColor;
in float a_markerSize;
in float a_markerId;

uniform mat4 u_viewProj;
uniform float u_time;
uniform float u_hoverId;

out vec4 v_color;
out float v_hover;

void main() {
  vec4 clip = u_viewProj * vec4(a_markerPos, 1.0);
  gl_Position = clip;
  gl_PointSize = a_markerSize * 60.0 / clip.w;

  v_color = a_markerColor;

  // Pulse animation
  float pulse = 0.7 + 0.3 * sin(u_time * 3.0 + a_markerId * 1.7);
  v_color.a *= pulse;

  v_hover = (abs(a_markerId - u_hoverId) < 0.5) ? 1.0 : 0.0;
}`

const MARKER_FRAG = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_hover;
out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);

  // Outer ring
  float ring = smoothstep(0.65, 0.72, d) - smoothstep(0.82, 0.9, d);
  float ringAlpha = 0.5 + v_hover * 0.5;

  // Core
  float core = 1.0 - smoothstep(0.4, 0.6, d);

  // Glow
  float glow = exp(-d * 2.5) * 0.35;

  float alpha = (core + ring * ringAlpha + glow) * v_color.a;
  vec3 color = v_color.rgb * (core + ring * ringAlpha * 0.8 + glow * 0.5);

  if (alpha < 0.01) discard;
  fragColor = vec4(color, alpha);
}`

export interface MarkerDef {
  id: string
  lat: number
  lng: number
  color: [number, number, number, number]
  size: number
}

export class GlobeRenderer implements Renderable {
  gl: WebGL2RenderingContext
  engine: Engine
  private surface: GlobeSurface
  private atmosphere: Atmosphere
  private grid: GridLayer
  private clouds: CloudLayer
  private windField: WindField

  // Starfield
  private starProgram: ShaderProgram
  private starVao: WebGLVertexArrayObject
  private starCount: number

  // Marker system
  private markerProgram: ShaderProgram
  private markerVao: WebGLVertexArrayObject | null = null
  private markerCount = 0
  private markerPosBuf: WebGLBuffer | null = null
  private markerColorBuf: WebGLBuffer | null = null
  private markerSizeBuf: WebGLBuffer | null = null
  private markerIdBuf: WebGLBuffer | null = null
  private markers: MarkerDef[] = []
  private hoveredIndex = -1

  // Layers control
  cloudOpacity = 0.6
  showGrid = true
  showClouds = true
  showAtmosphere = true
  showWindField = false

  radius = 1.5

  constructor(engine: Engine) {
    this.gl = engine.gl
    this.engine = engine
    const gl = engine.gl

    // Globe layers
    this.surface = new GlobeSurface(gl, this.radius)
    this.atmosphere = new Atmosphere(gl, this.radius)
    this.grid = new GridLayer(gl, this.radius)
    this.clouds = new CloudLayer(gl, this.radius)
    this.windField = new WindField(gl, 2000, this.radius)

    // Starfield
    this.starProgram = new ShaderProgram(gl, STAR_VERT, STAR_FRAG)
    const { vao, count } = this.createStarfield(gl)
    this.starVao = vao
    this.starCount = count

    // Marker shader
    this.markerProgram = new ShaderProgram(gl, MARKER_VERT, MARKER_FRAG)
  }

  private createStarfield(gl: WebGL2RenderingContext) {
    const count = 3000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const loc = this.starProgram.getAttribLocation('a_position')
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
    }
    gl.bindVertexArray(null)
    return { vao, count }
  }

  setMarkers(markers: MarkerDef[]): void {
    this.markers = markers
    this.markerCount = markers.length
    this.updateMarkerBuffers()
  }

  private updateMarkerBuffers(): void {
    const gl = this.gl
    if (this.markerCount === 0) return

    const positions = new Float32Array(this.markerCount * 3)
    const colors = new Float32Array(this.markerCount * 4)
    const sizes = new Float32Array(this.markerCount)
    const ids = new Float32Array(this.markerCount)

    for (let i = 0; i < this.markerCount; i++) {
      const m = this.markers[i]
      const pos = this.latLngToVec3(m.lat, m.lng)
      positions[i * 3] = pos[0]
      positions[i * 3 + 1] = pos[1]
      positions[i * 3 + 2] = pos[2]
      colors[i * 4] = m.color[0]
      colors[i * 4 + 1] = m.color[1]
      colors[i * 4 + 2] = m.color[2]
      colors[i * 4 + 3] = m.color[3]
      sizes[i] = m.size
      ids[i] = i
    }

    // Create VAO with instance data
    if (this.markerVao) gl.deleteVertexArray(this.markerVao)
    this.markerVao = gl.createVertexArray()!
    gl.bindVertexArray(this.markerVao)

    // Position buffer
    if (this.markerPosBuf) gl.deleteBuffer(this.markerPosBuf)
    this.markerPosBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerPosBuf)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    const posLoc = this.markerProgram.getAttribLocation('a_markerPos')
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    }

    // Color buffer
    if (this.markerColorBuf) gl.deleteBuffer(this.markerColorBuf)
    this.markerColorBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerColorBuf)
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
    const colorLoc = this.markerProgram.getAttribLocation('a_markerColor')
    if (colorLoc >= 0) {
      gl.enableVertexAttribArray(colorLoc)
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
    }

    // Size buffer
    if (this.markerSizeBuf) gl.deleteBuffer(this.markerSizeBuf)
    this.markerSizeBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerSizeBuf)
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW)
    const sizeLoc = this.markerProgram.getAttribLocation('a_markerSize')
    if (sizeLoc >= 0) {
      gl.enableVertexAttribArray(sizeLoc)
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0)
    }

    // ID buffer
    if (this.markerIdBuf) gl.deleteBuffer(this.markerIdBuf)
    this.markerIdBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerIdBuf)
    gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW)
    const idLoc = this.markerProgram.getAttribLocation('a_markerId')
    if (idLoc >= 0) {
      gl.enableVertexAttribArray(idLoc)
      gl.vertexAttribPointer(idLoc, 1, gl.FLOAT, false, 0, 0)
    }

    gl.bindVertexArray(null)
  }

  setHoveredMarker(id: string | null): void {
    if (id === null) {
      this.hoveredIndex = -1
    } else {
      this.hoveredIndex = this.markers.findIndex((m) => m.id === id)
    }
  }

  hitTest(
    sx: number,
    sy: number,
    canvasW: number,
    canvasH: number
  ): string | null {
    const camera = this.engine.camera
    const mvp = mat4.create()
    mat4.multiply(camera.projMatrix, camera.viewMatrix, mvp)

    let closestId: string | null = null
    let closestDist = Infinity

    for (let i = 0; i < this.markers.length; i++) {
      const m = this.markers[i]
      const pos = this.latLngToVec3(m.lat, m.lng)

      const px = mvp[0] * pos[0] + mvp[4] * pos[1] + mvp[8] * pos[2] + mvp[12]
      const py = mvp[1] * pos[0] + mvp[5] * pos[1] + mvp[9] * pos[2] + mvp[13]
      const pw = mvp[3] * pos[0] + mvp[7] * pos[1] + mvp[11] * pos[2] + mvp[15]

      if (pw <= 0) continue

      const nx = px / pw
      const ny = py / pw
      const screenX = (nx * 0.5 + 0.5) * canvasW
      const screenY = (-ny * 0.5 + 0.5) * canvasH
      const dist = Math.hypot(screenX - sx, screenY - sy)
      const threshold = 18

      if (dist < threshold && dist < closestDist) {
        closestDist = dist
        closestId = m.id
      }
    }
    return closestId
  }

  latLngToVec3(lat: number, lng: number): vec3 {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return vec3.create(
      -this.radius * Math.sin(phi) * Math.cos(theta),
      this.radius * Math.cos(phi),
      this.radius * Math.sin(phi) * Math.sin(theta)
    )
  }

  // Wind field controls
  enableWindField(lat: number, lng: number): void {
    this.windField.setCenter(lat, lng)
    this.showWindField = true
  }

  disableWindField(): void {
    this.showWindField = false
  }

  render(gl: WebGL2RenderingContext, camera: Camera, time: number, viewProj: mat4): void {
    // 1. Stars (behind everything, no depth write)
    {
      const p = this.starProgram
      p.use()
      p.uniform('u_viewProj', viewProj)
      p.uniform('u_time', time)
      gl.bindVertexArray(this.starVao)
      gl.depthMask(false)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.drawArrays(gl.POINTS, 0, this.starCount)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(true)
    }

    // 2. Earth surface
    gl.depthMask(true)
    this.surface.render(gl, camera, time, viewProj)

    // 3. Grid lines
    if (this.showGrid) {
      this.grid.render(gl, camera, time, viewProj)
    }

    // 4. Cloud layer
    if (this.showClouds) {
      this.clouds.cloudCover = this.cloudOpacity
      this.clouds.render(gl, camera, time, viewProj)
    }

    // 5. Atmosphere glow
    if (this.showAtmosphere) {
      this.atmosphere.render(gl, camera, time, viewProj)
    }

    // 6. Disaster markers
    if (this.markerCount > 0 && this.markerVao) {
      const p = this.markerProgram
      p.use()
      p.uniform('u_viewProj', viewProj)
      p.uniform('u_time', time)
      p.uniform('u_hoverId', this.hoveredIndex)

      gl.bindVertexArray(this.markerVao)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(false)

      gl.drawArrays(gl.POINTS, 0, this.markerCount)

      gl.depthMask(true)
      gl.bindVertexArray(null)
    }

    // 7. Wind field particles (on top)
    if (this.showWindField) {
      this.windField.render(gl, camera, time, viewProj)
    }
  }

  dispose(gl: WebGL2RenderingContext): void {
    this.surface.dispose(gl)
    this.atmosphere.dispose(gl)
    this.grid.dispose(gl)
    this.clouds.dispose(gl)
    this.windField.dispose(gl)
    this.starProgram.dispose()
    this.markerProgram.dispose()
    if (this.starVao) gl.deleteVertexArray(this.starVao)
    if (this.markerVao) gl.deleteVertexArray(this.markerVao)
    if (this.markerPosBuf) gl.deleteBuffer(this.markerPosBuf)
    if (this.markerColorBuf) gl.deleteBuffer(this.markerColorBuf)
    if (this.markerSizeBuf) gl.deleteBuffer(this.markerSizeBuf)
    if (this.markerIdBuf) gl.deleteBuffer(this.markerIdBuf)
  }
}
