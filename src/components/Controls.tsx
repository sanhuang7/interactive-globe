import { useState } from 'react'
import disasters from '../data/disasters'
import { getMarkerColor } from '../utils/globe-utils'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="搜索灾害名称、国家或类型..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}

interface StatsBarProps {
  filteredCount: number
  selectedType: string | null
}

export function StatsBar({ filteredCount, selectedType }: StatsBarProps) {
  const totalCount = disasters.length
  const types = [...new Set(disasters.map((d) => d.type))]
  const yearRange = {
    min: Math.min(...disasters.map((d) => d.year)),
    max: Math.max(...disasters.map((d) => d.year)),
  }

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{filteredCount}</span>
        <span className="stat-label">显示事件</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{totalCount}</span>
        <span className="stat-label">总计事件</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{types.length}</span>
        <span className="stat-label">灾害类型</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{yearRange.min} - {yearRange.max}</span>
        <span className="stat-label">时间范围</span>
      </div>
      <div className="stat-item intensity-legend">
        <span className="stat-label">强度大小参考</span>
        <div className="intensity-sizes">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
            <div
              key={i}
              className="intensity-dot-sample"
              style={{
                width: `${6 + scale * 8}px`,
                height: `${6 + scale * 8}px`,
                background: selectedType ? getMarkerColor(selectedType) : '#4da6ff',
                opacity: 0.3 + scale * 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Engine stats overlay
interface EngineStatsProps {
  fps: number
  quality: string
}

export function EngineStats({ fps, quality }: EngineStatsProps) {
  return (
    <div className="engine-stats">
      <span>FPS: {fps}</span>
      <span className={`quality-badge quality-${quality}`}>{quality}</span>
    </div>
  )
}
