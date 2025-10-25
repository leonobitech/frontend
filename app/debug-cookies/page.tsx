"use client";

import { useEffect, useState } from "react";

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string>("");
  const [parsedCookies, setParsedCookies] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    // Obtener todas las cookies del navegador
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
  }, []);

  const hasAccessKey = "accessKey" in parsedCookies;
  const hasClientKey = "clientKey" in parsedCookies;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4">🍪 Debug Cookies</h1>

        {/* Status */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Estado de Autenticación:</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasAccessKey ? (
                <span className="text-green-400">✅</span>
              ) : (
                <span className="text-red-400">❌</span>
              )}
              <span>accessKey: {hasAccessKey ? "PRESENTE" : "AUSENTE"}</span>
            </div>
            <div className="flex items-center gap-2">
              {hasClientKey ? (
                <span className="text-green-400">✅</span>
              ) : (
                <span className="text-red-400">❌</span>
              )}
              <span>clientKey: {hasClientKey ? "PRESENTE" : "AUSENTE"}</span>
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
          {!hasAccessKey && !hasClientKey ? (
            <p className="text-sm">
              ⚠️ No hay cookies de autenticación. Esto significa que:
              <br />
              1. Nunca se guardaron las cookies después del login
              <br />
              2. O las cookies fueron borradas
              <br />
              3. O el navegador está bloqueando cookies de terceros
            </p>
          ) : hasAccessKey && hasClientKey ? (
            <p className="text-sm text-green-400">
              ✅ Las cookies están presentes. Si aún así falla la autenticación,
              el problema es que NO se están enviando al servidor.
            </p>
          ) : (
            <p className="text-sm text-orange-400">
              ⚠️ Solo una cookie presente. Estado inconsistente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
