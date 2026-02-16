// tailwind.config.js
module.exports = {
    darkMode: 'class', // <--- Ajoutez cette ligne
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }