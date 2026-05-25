import { useMemo } from 'react'
import disasters from '../data/disasters'
import { disasterTypeConfig, DisasterType } from '../types/index'

interface StatsPanelProps {
  selectedType: string | null
  onSelectType: (type: string | null) => void
}

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#F7DC6F', '#C0392B', '#2980B9',
  '#E67E22', '#E74C3C', '#9B59B6', '#AED6F1', '#F39C12',
]

export default function StatsPanel({ selectedType, onSelectType }: StatsPanelProps) {
  const stats = useMemo(() => {
    // Type distribution
    const typeCount: Record<string, number> = {}
    let totalDeaths = 0
    const yearCount: Record<number, number> = {}
    const intensityDist: number[] = new Array(10).fill(0)

    for (const d of disasters) {
      typeCount[d.type] = (typeCount[d.type] || 0) + 1
      totalDeaths += d.deaths
      const decade = Math.floor(d.year / 10) * 10
      yearCount[decade] = (yearCount[decade] || 0) + 1
      intensityDist[d.intensity - 1]++
    }

    const sortedTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count, config: disasterTypeConfig[type as DisasterType] }))
      .sort((a, b) => b.count - a.count)

    const sortedYears = Object.entries(yearCount)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year)
      .filter((y) => y.year >= 1900)

    return { sortedTypes, sortedYears, intensityDist, totalDeaths }
  }, [])

  const maxYearCount = Math.max(...stats.sortedYears.map((y) => y.count))
  const maxIntensity = Math.max(...stats.intensityDist)

  return (
    <div className="stats-panel">
      <h4 className="stats-panel-title">数据统计</h4>

      {/* Type Distribution Pie */}
      <div className="chart-section">
        <h5>灾害类型分布</h5>
        <div className="pie-chart-container">
          <svg viewBox="0 0 200 200" className="pie-chart">
            <PieChart data={stats.sortedTypes.map((t) => t.count)} colors={CHART_COLORS} size={200} />
          </svg>
          <div className="pie-legend-mini">
            {stats.sortedTypes.slice(0, 5).map((t, i) => (
              <button
                key={t.type}
                className={`pie-legend-item ${selectedType === t.type ? 'active' : ''}`}
                onClick={() => onSelectType(selectedType === t.type ? null : t.type)}
              >
                <span className="dot" style={{ background: CHART_COLORS[i] }} />
                <span>{t.config.label}</span>
                <span className="count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Bar Chart */}
      <div className="chart-section">
        <h5>年代分布</h5>
        <div className="bar-chart">
          {stats.sortedYears.map((y) => (
            <div key={y.year} className="bar-item" title={`${y.year}s: ${y.count} 事件`}>
              <span className="bar-label">{y.year}s</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(y.count / maxYearCount) * 100}%`,
                    background: 'linear-gradient(90deg, #4da6ff, #84caff)',
                  }}
                />
              </div>
              <span className="bar-value">{y.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Intensity Distribution */}
      <div className="chart-section">
        <h5>强度分布</h5>
        <div className="bar-chart">
          {stats.intensityDist.map((count, i) => (
            <div key={i} className="bar-item">
              <span className="bar-label">{i + 1}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxIntensity) * 100}%`,
                    background: `hsl(${(i + 1) * 12}, 70%, 50%)`,
                  }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="stats-summary">
        <div className="summary-item">
          <span className="summary-value">{disasters.length}</span>
          <span className="summary-label">灾害事件</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{(stats.totalDeaths / 1e6).toFixed(1)}M</span>
          <span className="summary-label">总死亡人数</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">10</span>
          <span className="summary-label">灾害类型</span>
        </div>
      </div>
    </div>
  )
}

// Simple SVG Pie Chart
function PieChart({ data, colors, size }: { data: number[]; colors: string[]; size: number }) {
  const total = data.reduce((a, b) => a + b, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4
  let currentAngle = -Math.PI / 2

  const slices: Array<{ path: string; color: string }> = []

  for (let i = 0; i < data.length; i++) {
    const angle = (data[i] / total) * Math.PI * 2
    if (angle < 0.05) {
      currentAngle += angle
      continue
    }
    const x1 = cx + r * Math.cos(currentAngle)
    const y1 = cy + r * Math.sin(currentAngle)
    const x2 = cx + r * Math.cos(currentAngle + angle)
    const y2 = cy + r * Math.sin(currentAngle + angle)
    const largeArc = angle > Math.PI ? 1 : 0

    slices.push({
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[i % colors.length],
    })
    currentAngle += angle
  }

  return (
    <g>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="rgba(5,12,30,0.8)" strokeWidth="1" />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.35} fill="rgba(5,12,30,0.9)" />
      <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="#fff" fontSize="14" fontWeight="700">
        {total}
      </text>
    </g>
  )
}
