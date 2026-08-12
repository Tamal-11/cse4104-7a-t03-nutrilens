# AI inference smoke-test fixtures

These two representative food images are used only for local regression checks of the bundled Food-101 inference pipeline.

The smoke test verifies that the model preprocessing and label mapping remain aligned:

- `hamburger.webp` should classify as `hamburger` with confidence >= 0.70.
- `sushi.jpg` should classify as `sushi` with confidence >= 0.95.

Run from the repository root:

```bash
npm run inference:check
```

The thresholds are intentionally below the currently observed values so the check catches material preprocessing regressions without depending on exact floating-point output.
