import { useEffect, useRef, useState } from 'react'
import { Engine } from '../engine/Engine'
import { GlobeRenderer, MarkerDef } from '../globe/GlobeRenderer'

interface GlobeCanvasProps {
  markers: MarkerDef[]
  hoveredMarkerId: string | null
  onMarkerClick: (id: string | null) => void
  onMarkerHover: (id: string | null) => void
  windFieldCenter: { lat: number; lng: number } | null
}

export default function GlobeCanvas({
  markers,
  hoveredMarkerId,
  onMarkerClick,
  onMarkerHover,
  windFieldCenter,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const globeRef = useRef<GlobeRenderer | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize engine and globe
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let engine: Engine
    let globe: GlobeRenderer

    try {
      engine = new Engine(canvas)
      globe = new GlobeRenderer(engine)
    } catch (err: any) {
      console.error('WebGL init failed:', err)
      setError(err.message || 'WebGL 初始化失败')
      return
    }

    engine.addRenderable(globe)
    engine.start()

    engineRef.current = engine
    globeRef.current = globe

    // Handle click
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = (e.clientX - rect.left) * devicePixelRatio
      const sy = (e.clientY - rect.top) * devicePixelRatio
      const id = globe.hitTest(sx, sy, canvas.width, canvas.height)
      onMarkerClick(id)
    }

    // Handle hover
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = (e.clientX - rect.left) * devicePixelRatio
      const sy = (e.clientY - rect.top) * devicePixelRatio
      const id = globe.hitTest(sx, sy, canvas.width, canvas.height)
      onMarkerHover(id)
      globe.setHoveredMarker(id)
      canvas.style.cursor = id ? 'pointer' : 'grab'
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      engine.resize()
    })
    resizeObserver.observe(container)

    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousemove', handleMove)

    return () => {
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousemove', handleMove)
      resizeObserver.disconnect()
      engine.stop()
      engine.dispose()
    }
  }, [])

  // Update markers
  useEffect(() => {
    globeRef.current?.setMarkers(markers)
  }, [markers])

  // Update hover
  useEffect(() => {
    globeRef.current?.setHoveredMarker(hoveredMarkerId)
  }, [hoveredMarkerId])

  // Update wind field
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    if (windFieldCenter) {
      globe.enableWindField(windFieldCenter.lat, windFieldCenter.lng)
    } else {
      globe.disableWindField()
    }
  }, [windFieldCenter])

  if (error) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#050c1e', color: '#e0e8f0',
        padding: 40, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <h3 style={{ marginBottom: 8, color: '#ff6b6b' }}>渲染引擎初始化失败</h3>
        <p style={{ color: 'rgba(160,200,240,0.7)', fontSize: 14, marginBottom: 16 }}>
          {error}
        </p>
        <p style={{ color: 'rgba(160,200,240,0.4)', fontSize: 12 }}>
          请确认您的浏览器支持 WebGL2<br />
          推荐使用 Chrome 或 Edge 最新版本
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
        }}
      />
    </div>
  )
}
