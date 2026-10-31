import { create } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const ACCESS_TOKEN_KEY = "worthly_fastapi_access_token";
export const isBackendConfigured = () => Boolean(process.env.EXPO_PUBLIC_API_URL);

export const tokenStorage = {
  get: (key: string) => Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) => Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function checkBackendConnection(): Promise<boolean> {
  if (!isBackendConfigured()) return false;
  try {
    const healthApi = create({
      baseURL: process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, ""),
      timeout: 5000,
    });
    await healthApi.get("/health");
    return true;
  } catch {
    return false;
  }
}

api.interceptors.request.use(async (config) => {
  // Login and registration are public endpoints: never send an old/expired
  // token that could confuse backend middleware while credentials are checked.
  if (/\/auth\/(login|register)\/?$/.test(config.url ?? "")) {
    delete config.headers.Authorization;
    return config;
  }

  const token = await tokenStorage.get(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});
