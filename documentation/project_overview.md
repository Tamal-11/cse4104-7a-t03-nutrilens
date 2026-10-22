# Project Overview

NutriLens is an AI-assisted food recognition and nutrition analysis web application. It lets authenticated users submit a meal photograph, view an estimate for the visible portion, and review earlier analyses. Gemini performs the server-side image interpretation; the application does not train or run a local food-classification model.

## Product goals

- Make a photo-based food estimate easier to understand for everyday users.
- Show estimated calories, protein, carbohydrates, fats, fiber, classification, and practical guidance.
- Use a food goal and reported allergies to make the recommendation more relevant.
- Preserve scan history while protecting users’ images and analysis records.
- Give administrators a controlled way to manage AI keys, model selection, and accounts.

## Intended users

- People who want a quick food estimate without manually entering a meal.
- Students and general users exploring eating patterns.
- Administrators who operate the deployed service.

## Boundaries and limitations

NutriLens is informational. It cannot measure a portion, diagnose a condition, guarantee an ingredient list, or replace a clinician or dietitian. A Gemini response can be wrong, particularly for mixed meals, hidden ingredients, poor lighting, or unclear images. Users should seek professional advice for medical or allergy-critical decisions.

## Delivered capability

| Area | Current behavior |
|---|---|
| Identity | Neon Auth in production; cookie-based demo auth locally |
| Profile | Name, biometrics, health conditions, supported allergies, and one food goal |
| Upload | Authenticated JPEG, PNG, or WebP upload; 8 MiB default limit |
| Analysis | Gemini returns a validated structured response or a no-food result |
| Storage | Private R2 objects and Neon metadata/results in production |
| Review | Per-user history/dashboard plus admin users, uploads, and logs |
| Configuration | Server-side Gemini fallback or rotating administrator-managed key pool |
