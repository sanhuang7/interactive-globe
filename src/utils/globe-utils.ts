import * as THREE from 'three'

/**
 * Convert latitude/longitude to 3D position on a sphere
 */
export function latLngToVec3(
  lat: number,
  lng: number,
  radius: number
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

/**
 * Get marker color based on disaster type
 */
export function getMarkerColor(type: string): string {
  const colors: Record<string, string> = {
    typhoon: '#FF6B6B',
    flood: '#4ECDC4',
    drought: '#F7DC6F',
    earthquake: '#C0392B',
    tsunami: '#2980B9',
    wildfire: '#E67E22',
    volcano: '#E74C3C',
    tornado: '#9B59B6',
    blizzard: '#AED6F1',
    heatwave: '#F39C12',
  }
  return colors[type] ?? '#FFFFFF'
}

/**
 * Get marker size based on intensity (1-10 scale)
 */
export function getMarkerSize(intensity: number, baseSize: number = 0.06): number {
  return baseSize + (intensity / 10) * baseSize * 1.5
}
