/* ===================== Sparks — Carpet Only (levitación + edge lift) ===================== */
export const SPARKS_VERT = /* glsl */ `
precision highp float;
attribute vec3 aBase;
attribute float aSeed;

/* tiempo + señal (ya en tu API) */
uniform float u_time, u_pulseHz, u_splashPeriod, u_splashPower, u_level;

/* Humo */
uniform float u_smokeRatio;   // 0..1
uniform float u_smokeFlow;    // velocidad de deriva
uniform float u_smokeSize;    // multiplicador de tamaño

/* Alfombra/malla */
uniform float u_carpetSize;   // 0.8..1.2
uniform float u_carpetCurl;   // 0..0.6 (enrollado bordes)
uniform float u_carpetNoise;  // 0..0.1 (arrugas)
uniform float u_carpetWaveAmp;// 0..0.2 (ondas U/V)
uniform float u_carpetWaveHz; // Hz ondas U/V

/* Borde orgánico (“squircle” con ruido) */
uniform float u_edgeRound;    // 2..6 (2=círculo)
uniform float u_edgeFeather;  // 0.01..0.25
uniform float u_edgeNoise;    // 0..0.25
uniform float u_edgeWarp;     // 0..0.6

/* Riple radial */
uniform float u_carpetRadHz;  // 0..1.2
uniform float u_carpetRadAmp; // 0..0.25

/* --- NUEVO: levitar todo y soltar puntas en X --- */
uniform float u_levAmp;       // 0..0.3   amplitud de levitación global
uniform float u_levHz;        // 0..1.0   Hz de levitación global
uniform float u_edgeLiftAmp;  // 0..0.25  amplitud extra en extremos X
uniform float u_edgeLiftHz;   // 0..1.0   Hz de ese movimiento
uniform float u_edgePhase;    // 0..6.283 fase entre izquierda/derecha

varying vec2  vCarpetUV;      // UV para grid
varying float vCarpetMask;    // máscara de borde orgánico
varying float vIsSmoke;       // 0/1
varying float vSmokeN;        // ruido humo
varying float vBreath;
varying float vSeed;

/* ---------- helpers ---------- */
float h1(float x){ return fract(sin(x*1.27)*43758.5453123); }
vec3  h3(float n){ return fract(sin(vec3(n,n+1.0,n+2.0)*1.27)*43758.5453); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }

float hash3v(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float n000=hash3v(i+vec3(0,0,0)), n100=hash3v(i+vec3(1,0,0));
  float n010=hash3v(i+vec3(0,1,0)), n110=hash3v(i+vec3(1,1,0));
  float n001=hash3v(i+vec3(0,0,1)), n101=hash3v(i+vec3(1,0,1));
  float n011=hash3v(i+vec3(0,1,1)), n111=hash3v(i+vec3(1,1,1));
  float nx00=mix(n000,n100,f.x), nx10=mix(n010,n110,f.x);
  float nx01=mix(n001,n101,f.x), nx11=mix(n011,n111,f.x);
  float nxy0=mix(nx00,nx10,f.y), nxy1=mix(nx01,nx11,f.y);
  return mix(nxy0,nxy1,f.z);
}
float fbm(vec3 p){
  float a=0.5, s=1.0, sum=0.0;
  for(int i=0;i<4;i++){ sum+=a*vnoise(p*s); s*=2.0; a*=0.55; }
  return sum;
}
vec3 sampleSphereDir(float s){
  vec3 r=h3(s*19.3); float u=r.x, v=r.y;
  float th=6.2831853*u, ph=acos(2.0*v-1.0);
  return vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th));
}

void main(){
  float t = u_time;
  float breath = sin(6.2831*u_pulseHz*t);
  vBreath = 0.5 + 0.5*breath;
  vSeed   = fract(aSeed*0.73);

  // Dirección base para derivar UV esféricos (no dibujamos la esfera)
  vec3 dir = normalize(sampleSphereDir(aSeed)+1e-6);

  // Spherical → UV en [-1,1]^2
  float theta = atan(dir.z,dir.x); if(theta<0.0) theta+=6.2831853;
  float phi   = acos(clamp(dir.y,-1.0,1.0));
  vec2 uv = vec2(theta/3.14159265 - 1.0, 1.0 - phi/1.57079633);

  // Warp sutil para evitar silueta cuadrada
  vec2 uvw = uv;
  uvw += u_edgeWarp * vec2(
    0.25*uv.y*(0.6+0.4*sin(u_time*0.7)) + 0.05*sin(3.0*uv.y + u_time),
    0.25*uv.x*(0.6+0.4*cos(u_time*0.65)) + 0.05*sin(3.5*uv.x - u_time*1.1)
  );

  // Lp-norm “squircle”
  float pEdge = max(1.0001, u_edgeRound);
  float lp = pow(abs(uvw.x), pEdge) + pow(abs(uvw.y), pEdge);

  // Ruido para irregularidad del borde
  float nEdge = fbm(vec3(uvw*5.0, t*0.6 + aSeed*1.7)) * 2.0 - 1.0;
  float edge = 1.0 - smoothstep(1.0 - u_edgeFeather - u_edgeNoise*0.5,
                                1.0 + u_edgeFeather + u_edgeNoise*0.5,
                                lp + u_edgeNoise*0.35*nEdge);
  vCarpetMask = clamp(edge, 0.0, 1.0);

  // Ondas U/V + riple radial
  float waveU = sin( (uvw.x*3.14159*4.0) - u_time*6.2831*u_carpetWaveHz );
  float waveV = sin( (uvw.y*3.14159*3.0) - u_time*6.2831*u_carpetWaveHz*0.85 );
  float ruv   = length(uvw);
  float waveR = sin( ruv*3.14159*8.0 - u_time*6.2831*u_carpetRadHz );

  // Ruido de “arrugas” y curl en bordes
  float nCarp = fbm(vec3(uvw*4.0, t*0.8 + aSeed*2.3));
  vec2  uvScaled = uvw * u_carpetSize;
  float curlX = u_carpetCurl * (1.0 - pow(1.0-abs(uvScaled.x), 2.0));
  float curlY = u_carpetCurl * (1.0 - pow(1.0-abs(uvScaled.y), 2.0));

  // Perfil de amplitud basado en la distancia al centro UV
  float centerWeight = 1.0 - smoothstep(0.6, 1.0, length(uvw));

  // Altura base
  float y =
      (curlX + curlY)*0.18
    + u_carpetNoise*(nCarp-0.5)
    + centerWeight * u_carpetWaveAmp*(0.35*waveU + 0.35*waveV)
    + centerWeight * u_carpetRadAmp*waveR;

  // --- Levitación global en eje Y (toda la pieza)
  y += u_levAmp * sin(6.2831853 * u_levHz * t);

  // --- “Desanclar” puntas en X (flotan aunque centerWeight≈0)
  float ex = smoothstep(0.55, 1.0, abs(uvScaled.x)); // 0 centro → 1 extremos
  float side = sign(uvScaled.x);                     // -1 izq / +1 der
  y += u_edgeLiftAmp * ex * sin(6.2831853 * u_edgeLiftHz * t + side * u_edgePhase);

  // Posición final
  vec3 pCarpet = vec3(uvScaled.x, y, uvScaled.y);

  // Humo (deriva)
  float isSmoke = step(h1(aSeed*5.13), u_smokeRatio);
  vIsSmoke = isSmoke;
  float nS = fbm(dir*2.2 + vec3(0.0, t*u_smokeFlow, 0.0));
  vSmokeN = nS;
  if(isSmoke > 0.5){
    vec3 up2 = abs(dir.y)>0.99 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0);
    vec3 t2 = normalize(cross(up2,dir));
    vec3 b2 = normalize(cross(dir,t2));
    float swirl = (nS-0.5)*0.06;
    pCarpet += t2*swirl + b2*swirl;
  }

  // Inclinación fija
  vec3 p = rotX(0.5) * pCarpet;

  // Salida y tamaño
  vec4 mvPosition = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * mvPosition;

  float baseSize = (1.0 + 0.05*breath + 0.18*pow(u_level,0.5));
  float dist = max(1.5, -mvPosition.z);
  float size = baseSize * (46.0 / dist);
  float jitter = mix(0.95, 1.05, h1(aSeed*43758.5453));
  size = clamp(size * jitter, 0.33, 1.45);
  if(isSmoke > 0.5){ size *= u_smokeSize; }

  gl_PointSize = size;
  vCarpetUV = uvw;
}
`;
/* ===================== Sparks FRAG — Carpet Only ===================== */
export const SPARKS_FRAG = /* glsl */ `
precision highp float;

uniform float u_time;
uniform float u_level;
uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

/* Humo */
uniform float u_smokeOpacity;

/* Malla (grid) en alfombra */
uniform float u_gridStep;   // p.ej. 0.12
uniform float u_gridSoft;   // p.ej. 0.015
uniform float u_gridBoost;  // p.ej. 0.6

varying vec2  vCarpetUV;
varying float vCarpetMask;
varying float vIsSmoke;
varying float vSmokeN;
varying float vBreath;
varying float vSeed;

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
  return a + b * cos(6.2831853 * (c * t + d));
}

float softGrid(vec2 uv, float step, float soft){
  float du = abs(fract((uv.x*0.5+0.5)/step)-0.5)*step;
  float dv = abs(fract((uv.y*0.5+0.5)/step)-0.5)*step;
  float g  = exp(-du*du/(soft*soft)) + exp(-dv*dv/(soft*soft));
  return clamp(g, 0.0, 1.5);
}

void main(){
  vec2 pix = gl_PointCoord*2.0 - 1.0;
  float r2 = dot(pix,pix);
  if(r2>1.0) discard;

  // núcleo + halo (sprite)
  float core = exp(-18.0*r2);
  float halo = exp(-3.0*r2);

  // color base respirando
  float mixAmt = clamp(0.55*vBreath, 0.0, 1.0);
  vec3 base = mix(u_coreColor, u_accentColor, mixAmt);

  // neón sutil
  vec3 neon = palette(
    vBreath + 0.08*u_time,
    vec3(0.55), vec3(0.45), vec3(1.0),
    vec3(0.0,0.33,0.67) + vSeed
  );
  base = mix(base, neon, 0.18);

  vec3 sparkCol = base;
  vec3 hot = vec3(1.0, 0.97, 0.94);
  sparkCol = mix(sparkCol, hot, pow(u_level,1.2) * 0.18);
  float sparkA = (core*0.90 + halo*0.18);

  // humo
  vec3 smokeTint = mix(vec3(0.85), normalize(u_coreColor)*0.9, 0.35);
  float smokeSoft = exp(-2.1*r2);
  float smokePulse = 0.86 + 0.14*(0.5+0.5*sin(u_time*2.0));
  float smokeA = u_smokeOpacity * smokeSoft * smokePulse * (0.75 + 0.25*vSmokeN);

  vec3  color = mix(sparkCol, smokeTint, vIsSmoke);
  float alpha = mix(sparkA,   smokeA,    vIsSmoke);

  // Grid de la malla, atenuado por la máscara de borde
  float grid = softGrid(vCarpetUV, u_gridStep, u_gridSoft) * vCarpetMask;
  color = mix(color, mix(u_accentColor, vec3(1.0), 0.35), u_gridBoost * grid);

  // Borde orgánico: cae alpha en el contorno
  alpha *= vCarpetMask;

  // flicker leve
  float flicker = 0.96 + 0.10 * sin(u_time*6.0 + vSeed*5.0);
  alpha *= flicker;

  if(alpha < 0.01) discard;
  gl_FragColor = vec4(color, alpha);
}
`;
