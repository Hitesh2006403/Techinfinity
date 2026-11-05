export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-surface-container dark:bg-primary rounded-lg ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
