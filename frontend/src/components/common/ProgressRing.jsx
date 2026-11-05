export function ProgressRing({
  value = 0,
  max = 10,
  size = 64,
  strokeWidth = 6,
  color = "#2e7d4f",
  label,
  sublabel
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-container dark:text-primary"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className="text-sm font-bold text-on-surface dark:text-inverse-primary leading-none">
            {value.toFixed(1)}
          </span>
          <span className="text-[10px] text-outline">/{max}</span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-on-surface mt-1">{label}</span>}
      {sublabel && <span className="text-[10px] text-outline">{sublabel}</span>}
    </div>
  );
}
