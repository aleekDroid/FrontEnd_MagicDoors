# MG Magic Doors — Frontend

Aplicación web en Angular 20 para gestión de aulas con control de acceso.

> **⚠️ ESTADO: 11 abril 2026**
> El login falla con HTTP 500 por bugs en el backend (ver README-backend.md).
> Para trabajar offline, activa el modo mock en cada servicio (`USE_MOCK = true`).



## Requisitos

- Node.js 18+
- Angular CLI 20: `npm install -g @angular/cli`
- Backend corriendo en `localhost:3000` (api-gateway)

## Instalar y correr

```bash
npm install
ng serve
# Abre http://localhost:4200
```

El proxy (`proxy.conf.json`) redirige `/api/*` → `http://localhost:3000`
automáticamente, por lo que no hay problemas de CORS en desarrollo.

## Credenciales de prueba

| Rol           | Email               | Password |
|---------------|---------------------|----------|
| Administrador | juan@gmail.com      | 123      |

> El admin puede gestionar usuarios. Los usuarios normales solo visualizan.

## Tipografía

- **Syne** — headings y display
- **DM Sans** — cuerpo de texto y UI

Cargadas desde Google Fonts en `src/index.html`.

## Agregar el logo

Cuando tengas el logo final (SVG o PNG):

1. Colócalo en `src/assets/logo.svg`
2. En `header.component.html` — descomenta `<img src="assets/logo.svg" ...>`
3. En `login.component.html` — descomenta `<img src="assets/logo.svg" ...>`

## Paleta de colores

| Variable CSS           | Hex       | Uso                  |
|------------------------|-----------|----------------------|
| `--color-navy`         | `#183B4E` | Fondo header, títulos|
| `--color-blue`         | `#27548A` | Acciones primarias   |
| `--color-amber`        | `#DDA853` | Acentos, avatar      |
| `--color-cream`        | `#F5EEDC` | Fondo general        |

## Estructura

```
src/app/
├── core/
│   ├── config/environment.ts   ← URL del API
│   ├── guards/                 ← authGuard, adminGuard
│   ├── interceptors/           ← JWT automático en cada request
│   ├── models/                 ← TypeScript interfaces
│   └── services/               ← Servicios con USE_MOCK flag
├── layout/                     ← Shell (header + router-outlet)
├── shared/components/header/   ← Navbar con menú y usuario
└── pages/
    ├── login/                  ← Pantalla de acceso
    ├── home/                   ← Plano de aulas interactivo
    │   └── classroom-modal/    ← Modal de gestión por aula
    ├── personnel/              ← CRUD de personal (solo admin)
    ├── subjects/               ← CRUD de materias
    └── groups/                 ← CRUD de grupos
```

## Modo mock (sin backend)

En cada servicio hay un flag `USE_MOCK`. Para volver a modo offline:

```typescript
// src/app/core/services/auth.service.ts (y los demás)
private readonly USE_MOCK = true;  // ← cambiar a true
```

## Conectar a producción

En `src/app/core/config/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://tu-backend.com/api',  // ← URL real
};
```

## Build para producción

```bash
ng build
# Archivos en: dist/mg-magic-doors/
```

---

## 📦 Dependencias clave

| Paquete      | Versión | Nota                                    |
|--------------|---------|-----------------------------------------|
| Angular      | ^20.0.0 | Standalone components, Signals          |
| rxjs         | ~7.8.0  | Observables y operadores                |
| qrcode       | ^1.5.4  | Librería para renderizar QR codes       |
| TypeScript   | ~5.8.0  | Tipado estático                         |

**Para servir con proxy:** `ng serve` (usa `proxy.conf.json` automáticamente con Angular CLI)

> Si usas Vite directamente, el proxy de Angular CLI es el que inyecta `/api → localhost:3000`.
> No confundir con el proxy de Vite que aparece en dev mode — el que importa es `proxy.conf.json`.

---

## 🗺️ Flujo de datos (resumen)

```
[Angular Component]
      ↓ llama
[Service (*.service.ts)]  ← USE_MOCK=false → HttpClient
      ↓ usa /api/...
[Angular Dev Proxy]  ← proxy.conf.json
      ↓ redirige a localhost:3000
[API Gateway]  ← api-gateway/src/server.js
      ↓ proxy con http-proxy-middleware
[Microservicio]  ← servicio-usuarios:3001 / servicio-aulas:3002
      ↓ consulta
[PostgreSQL]  ← DB_Usuarios / DB_Aulas
```

## 🔐 Roles y rutas protegidas

| Ruta        | Guard        | Descripción                          |
|-------------|--------------|--------------------------------------|
| /login      | publicGuard  | Solo si NO estás autenticado         |
| /home       | authGuard    | Cualquier usuario autenticado        |
| /personal   | adminGuard   | Solo `rol_id = 1` (admin)            |
| /materias   | authGuard    | Cualquier usuario autenticado        |
| /grupos     | authGuard    | Cualquier usuario autenticado        |

Tokens almacenados en `localStorage` con claves `edu_token` y `edu_user`.
