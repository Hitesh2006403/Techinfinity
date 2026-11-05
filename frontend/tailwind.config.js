/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core Specification Palette
        primary: {
          DEFAULT: "#2563EB", // Primary Blue
          hover: "#1D4ED8",
          light: "#EFF6FF",
          dark: "#1E40AF",
          container: "#1E293B",
          fixed: "#DBEAFE",
          dim: "#93C5FD",
        },
        teal: {
          DEFAULT: "#0D9488", // Secondary Teal
          hover: "#0F766E",
          light: "#F0FDFA",
          dark: "#115E59",
        },
        amber: {
          DEFAULT: "#F59E0B", // Accent Amber
          hover: "#D97706",
          light: "#FFFBEB",
          dark: "#B45309",
        },
        ai: {
          DEFAULT: "#8B5CF6", // AI Insights Purple
          hover: "#7C3AED",
          light: "#F5F3FF",
          dark: "#6D28D9",
        },
        teacher: {
          DEFAULT: "#EA5808", // Teacher Review Orange
          hover: "#C2410C",
          light: "#FFF7ED",
          dark: "#9A3412",
        },
        success: {
          DEFAULT: "#16A34A", // Success Green
          hover: "#15803D",
          light: "#F0FDF4",
          dark: "#166534",
        },
        surface: {
          DEFAULT: "#F8FAFC", // Background
          card: "#FFFFFF",    // Cards
          container: "#F1F5F9",
          "container-low": "#F8FAFC",
          "container-lowest": "#FFFFFF",
          "container-high": "#E2E8F0",
          "container-highest": "#CBD5E1",
          dim: "#E2E8F0",
          bright: "#FFFFFF",
        },
        "on-surface": {
          DEFAULT: "#1E293B", // Main Text
          variant: "#64748B", // Secondary Text
        },
        outline: {
          DEFAULT: "#94A3B8",
          variant: "#E2E8F0", // Borders
        },
        academic: {
          green: "#16A34A",
          "green-light": "rgba(22, 163, 74, 0.12)",
          amber: "#F59E0B",
          "amber-light": "rgba(245, 158, 11, 0.12)",
          red: "#EF4444",
          "red-light": "rgba(239, 68, 68, 0.12)",
          purple: "#8B5CF6",
          "purple-light": "rgba(139, 92, 246, 0.12)",
          orange: "#EA5808",
          "orange-light": "rgba(234, 88, 12, 0.12)",
          highlight: "#FEF08A",
        },
        secondary: {
          DEFAULT: "#0D9488",
          fixed: "#CCFBF1",
          "fixed-dim": "#99F6E4",
          container: "#F0FDFA",
        },
        error: {
          DEFAULT: "#EF4444",
          container: "#FEE2E2",
        },
        brand: {
          blue: "#2563EB",
          teal: "#0D9488",
          amber: "#F59E0B",
          purple: "#8B5CF6",
          green: "#16A34A",
          orange: "#EA5808",
          light: "#EFF6FF",
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
      },
      fontFamily: {
        headline: ["Poppins", "Inter", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "card-hover": "0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        subtle: "0 2px 6px 0 rgba(0, 0, 0, 0.04)",
        folio: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
        stamp: "0 1px 3px rgba(0,0,0,0.08)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "150ms",
        smooth: "250ms",
        reveal: "350ms",
      },
    },
  },
  plugins: [],
};
