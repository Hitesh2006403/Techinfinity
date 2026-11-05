import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search machines, documents, questions...',
  onClear,
  className = '',
  shortcutKey = '⌘K',
}) {
  const inputRef = useRef(null)

  return (
    <div className={cn('relative flex items-center w-full max-w-md group', className)}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-16 py-2 rounded-xl text-sm',
          'bg-white/[0.04] text-slate-100 placeholder:text-slate-400',
          'border border-white/10 hover:border-white/20',
          'focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-500/10',
          'transition-all duration-200'
        )}
      />

      <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
        {value ? (
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear()
              else onChange('')
            }}
            className="pointer-events-auto text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded-md">
            {shortcutKey}
          </kbd>
        )}
      </div>
    </div>
  )
}
