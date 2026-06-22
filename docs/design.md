# NutriLens Design Document

**Project:** NutriLens  
**Course:** Software Development III  
**Course Code:** CSE 4104  
**Team:** CSE4104-7A-T03  
**Source Document:** UI/UX Design and Development Planning  
**Submission Date:** 22/06/2026

---

## 1. Team Information

| SL | Member Name | Student ID | Role |
|---|---|---|---|
| 1 | Md. Arafat Hossen | 11230121099 | Team Leader |
| 2 | Md. Saiful Islam Anik | 11230121086 | Backend Developer |
| 3 | Md. Azizul Haque Rifat | 11230121087 | AI Engineer |
| 4 | Gazi Nafisa Maliat | 11250122046 | Frontend Designer |

---

## 2. Project Information

### 2.1 Project Title

**NutriLens**

### 2.2 Project Overview

NutriLens is an AI-powered nutrition analysis web application that allows users to identify food items and obtain detailed nutritional information by uploading a food image. The system uses image recognition and machine learning techniques to analyze meals and provide instant insights about calories, proteins, fats, carbohydrates, health risks, and dietary recommendations.

By removing the need for manual food entry, NutriLens makes nutrition tracking faster, smarter, and more convenient for users.

### 2.3 Problem Statement

Many people consume food every day without understanding its nutritional value or possible health impact. Manual calorie and nutrient calculation is difficult and time-consuming. Existing nutrition-tracking applications often require users to search for food items and enter information manually.

Many current solutions also focus mainly on calorie counting and do not provide complete nutrition analysis, health-risk warnings, or personalized recommendations. Because of this, users may struggle to maintain healthy eating habits and make informed dietary decisions.

### 2.4 Objectives

The main objectives of NutriLens are:

- Develop an AI-powered food image recognition system.
- Automatically detect food items from uploaded images.
- Provide nutritional information, including calories, proteins, fats, and carbohydrates.
- Classify foods as healthy or unhealthy.
- Warn users about potential health risks caused by excessive consumption.
- Offer personalized nutrition recommendations.
- Create a responsive and user-friendly web application accessible on mobile devices.

### 2.5 Scope of the Project

The scope of NutriLens includes:

- User registration, authentication, and profile management.
- Food image upload and AI-based food recognition.
- Nutritional analysis and display of calorie and nutrient information.
- Healthy/unhealthy food assessment.
- Health risk warnings based on food consumption patterns.
- Personalized dietary suggestions and recommendations.
- Integration of AI models and nutrition APIs for real-time analysis.
- Mobile-responsive interface for convenient access across different devices.

---

## 3. Product Design Goals

The NutriLens interface should be:

- **Simple:** Users should be able to upload a food image and understand the result without confusion.
- **Fast:** The analysis flow should require minimum manual input.
- **Mobile-friendly:** The UI should work well on mobile screens as well as larger displays.
- **Informative:** Nutrition information should be shown clearly through cards, charts, labels, and warnings.
- **Helpful:** The system should not only show data but also give health insights and recommendations.

---

## 4. UI / Wireframe Screens

### 4.1 Home Page

The home page introduces NutriLens and encourages users to start using the application. It acts as the landing screen for new users.

**Main elements:**

- NutriLens logo or brand name
- Short introduction or tagline
- Get Started button
- Navigation options for login or registration

**Primary user action:** Start using the application.

### 4.2 Login Page

The login page allows existing users to access their NutriLens account using email and password.

**Main elements:**

- Email input field
- Password input field
- Login button
- Links for account creation or password recovery

**Primary user action:** Log in to the dashboard.

### 4.3 Registration Page

The registration page allows new users to create an account before using personalized features.

**Main elements:**

- Name input field
- Email input field
- Password input field
- Sign up button
- Link to return to login

**Primary user action:** Create a new account.

### 4.4 Dashboard

The dashboard is the main screen after login. It gives users a quick overview of their recent nutrition activity and provides access to food analysis.

**Main elements:**

- User greeting
- Daily nutrition summary
- Recent meal stats
- Quick access to AI Lens
- Bottom or side navigation

**Primary user action:** Move to the AI Lens and upload a meal image.

### 4.5 AI Lens / Food Analyzer

The AI Lens screen allows users to upload a food image for analysis.

**Main elements:**

- Image upload area
- Upload or scan button
- Processing state while analysis is running
- Navigation back to dashboard

**Primary user action:** Upload a food image for AI-based food detection.

### 4.6 Result Page

The result page displays detected food items and their nutrition information.

