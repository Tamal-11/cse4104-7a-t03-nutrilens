# NutriLens Frontend

The frontend is a React + Vite + TypeScript interface for the NutriLens food analysis system.

## Local development

From the repository root:

```bash
npm run setup
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

It connects to the local backend using:

```text
VITE_API_BASE_URL=http://localhost:8787
```

## AI image flow

1. The user selects or drags and drops a JPG, PNG, or WebP food photo.
2. The frontend uploads the image to the backend.
3. The backend sends the stored image to the Node.js ONNX AI service.
4. The backend returns the Food-101 prediction and estimated nutrition values.
5. The frontend displays the result and stores it in analysis history.

Nutrition values shown in the interface are estimates for approximately 100 g of the detected food. They are not a measurement of the photographed portion.

## Main folders

```text
src/components/   Main UI screens
src/services/     Backend API client
src/types.ts      Shared frontend types
public/           Static assets
```

