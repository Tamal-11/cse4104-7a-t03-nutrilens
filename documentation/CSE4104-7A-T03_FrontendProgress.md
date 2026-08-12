# CSE4104-7A-T03 Frontend Progress Report

## Project Title

**NutriLens - AI Based Food Recognition and Nutrition Analysis System**

NutriLens is a responsive food-image-based nutrition analysis application. It allows users to create an account, sign in, upload a food image, view its nutrition analysis, review previous analyses, and manage their health profile.

## Team Information

| Field | Information |
| --- | --- |
| Course | CSE4104 |
| Section | 7A |
| Team | T03 |
| Team Name | CSE4104-7A-T03 |

| SL | Name | Student ID | Role |
| --- | --- | --- | --- |
| 1 | Md. Arafat Hossen | 11230121099 | Team Leader |
| 2 | Md. Saiful Islam Anik | 11230121086 | Backend Developer |
| 3 | Md. Azizul Haque Rifat | 11230121087 | AI Engineer |
| 4 | Gazi Nafisa Maliat | 11250122046 | Frontend Designer |

## Frontend Technology Stack

| Area | Technology |
| --- | --- |
| UI Library | React 19 |
| Programming Language | TypeScript |
| Build Tool and Development Server | Vite 6 |
| Styling | Tailwind CSS 4 and custom CSS |
| Icons | Lucide React |
| Animation | Motion |
| Charts and Data Visualization | Recharts |
| Progressive Web App | Vite Plugin PWA |
| API Communication | Browser Fetch API |
| Package Manager | npm |

## Completed Pages

| Page | Status | Main Features |
| --- | --- | --- |
| Home / Landing Page | Completed | Project introduction and navigation to sign-in |
| Login Page | Completed | Email/password login, password visibility control, validation, loading state, and API error display |
| Registration Page | Completed | Name, email, password, password confirmation, terms acceptance, validation, and account creation |
| Dashboard Page | Completed | User summary, nutrition-analysis history, previous result selection, and admin navigation for authorized users |
| AI Lens / Food Analysis Page | Completed | Food image selection, image preview, upload, analysis request, loading/error states, and nutrition result presentation |
| Profile Page | Completed | Personal and health information display/editing, profile update, sign-out, and PWA installation controls |
| Admin Page | Completed | Administrative overview, user list, statistics, logs, and user status management |

The application also includes a responsive bottom navigation bar for the Dashboard, AI Lens, and Profile pages.

## Backend APIs Integrated

The frontend reads the backend base URL from the `VITE_API_BASE_URL` environment variable. Requests include credentials so that the backend can maintain the authenticated session through cookies.

| Method | Endpoint | Frontend Use |
| --- | --- | --- |
| `POST` | `/api/auth/sign-in` | Authenticate an existing user |
| `POST` | `/api/auth/sign-up` | Register a new user |
| `GET` | `/api/auth/session` | Restore and validate the current session when the application starts |
| `POST` | `/api/auth/sign-out` | End the current user session |
| `GET` | `/api/v1/profile` | Load the authenticated user's profile |
| `POST` | `/api/v1/profile` | Update personal, health, and dietary information |
| `GET` | `/api/v1/analysis-history` | Load the user's previous food analyses |
| `GET` | `/api/v1/analysis-history/:id` | Retrieve a specific analysis result |
| `POST` | `/api/v1/upload-food-image` | Upload a food image as multipart form data |
| `POST` | `/api/v1/analyze-food` | Analyze a previously uploaded image |
| `GET` | `/api/v1/admin/overview` | Load administrative statistics, users, and logs |
| `PUT` | `/api/v1/admin/users/:id/status` | Activate or suspend a user account |

## Authentication Flow

1. A new user submits their name, email address, and password on the Registration page.
2. The frontend validates the form and sends the data to `POST /api/auth/sign-up`.
3. An existing user signs in through `POST /api/auth/sign-in`.
4. Authentication requests use `credentials: "include"`, allowing the backend to establish and maintain the session using cookies.
5. After successful registration or login, the frontend loads the user's profile and analysis history in parallel and opens the AI Lens page.
6. Whenever the application starts, it calls `GET /api/auth/session`. If a valid session exists, account data is restored automatically and the user is taken to the AI Lens page.
7. Authenticated requests continue to include the session credentials.
8. On sign-out, the frontend calls `POST /api/auth/sign-out`, clears the local analysis-history state, and returns to the Home page.

## Current Development Progress

| Feature Area | Current Status |
| --- | --- |
| Responsive application shell and navigation | Completed |
| Landing, login, and registration interfaces | Completed |
| Session restoration and sign-out | Completed |
| User profile loading and editing | Completed |
| Food image upload and analysis workflow | Completed |
| Nutrition result display | Completed |
| Analysis-history loading and result review | Completed |
| Admin overview and account-status controls | Completed |
| PWA installation support | Completed |
| Backend API service layer and response mapping | Completed |
| Production deployment and end-to-end acceptance testing | Pending final verification |

The main frontend workflow is implemented and connected to the backend. The remaining work is final cross-device testing, production-environment verification, accessibility review, and resolution of any issues found during acceptance testing.

## GitHub Repository Link

[NutriLens GitHub Repository](https://github.com/Tamal-11/cse4104-7a-t03-nutrilens)

