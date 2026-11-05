import { forwardRef } from "react";

export const Textarea = forwardRef(
  (
    {
      label,
      helperText,
      error,
      className = "",
      id,
      rows = 3,
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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`w-full rounded-xl bg-surface-container-lowest dark:bg-primary-container border text-sm text-on-surface dark:text-inverse-primary p-3.5 transition-colors placeholder:text-outline focus:outline-none focus:ring-1 resize-y leading-relaxed ${
            error
              ? "border-error focus:border-error focus:ring-error"
              : "border-outline-variant dark:border-primary-container focus:border-primary focus:ring-primary"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-error font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-on-surface-variant dark:text-outline">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
