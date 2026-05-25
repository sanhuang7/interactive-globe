// ==================== Earth Surface Shader ====================

export const earthVert = `#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

uniform mat4 u_modelViewProj;
uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;

out vec3 v_normal;
out vec3 v_pos;
out vec2 v_uv;

void main() {
  vec4 worldPos = vec4(a_position, 1.0);
  gl_Position = u_modelViewProj * worldPos;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_pos = (u_modelView * worldPos).xyz;
  v_uv = a_uv;
}`

export const earthFrag = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec3 v_pos;
in vec2 v_uv;

uniform vec3 u_lightDir;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform float u_time;
uniform sampler2D u_earthTex;

out vec4 fragColor;

void main() {
  // Sample world map texture
  vec4 texColor = texture(u_earthTex, v_uv);
  vec3 baseColor = texColor.rgb;

  // Lighting
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightDir);
  float NdotL = max(dot(N, L), 0.0);

  // Specular on ocean (detect by checking if pixel is blue-ish)
  float isOcean = smoothstep(0.3, 0.6, baseColor.b - baseColor.g);
  vec3 V = normalize(-v_pos);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 64.0) * isOcean * 0.5;

  vec3 diffuse = baseColor * (u_lightColor * NdotL + u_ambientColor);
  vec3 specular = u_lightColor * spec;

  // Rim lighting
  float rim = 1.0 - abs(dot(N, V));
  rim = pow(rim, 3.0) * 0.3;

  fragColor = vec4(diffuse + specular + rim, 1.0);
}`

// ==================== Atmosphere Shader ====================

export const atmosphereVert = `#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_modelViewProj;
uniform mat4 u_modelView;
out vec3 v_normal;
out vec3 v_pos;
void main() {
  vec4 worldPos = vec4(a_position, 1.0);
  gl_Position = u_modelViewProj * worldPos;
  v_normal = a_normal;
  v_pos = (u_modelView * worldPos).xyz;
}`

export const atmosphereFrag = `#version 300 es
precision highp float;
uniform vec3 u_atmosphereColor;
uniform float u_atmosphereIntensity;
out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  float alpha = smoothstep(1.0, 0.0, d) * u_atmosphereIntensity;
  alpha *= 0.3;
  fragColor = vec4(u_atmosphereColor, alpha);
}`

export const atmosphereFullscreenFrag = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec3 v_pos;
uniform vec3 u_atmosphereColor;
out vec4 fragColor;

void main() {
  vec3 V = normalize(-v_pos);
  vec3 N = normalize(v_normal);
  float fresnel = 1.0 - abs(dot(V, N));
  fresnel = pow(fresnel, 4.0) * 0.6;
  fragColor = vec4(u_atmosphereColor, fresnel);
}`

// ==================== Grid Layer Shader ====================

export const gridVert = `#version 300 es
precision highp float;
in vec3 a_position;
uniform mat4 u_modelViewProj;
void main() {
  gl_Position = u_modelViewProj * vec4(a_position, 1.0);
}`

export const gridFrag = `#version 300 es
precision highp float;
uniform vec3 u_gridColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(u_gridColor, 0.3);
}`

// ==================== Cloud Layer Shader ====================

export const cloudVert = `#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;
uniform mat4 u_modelViewProj;
uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
out vec3 v_normal;
out vec3 v_pos;
out vec2 v_uv;
void main() {
  vec4 wp = vec4(a_position, 1.0);
  gl_Position = u_modelViewProj * wp;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_pos = (u_modelView * wp).xyz;
  v_uv = a_uv;
}`

export const cloudFrag = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec3 v_pos;
in vec2 v_uv;

uniform float u_time;
uniform float u_cloudCover;
uniform vec3 u_lightDir;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;

out vec4 fragColor;

