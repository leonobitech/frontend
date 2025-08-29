export const SPARKS_VERT = /* glsl */ `
precision highp float;
attribute vec3 aBase;
attribute float aSeed;

uniform float u_time,u_pulseHz,u_splashPeriod,u_splashPower,u_level;

varying float vBand;     // reservado
varying float vBreath;   // pulso [0..1]
varying float vWave;     // intensidad del frente (pico en el borde)
varying float vSeed;     // variación cromática
varying float vBuild;    // 0..1 cuánto "construido" está ese punto

/* helpers */
float h1(float x){ return fract(sin(x*1.27)*43758.5453123); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }

/* ===== knobs (tuneables) ===== */
const float PULSE_SCALE = 0.35; // pulso lento
const float WAVE_WIDTH  = 0.12; // grosor del frente (rad)
const float BUILD_TRAIL = 0.70; // cuánto ángulo queda "ya construido" detrás del frente (rad)
const float RC_MIN      = 0.020; // radio mínimo antes de ser construido

const float BULGE_GAIN  = 0.028; // empuje radial en el centro del frente
const float SUCK_GAIN   = 0.012; // compresión en bordes
const float SHEAR_GAIN  = 0.010; // deslizamiento tangencial
const float SHEAR_FREQ  = 6.0;   // Hz del shear
/* ============================ */

void main(){
  float t=u_time;

  // Pulso / splash (respetan tus parámetros; funcionan aunque sean 0)
  float breath = sin(6.2831 * u_pulseHz * (t * PULSE_SCALE));

  float phase   = fract(t / max(0.0001, u_splashPeriod));
  float splashS = 0.5 - 0.5 * cos(6.2831 * phase);
  splashS = pow(splashS, 1.2);
  float sp = u_splashPower * splashS;

  float lvl=smoothstep(0.02,0.25,u_level);
  lvl=pow(lvl,0.5)*2.0;

  // Dirección esférica estable por partícula
  float u = h1(aSeed*13.7);
  float v = h1(aSeed*41.1);
  float theta = 6.2831 * u;
  float phi   = acos(2.0*v - 1.0);
  vec3 dir = vec3(sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta));

  // Radio "target" (cuando ya está construido)
  float Rc = 0.22 + 0.06*(0.5*breath + 0.5*lvl);

  // ------------------- SHOCKWAVE + BUILD -------------------
  const float PI = 3.14159265;

  // Ángulo del punto respecto al eje X (0..π)
  float ang = acos(clamp(dot(dir, vec3(1.0,0.0,0.0)), -1.0, 1.0));

  // Velocidad del frente (puedes fijarla si quieres constante)
  float waveSpeed = mix(0.25, 0.55, 0.5*breath + 0.5*lvl);
  // float waveSpeed = 0.85; // <- opción: constante
  float r = mod(t * waveSpeed, PI); // ángulo del frente

  // Distancia angular con WRAP (mínima en el círculo)
  float d = abs(ang - r);
  d = min(d, PI - d);

  // Distancia angular con signo: negativa = detrás del frente (ya construido)
  float sd = atan(sin(ang - r), cos(ang - r)); // (-π..π)

  // vBuild: 0 delante del frente, 1 detrás (transición sobre BUILD_TRAIL)
  float build = smoothstep(-BUILD_TRAIL, 0.0, sd);
  vBuild = build;

  // Perfil del frente para efectos (pico en el borde)
  float w = WAVE_WIDTH;
  float band = exp(-0.5 * (d*d) / (w*w)); // gaussiano, continuo
  vWave = band;

  // Radio efectivo: arranca en RC_MIN y crece a Rc al pasar el frente
  float radial = mix(RC_MIN, Rc, build);
  // Pulso radial global (no cambia la lógica de build)
  float pulse = 1.0 + 0.25*lvl + 0.18*breath + 0.20*sp;

  vec3 p = dir * radial * pulse;

  // Deformación del frente (bulge/suck) SOLO sobre la zona del frente
  float x = clamp(d / max(1e-5, w), 0.0, 1.0);
  float bulge = (1.0 - x); bulge *= bulge;
  float rim   = smoothstep(0.65, 1.0, x);

  float disp = (BULGE_GAIN * bulge - SUCK_GAIN * rim) * (0.6*lvl + 0.4*breath);
  p += dir * (disp * band); // escalamos por intensidad del frente

  // Shear tangencial sobre el frente
  vec3 tangent = normalize(cross(vec3(1.0,0.0,0.0), dir));
  if(length(tangent) < 1e-4) tangent = normalize(cross(vec3(0.0,1.0,0.0), dir));
  float shear = sin(6.2831 * SHEAR_FREQ * t + aSeed*21.7) * SHEAR_GAIN * band;
  p += tangent * shear;

  // Detalles estéticos
  p = rotY(0.35*t * 0.5) * rotX(0.22*t * 0.5) * p;
  p += normalize(vec3(p.x, 0.35*p.y, p.z)) * (0.010*sp + 0.008*breath);

  // Salida y tamaño
  vec4 mvPosition = modelViewMatrix * vec4(p,1.0);
  gl_Position     = projectionMatrix * mvPosition;

  float baseSize = 1.30 * (1.0 + 0.06*breath + 0.08*sp + 0.22*lvl);
  float dist     = max(1.5, -mvPosition.z);
  float size     = baseSize * (58.0 / dist);
  float jitter   = mix(0.94, 1.06, h1(aSeed*43758.5453));
  gl_PointSize   = clamp(size*jitter, 0.6, 2.2);

  vBand   = 0.0;
  vBreath = 0.5 + 0.5*breath;
  vSeed   = fract(aSeed*0.73);
}
`;
export const SPARKS_FRAG = /* glsl */ `
precision highp float;

uniform float u_time;
uniform float u_level;
uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

varying float vBand;
varying float vBreath;
varying float vWave;
varying float vSeed;
varying float vBuild; // NUEVO

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
  return a + b * cos(6.2831853 * (c * t + d));
}

void main(){
  vec2 uv = gl_PointCoord*2.0 - 1.0;
  float r2 = dot(uv,uv);
  if(r2>1.0) discard;

  float core = exp(-12.0*r2);
  float halo = exp(-2.5*r2);

  // Color base – si no hay pulso, igual se anima con la onda (ver vWave en vert)
  vec3 pulsingBase = mix(u_coreColor, u_accentColor, vBreath);

  vec3 neon = palette(
    vBreath + 0.12 * u_time, // leve drift aunque pulseHz=0
    vec3(0.50), vec3(0.50), vec3(1.0),
    vec3(0.00, 0.33, 0.67) + vSeed
  );
  vec3 baseColor = mix(pulsingBase, neon, 0.35);

  float waveBoost = smoothstep(0.0, 1.0, vWave);
  vec3  waveColor = mix(baseColor, u_accentColor, 0.45 * waveBoost);
  vec3  hot       = vec3(1.0, 0.96, 0.92);
  vec3  color     = mix(waveColor, hot, pow(u_level,1.2) * (0.30 + 0.20*waveBoost));

  // Aparición: puntos "por delante" del frente son más transparentes
  float appear = pow(clamp(vBuild, 0.0, 1.0), 0.8); // fade-in suave

  float flicker = 0.94 + 0.12 * sin(u_time*2.0 + u_level*2.0);
  float alpha   = (core*0.9 + halo*0.22) * (0.95 + 0.25*waveBoost) * flicker * appear;

  gl_FragColor = vec4(color, alpha);
}
`;
