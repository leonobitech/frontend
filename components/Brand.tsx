"use client";

import { useEffect } from "react";

export function Brand() {
  useEffect(() => {
    const comment = document.createComment(`
░█░░░█▀▀░█▀█░█▀█░█▀█░█▀▄░▀█▀░▀█▀░█▀▀░█▀▀░█░█
░█░░░█▀▀░█░█░█░█░█░█░█▀▄░░█░░░█░░█▀▀░█░░░█▀█
░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀▀▀░▀▀░░▀▀▀░░▀░░▀▀▀░▀▀▀░▀░▀

🚀 Empower your business with Leonobitech..!
    `);
    // Insertar al principio del <head>
    document.head.insertBefore(comment, document.head.firstChild);
  }, []);

  return null;
}
