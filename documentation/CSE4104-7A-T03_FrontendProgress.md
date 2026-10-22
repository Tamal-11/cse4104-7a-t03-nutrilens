# CSE4104-7A-T03 Frontend Progress Report

## Project

**NutriLens — AI Based Food Recognition and Nutrition Analysis System**

The frontend is a responsive React/Vite single-page application. It uses a cookie-aware API client and browser-history paths rather than a separate router dependency.

## Implemented stack

| Area | Implementation |
|---|---|
| UI | React 19 + TypeScript |
| Build/dev server | Vite 6 |
| Styling | Tailwind CSS 4 and application CSS |
| Icons/animation/charts | Lucide React, Motion, Recharts |
| PWA | Vite Plugin PWA |
| API client | Browser `fetch` with `credentials: "include"` |

## Delivered screens and behavior

| Screen | Delivered behavior |
|---|---|
| Landing | Introduces NutriLens and starts sign-in/registration. |
| Login and registration | Client-side feedback, loading/error states, and session establishment. |
| Dashboard | Recent scan history, calendar-oriented eating-pattern view, and navigation. |
| AI Lens | Image preview, upload, Gemini analysis progress, result, failure, and no-food states. |
| Profile | Name, age, gender, height, weight, food goal, health conditions, allergies, sign-out, and PWA controls. |
| Administrator | User/scan overview, upload review, account status, logs, and Gemini key/model configuration. |

## Navigation and scan gate

The application has browser paths for `/`, `/login`, `/register`, `/dashboard`, `/ai-lens`, `/profile`, and `/admin`. Protected navigation restores the server session and loads profile/history. The AI Lens blocks a new scan until the required display name, age, height, and weight are present; past history may still be opened.

The interface sends `VITE_API_BASE_URL` requests with credentials. It first uploads a selected JPG, PNG, or WebP image and then sends the returned `imageId` to the analysis route. Results present a visible-portion estimate, classification, recommendation, benefits, cautions, and practical suggestions. The frontend never receives or stores Gemini keys.

## Remaining validation work

- Cross-browser, responsive, keyboard, and screen-reader testing.
- Deployed-environment verification of cookie/CORS behavior.
- End-to-end tests for successful, error, and no-food paths.
- PWA install/offline behavior validation on target devices.

Run static checks with:

```bash
pnpm run typecheck:frontend
pnpm run build:frontend
```
