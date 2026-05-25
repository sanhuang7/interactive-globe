// Lightweight math library — vec3, mat4

export type vec3 = [number, number, number] | Float32Array
export type mat4 = Float32Array

export const vec3 = {
  create(x = 0, y = 0, z = 0): vec3 {
    return new Float32Array([x, y, z])
  },
  add(a: vec3, b: vec3, out: vec3): void {
    out[0] = a[0] + b[0]; out[1] = a[1] + b[1]; out[2] = a[2] + b[2]
  },
  sub(a: vec3, b: vec3, out: vec3): void {
    out[0] = a[0] - b[0]; out[1] = a[1] - b[1]; out[2] = a[2] - b[2]
  },
  scale(v: vec3, s: number, out: vec3): void {
    out[0] = v[0] * s; out[1] = v[1] * s; out[2] = v[2] * s
  },
  normalize(v: vec3, out: vec3): void {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1
    out[0] = v[0] / len; out[1] = v[1] / len; out[2] = v[2] / len
  },
  cross(a: vec3, b: vec3, out: vec3): void {
    out[0] = a[1] * b[2] - a[2] * b[1]
    out[1] = a[2] * b[0] - a[0] * b[2]
    out[2] = a[0] * b[1] - a[1] * b[0]
  },
  dot(a: vec3, b: vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  },
  length(v: vec3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  },
  distance(a: vec3, b: vec3): number {
    const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  },
  copy(src: vec3): vec3 {
    return new Float32Array([src[0], src[1], src[2]])
  },
}

export const mat4 = {
  create(): mat4 {
    const out = new Float32Array(16)
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1
    return out
  },
  identity(out: mat4): void {
    out.fill(0)
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1
  },
  perspective(fov: number, aspect: number, near: number, far: number, out: mat4): void {
    const f = 1 / Math.tan(fov / 2)
    out.fill(0)
    out[0] = f / aspect
    out[5] = f
    out[10] = (far + near) / (near - far)
    out[11] = -1
    out[14] = (2 * far * near) / (near - far)
  },
  lookAt(eye: vec3, target: vec3, up: vec3, out: mat4): void {
    const f: vec3 = new Float32Array(3)
    const s: vec3 = new Float32Array(3)
    const u: vec3 = new Float32Array(3)

    vec3.sub(target, eye, f)
    vec3.normalize(f, f)
    vec3.cross(f, up, s)
    vec3.normalize(s, s)
    vec3.cross(s, f, u)

    out[0] = s[0]; out[1] = u[0]; out[2] = -f[0]; out[3] = 0
    out[4] = s[1]; out[5] = u[1]; out[6] = -f[1]; out[7] = 0
    out[8] = s[2]; out[9] = u[2]; out[10] = -f[2]; out[11] = 0
    out[12] = -vec3.dot(s, eye)
    out[13] = -vec3.dot(u, eye)
    out[14] = vec3.dot(f, eye)
    out[15] = 1
  },
  multiply(a: mat4, b: mat4, out: mat4): void {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0
        for (let k = 0; k < 4; k++) sum += a[i + k * 4] * b[k + j * 4]
        out[i + j * 4] = sum
      }
    }
  },
  fromRotation(axis: vec3, angle: number, out: mat4): void {
    const [x, y, z] = axis
    const len = Math.sqrt(x * x + y * y + z * z)
    const nx = x / len, ny = y / len, nz = z / len
    const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c

    out[0] = t * nx * nx + c;      out[1] = t * nx * ny + s * nz;  out[2] = t * nx * nz - s * ny;  out[3] = 0
    out[4] = t * nx * ny - s * nz; out[5] = t * ny * ny + c;       out[6] = t * ny * nz + s * nx;  out[7] = 0
    out[8] = t * nx * nz + s * ny; out[9] = t * ny * nz - s * nx;  out[10] = t * nz * nz + c;       out[11] = 0
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1
  },
  translate(m: mat4, v: vec3, out: mat4): void {
    out.set(m)
    out[12] += v[0]; out[13] += v[1]; out[14] += v[2]
  },
  scale(m: mat4, v: vec3, out: mat4): void {
    out[0] = m[0] * v[0];  out[1] = m[1] * v[0];  out[2] = m[2] * v[0];  out[3] = m[3] * v[0]
    out[4] = m[4] * v[1];  out[5] = m[5] * v[1];  out[6] = m[6] * v[1];  out[7] = m[7] * v[1]
    out[8] = m[8] * v[2];  out[9] = m[9] * v[2];  out[10] = m[10] * v[2]; out[11] = m[11] * v[2]
    out[12] = m[12]; out[13] = m[13]; out[14] = m[14]; out[15] = m[15]
  },
}
