import type {FoodAnalysis, UserProfile} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const apiUrl = (value?: string | null) =>
  value?.startsWith('/') ? `${API_BASE_URL}${value}` : value || '';

type ApiEnvelope<T> = {success: boolean; data: T; message?: string};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: init.body instanceof FormData
      ? init.headers
      : {'Content-Type': 'application/json', ...init.headers},
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

export type AuthUser = {id: string; email: string; name?: string};
export type ProfileResponse = {
  userId: string;
  email: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  healthConditions: string[];
  dietaryPreferences: string[];
  isAdmin: boolean;
};
type AnalysisResponse = {
  analysisId: string;
  foodName: string;
  confidence: number;
  imageUrl?: string | null;
  createdAt?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
  };
  healthBenefits?: string[];
  warnings?: string[];
  suggestions?: string[];
  explanation?: string;
  classification?: 'Healthy' | 'Moderate' | 'Unhealthy';
};

export const api = {
  signIn: (email: string, password: string) =>
    request<{user: AuthUser}>('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    }),
  signUp: (name: string, email: string, password: string) =>
    request<{user: AuthUser}>('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({name, email, password}),
    }),
  session: () => request<{user: AuthUser}>('/api/auth/session'),
  signOut: () => request('/api/auth/sign-out', {method: 'POST', body: '{}'}),
  profile: () => request<ApiEnvelope<ProfileResponse>>('/api/v1/profile'),
  updateProfile: (profile: UserProfile) =>
    request('/api/v1/profile', {
      method: 'POST',
      body: JSON.stringify({
        fullName: profile.name,
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.height,
        weightKg: profile.weight,
        healthConditions: profile.healthConditions,
        dietaryPreferences: profile.dietaryPreferences,
      }),
    }),
  history: () => request<ApiEnvelope<AnalysisResponse[]>>('/api/v1/analysis-history'),
  analysis: (id: string) =>
    request<ApiEnvelope<AnalysisResponse>>(`/api/v1/analysis-history/${id}`),
  async analyzeImage(file: File): Promise<FoodAnalysis> {
    const form = new FormData();
    form.append('image', file);
    const upload = await request<ApiEnvelope<{imageId: string; imageUrl: string | null}>>(
      '/api/v1/upload-food-image',
      {method: 'POST', body: form},
    );
    const result = await request<ApiEnvelope<AnalysisResponse>>('/api/v1/analyze-food', {
      method: 'POST',
      body: JSON.stringify({imageId: upload.data.imageId}),
    });
    return mapAnalysis({...result.data, imageUrl: upload.data.imageUrl || URL.createObjectURL(file)});
  },
  adminOverview: () => request<ApiEnvelope<{
    currentUserId: string;
    users: import('../types').UserAccount[];
    stats: import('../types').AdminStats;
    logs: string[];
  }>>('/api/v1/admin/overview'),
  setUserStatus: (id: string, status: 'Active' | 'Suspended') =>
    request<ApiEnvelope<import('../types').UserAccount>>(`/api/v1/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({status}),
    }),
};

export function mapProfile(profile: ProfileResponse): UserProfile {
  const gender = ['Male', 'Female', 'Other'].includes(profile.gender || '')
    ? profile.gender as UserProfile['gender']
    : 'Other';
  return {
    name: profile.fullName,
    email: profile.email,
    age: profile.age ?? 0,
    gender,
    height: profile.heightCm ?? 0,
    weight: profile.weightKg ?? 0,
    healthConditions: profile.healthConditions,
    dietaryPreferences: profile.dietaryPreferences,
    isAdmin: profile.isAdmin,
  };
}

export function mapAnalysis(item: AnalysisResponse): FoodAnalysis {
  const nutrition = item.nutrition ?? {
    calories: 0, protein: 0, carbohydrates: 0, fats: 0, fiber: 0,
  };
  return {
    id: item.analysisId,
    name: item.foodName,
    image: apiUrl(item.imageUrl),
    time: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
    isHealthy: (item.classification || 'Moderate') === 'Healthy',
    classification: item.classification || 'Moderate',
    macros: {
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbohydrates: nutrition.carbohydrates,
      fat: nutrition.fats,
      fiber: nutrition.fiber,
    },
    pros: item.healthBenefits || [],
    cons: item.warnings || [],
    warnings: item.warnings || [],
    suggestions: item.suggestions || [],
    explanation: item.explanation || `${item.foodName} was identified with ${Math.round(item.confidence * 100)}% confidence.`,
  };
}
