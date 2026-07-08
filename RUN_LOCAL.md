# Run NutriLens Locally

Use this from the project root:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The command starts the frontend and local API using plain npm. It also tries to start the optional Node AI service. If the AI native packages fail, the app still works using fallback demo analysis. No PNPM/Corepack, Neon, Cloudflare R2, or Cloudflare login is required for this local demo mode.

To stop everything, press `Ctrl+C` in the terminal.


If you see an old Corepack/PNPM error, run:

```bash
npm run clean:deps
npm run dev
```


To skip optional AI installation/startup in PowerShell:

```powershell
$env:SKIP_AI="1"; npm run dev
```