**Main elements:**

- Uploaded food image preview
- Detected food name
- Calories
- Protein amount
- Fat amount
- Carbohydrate amount
- Healthy/unhealthy classification
- Health risk indicators

**Primary user action:** Review analysis result and continue to detailed nutrition insights.

### 4.7 Result Page With Chart

The chart-based result page visualizes the nutrient breakdown of the analyzed meal.

**Main elements:**

- Macro pie chart
- Calories summary
- Protein, fat, and carbohydrate breakdown
- AI-generated warning
- Recommendation section

**Primary user action:** Understand the nutrition balance of the meal visually.

### 4.8 Profile Page

The profile page stores user-related information and supports personalized recommendations.

**Main elements:**

- User name and basic profile details
- Biometric information
- Dietary target settings
- Saved profile metrics
- Health warning updates

**Primary user action:** Manage profile information and dietary targets.

---

## 5. User Flow

The main user journey follows this flow:

1. User opens the landing page.
2. User goes to the login screen.
3. If the user does not have an account, the user opens the registration screen.
4. After successful login or registration, the user enters the activity dashboard.
5. User taps AI Lens.
6. User uploads a meal image.
7. The system analyzes the image using AI vision processing.
8. The system displays detected food and calorie information.
9. The system shows a macro pie chart with protein, fat, and carbohydrate information.
10. The user can view or update profile information.
11. Profile metrics are saved and health warnings are updated.
12. User can analyze another meal or log out.

### 5.1 Flow Summary

```text
Landing Page
    ↓
Login Screen ── No Account ──→ Register Screen
    ↓                              ↓
Account Login Success ←──────── Account Creation Success
    ↓
Activity Dashboard
    ↓
AI Lens / Upload Meal Image
    ↓
Food Analysis Result
    ↓
Macro Pie Chart + AI Warning
    ↓
Profile / Saved Metrics / Health Recommendations
    ↓
Analyze Another Meal or Logout
```

---

## 6. Functional Design Requirements

### 6.1 User Management

- Users must be able to create an account.
- Users must be able to log in securely.
- Users must be able to manage their profile.
- Authentication must protect user-specific data.

### 6.2 Food Image Upload

- Users must be able to upload a food image.
- The upload interface should be simple and mobile-friendly.
- The system should show progress or loading feedback during analysis.

### 6.3 AI-Based Food Recognition

- The system must detect food items from uploaded images.
- The system should classify detected food into relevant categories.
- The AI service must connect with the backend and frontend interface.

### 6.4 Nutrition Analysis

- The system must show calorie information.
- The system must show protein, fat, and carbohydrate values.
- The system must use nutrition API data for food data analysis.

### 6.5 Health Assessment

- The system must classify food as healthy or unhealthy.
- The system must warn users about risks from excessive consumption.
- The system must generate personalized dietary recommendations.

### 6.6 Profile and Personalization

- The system should store biometric and dietary target information.
- The system should use saved metrics to improve recommendations.
- Health warnings should update based on user metrics and food analysis.

---

## 7. Information Architecture

| Section | Purpose |
|---|---|
| Home | Introduce NutriLens and guide users to get started |
| Login | Authenticate existing users |
| Register | Create a new account |
| Dashboard | Show user summary and access to major features |
| AI Lens | Upload food image for analysis |
| Result | Show detected food and nutrition information |
| Chart Result | Visualize macro nutrition breakdown |
| Profile | Manage user information, metrics, and dietary targets |

---

## 8. Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Hono, Cloudflare Workers |
| Database | PostgreSQL, Neon |
| AI / Machine Learning | YOLOv8n, MobileNetV3, ShuffleNet, EfficientNet-Lite |
| API and Tools | Nutrition API for food data analysis |

---

## 9. UI/UX Design Notes

- Use clear visual hierarchy for calories, nutrients, warnings, and recommendations.
- Keep the upload process short and direct.
- Use cards for nutrition values to make information easy to scan.
- Use charts for macro breakdown because visual results are easier to understand than plain numbers.
- Use warning labels carefully so that users can understand risk without unnecessary confusion.
- Keep navigation consistent across dashboard, AI Lens, result, and profile pages.
- Ensure the interface remains responsive for mobile users.

---

## 10. Expected Outcome

After uploading a food image, users should instantly receive nutritional information and health insights about their meal. NutriLens should help users become more aware of their eating habits, make healthier food choices, and monitor nutrition more effectively.

Through AI-powered automation, NutriLens will simplify nutrition tracking while delivering a fast, accurate, and personalized user experience.
