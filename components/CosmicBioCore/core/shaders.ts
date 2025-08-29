export const SPARKS_VERT = /* glsl */ `
precision highp float;
attribute vec3 aBase;
attribute float aSeed;

uniform float u_time,u_pulseHz,u_splashPeriod,u_splashPower,u_level;

varying float vBand;  // 0 = core

/* helpers */
float h1(float x){ return fract(sin(x*1.27)*43758.5453123); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }

void main(){
  float t = u_time;

  // Pulso más lento (respiración)
  const float PULSE_SCALE = 0.35;                 // ~3x más lento
  float breath = sin(6.2831 * u_pulseHz * (t * PULSE_SCALE));

  // --- Splash SUAVE (sin escalones): raised cosine 0..1 ---
  float phase   = fract(t / max(0.0001, u_splashPeriod));
  float splashS = 0.5 - 0.5 * cos(6.2831 * phase); // suave, periódica
  splashS = pow(splashS, 1.2);                     // perfil un poco más “pico”
  float sp = u_splashPower * splashS;

  // Nivel (se mantiene) – es suave de por sí
  float lvl = smoothstep(0.02, 0.25, u_level);
  lvl = pow(lvl, 0.5) * 2.0;

  // Núcleo
  vec3  p = vec3(0.0);
  float bandMix = 0.0;

  // radio base del núcleo (proporcional, pero todo suave)
  float Rc = 0.22 + 0.06 * (0.5*breath + 0.5*lvl);

  // dirección esférica estable por partícula
  float u = h1(aSeed*13.7);
  float v = h1(aSeed*41.1);
  float theta = 6.2831 * u;
  float phi   = acos(2.0*v - 1.0);
  vec3 dir = vec3(sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta));

  // pulso radial (usa breath/lvl + splash SUAVE)
  float pulse = 1.0 + 0.25*lvl + 0.18*breath + 0.20*sp; // (sp) más bajo = menos bombeo
  p = dir * Rc * pulse;

  // swirl lento (decorativo; no cambia el radio)
  p = rotY(0.35*t * 0.5) * rotX(0.22*t * 0.5) * p;

  // expansión radial global MUY sutil (también con splash suave)
  vec3 pr = normalize(vec3(p.x, 0.35*p.y, p.z));
  p += pr * (0.010*sp + 0.008*breath);

  // salida y tamaño suave (incluye sp pero ya es continuo)
  vec4 mvPosition = modelViewMatrix * vec4(p,1.0);
  gl_Position     = projectionMatrix * mvPosition;

  float baseSize = 1.30 * (1.0 + 0.06*breath + 0.08*sp + 0.22*lvl);
  float dist     = max(1.5, -mvPosition.z);
  float size     = baseSize * (58.0 / dist);
  float jitter   = mix(0.94, 1.06, h1(aSeed*43758.5453));
  gl_PointSize   = clamp(size*jitter, 0.6, 2.2);

  vBand = bandMix;
}
`;
export const SPARKS_FRAG = /* glsl */ `
precision highp float;

uniform float u_time;
uniform float u_level;
uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

varying float vBand;

void main(){
  vec2 uv = gl_PointCoord*2.0 - 1.0;
  float r2 = dot(uv,uv);
  if(r2>1.0) discard;

  float core = exp(-12.0*r2);
  float halo = exp(-2.5*r2);

  // Flicker más lento y de baja amplitud (no “salta”)
  float flicker = 0.94 + 0.12 * sin(u_time*2.0 + u_level*2.0);

  // Núcleo: color estable (acento solo si vBand>0)
  float accentMix = vBand * halo;
  vec3  baseColor = mix(u_coreColor, u_accentColor, accentMix);

  vec3 hot = vec3(1.0, 0.96, 0.92);
  vec3 color = mix(baseColor, hot, pow(u_level,1.25)*0.35);

  float bandAlpha = mix(1.0, 0.78, vBand);
  float alpha = (core*0.9 + halo*0.22) * bandAlpha * flicker;

  gl_FragColor = vec4(color, alpha);
}
`;
