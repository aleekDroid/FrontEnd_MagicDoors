# MG Magic Doors — Frontend

Aplicación web en Angular 20 para gestión de aulas con control de acceso.

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
