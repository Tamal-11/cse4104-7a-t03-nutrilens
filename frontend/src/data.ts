import type {UserProfile} from './types';

export const EMPTY_USER: UserProfile = {
  name: '',
  email: '',
  age: 0,
  gender: 'Other',
  height: 0,
  weight: 0,
  healthConditions: [],
  dietaryPreferences: [],
  isAdmin: false,
};
