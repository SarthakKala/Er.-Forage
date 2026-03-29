"use client";

import axios from "axios";

import { AUTH_LS_KEY, clearSessionToken } from "@/lib/auth-storage";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_LS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      clearSessionToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
