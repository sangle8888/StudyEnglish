tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Be Vietnam Pro", "sans-serif"],
      },
      colors: {
        tealBrand: {
          50: "#f0fdfa",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        emeraldBrand: {
          50: "#ecfdf5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "float-delayed": "float 4s ease-in-out 2s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
};
