import { disasterTypeConfig, DisasterType } from '../types/index'
import disasters from '../data/disasters'

interface LegendProps {
  selectedType: string | null
  onSelectType: (type: string | null) => void
}

export default function Legend({ selectedType, onSelectType }: LegendProps) {
  const types = Object.entries(disasterTypeConfig) as [DisasterType, typeof disasterTypeConfig[DisasterType]][]

  const counts = types.map(([type]) => ({
    type,
    count: disasters.filter((d) => d.type === type).length,
  }))

  return (
    <div className="legend">
      <h4 className="legend-title">灾害类型</h4>
      <button
        className={`legend-item legend-all ${selectedType === null ? 'active' : ''}`}
        onClick={() => onSelectType(null)}
      >
        <span className="legend-dot" style={{ background: '#fff' }} />
        <span className="legend-label">全部类型</span>
        <span className="legend-count">{disasters.length}</span>
      </button>
      {types.map(([type, config]) => (
        <button
          key={type}
          className={`legend-item ${selectedType === type ? 'active' : ''}`}
          onClick={() => onSelectType(selectedType === type ? null : type)}
        >
          <span className="legend-dot" style={{ background: config.color }} />
          <span className="legend-icon">{config.icon}</span>
          <span className="legend-label">{config.label}</span>
          <span className="legend-count">{counts.find((c) => c.type === type)?.count ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
