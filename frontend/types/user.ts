// User and authentication types

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio: string;
  career: string;
  location: string;
  interests: string[];
  hobbies: string[];
  habits: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
