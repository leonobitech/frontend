// src/lib/axios.ts

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

// 🎨 Extiende la configuración de Axios para incluir _retry
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Importante para enviar cookies en las requests
});

// Interceptor de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest || originalRequest._retry) {
      // Si ya reintentamos, o no hay request, no seguimos
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // 🌙 Token expirado, intenta una vez más
      console.warn("🔁 Intentando reintentar la request tras 401...");

      originalRequest._retry = true; // Marcar como ya reintentado

      try {
        // ⚠️ Reintenta la misma request
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
