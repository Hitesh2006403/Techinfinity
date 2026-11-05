export function Card({
  children,
  className = "",
  variant = "default",
  onClick,
  ...props
}) {
  const isClickable = Boolean(onClick);

  const variantStyles = {
    default:
      "bg-surface-container-lowest dark:bg-primary-container border border-outline-variant dark:border-primary-container/80 rounded-xl",
    folio:
      "bg-surface-container-lowest dark:bg-primary-container border border-outline-variant dark:border-primary-container/80 rounded-xl relative overflow-hidden ledger-paper-line",
    callout:
      "bg-surface-container-low dark:bg-primary border border-outline-variant rounded-xl",
    paper:
      "bg-white dark:bg-primary-container border border-outline-variant rounded-xl shadow-folio",
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} ${
        isClickable ? "cursor-pointer hover:shadow-folio-hover hover:-translate-y-0.5 transition-all duration-150" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", title, subtitle, action }) {
  if (title || subtitle || action) {
    return (
      <div className={`p-5 border-b border-outline-variant/60 flex items-center justify-between ${className}`}>
        <div>
          {title && <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-on-surface-variant dark:text-outline mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={`p-5 border-b border-outline-variant/60 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`p-4 bg-surface-container-low/50 dark:bg-primary/30 border-t border-outline-variant/60 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
}
