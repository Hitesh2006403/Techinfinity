import { forwardRef } from "react";

export const Input = forwardRef(
  (
    {
      label,
      helperText,
      error,
      icon: Icon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-inverse-primary"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl bg-surface-container-lowest dark:bg-primary-container border text-sm text-on-surface dark:text-inverse-primary px-3.5 py-2.5 transition-colors placeholder:text-outline focus:outline-none focus:ring-1 ${
              error
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant dark:border-primary-container focus:border-primary focus:ring-primary"
            } ${Icon ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {Icon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-error font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-on-surface-variant dark:text-outline">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
