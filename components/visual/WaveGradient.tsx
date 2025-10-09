type Vec2 = { x: number; y: number };

const LINES = 40;
const LINE_SPACING = 2.0;
const SAMPLES = 800;
const CANVAS_SHIFT_X = -280;
const CANVAS_SHIFT_Y = -298;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const gaussian = (t: number, mean: number, sigma: number) =>
  Math.exp(-Math.pow((t - mean) / sigma, 2));

const baseCurvePoint = (t: number): Vec2 => {
  let x =
    lerp(30, 1500, t) +
    Math.sin(t * Math.PI * 1.05 + 0.3) * 12 +
    Math.sin(t * Math.PI * 0.5) * 10;

  const envelope =
    400 * gaussian(t, 0.2, 0.3) + 50 * gaussian(t, 0.2, 0.3) - 150;

  const snake = Math.sin((t * 2 + 0.1) * Math.PI);
  const tilt = 50 * Math.pow(1 - t, 0.98);

  let y = 100 + envelope * snake + tilt;

  const alignWindow = 0.2;
  const alignStrength = clamp((alignWindow - t) / alignWindow, 0, 1);
  if (alignStrength > 0) {
    const targetX = 0;
    const targetY = 0;
    x = x * (1 - alignStrength) + targetX * alignStrength;
    y = y * (1 - alignStrength) + targetY * alignStrength;

    const pivotX = 0;
    const pivotY = 0;
    const angle = (Math.PI / 1.7) * alignStrength;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - pivotX;
    const dy = y - pivotY;
    x = pivotX + dx * cos - dy * sin;
    y = pivotY + dx * sin + dy * cos;
  }

  return { x, y };
};

const computeBaseCurve = () =>
  Array.from({ length: SAMPLES + 1 }, (_, idx) => {
    const t = idx / SAMPLES;
    return baseCurvePoint(t);
  });

const baseCurve = computeBaseCurve();

const normals = baseCurve.map((point, idx) => {
  const prev = baseCurve[idx - 1] ?? point;
  const next = baseCurve[idx + 1] ?? point;
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    nx: -dy / length,
    ny: dx / length,
    tx: dx / length,
    ty: dy / length,
  };
});

const spreadProfile = (t: number) => {
  const leftPulse = 0.55 * gaussian(t, 0.2, 0.2);
  const midTurn = 0.85 * gaussian(t, 0.45, 0.18);
  const rightFan = 1.9 * gaussian(t, 0.82, 0.26);
  return 0.68 + leftPulse + midTurn + rightFan;
};

const twistProfile = (t: number, lane: number) =>
  Math.sin((t - 0.35) * Math.PI * 1.4) * lane * 0.34 +
  Math.sin((t - 0.72) * Math.PI * 1.7) * lane * 0.28;

const rippleProfile = (t: number, lane: number) =>
  Math.sin(t * Math.PI * 2.4 + lane * 0.5) * lane * 2.2;

const edgeTaper = (t: number) => {
  const startBlend = clamp(t / 0.18, 0, 1);
  const endBlend = clamp((1 - t) / 0.16, 0, 1);

  const startFactor = 0.55 + 0.45 * Math.pow(startBlend, 1.4);
  const fanFactor = 1 + 1.6 * Math.pow(1 - endBlend, 1.4);

  return startFactor * fanFactor;
};

const createOffsetPath = (offset: number) => {
  const points = baseCurve.map((base, idx) => {
    const { nx, ny, tx, ty } = normals[idx];
    const t = idx / SAMPLES;
    const lane = offset / (LINE_SPACING * ((LINES - 1) / 2 || 1));
    const spread = offset * spreadProfile(t);
    const twist = twistProfile(t, lane);
    const ripple = rippleProfile(t, lane);
    const taper = edgeTaper(t);

    return {
      x: base.x + taper * (nx * spread + tx * twist + nx * ripple),
      y: base.y + taper * (ny * spread + ty * twist + ny * ripple),
    };
  });

  return points.reduce(
    (path, point, idx) =>
      idx === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`,
    ""
  );
};

const paths = Array.from({ length: LINES }).map((_, index) => {
  const center = (LINES - 1) / 2;
  const offset = (index - center) * LINE_SPACING;
  const d = createOffsetPath(offset);
  const serpWeight = Math.pow(Math.abs(index - center) / center, 1.1);
  const opacity = clamp(0.94 - serpWeight * 0.7, 0.18, 0.92);
  return { d, opacity };
});

export default function WaveGradient({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-260 -320 1360 680"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="36%" stopColor="#6366f1" />
          <stop offset="65%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>

      <g
        transform={`translate(${CANVAS_SHIFT_X}, ${CANVAS_SHIFT_Y})`}
        stroke="url(#waveGradient)"
        strokeWidth="1.12"
        strokeLinecap="round"
      >
        {paths.map(({ d, opacity }, idx) => (
          <path key={idx} d={d} opacity={opacity} />
        ))}
      </g>
    </svg>
  );
}
