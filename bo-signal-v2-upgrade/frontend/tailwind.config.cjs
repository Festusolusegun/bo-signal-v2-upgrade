module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070a",
        panel: "#0e141b",
        "panel-raised": "#141c26",
        hairline: "rgba(245,243,238,0.08)",
        phosphor: "#ffb238",
        call: "#37d67a",
        put: "#ff5d5d",
        idle: "#6b7785",
        primary: "#f5f3ee",
        muted: "#8993a1",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        data: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
