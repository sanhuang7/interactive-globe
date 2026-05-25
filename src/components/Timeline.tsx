import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import disasters from '../data/disasters'

interface TimelineProps {
  selectedType: string | null
  onYearRange: (minYear: number, maxYear: number) => void
  onSelectYear: (year: number | null) => void
}

export default function Timeline({ selectedType, onYearRange, onSelectYear }: TimelineProps) {
  const years = useMemo(() => {
    const filtered = selectedType
      ? disasters.filter((d) => d.type === selectedType)
      : disasters
    return [...new Set(filtered.map((d) => d.year))].sort((a, b) => a - b)
  }, [selectedType])

  const minYear = years[0] || 1900
  const maxYear = years[years.length - 1] || 2024

  const [rangeStart, setRangeStart] = useState(minYear)
  const [rangeEnd, setRangeEnd] = useState(maxYear)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playYear, setPlayYear] = useState<number | null>(null)
  const timerRef = useRef<number>(0)

  // Count events per year
  const yearCount = useMemo(() => {
    const count: Record<number, number> = {}
    const filtered = selectedType
      ? disasters.filter((d) => d.type === selectedType)
      : disasters
    for (const d of filtered) {
      count[d.year] = (count[d.year] || 0) + 1
    }
    return count
  }, [selectedType])

  const maxCount = Math.max(...Object.values(yearCount), 1)

  // Update parent when range changes
  useEffect(() => {
    onYearRange(rangeStart, rangeEnd)
  }, [rangeStart, rangeEnd, onYearRange])

  // Playback
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timerRef.current)
      return
    }

    let current = rangeStart
    setPlayYear(current)

    timerRef.current = window.setInterval(() => {
      current++
      if (current > rangeEnd) {
        current = rangeStart
      }
      setPlayYear(current)
      onSelectYear(current)
    }, 300)

    return () => clearInterval(timerRef.current)
  }, [isPlaying, rangeStart, rangeEnd, onSelectYear])

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setPlayYear(null)
      onSelectYear(null)
    } else {
      setIsPlaying(true)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setPlayYear(null)
    setRangeStart(minYear)
    setRangeEnd(maxYear)
    onSelectYear(null)
    onYearRange(minYear, maxYear)
  }

  // Generate year markers
  const yearMarkers = useMemo(() => {
    const step = Math.max(1, Math.floor((maxYear - minYear) / 30))
    const markers: number[] = []
    for (let y = Math.ceil(minYear / step) * step; y <= maxYear; y += step) {
      markers.push(y)
    }
    return markers
  }, [minYear, maxYear])

  const barWidth = `${100 / (maxYear - minYear + 1)}%`

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <h4>时间轴</h4>
        <div className="timeline-controls">
          <button onClick={handleReset} title="重置">⏮</button>
          <button className="play-btn" onClick={handlePlayPause} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Year range display */}
      <div className="timeline-range-display">
        <span>{rangeStart}</span>
        <span>—</span>
        <span>{rangeEnd}</span>
        {playYear && (
          <span className="play-year-badge">▶ {playYear}</span>
        )}
      </div>

      {/* Year bars */}
      <div className="timeline-bars">
        {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
          const year = minYear + i
          const count = yearCount[year] || 0
          const height = count > 0 ? Math.max(4, (count / maxCount) * 40) : 1
          const isInRange = year >= rangeStart && year <= rangeEnd
          const isPlayYear = year === playYear

          return (
            <div
              key={year}
              className={`timeline-bar ${isInRange ? 'active' : ''} ${isPlayYear ? 'playing' : ''}`}
              style={{ height: `${height}px`, width: barWidth }}
              title={`${year}: ${count} 事件`}
              onClick={() => {
                if (!isPlaying) {
                  setRangeStart(year)
                  setRangeEnd(year + 10)
                  onYearRange(year, year + 10)
                }
              }}
            />
          )
        })}
      </div>

      {/* Year axis labels */}
      <div className="timeline-axis">
        {yearMarkers.map((y) => (
          <span
            key={y}
            className="timeline-tick"
            style={{ left: `${((y - minYear) / (maxYear - minYear)) * 100}%` }}
          >
            {y}
          </span>
        ))}
      </div>

      {/* Range sliders */}
      <div className="timeline-sliders">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={rangeStart}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (v <= rangeEnd) setRangeStart(v)
          }}
          className="range-slider range-start"
        />
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={rangeEnd}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (v >= rangeStart) setRangeEnd(v)
          }}
          className="range-slider range-end"
        />
      </div>
    </div>
  )
}
