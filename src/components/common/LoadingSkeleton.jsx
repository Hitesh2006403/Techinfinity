import React from 'react'
import { cn } from '../../utils/cn'

export function Skeleton({ className = '' }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/[0.06] border border-white/[0.04]',
        className
      )}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl p-5 bg-slate-900/50 border border-white/[0.06] backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-white/[0.05]">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}
