# Test guide

Automated tests have not yet been added to this workspace. Before release, verify the following scenarios against the local demo and the deployed Worker.

- Authentication: registration, sign-in, session restoration, sign-out, and protected-route rejection.
- Profile: required scan-gate fields, allowed food goals, and supported allergy validation.
- Upload: JPEG/PNG/WebP acceptance, unsupported MIME type, mismatched file signature, over-size file, and owner-only image access.
- Analysis: configured Gemini success, no-food image, invalid/missing image ID, missing key configuration, provider error, and allergy recommendation override.
- History and catalogs: own-record listing/detail, unknown record rejection, nutrition lookup, and health-insights lookup.
- Administration: user access denial, role-based access, account suspension, uploads review, and key-pool validation.
- Frontend: loading, error, empty, no-food, keyboard, mobile, and PWA-install states.

Run the existing static checks from the repository root:

```bash
pnpm run typecheck
pnpm run build:frontend
```
