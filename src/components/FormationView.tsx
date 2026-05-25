import { useState, useEffect, useRef, useCallback } from 'react'
import { DisasterType, formationData, FormationStage } from '../types/index'

interface FormationViewProps {
  type: DisasterType
  onClose: () => void
}

export default function FormationView({ type, onClose }: FormationViewProps) {
  const data = formationData[type]
  const [currentStage, setCurrentStage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number>(0)
  const progressRef = useRef<number>(0)

  const stage = data.stages[currentStage]
  const totalStages = data.stages.length

  // Auto-advance
  const advance = useCallback(() => {
    if (progressRef.current >= 1) {
      if (currentStage < totalStages - 1) {
        setCurrentStage((s) => s + 1)
        progressRef.current = 0
        setProgress(0)
      } else {
        setIsPlaying(false)
        return
      }
    }
  }, [currentStage, totalStages])

  useEffect(() => {
    if (!isPlaying) return

    const duration = stage.duration * 1000
    const interval = 50
    const step = interval / duration

    timerRef.current = window.setInterval(() => {
      progressRef.current += step
      if (progressRef.current >= 1) {
        progressRef.current = 1
        setProgress(1)
        advance()
      }
      setProgress(progressRef.current)
    }, interval)

    return () => clearInterval(timerRef.current)
  }, [isPlaying, currentStage, stage.duration, advance])

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  const handleRestart = () => {
    setIsPlaying(false)
    setCurrentStage(0)
    progressRef.current = 0
    setProgress(0)
  }
  const handlePrev = () => {
    if (currentStage > 0) {
      setCurrentStage((s) => s - 1)
      progressRef.current = 0
      setProgress(0)
    }
  }
  const handleNext = () => {
    if (currentStage < totalStages - 1) {
      setCurrentStage((s) => s + 1)
      progressRef.current = 0
      setProgress(0)
    }
  }

  return (
    <div className="formation-view">
      <div className="formation-header">
        <h3>{data.title}</h3>
        <button className="formation-close" onClick={onClose}>✕</button>
      </div>

      <p className="formation-summary">{data.summary}</p>

      {/* Stage indicator */}
      <div className="formation-stages-indicator">
        {data.stages.map((s, i) => (
          <button
            key={s.id}
            className={`formation-stage-dot ${i === currentStage ? 'active' : ''} ${i < currentStage ? 'done' : ''}`}
            onClick={() => {
              setCurrentStage(i)
              progressRef.current = 0
              setProgress(0)
            }}
            title={s.title}
          >
            <span className="stage-number">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Stage content */}
      <div className="formation-stage-card">
        <div className="stage-progress-bar">
          <div
            className="stage-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <h4 className="stage-title">{stage.title}</h4>
        <p className="stage-description">{stage.description}</p>

        {/* ASCII diagram */}
        <pre className="stage-diagram">{stage.diagram}</pre>

        {/* Key points */}
        <ul className="stage-keypoints">
          {stage.keyPoints.map((kp, i) => (
            <li key={i}>{kp}</li>
          ))}
        </ul>
      </div>

      {/* Controls */}
      <div className="formation-controls">
        <button onClick={handleRestart} title="重新开始">⏮</button>
        <button onClick={handlePrev} disabled={currentStage === 0} title="上一阶段">⏪</button>
        <button className="play-btn" onClick={handlePlayPause} title={isPlaying ? '暂停' : '播放'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext} disabled={currentStage === totalStages - 1} title="下一阶段">⏩</button>
        <span className="stage-counter">
          {currentStage + 1} / {totalStages}
        </span>
      </div>
    </div>
  )
}
