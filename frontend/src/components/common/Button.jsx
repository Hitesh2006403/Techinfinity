import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      className = "",
      icon: Icon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-primary dark:bg-primary-fixed text-white dark:text-primary hover:bg-primary-hover shadow-sm focus:ring-primary",
      secondary:
        "bg-surface-container-high dark:bg-primary-container text-on-surface dark:text-inverse-primary hover:bg-surface-container-highest focus:ring-outline",
      outline:
        "border border-outline-variant dark:border-primary-container bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-inverse-primary hover:bg-surface-container-low focus:ring-outline",
      ghost:
        "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low dark:hover:bg-primary-container focus:ring-outline",
      danger:
        "bg-error text-white hover:bg-error/90 focus:ring-error shadow-sm",
      success:
        "bg-academic-green text-white hover:bg-academic-green/90 focus:ring-academic-green shadow-sm",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="w-4 h-4 shrink-0" />
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
