export type ScreenType = 'home' | 'login' | 'register' | 'dashboard' | 'ai' | 'profile' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  healthConditions: string[];
  dietaryPreferences: string[];
}

export interface MacroNutrients {
  calories: number;
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
}

export interface FoodAnalysis {
  id: string;
  name: string;
  image: string; // url or base64 representation
  time: string;
  isHealthy: boolean;
  classification: 'Healthy' | 'Moderate' | 'Unhealthy';
  macros: MacroNutrients;
  pros: string[];
  cons: string[];
  warnings: string[];
  suggestions: string[];
  explanation: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended';
  role: 'User' | 'Admin';
  joinedDate: string;
  scansCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalScans: number;
  activeUsers24h: number;
  averageResponseTime: number; // in seconds
  systemStatus: 'Healthy' | 'Degraded' | 'Maintenance';
  modelAccuracy: number; // percentage
}
