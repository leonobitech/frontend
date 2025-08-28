/* ===================== Ribbon shaders ===================== */
/* =========================================
   Shaders refinados
========================================= */
export const RIBBON_VERT = /* glsl */ `
precision highp float;

attribute float aS;  
attribute float aU;  

uniform float u_time;
uniform float u_pulseHz;
uniform float u_splashPeriod;
uniform float u_splashPower;
uniform float u_level;
uniform float u_eps;

vec3 centerPath(float s, float t) {
  float R = 1.2 + 0.25 * sin(6.2831 * s + t * 0.6)
                  + 0.15 * sin(6.2831 * s * 2.0 - t * 0.9);
  float ang = 6.2831 * s * (1.0 + 0.15 * sin(t * 0.5));
  float x = R * cos(ang);
  float z = R * sin(ang);
  float y = 0.4 * sin(ang * 0.5 + t * 0.8);
  return vec3(x, y, z);
}
vec3 safeNorm(vec3 v){ float l = length(v); return (l > 1e-6) ? v/l : vec3(0.0,1.0,0.0); }

void main() {
  float t = u_time;

  // mic + splash
  float breath = sin(6.2831 * u_pulseHz * t);
  float cyc = mod(t, u_splashPeriod);
  float splash = (cyc < 0.18) ? 1.0 : (cyc < 0.55 ? 0.6 : 0.0);
  float sp = u_splashPower * splash;

  float lvl = smoothstep(0.02, 0.25, u_level);
  lvl = pow(lvl, 0.5) * 2.0;

  // curva y ejes locales
  vec3 c0 = centerPath(aS, t);
  vec3 c1 = centerPath(min(1.0, aS + u_eps), t);
  vec3 T = safeNorm(c1 - c0);
  vec3 U = vec3(0.0, 1.0, 0.0);
  vec3 N = safeNorm(cross(T, U));
  vec3 B = safeNorm(cross(T, N));

  // grosor mucho más fino
  float thicknessBase = 0.04 + 0.06 * (1.0 - pow(aS, 2.2));
  float thickness = thicknessBase * (1.0 + 0.25 * lvl + 0.18 * sp + 0.10 * breath);

  // torsión helicoidal
  float twist = 3.1415 * aS + 2.0 * lvl * sin(t * 2.0);
  vec3 pos = c0 + cos(twist) * (aU * thickness) * N + sin(twist) * (aU * thickness) * B;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const RIBBON_FRAG = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec3  u_coreColor;
uniform vec3  u_accentColor;

void main() {
  float t = u_time;
  float k = 0.5 + 0.5 * sin(gl_FragCoord.x * 0.01 + t * 1.2);

  // mezcla tricolor
  vec3 midColor = mix(u_coreColor, u_accentColor, 0.5);
  vec3 col = mix(mix(u_coreColor, midColor, k), u_accentColor, 1.0-k);

  gl_FragColor = vec4(col, 0.4); // mucho más etéreo
}
`;

/* ===================== Sparks shaders ===================== */
export const SPARKS_VERT = /* glsl */ `
precision highp float;
attribute vec3 aBase;
attribute float aSeed;
uniform float u_time,u_pulseHz,u_splashPeriod,u_splashPower,u_level;

vec3 swirl(vec3 p,float seed,float t){
  float s1=sin(seed*6.2831+t*1.7);
  float s2=cos(seed*9.1234-t*1.1);
  vec3 j=vec3(s1*0.18,s2*0.16,(s1-s2)*0.14);
  float ang=0.9*sin(t*0.8+seed*6.2831);
  float ca=cos(ang),sa=sin(ang);
  mat3 R=mat3(ca,0.0,sa,0.0,1.0,0.0,-sa,0.0,ca);
  return R*(p+j);
}

void main(){
  float t=u_time;
  float breath=sin(6.2831*u_pulseHz*t);
  float cyc=mod(t,u_splashPeriod);
  float splash=(cyc<0.18)?1.0:(cyc<0.55?0.6:0.0);
  float sp=u_splashPower*splash;
  float lvl=smoothstep(0.02,0.25,u_level);
  lvl=pow(lvl,0.5)*2.0;

  vec3 p=swirl(aBase,aSeed,t);
  p+=normalize(aBase+vec3(1e-6))*(0.30*sp+0.30*lvl+0.06*breath);

  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  gl_PointSize = 1.5 * (1.0 + 0.08 * breath + 0.12 * sp + 0.25 * lvl);
}`;

export const SPARKS_FRAG = /* glsl */ `
precision highp float;
uniform vec3 u_coreColor,u_accentColor;
void main(){
  vec2 uv=gl_PointCoord*2.0-1.0;
  float r2=dot(uv,uv);
  if(r2>1.0)discard;
  float alpha = smoothstep(0.9, 0.0, r2);
  float glow  = smoothstep(0.7, 0.0, r2);
  gl_FragColor=vec4(mix(u_coreColor,u_accentColor,glow),alpha);
}`;
