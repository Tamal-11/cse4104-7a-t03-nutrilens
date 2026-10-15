# Run NutriLens Locally with Gemini

1. Install dependencies:

```bash
pnpm run setup
```

2. Create `.env` from `.env.example`, then add your Gemini API key:

```text
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Keep this key only in the root `.env` file. Do not use a `VITE_` prefix and never commit it.

3. Start the app:

```bash
pnpm run dev
```

Open `http://localhost:3000`. The frontend uploads the image to the local backend, and the backend calls Gemini directly. No local model download or AI sidecar service is required.

Open `http://localhost:3000/admin` for the admin dashboard. The local demo API includes Users, Food uploads, and AI settings tabs. In AI settings, add one or more Gemini keys; analysis calls rotate through the list in order. The server stores the key pool in the ignored `.local-storage/admin-ai-settings.json` file. The API keys never go into frontend environment variables or the local `.env` file.

Press `Ctrl+C` to stop the frontend and backend.
