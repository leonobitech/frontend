"use client";

import { useEffect, useState } from "react";

interface ServerCookieInfo {
  hasAccessKey: boolean;
  hasClientKey: boolean;
  cookieCount: number;
  isAuthenticated: boolean;
}

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string>("");
  const [parsedCookies, setParsedCookies] = useState<Record<string, string>>(
    {}
  );
  const [serverInfo, setServerInfo] = useState<ServerCookieInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener todas las cookies del navegador (solo las NO HttpOnly)
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Parsear cookies
    const cookieObj: Record<string, string> = {};
    if (allCookies) {
      allCookies.split(";").forEach((cookie) => {
        const [name, value] = cookie.split("=").map((c) => c.trim());
        if (name) cookieObj[name] = value || "";
      });
    }
    setParsedCookies(cookieObj);

    // Obtener info del servidor (puede ver cookies HttpOnly)
    fetch("/api/debug/cookies")
      .then((res) => res.json())
      .then((data) => {
        setServerInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const hasAccessKey = "accessKey" in parsedCookies;
  const hasClientKey = "clientKey" in parsedCookies;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">🍪 Debug Cookies</h1>

        {/* Server-side Cookie Status (HttpOnly visible) */}
        <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-blue-400">
            🔐 Estado Real (desde servidor):
          </h2>
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : serverInfo ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {serverInfo.hasAccessKey ? (
                  <span className="text-green-400">✅</span>
                ) : (
                  <span className="text-red-400">❌</span>
                )}
                <span>
                  accessKey (HttpOnly):{" "}
                  {serverInfo.hasAccessKey ? "PRESENTE" : "AUSENTE"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {serverInfo.hasClientKey ? (
                  <span className="text-green-400">✅</span>
                ) : (
                  <span className="text-red-400">❌</span>
                )}
                <span>
                  clientKey (HttpOnly):{" "}
                  {serverInfo.hasClientKey ? "PRESENTE" : "AUSENTE"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {serverInfo.isAuthenticated ? (
                  <span className="text-green-400">✅</span>
                ) : (
                  <span className="text-red-400">❌</span>
                )}
                <span>
                  Autenticado:{" "}
                  {serverInfo.isAuthenticated ? "SÍ" : "NO"}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Total de cookies en servidor: {serverInfo.cookieCount}
              </p>
            </div>
          ) : (
            <p className="text-red-400">Error al obtener info del servidor</p>
          )}
        </div>

        {/* Client-side Status (only non-HttpOnly cookies) */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">
            📱 Cookies visibles desde JavaScript (NO HttpOnly):
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasAccessKey ? (
                <span className="text-green-400">✅</span>
              ) : (
                <span className="text-yellow-400">⚠️</span>
              )}
              <span>accessKey: {hasAccessKey ? "PRESENTE" : "NO VISIBLE (esto es correcto si es HttpOnly)"}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasClientKey ? (
                <span className="text-green-400">✅</span>
              ) : (
                <span className="text-yellow-400">⚠️</span>
              )}
              <span>clientKey: {hasClientKey ? "PRESENTE" : "NO VISIBLE (esto es correcto si es HttpOnly)"}</span>
            </div>
          </div>
        </div>

        {/* Todas las cookies parseadas */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Cookies Detectadas:</h2>
          {Object.keys(parsedCookies).length === 0 ? (
            <p className="text-red-400">⚠️ No hay cookies en el navegador</p>
          ) : (
            <ul className="space-y-2 text-sm font-mono">
              {Object.entries(parsedCookies).map(([name, value]) => (
                <li key={name} className="border-b border-gray-700 pb-2">
                  <div className="text-blue-400">{name}:</div>
                  <div className="text-gray-400 break-all">
                    {value.substring(0, 60)}
                    {value.length > 60 ? "..." : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Raw cookies string */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">document.cookie (raw):</h2>
          <pre className="text-xs bg-black p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
            {cookies || "(vacío)"}
          </pre>
        </div>

        {/* Información del navegador */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Info del Navegador:</h2>
          <div className="text-sm space-y-1">
            <p>
              <strong>User Agent:</strong>{" "}
              <span className="text-gray-400 text-xs break-all">
                {navigator.userAgent}
              </span>
            </p>
            <p>
              <strong>URL actual:</strong>{" "}
              <span className="text-gray-400">{window.location.href}</span>
            </p>
            <p>
              <strong>Dominio:</strong>{" "}
              <span className="text-gray-400">{window.location.hostname}</span>
            </p>
            <p>
              <strong>Protocolo:</strong>{" "}
              <span className="text-gray-400">{window.location.protocol}</span>
            </p>
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-yellow-400">
            📋 Diagnóstico:
          </h2>
          {loading ? (
            <p className="text-sm">Analizando...</p>
          ) : serverInfo?.isAuthenticated ? (
            <div className="text-sm space-y-2">
              <p className="text-green-400">
                ✅ AUTENTICACIÓN EXITOSA
              </p>
              <p>
                Las cookies están funcionando correctamente. Son HttpOnly,
                lo cual significa que:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>JavaScript no puede leerlas (seguridad contra XSS)</li>
                <li>El navegador las envía automáticamente en cada petición</li>
                <li>Solo el servidor puede verlas y modificarlas</li>
              </ul>
              <p className="text-blue-400 mt-2">
                👍 Esto es el comportamiento CORRECTO y SEGURO.
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-400">
              ❌ No hay sesión activa. Las cookies no están presentes o
              han expirado. Por favor, inicia sesión nuevamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
