/**
 * BrandMark — canonical HealthPredict logo glyph from the design system.
 * Gradient-filled rounded square with the pulse-wave path.
 *
 * Props:
 *   size    (number) — pixel size of the square (default 40)
 *   variant ('gradient' | 'dark') — dark uses solid slate bg, emerald stroke
 */
export default function BrandMark({ size = 40, variant = 'gradient', className = '' }) {
  const gradientId = `hp-grad-${variant}`;
  const strokeColor = variant === 'dark' ? '#10b981' : '#ffffff';
  const bgFill = variant === 'dark' ? '#0f172a' : `url(#${gradientId})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="HealthPredict"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      )}
      <rect width="64" height="64" rx="14" fill={bgFill} />
      <path
        d="M46 32h-8l-6 18L20 14l-6 18H6"
        fill="none"
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
