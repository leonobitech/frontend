// File: app/head.tsx

import Script from "next/script";

export default function Head() {
  return (
    <>
      {/*
        ───────────────────────────────────────────────────────────────────────────
        🚀  ESTE SCRIPT INYECTA TU LOGO ASCII COMO COMENTARIO PÚRO EN HEAD 🚀
        ───────────────────────────────────────────────────────────────────────────
        Al inspeccionar (DevTools → Elements), verás esto COMO PRIMER LÍNEA EN <head>:
        
        <!--
        ██╗     ███████╗ ██████╗ ███╗   ██╗ ██████╗ ██████╗ ██╗████████╗███████╗ ...
        ██║     ██╔════╝██╔═══██╗████╗  ██║██╔═══██╗██╔══██╗██║╚══██╔══╝██╔════╝ ...
        (…resto del ASCII art…)
        
        🔥 leonobitech – infraestructura inteligente
        -->
        
        Este bloque es UN COMENTARIO HTML puro,  y no se renderiza en pantalla,
        sólo aparece cuando abres DevTools → Elements.
      */}
      <Script
        id="ascii-logo-comment"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
<!--
██╗     ███████╗ ██████╗ ███╗   ██╗ ██████╗ ██████╗ ██╗████████╗███████╗ ██████╗██╗  ██╗
██║     ██╔════╝██╔═══██╗████╗  ██║██╔═══██╗██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝██║  ██║
██║     █████╗  ██║   ██║██╔██╗ ██║██║   ██║██████╔╝██║   ██║   █████╗  ██║     ███████║
██║     ██╔══╝  ██║   ██║██║╚██╗██║██║   ██║██╔══██╗██║   ██║   ██╔══╝  ██║     ██╔══██║
███████╗███████╗╚██████╔╝██║ ╚████║╚██████╔╝██████╔╝██║   ██║   ███████╗╚██████╗██║  ██║
╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝

🔥 leonobitech – infraestructura inteligente
-->
          `,
        }}
      />
    </>
  );
}
