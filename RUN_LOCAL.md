# Run NutriLens Locally

1. Install dependencies:

```bash
pnpm run setup
```

2. Start the app:

```bash
pnpm run dev
```

Open `http://localhost:3000`. The frontend uploads the image to the local backend, and the backend calls Gemini. No local model download or AI sidecar service is required.

Open `http://localhost:3000/admin` for the admin dashboard. In AI settings, add one or more Gemini keys; analysis calls rotate through the list in order. The server stores the key pool in the ignored `.local-storage/admin-ai-settings.json` file. Local API keys are not stored in `.env` or frontend environment files.

Press `Ctrl+C` to stop the frontend and backend.
