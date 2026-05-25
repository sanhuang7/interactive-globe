import { useState } from 'react'
import { DisasterEvent, disasterTypeConfig, DisasterType } from '../types/index'
import FormationView from './FormationView'

interface InfoPanelProps {
  disaster: DisasterEvent | null
  onClose: () => void
  onWindField: (lat: number, lng: number, enable: boolean) => void
}

export default function InfoPanel({ disaster, onClose, onWindField }: InfoPanelProps) {
  const [showFormation, setShowFormation] = useState(false)

  if (!disaster) return null

  const config = disasterTypeConfig[disaster.type]
  const supportsWind = disaster.type === 'typhoon' || disaster.type === 'tornado'

  return (
    <div className="info-panel">
      <button className="info-panel-close" onClick={onClose}>✕</button>

      <div className="info-panel-header" style={{ borderLeftColor: config.color }}>
        <span className="info-panel-icon">{config.icon}</span>
        <div>
          <h3>{disaster.name}</h3>
          <span className="info-panel-badge" style={{ background: config.color }}>
            {config.label}
          </span>
        </div>
      </div>

      <div className="info-panel-body">
        <div className="info-row">
          <span className="info-label">时间</span>
          <span className="info-value">{disaster.date}</span>
        </div>
        <div className="info-row">
          <span className="info-label">地点</span>
          <span className="info-value">{disaster.country}</span>
        </div>
        <div className="info-row">
          <span className="info-label">坐标</span>
          <span className="info-value">
            {disaster.lat.toFixed(2)}°N, {disaster.lng.toFixed(2)}°E
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">强度</span>
          <span className="info-value">
            <div className="intensity-bar-wrapper">
              <div
                className="intensity-bar"
                style={{ width: `${disaster.intensity * 10}%`, background: config.color }}
              />
            </div>
            {disaster.intensity} / 10
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">死亡人数</span>
          <span className="info-value danger">{disaster.deaths.toLocaleString()} 人</span>
        </div>
        <div className="info-row">
          <span className="info-label">受灾人口</span>
          <span className="info-value">{disaster.affected.toLocaleString()} 人</span>
        </div>
        <div className="info-row">
          <span className="info-label">经济损失</span>
          <span className="info-value">{disaster.economicLoss.toLocaleString()} 亿美元</span>
        </div>

        <div className="info-divider" />
        <p className="info-description">{disaster.description}</p>

        <div className="info-divider" />

        {/* Action buttons */}
        <div className="info-actions">
          <button
            className="info-btn primary"
            onClick={() => setShowFormation(true)}
          >
            🧬 查看形成过程
          </button>
          {supportsWind && (
            <button
              className="info-btn"
              onClick={() => onWindField(disaster.lat, disaster.lng, true)}
            >
              💨 显示风场粒子
            </button>
          )}
          <button
            className="info-btn"
            onClick={() => {
              // flyTo is handled by parent via camera.flyTo
              onClose()
            }}
          >
            🔍 自动定位
          </button>
        </div>
      </div>

      {/* Formation process overlay */}
      {showFormation && (
        <div className="formation-overlay">
          <FormationView
            type={disaster.type}
            onClose={() => setShowFormation(false)}
          />
        </div>
      )}
    </div>
  )
}
