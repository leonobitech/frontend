# 🧠 Leonobitech – AI + Automatización para Negocios de Comida

Leonobitech es una plataforma pensada para revolucionar la atención al cliente y la gestión de pedidos en negocios gastronómicos. Combinamos **voz en tiempo real**, **automación neuronal**, y **seguridad de backend avanzada**, todo impulsado por inteligencia artificial.

---

## 🚀 ¿Qué es Leonobitech?

Una arquitectura moderna que conecta:

- 🗣️ **Ultravox AI** para agentes virtuales con voz realista en tiempo real
- 🔁 **n8n** como sistema de control neuronal y orquestación de procesos
- 💬 **WhatsApp** como canal principal de interacción con clientes finales
- 💳 **Integraciones de pago** con Mercado Pago y Stripe
- 📊 **Conexión a herramientas administrativas** como Odoo (ERP)
- 🔐 **Backend seguro** con control de sesiones, tokens, fingerprint y auditoría

---

## 🍕 ¿Para quién está diseñado?

Para negocios de comida que quieren:
- Recibir pedidos por WhatsApp automáticamente
- Eliminar la necesidad de atención humana directa
- Integrar cobros, stock y administración
- Ofrecer una experiencia moderna, fluida y trazable a sus clientes

---

## 🧠 Arquitectura técnica

|       Componente        |                  Rol                                      |
| `Ultravox AI`           | Agente conversacional con voz natural                     |
| `n8n`                   | Motor de flujos y lógica neuronal                         |
| `Leonobitech core`      | Backend seguro con sesiones, Redis, JWT, DB               |
| `Frontend Next.js`      | Panel del negocio, insights, pedidos, configuraciones     |
| `WhatsApp Business API` | Canal de interacción con el cliente final                 |
| `Odoo (opcional)`       | Herramienta de control administrativo, stock, facturación |

---

## 🔐 Seguridad y consistencia

- Cookies `httpOnly` y `secure` (accessKey y clientKey)
- Validación de fingerprint por dispositivo
- Middleware para proteger rutas públicas
- Redis para TTL y revocación de tokens
- Refresh automático de sesión
- Logging de auditoría y eventos de seguridad

Documentación detallada en:
- [`SECURITY.md`](./SECURITY.md)
- [`README.SessionContext.md`](./README.SessionContext.md)

---

## 📦 Tecnologías utilizadas

- **Next.js 15 App Router** + React Query
- **Express.js** + Redis + Prisma (MongoDB)
- **Docker + Traefik** para orquestación de servicios
- **n8n** autoalojado como cerebro automatizador
- **Ultravox AI** para interacción conversacional con voz
- **Mercado Pago / Stripe / Odoo** como servicios externos integrables

---

## 🌍 Visión

Leonobitech no es solo software. Es una visión de cómo **la inteligencia artificial puede mejorar negocios reales**, ayudando a servir mejor, automatizar flujos operativos y escalar sin perder el control.

**Hecho para el presente, construido para el futuro.**

---

**Leonobitech Dev Team**  
https://www.leonobitech.com  
Conectando IA + voz + negocios reales.
