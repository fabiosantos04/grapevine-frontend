export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  id: number;
  fullName: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}