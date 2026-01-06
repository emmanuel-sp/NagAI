// User types matching backend schema

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  userLocation?: string;
  career?: string;
  bio?: string;
  interests?: string[];
  hobbies?: string[];
  habits?: string[];
  createdAt?: string;
}

export interface UserProfile extends User {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
}
