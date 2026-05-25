// ==================== Wind Field Particle Shaders ====================

export const windVert = `#version 300 es
precision highp float;
in vec3 a_position;    // particle position
in vec3 a_velocity;    // particle velocity
in float a_life;       // particle age (0-1 normalized)
in float a_size;       // particle size

uniform mat4 u_viewProj;
uniform float u_time;
uniform float u_deltaTime;
uniform vec3 u_fieldCenter;
uniform float u_fieldRadius;
uniform float u_fieldStrength;
uniform float u_spiralFactor;

out float v_life;
out float v_alpha;

// Rotate around Y axis
mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(c, 0, -s, 0, 1, 0, s, 0, c);
}

void main() {
  vec3 pos = a_position;
  float life = a_life;

  // Update life
  life += u_deltaTime * 0.3;
  if (life > 1.0) life -= 1.0;

  // Compute wind field force at this position
  vec3 toCenter = u_fieldCenter - pos;
  float dist = length(toCenter);

  // Spiral wind: tangential + radial
  vec3 radial = normalize(toCenter) * u_fieldStrength * 0.3;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 tangential = normalize(cross(toCenter, up)) * u_fieldStrength * 0.7;
  vec3 spiral = radial + tangential;

  // Apply Coriolis-like rotation
  float coriolis = u_spiralFactor * (1.0 - smoothstep(0.0, u_fieldRadius, dist));
  vec3 rotatedPos = rotateY(coriolis * u_deltaTime) * pos;

  // Update position
  vec3 newPos = rotatedPos + spiral * u_deltaTime * 0.5;

  // Fade alpha based on distance and life
  float distFade = 1.0 - smoothstep(0.0, u_fieldRadius * 1.5, dist);
  float lifeFade = 1.0 - abs(life - 0.5) * 2.0;
  v_alpha = distFade * lifeFade * 0.6;
  v_life = life;

  gl_Position = u_viewProj * vec4(a_position, 1.0);
  gl_PointSize = a_size * (1.0 + lifeFade * 0.5);

  // Store updated values (in real impl we'd use transform feedback)
  // For simplicity, we animate via uniforms
}
`

export const windFrag = `#version 300 es
precision highp float;
in float v_life;
in float v_alpha;
uniform vec3 u_particleColor;
out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  float alpha = smoothstep(1.0, 0.0, d) * v_alpha;
  fragColor = vec4(u_particleColor, alpha);
}`

// ==================== Rain Particle Shaders ====================

export const rainVert = `#version 300 es
precision highp float;
in vec3 a_position;
in float a_offset;
uniform mat4 u_viewProj;
uniform float u_time;
uniform vec3 u_rainArea;
uniform float u_rainIntensity;
out float v_alpha;
void main() {
  float speed = 5.0 + u_rainIntensity * 2.0;
  float y = mod(a_position.y - u_time * speed + a_offset * 20.0, 10.0) - 5.0;
  vec3 pos = vec3(a_position.x, y, a_position.z);
  gl_Position = u_viewProj * vec4(pos, 1.0);
  v_alpha = 1.0 - abs(y) / 5.0;
  gl_PointSize = 1.5;
}`

export const rainFrag = `#version 300 es
precision highp float;
in float v_alpha;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.7, 0.8, 1.0, v_alpha * 0.4);
}`

// ==================== Compute Shader for Wind Field ====================

// Since WebGL2 doesn't have compute shaders, we use a ping-pong texture approach
// to simulate wind vector field evolution

export const windFieldVert = `#version 300 es
precision highp float;
in vec2 a_position;
uniform vec2 u_resolution;
out vec2 v_uv;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}`

export const windFieldFrag = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_prevField;
uniform float u_time;
uniform float u_deltaTime;
uniform vec3 u_fieldCenter; // lat/lng converted to uv
uniform float u_fieldStrength;
uniform float u_spiralFactor;
out vec4 fragColor;

// Convert uv (0-1) to 3D position on unit sphere
vec3 uvToSphere(vec2 uv) {
  float phi = uv.y * 3.14159265;
  float theta = uv.x * 6.28318531;
  return vec3(
    -sin(phi) * cos(theta),
    cos(phi),
    sin(phi) * sin(theta)
  );
}

void main() {
  vec3 pos = uvToSphere(v_uv);

  // Get previous wind vector
  vec4 prev = texture(u_prevField, v_uv);
  vec3 wind = prev.rgb * 2.0 - 1.0; // decode from [0,1] to [-1,1]

  // Compute influence from field center
  vec3 centerPos = uvToSphere(v_uv); // simplified

  // Spiral wind pattern
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 toCenter = u_fieldCenter - pos;
  float dist = length(toCenter);
  float influence = exp(-dist * dist / (0.2 * u_fieldStrength));

  vec3 radial = normalize(toCenter) * influence * 0.3;
  vec3 tangential = normalize(cross(toCenter, up)) * influence * u_spiralFactor;
  vec3 newWind = wind * 0.98 + (radial + tangential) * u_deltaTime * 2.0;

  // Encode back to [0,1]
  vec3 encoded = newWind * 0.5 + 0.5;
  fragColor = vec4(encoded, 1.0);
}`
