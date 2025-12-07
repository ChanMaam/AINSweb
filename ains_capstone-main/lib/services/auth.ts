// lib/services/auth.ts
import { http } from "@/lib/http";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  ok: boolean;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return http.post("/auth/login", payload);
}

export type SignupPayload = {
  adminCode: string;
  fullName?: string;
  email: string;
  password: string;
};

export async function signup(payload: SignupPayload): Promise<{ ok: boolean }> {
  return http.post("/auth/signup", payload);
}
