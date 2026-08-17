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

Press `Ctrl+C` to stop the frontend and backend.
