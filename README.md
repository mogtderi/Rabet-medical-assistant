# Rabet-medical-assistant
# Rabet — First-Aid Assistant with a 3D Crystal Rose

A Persian (RTL) web app that combines an **AI first-aid / medical-emergency assistant** (LLM API called from a server-side Express route) with an immersive **interactive 3D neon crystal rose** rendered in WebGL (Three.js).

> ⚠️ **Disclaimer:** Rabet gives general first-aid information only. It is **not** a medical device and never replaces a doctor or emergency services. In an emergency call your local emergency number (in Iran: **115**).

## Features

- 💬 Chat assistant specialised in first aid and emergencies (CPR, stroke signs, bleeding control, …), answering in Persian
- 🚨 Urgency detection that highlights emergency guidance and emergency phone numbers
- 🌹 Interactive 3D crystal rose in a starfield/nebula: orbit controls, glow, sparkles
- 🎛️ Settings panel to change rose color, rotation speed, glow intensity, orbit speed, sparkle density and nebula color
- 🔒 The Gemini API key stays on the server and is never sent to the browser
- 🪟 Glassmorphism / neon UI with Tailwind CSS and Motion animations, Persian font (Vazirmatn)

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Motion, lucide-react |
| 3D | Three.js (custom geometry, particles, OrbitControls) |
| Backend | Node.js, Express |
| AI | Google Gemini API (`@google/genai`) with a custom Persian system instruction |

## Getting started

**Requirements:** Node.js 20+ and a [Gemini API key](https://aistudio.google.com/app/apikey).

```bash
git clone https://github.com/mogtderi/rabet-medical-assistant.git
cd rabet-medical-assistant
npm install

# create a .env file (it is git-ignored) with your key:
echo 'GEMINI_API_KEY="your-key-here"' > .env

npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

The app needs a Node.js host (Render, Railway, Google Cloud Run, a VPS, …). It cannot be deployed to static hosting such as GitHub Pages because the chat uses the `/api/chat` server route.

## Project structure

```
├── server.ts                 # Express server, /api/chat (Gemini), /api/health, Vite middleware
├── index.html
├── src/
│   ├── App.tsx               # chat UI, settings panel, layout
│   ├── components/
│   │   └── RoseCanvas.tsx    # Three.js scene (rose, particles, orbits, cleanup)
│   ├── types.ts
│   ├── index.css             # Tailwind + glass/neon styles
│   └── main.tsx
├── .env.example
└── vite.config.ts
```

## Privacy

Messages typed in the chat are sent to the Gemini API to generate answers. Do not enter personal identifying or sensitive medical data.

## Roadmap

- [ ] Rate limiting and input validation on `/api/chat`
- [ ] Always append the safety disclaimer in code (not only through the prompt)
- [ ] Lower the model temperature for medical answers
- [ ] Accessibility: allow text selection in chat, ARIA labels, reduced-motion mode
- [ ] Lighter 3D mode for mobile devices
- [ ] Screenshots / demo GIF

## Credits

Project by **Moghtaderi**.

## License

MIT
