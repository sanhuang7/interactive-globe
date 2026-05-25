import { useState, useCallback, useMemo } from 'react'
import GlobeCanvas from './components/GlobeCanvas'
import InfoPanel from './components/InfoPanel'
import Legend from './components/Legend'
import SearchBar, { StatsBar, EngineStats } from './components/Controls'
import StatsPanel from './components/StatsPanel'
import Timeline from './components/Timeline'
import { DisasterEvent } from './types/index'
import { getMarkerColor, getMarkerSize } from './utils/globe-utils'
import { MarkerDef } from './globe/GlobeRenderer'
import disasters from './data/disasters'
import './App.css'

type TabId = 'legend' | 'stats'

export default function App() {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterEvent | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [windFieldCenter, setWindFieldCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [yearRange, setYearRange] = useState<[number, number]>([0, 9999])
  const [activeTab, setActiveTab] = useState<TabId>('legend')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Filter disasters by type, search, and year range
  const filteredDisasters = useMemo(() => {
    return disasters.filter((d) => {
      if (selectedType && d.type !== selectedType) return false
      if (d.year < yearRange[0] || d.year > yearRange[1]) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [selectedType, searchQuery, yearRange])

  // Convert to marker defs
  const markers: MarkerDef[] = useMemo(() => {
    return filteredDisasters.map((d) => ({
      id: d.id,
      lat: d.lat,
      lng: d.lng,
      color: hexToRgba(getMarkerColor(d.type), 0.9) as [number, number, number, number],
      size: getMarkerSize(d.intensity, 0.06),
    }))
  }, [filteredDisasters])

  const handleMarkerClick = useCallback((id: string | null) => {
    if (id) {
      const d = disasters.find((dis) => dis.id === id)
      setSelectedDisaster(d ?? null)
    } else {
      setSelectedDisaster(null)
    }
  }, [])

  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredId(id)
  }, [])

  const handleWindField = useCallback((lat: number, lng: number, enable: boolean) => {
    setWindFieldCenter(enable ? { lat, lng } : null)
  }, [])

  const handleYearRange = useCallback((min: number, max: number) => {
    setYearRange([min, max])
  }, [])

  const handleSelectYear = useCallback((_year: number | null) => {
    // Year playback hook — could auto-fly to the year's events
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◁' : '▷'}
        </button>
        <h1 className="header-title">
          <span className="header-icon">🌍</span>
          全球自然灾害可视化系统
        </h1>
        <span className="header-subtitle">阶段三 · 完整版</span>
        <div className="header-right">
          <span className="header-badge">{filteredDisasters.length} 事件</span>
          <span className="header-badge accent">自研 WebGL2 引擎</span>
        </div>
      </header>

      {/* Main content */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <StatsBar filteredCount={filteredDisasters.length} selectedType={selectedType} />

          {/* Tab switcher */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'legend' ? 'active' : ''}`}
              onClick={() => setActiveTab('legend')}
            >
              图例筛选
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              统计图表
            </button>
          </div>

          {activeTab === 'legend' ? (
            <Legend selectedType={selectedType} onSelectType={setSelectedType} />
          ) : (
            <StatsPanel selectedType={selectedType} onSelectType={setSelectedType} />
          )}

          <div className="sidebar-footer">
            <p>点击标记查看灾害详情</p>
            <p>拖拽旋转 · 滚轮缩放</p>
          </div>
        </aside>

        {/* Globe */}
        <main className="globe-container">
          <GlobeCanvas
            markers={markers}
            hoveredMarkerId={hoveredId}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={handleMarkerHover}
            windFieldCenter={windFieldCenter}
          />

          {/* Info panel */}
          <InfoPanel
            disaster={selectedDisaster}
            onClose={() => {
              setSelectedDisaster(null)
              setWindFieldCenter(null)
            }}
            onWindField={handleWindField}
          />

          {/* Timeline (bottom overlay) */}
          <div className="timeline-overlay">
            <Timeline
              selectedType={selectedType}
              onYearRange={handleYearRange}
              onSelectYear={handleSelectYear}
            />
          </div>

          {/* Wind field indicator */}
          {windFieldCenter && (
            <div className="wind-indicator">
              <span className="wind-dot" />
              风场粒子模拟中
              <button className="wind-close" onClick={() => setWindFieldCenter(null)}>✕</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b, alpha]
}
