# Hyperframes Composition Brief: NutriLens

## Objective
Create a concise launch-style brag video that shows NutriLens turning a meal photo into a useful, goal-aware nutrition report.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `D:\Projects\cse4104-7a-t03-nutrilens`
- Primary files read: `README.md`, `frontend/index.html`, `frontend/src/App.tsx`, `frontend/src/components/HomeScreen.tsx`, `frontend/src/components/AIInterfaceScreen.tsx`, `frontend/src/components/DashboardScreen.tsx`, `frontend/src/styles/index.css`
- Product name: NutriLens
- Tagline / strongest claim: "Snap a meal, know the deal"
- Key UI to recreate: the AI Lens upload -> scan -> Unified Food Report flow, including the macro chart and recommendation.
- Copy that must appear verbatim:
  - Snap a meal, know the deal
  - Food Analysis
  - Unified Food Report

## Creative Direction
- Tone preset: app-store
- Creative direction: calm, credible food-tech launch in a leafy mobile interface
- Interpretation: practical UI motion, clear feature-first language, leaf-green accent, and enough stillness for values to read.
- Angle: a meal photo becomes useful personal context, not merely an ingredient label.
- Hook: "Your meal has more to say."
- Outro / punchline: NutriLens — "Snap a meal, know the deal."
- Avoid: generic SaaS language, abstract filler, health certainty, and visual redesign unrelated to the supplied app.

## Visual Identity
- Background: #f2f8ed / #daefcc
- Text: #1c221a / #1a1b1a
- Accent: #599b38
- Display font: Inter 900
- Body font: Inter
- Visual references: the source logo, AI Lens upload/result screenshots, rounded white panels, green macro ring, light foliage shapes.

## Storyboard
Use `brag-plan.md` as the creative contract.

1. Meal signal — 3.0s — product mark, hook, and actual tagline.
2. Drop the photo — 4.0s — AI Lens upload screen and cursor interaction.
3. AI Lens resolves — 4.5s — scan line and analysis-ready signal.
4. The useful part — 4.5s — source result UI plus readable nutrition estimate cards.
5. Keep the signal — 4.0s — scan history and held brand close.

## Audio
- Audio role: warm product bed with sparse, low-risk interface accents.
- Audio arc: quiet entry -> precise upload tap -> soft scan confirmation -> three macro arrivals -> final warm logo resolve.
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: subtle volume, no narration, fade toward the final lockup.
- Music cue guidance: bundled 120.19 BPM cue preset. Major mark: 16.02s. Macro card beat grid: 12.02s, 12.52s, 13.01s.
- Audio-reactive treatment: subtle precomputed data drives only the existing scanner glow and background warmth; no waveform-style graphics.
- Audio-coupled moments: upload click, scan lock, macro-card sequence, final NutriLens logo.
- SFX selection guidance: low-risk `interface/click_003.ogg` for interaction; warm `impact/impactSoft_medium_001.ogg` for major result/logo emphasis.
- SFX analysis guidance: bundled `assets/sfx/sfx-analysis.md`; favor low high-frequency-risk files.
- Exact SFX choice: as specified above to keep the short edit calm and clear.
- Audio files: copied locally under `composition/assets/`.

## Hyperframes Instructions
Follow the current Hyperframes composition contract: one paused GSAP timeline, deterministic motion, readable text, and clips with deliberate timing. Show the real NutriLens UI screenshot in the upload and result scenes. Use a single monolithic composition, with the music as a local audio asset. Major reveal timing and beat-grid labels may follow the cited cue guidance only when readability remains intact.
