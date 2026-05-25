import { Renderable } from '../engine/Engine'
import { Camera } from '../engine/Camera'
import { mat4, vec3 } from '../engine/math'

/**
 * MarkerSystem is now handled by GlobeRenderer directly via point sprites.
 * This file is kept as a stub that re-exports the marker interface.
 */

export interface MarkerDef {
  id: string
  lat: number
  lng: number
  color: [number, number, number, number]
  size: number
}

// Marker rendering is integrated into GlobeRenderer for efficiency
// See GlobeRenderer.ts for the actual point-sprite implementation
