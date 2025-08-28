/* ===================== Ribbon shaders ===================== */
export const RIBBON_VERT = /* glsl */ `
precision highp float;
attribute float aS;
attribute float aU;
uniform float u_time, u_pulseHz, u_splashPeriod, u_splashPower, u_level, u_eps;
uniform vec3 u_coreColor, u_accentColor;

vec3 centerPath(float s, float t) {
  float R = 1.15 + 0.20 * sin(6.2831*s + t*0.6) + 0.12 * sin(6.2831*s*2.0 - t*0.9);
  float ang = 6.2831*s*(1.0 + 0.15*sin(t*0.5));
  return vec3(R*cos(ang), 0.35*sin(ang*0.5 + t*0.8), R*sin(ang));
}
vec3 safeNorm(vec3 v){ float l=length(v); return (l>1e-6)? v/l : vec3(0.0,1.0,0.0); }

void main(){
  float t=u_time;
  float breath=sin(6.2831*u_pulseHz*t);
  float cyc=mod(t,u_splashPeriod);
  float splash=(cyc<0.18)?1.0:(cyc<0.55?0.6:0.0);
  float sp=u_splashPower*splash;
  float lvl=smoothstep(0.02,0.25,u_level);
  lvl=pow(lvl,0.5)*2.2;

  vec3 c0=centerPath(aS,t);
  vec3 c1=centerPath(min(1.0,aS+u_eps),t);
  vec3 T=safeNorm(c1-c0);
  vec3 N=safeNorm(cross(T,vec3(0.0,1.0,0.0)));
  vec3 B=safeNorm(cross(T,N));

  float thickness= (0.09+0.10*(1.0-pow(aS,2.2)))*(1.0+0.35*lvl+0.18*sp+0.10*breath);
  float wob=0.04*sin(6.2831*(aS*1.7+aU*0.5)+t*1.6)+0.02*cos(6.2831*(aS*2.3-aU*0.7)-t*1.2);
  vec3 pos=c0+(aU*thickness)*N+wob*B;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
}`;

export const RIBBON_FRAG = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec3 u_coreColor,u_accentColor;
void main(){
  float k=0.5+0.5*sin(gl_FragCoord.x*0.01+u_time*0.9);
  gl_FragColor=vec4(mix(u_coreColor,u_accentColor,k),0.86);
}`;

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
