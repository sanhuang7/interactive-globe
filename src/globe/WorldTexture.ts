/**
 * Procedural world map texture using Canvas 2D pixel manipulation.
 * Draws continent shapes directly into pixel data for reliability.
 */
export function generateWorldTexture(size = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size / 2
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    // Fallback: solid color canvas
    const fallback = document.createElement('canvas')
    fallback.width = size
    fallback.height = size / 2
    const fc = fallback.getContext('2d')!
    fc.fillStyle = '#1a5276'
    fc.fillRect(0, 0, size, size / 2)
    return fallback
  }

  const W = size
  const H = size / 2

  // Helper: geographic to pixel
  const toX = (lng: number) => Math.round(((lng + 180) / 360) * W)
  const toY = (lat: number) => Math.round(((90 - lat) / 180) * H)

  // Fill ocean base
  ctx.fillStyle = '#1a5276'
  ctx.fillRect(0, 0, W, H)

  // Draw latitude-based ocean color variation
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H)
  oceanGrad.addColorStop(0, '#0a2a5e')
  oceanGrad.addColorStop(0.3, '#15497a')
  oceanGrad.addColorStop(0.5, '#1a5c8a')
  oceanGrad.addColorStop(0.7, '#15497a')
  oceanGrad.addColorStop(1, '#0a2a5e')
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, W, H)

  // Draw continent polygons using fill + stroke
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'

  const continents: Array<{ paths: Array<Array<[number, number]>>; color: string }> = [
    {
      color: '#3d8a3d',
      paths: [[
        // Africa
        [-17, 15], [-16, 13], [-14, 12], [-12, 10], [-14, 8], [-10, 5], [-8, 5],
        [-5, 5], [0, 5], [5, 4], [10, 0], [15, -5], [22, -8], [28, -12], [33, -15],
        [36, -20], [40, -28], [38, -34], [28, -33], [20, -34], [15, -28], [10, -18],
        [10, -5], [8, 0], [5, 5], [8, 10], [10, 12], [12, 17], [12, 22], [10, 27],
        [12, 31], [10, 34], [8, 36], [5, 37], [-5, 37], [-10, 35], [-15, 30],
        [-17, 25], [-17, 20], [-17, 15],
      ]]
    },
    {
      color: '#4a8a3d',
      paths: [[
        // Europe
        [-10, 36], [-5, 38], [0, 42], [3, 43], [5, 46], [2, 49], [-2, 50],
        [-5, 50], [-3, 54], [2, 53], [5, 54], [10, 55], [15, 55], [20, 56],
        [28, 58], [32, 60], [35, 63], [42, 66], [45, 67], [38, 64], [30, 60],
        [25, 56], [22, 52], [15, 46], [13, 43], [8, 38], [3, 36], [-5, 35],
        [-8, 36],
      ]]
    },
    {
      color: '#4d8a40',
      paths: [[
        // Asia
        [27, 66], [35, 63], [45, 60], [55, 58], [65, 56], [75, 54], [90, 54],
        [100, 53], [108, 50], [115, 50], [120, 45], [125, 42], [130, 38],
        [135, 34], [140, 36], [143, 41], [148, 45], [155, 50], [160, 55],
        [168, 62], [180, 66], [180, 72], [170, 73], [150, 73], [130, 73],
        [110, 73], [90, 73], [70, 72], [50, 71], [40, 68],
      ], [
        // India subcontinent
        [68, 30], [72, 32], [78, 35], [82, 30], [88, 26], [92, 23], [90, 20],
        [85, 15], [80, 10], [76, 8], [73, 12], [70, 18], [68, 24],
      ], [
        // Japan
        [130, 31], [133, 34], [136, 36], [140, 40], [143, 43], [145, 45],
        [142, 42], [140, 38], [136, 35], [133, 33],
      ], [
        // SE Asia mainland
        [95, 22], [100, 20], [105, 17], [108, 14], [105, 10], [102, 12],
        [98, 15], [96, 20],
      ], [
        // SE Asia islands
        [96, 6], [100, 3], [105, -2], [110, -5], [118, -6], [122, -8],
        [117, -8], [112, -4], [106, -1], [100, 3], [96, 5],
      ]]
    },
    {
      color: '#4a8535',
      paths: [[
        // North America
        [-168, 66], [-160, 62], [-150, 61], [-140, 62], [-135, 59], [-128, 54],
        [-122, 48], [-118, 38], [-115, 33], [-108, 28], [-100, 25], [-95, 28],
        [-88, 30], [-84, 26], [-81, 23], [-82, 18], [-87, 16], [-90, 20],
        [-94, 22], [-97, 20], [-100, 18], [-106, 20], [-110, 26], [-117, 30],
        [-122, 36], [-128, 44], [-132, 50], [-138, 56], [-148, 59], [-158, 59],
        [-166, 62],
      ], [
        // Greenland
        [-58, 60], [-48, 64], [-38, 71], [-22, 76], [-20, 79], [-30, 81],
        [-48, 83], [-58, 80], [-62, 76], [-55, 70], [-48, 64],
      ], [
        // Central America
        [-85, 15], [-88, 12], [-90, 10], [-88, 10], [-84, 13], [-82, 15],
      ]]
    },
    {
      color: '#3d7a35',
      paths: [[
        // South America
        [-80, 10], [-75, 8], [-68, 5], [-60, 1], [-52, -8], [-46, -15],
        [-38, -22], [-42, -26], [-48, -30], [-52, -35], [-58, -40],
        [-62, -46], [-68, -52], [-72, -46], [-74, -40], [-72, -32],
        [-73, -22], [-75, -12], [-78, -2], [-80, 5],
      ]]
    },
    {
      color: '#b8843a',
      paths: [[
        // Australia
        [115, -15], [124, -13], [136, -12], [142, -13], [148, -16],
        [152, -22], [154, -28], [152, -32], [148, -36], [143, -38],
        [138, -37], [132, -34], [124, -33], [116, -33], [114, -28],
        [114, -22], [115, -18],
      ], [
        // New Zealand
        [166, -36], [172, -40], [176, -43], [178, -45], [175, -46],
        [170, -44], [167, -40],
      ]]
    },
    {
      color: '#e8e8e8',
      paths: [[
        // Antarctica
        [-180, -70], [-150, -72], [-120, -70], [-90, -72], [-60, -68],
        [-30, -70], [0, -68], [30, -70], [60, -68], [90, -70], [120, -68],
        [150, -72], [180, -70], [180, -90], [-180, -90],
      ]]
    },
  ]

  // Draw each continent
  for (const continent of continents) {
    for (const path of continent.paths) {
      if (path.length < 3) continue
      ctx.beginPath()
      ctx.moveTo(toX(path[0][0]), toY(path[0][1]))
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(toX(path[i][0]), toY(path[i][1]))
      }
      ctx.closePath()

      // Fill with gradient
      const lngs = path.map(p => p[0])
      const lats = path.map(p => p[1])
      const cx = toX((Math.min(...lngs) + Math.max(...lngs)) / 2)
      const cy = toY((Math.min(...lats) + Math.max(...lats)) / 2)
      const maxDim = Math.max(
        toX(Math.max(...lngs)) - toX(Math.min(...lngs)),
        toY(Math.min(...lats)) - toY(Math.max(...lats))
      )

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDim * 0.7)
      grad.addColorStop(0, continent.color)
      grad.addColorStop(0.5, darken(continent.color, 0.1))
      grad.addColorStop(1, darken(continent.color, 0.25))

      ctx.fillStyle = grad
      ctx.fill()
      ctx.stroke()
    }
  }

  // Add pixel-level noise for terrain detail
  const imageData = ctx.getImageData(0, 0, W, H)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10
    data[i] = Math.min(255, Math.max(0, data[i] + noise))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
  }
  ctx.putImageData(imageData, 0, 0)

  // Coastline highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  for (const continent of continents) {
    for (const path of continent.paths) {
      if (path.length < 3) continue
      ctx.beginPath()
      ctx.moveTo(toX(path[0][0]), toY(path[0][1]))
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(toX(path[i][0]), toY(path[i][1]))
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 0.5
  for (let lng = -180; lng <= 180; lng += 15) {
    ctx.beginPath()
    ctx.moveTo(toX(lng), 0)
    ctx.lineTo(toX(lng), H)
    ctx.stroke()
  }
  for (let lat = -90; lat <= 90; lat += 15) {
    ctx.beginPath()
    ctx.moveTo(0, toY(lat))
    ctx.lineTo(W, toY(lat))
    ctx.stroke()
  }

  // Key latitude lines (equator, tropics, circles)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  for (const lat of [0, 23.5, -23.5, 66.5, -66.5]) {
    ctx.beginPath()
    ctx.moveTo(0, toY(lat))
    ctx.lineTo(W, toY(lat))
    ctx.stroke()
  }

  return canvas
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const f = 1 - amount
  return `rgb(${Math.floor(r * f)},${Math.floor(g * f)},${Math.floor(b * f)})`
}

export function createWorldTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
  try {
    const canvas = generateWorldTexture()

    // Verify canvas has content
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const test = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data
      console.log('[WorldTexture] Center pixel RGBA:', test[0], test[1], test[2], test[3])
    }

    const tex = gl.createTexture()
    if (!tex) {
      console.error('[WorldTexture] gl.createTexture returned null')
      return null
    }

    gl.bindTexture(gl.TEXTURE_2D, tex)

    // Critical: Set pixel store for proper row alignment
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      gl.RGBA, gl.UNSIGNED_BYTE, canvas
    )

    const err = gl.getError()
    if (err !== gl.NO_ERROR) {
      console.error('[WorldTexture] texImage2D error:', err)
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    console.log('[WorldTexture] Texture created successfully, size:', canvas.width, 'x', canvas.height)
    return tex
  } catch (e) {
    console.error('[WorldTexture] Exception:', e)
    return null
  }
}
