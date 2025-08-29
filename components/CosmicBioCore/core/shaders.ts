/* ===================== Sparks — AI Random + Cohesion + Smoke + Tear (STRONG) ===================== */
export const SPARKS_VERT = /* glsl */ `
precision highp float;
attribute vec3 aBase;
attribute float aSeed;

uniform float u_time, u_pulseHz, u_splashPeriod, u_splashPower, u_level;

/* Cohesión */
uniform float u_cohesion;
uniform int   u_binsTheta;
uniform int   u_binsPhi;
uniform float u_clusterJitter;

/* Humo */
uniform float u_smokeRatio;
uniform float u_smokeFlow;
uniform float u_smokeSize;

/* Tear (hueco fuerte) */
uniform float u_tearPeriod;   // seg
uniform float u_tearWidth;    // rad máx del hueco
uniform float u_tearSpin;     // rad/s
uniform float u_tearSharp;    // 1..4
uniform float u_tearPush;     // 0..0.2 aprox (empuje borde)
uniform float u_tearSuck;     // 0..0.1 aprox (vacío interior)
uniform float u_tearShear;    // 0..0.15 aprox (cizalla lateral)
uniform float u_tearNoise;    // 0..0.1 (jitter en el rompimiento)

varying float vBreath;
varying float vWave;
varying float vSeed;
varying float vIsSmoke;
varying float vSmokeN;
varying float vHole;      // 0 fuera del hueco, 1 dentro
varying float vRim;       // 0..1 borde del hueco

/* -------- helpers -------- */
float h1(float x){ return fract(sin(x*1.27)*43758.5453123); }
vec3  h3(float n){ return fract(sin(vec3(n,n+1.0,n+2.0)*1.27)*43758.5453); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }

/* value-noise 3D + fbm para humo */
float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float n000=hash3(i+vec3(0,0,0)), n100=hash3(i+vec3(1,0,0));
  float n010=hash3(i+vec3(0,1,0)), n110=hash3(i+vec3(1,1,0));
  float n001=hash3(i+vec3(0,0,1)), n101=hash3(i+vec3(1,0,1));
  float n011=hash3(i+vec3(0,1,1)), n111=hash3(i+vec3(1,1,1));
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

vec3 sampleSphere(float s){
  vec3 r=h3(s*19.3); float u=r.x, v=r.y;
  float th=6.2831853*u, ph=acos(2.0*v-1.0);
  vec3 dir=vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th));
  float rad=pow(r.z, 1.0/3.0);
  return dir*rad;
}
vec3 sampleCube(float s){ return h3(s*37.1)*2.0-1.0; }
vec3 sampleBlob(float s){
  vec3 p=h3(s*67.3)*2.0-1.0;
  p+=0.25*sin(vec3(p.x*2.3,p.y*2.1,p.z*2.7));
  return normalize(p)*length(p);
}

const float WAVE_W=0.12;

void main(){
  float t=u_time;

  // Pulso + splash
  float breath=sin(6.2831*u_pulseHz*t);
  float phase=fract(t/max(0.0001,u_splashPeriod));
  float splashS=0.5-0.5*cos(6.2831*phase);
  splashS=pow(splashS,1.2);
  float sp=u_splashPower*splashS;

  float lvl=smoothstep(0.02,0.25,u_level);
  lvl=pow(lvl,0.5)*2.0;

  // AI Random
  vec3 s1=sampleSphere(aSeed), s2=sampleCube(aSeed), s3=sampleBlob(aSeed);
  float mode=floor(mod(t/6.0,3.0));
  vec3 target=(mode<1.0)?s1:((mode<2.0)?s2:s3);
  float morph=smoothstep(0.0,1.0,fract(t/6.0));
  vec3 p0=mix(s1,target,morph);
  vec3 dir=normalize(p0+1e-6);

  // Cohesión esférica
  float theta=atan(dir.z,dir.x); if(theta<0.0) theta+=6.2831853;
  float phi=acos(clamp(dir.y,-1.0,1.0));
  float fT=float(u_binsTheta), fP=float(u_binsPhi);
  float iT=floor(theta/(6.2831853/max(1.0,fT)));
  float iP=floor(phi  /(3.14159265/max(1.0,fP)));
  float cTheta=(iT+0.5)*(6.2831853/max(1.0,fT));
  float cPhi  =(iP+0.5)*(3.14159265/max(1.0,fP));
  vec3 cellDir=vec3(sin(cPhi)*cos(cTheta),cos(cPhi),sin(cPhi)*sin(cTheta));
  float coh=clamp(u_cohesion,0.0,1.0);
  dir=normalize(mix(dir,cellDir,coh));

  // Radio / posición base
  float Rc=0.25 + 0.06*(0.5*breath + 0.5*lvl);
  vec3 p=dir * Rc * (0.85 + 0.15*h1(aSeed*97.7));

  // Shockwave
  float ang=acos(clamp(dot(dir,vec3(1.0,0.0,0.0)),-1.0,1.0));
  float waveSpeed=mix(0.35,0.65,lvl);
  float rr=mod(t*waveSpeed,3.14159265);
  float dd=abs(ang-rr); dd=min(dd,3.14159265-dd);
  float band=exp(-0.5*(dd*dd)/(WAVE_W*WAVE_W));
  vWave=band;
  p += dir * (0.02 * band * (0.6*lvl + 0.4*breath));

  // ------------ TEAR (HUECO FUERTE) ------------
  vec3 tearAxis = normalize(vec3(cos(u_tearSpin*t), 0.0, sin(u_tearSpin*t)));
  float tearPhase = fract(t / max(0.0001, u_tearPeriod));
  float open = pow(0.5 - 0.5*cos(6.2831853*tearPhase), u_tearSharp);
  float w = u_tearWidth * open;

  float angT = acos(clamp(dot(dir, tearAxis), -1.0, 1.0)); // 0 en el eje
  float hole = 1.0 - smoothstep(w, w*1.12, angT);          // 1 dentro del hueco
  float rim  = smoothstep(w*0.82, w, angT) * (1.0 - smoothstep(w, w*1.18, angT));

  // Empuje fuerte en el borde (radial + tangencial)
  vec3 up = abs(tearAxis.y)>0.99 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0);
  vec3 tangent = normalize(cross(tearAxis, dir));
  vec3 bitan   = normalize(cross(dir, tangent));

  // Jitter roto-noise para que la rotura sea “sucia”
  float tearJ = (h1(aSeed*611.0) - 0.5) * u_tearNoise;

  float push = u_tearPush * (0.7*rim + 0.3*rim*rim) * (0.5+0.5*open) * (0.7+0.3*lvl);
  vec3 pushVec = dir * push + (tangent + bitan) * (push * 1.35);
  p += pushVec + tearJ * (tangent - bitan);

  // Vacío dentro del hueco (succión hacia adentro)
  p -= dir * (u_tearSuck * hole * (0.6 + 0.4*open));

  // Cizalla lateral para “rasgar”
  float shear = u_tearShear * rim * (0.6 + 0.4*open);
  p += tangent * shear - bitan * shear;

  // --- Humo (deriva + swirl suave) ---
  float isSmoke = step(h1(aSeed*5.13), u_smokeRatio);
  vIsSmoke = isSmoke;
  float n = fbm(dir*2.2 + vec3(0.0, t*u_smokeFlow, 0.0));
  vSmokeN = n;
  if(isSmoke > 0.5){
    vec3 up2 = abs(dir.y)>0.99 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0);
    vec3 t2 = normalize(cross(up2,dir));
    vec3 b2 = normalize(cross(dir,t2));
    float swirl = (n-0.5)*0.06;
    p += t2*swirl + b2*swirl;
  }

  // Rotación global ligera
  p = rotY(0.2*t) * rotX(0.1*t) * p;

  // Tamaño
  vec4 mvPosition = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * mvPosition;

  float baseSize = 0.9 * (1.0 + 0.05*breath + 0.06*sp + 0.18*lvl);
  float dist = max(1.5, -mvPosition.z);
  float size = baseSize * (46.0 / dist);
  float jitter = mix(0.95, 1.05, h1(aSeed*43758.5453));
  size = clamp(size * jitter, 0.35, 1.4);
  if(isSmoke > 0.5){ size *= u_smokeSize; }

  // Apaga casi por completo dentro del hueco
  size = mix(size, 0.04, clamp(hole, 0.0, 1.0));

  gl_PointSize = size;

  vBreath = 0.5 + 0.5*breath;
  vSeed   = fract(aSeed*0.73);
  vHole   = hole;
  vRim    = rim;
}
`;
/* ===================== Sparks FRAG — tear strong + smoke ===================== */
export const SPARKS_FRAG = /* glsl */ `
precision highp float;

uniform float u_time;
uniform float u_level;
uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

/* Humo */
uniform float u_smokeOpacity;

/* Tear */
varying float vHole;
varying float vRim;

varying float vBreath;
varying float vWave;
varying float vSeed;
varying float vIsSmoke;
varying float vSmokeN;

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
  return a + b * cos(6.2831853 * (c * t + d));
}

void main(){
  vec2 uv = gl_PointCoord*2.0 - 1.0;
  float r2 = dot(uv,uv);
  if(r2>1.0) discard;

  float core = exp(-20.0*r2);
  float halo = exp(-3.5 *r2);

  float mixAmt = clamp(0.55*vBreath + 0.45*smoothstep(0.0,1.0,vWave), 0.0, 1.0);
  vec3 base = mix(u_coreColor, u_accentColor, mixAmt);

  vec3 neon = palette(
    vBreath + 0.08*u_time,
    vec3(0.55), vec3(0.45), vec3(1.0),
    vec3(0.0,0.33,0.67) + vSeed
  );
  base = mix(base, neon, 0.20);

  float waveBoost = pow(smoothstep(0.0,1.0,vWave), 0.9);
  vec3  sparkCol  = mix(base, u_accentColor, 0.35 * waveBoost);
  vec3  hot       = vec3(1.0, 0.97, 0.94);
  sparkCol = mix(sparkCol, hot, pow(u_level,1.2) * (0.2 + 0.2*waveBoost));
  float sparkA = (core*0.92 + halo*0.18);

  // Humo
  vec3 smokeTint = mix(vec3(0.85), normalize(u_coreColor)*0.9, 0.35);
  smokeTint = mix(smokeTint, u_accentColor, 0.15*waveBoost);
  float smokeSoft = exp(-2.2*r2);
  float smokePulse = 0.85 + 0.15*(0.5+0.5*sin(u_time*2.0));
  float smokeA = u_smokeOpacity * smokeSoft * smokePulse * (0.75 + 0.25*vSmokeN);

  vec3  color = mix(sparkCol, smokeTint, vIsSmoke);
  float alpha = mix(sparkA,   smokeA,    vIsSmoke);

  // Borde del hueco más brillante (glow extra y un poco más de alpha)
  color = mix(color, u_accentColor, 0.35 * vRim);
  alpha *= (1.0 + 0.45 * vRim);

  // Dentro del hueco: “vacío”
  alpha *= (1.0 - clamp(vHole, 0.0, 1.0));

  // Flicker
  float flicker = 0.96 + 0.10 * sin(u_time*6.0 + vSeed*5.0);
  alpha *= flicker;

  gl_FragColor = vec4(color, alpha);
}
`;