// 3D Worley noise for cloud shapes
float hash3D(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float worley(vec3 p, float scale) {
  vec3 i = floor(p * scale);
  float minDist = 1.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 neighbor = vec3(float(x), float(y), float(z));
        vec3 point = i + neighbor + vec3(hash3D(i + neighbor));
        float dist = length(p * scale - point);
        minDist = min(minDist, dist);
      }
    }
  }
  return minDist;
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * (1.0 - worley(p, frequency));
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightDir);
  vec3 V = normalize(-v_pos);

  // Animated cloud pattern
  vec3 samplePos = vec3(v_uv * 3.0, u_time * 0.02);
  float cloudNoise = fbm(samplePos);

  // Add wispy detail
  float detail = fbm(samplePos * 2.0 + 0.5) * 0.3;

  float cloudDensity = cloudNoise + detail;
  cloudDensity = smoothstep(0.35, 0.8, cloudDensity) * u_cloudCover;

  // Lighting on clouds
  float NdotL = max(dot(N, L), 0.0);
  float cloudLight = NdotL * 0.7 + 0.3;

  // Silver lining effect (brighter edges)
  float rim = 1.0 - abs(dot(N, V));
  float silverLining = pow(rim, 2.0) * 0.4 * cloudDensity;

  vec3 cloudColor = vec3(0.95, 0.95, 0.98) * cloudLight + vec3(0.85, 0.88, 0.95) * silverLining;

  fragColor = vec4(cloudColor, cloudDensity * 0.7);
}`

// ==================== Marker Billboard Shader ====================

export const markerVert = `#version 300 es
precision highp float;
in vec3 a_position;      // world position of marker
in vec4 a_color;          // instance color
in float a_size;          // instance size

uniform mat4 u_viewProj;
uniform vec2 u_viewportSize;
uniform float u_time;
uniform float u_hoverId;  // -1 = none
uniform float u_instanceOffset;

out vec4 v_color;
out float v_ringAlpha;

void main() {
  vec4 clipPos = u_viewProj * vec4(a_position, 1.0);
  vec2 ndc = clipPos.xy / clipPos.w;

  // Billboard offset in screen space
  float size = a_size * u_viewportSize.y * 0.01;
  int vertexId = gl_VertexID % 4;

  // Simple quad: 4 vertices per instance
  float ox = (vertexId == 0 || vertexId == 3) ? -size : size;
  float oy = (vertexId == 0 || vertexId == 1) ? size : -size;

  gl_Position = vec4(clipPos.xy / clipPos.w + vec2(ox, oy) / u_viewportSize, clipPos.z / clipPos.w, 1.0);
  gl_Position = clipPos + vec4(ox * clipPos.w, oy * clipPos.w, 0.0, 0.0);

  v_color = a_color;

  // Pulse animation
  float pulse = 0.7 + 0.3 * sin(u_time * 3.0 + u_instanceOffset * 1.7);
  v_color.a *= pulse;

  // Hover highlight
  float id = float(gl_InstanceID);
  v_ringAlpha = (abs(id - u_hoverId) < 0.5) ? 1.0 : 0.4;
}`

export const markerFrag = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_ringAlpha;
out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);

  // Outer ring
  float ring = smoothstep(0.7, 0.75, d) - smoothstep(0.85, 0.9, d);
  ring *= v_ringAlpha;

  // Inner filled circle
  float core = 1.0 - smoothstep(0.55, 0.65, d);

  // Glow
  float glow = exp(-d * 3.0) * 0.3;

  float alpha = core * v_color.a + ring * v_color.a * 0.8 + glow * v_color.a;
  vec3 color = v_color.rgb * (core * 1.0 + ring * 1.2 + glow * 0.6);

  fragColor = vec4(color, alpha);
}`

// ==================== Starfield Shader ====================

export const starVert = `#version 300 es
precision highp float;
in vec3 a_position;
uniform mat4 u_viewProj;
uniform float u_time;
out float v_twinkle;
void main() {
  gl_Position = u_viewProj * vec4(a_position, 1.0);
  gl_PointSize = 2.0;
  v_twinkle = fract(sin(dot(a_position.xy, vec2(12.9898, 78.233))) * 43758.5453);
}`

export const starFrag = `#version 300 es
precision highp float;
in float v_twinkle;
uniform float u_time;
out vec4 fragColor;
void main() {
  float alpha = 0.5 + 0.5 * sin(u_time * 2.0 + v_twinkle * 6.28);
  fragColor = vec4(1.0, 0.95, 0.8, alpha * 0.8);
}`
