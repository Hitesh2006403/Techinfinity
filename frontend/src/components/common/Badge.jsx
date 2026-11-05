export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  icon: Icon,
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1 text-sm gap-2",
  };

  const variantStyles = {
    neutral:
      "bg-surface-container dark:bg-surface-container-high text-on-surface-variant dark:text-outline-variant border border-outline-variant/60",
    success:
      "bg-academic-green/10 text-academic-green dark:text-[#a4f4bc] border border-academic-green/20 font-medium",
    warning:
      "bg-academic-amber/10 text-academic-amber dark:text-secondary-fixed border border-academic-amber/20 font-medium",
    danger:
      "bg-academic-red/10 text-academic-red dark:text-[#ffdad6] border border-academic-red/20 font-medium",
    score:
      "bg-[#f2d45c] text-[#1e2433] border border-[#e2c54f] font-mono font-bold shadow-xs",
    provisional:
      "border border-dashed border-[#f2d45c] bg-[#f2d45c]/15 text-[#746100] dark:text-secondary-fixed font-mono font-bold",
    primary:
      "bg-primary-container text-white dark:bg-primary-fixed dark:text-primary font-medium"
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
