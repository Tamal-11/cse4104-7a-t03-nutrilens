import type {FoodAnalysis, UserProfile} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

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
    healthConditions: [],
    dietaryPreferences: [],
  };
}

export function mapAnalysis(item: AnalysisResponse): FoodAnalysis {
  const nutrition = item.nutrition ?? {
    calories: 0, protein: 0, carbohydrates: 0, fats: 0, fiber: 0,
  };
  return {
    id: item.analysisId,
    name: item.foodName,
    image: item.imageUrl || '',
    time: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
    isHealthy: nutrition.calories < 600,
    classification: nutrition.calories >= 800 ? 'Unhealthy' : nutrition.calories >= 600 ? 'Moderate' : 'Healthy',
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
    suggestions: [],
    explanation: `${item.foodName} was identified with ${Math.round(item.confidence * 100)}% confidence.`,
  };
}
