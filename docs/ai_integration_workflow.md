# AI Integration Workflow

AI is planned, not connected yet.

## Why AI is needed

- User gives food picture, not food name
- AI will guess what food is in the image
- System can then show nutrition fast

## Planned AI service

- Current phase: mock data only
- Future plan: food image classification model
- Possible model source:
  - team-hosted model
  - external AI API later if needed

## Current planning flow

1. User uploads food image
2. Frontend sends image to Worker upload route
3. Worker stores file in R2
4. Worker saves image metadata in Neon PostgreSQL
5. Frontend sends `imageId` to analyze route
6. Analyze route returns mock food result
7. Frontend shows food name, nutrition, and health notes

## Future AI flow

1. User uploads food image
2. Worker gets image file from R2
3. Worker sends image to AI model
4. AI model returns predicted food and confidence
5. Worker matches food with nutrition data
6. Worker saves final result
7. Worker sends final result to frontend

## AI input

- Food image file
- Optional meal type
- Optional user note

## AI output

- Predicted food name
- Confidence score
- Maybe top 3 predictions later

## How AI improves project

- Less manual typing
- Faster food recognition
- Better user experience
- Can grow into smart food diary later

## Planning note

For this submission, AI part is shown as planned workflow only. No live AI model connection yet.
