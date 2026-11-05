import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) {
  return (
    <div
      className={`bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-container dark:bg-primary text-primary dark:text-inverse-primary border border-outline-variant flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="font-headline text-xl font-medium text-primary dark:text-inverse-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant dark:text-outline max-w-md mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
