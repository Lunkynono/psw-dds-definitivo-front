# Votify Frontend

Frontend React + TypeScript de Votify.

## Responsabilidad

Este repositorio solo contiene interfaz, rutas, formularios, estado de cliente y llamadas HTTP al backend.

La identidad visual se mantiene respecto al monorepo original usando Tailwind CSS y las mismas clases principales de sus componentes y pantallas.

No debe contener:

- Acceso directo a Supabase.
- Cálculo de resultados.
- Inserción de votos en tablas.
- Validaciones de autorización reales.
- Factories de dominio/persistencia.

## Stack visual

- React + TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- React Hook Form.
- Zustand.
- `lucide-react`.

## Patrón fachada + singleton

La clase `VotifyApiFacade` es la única puerta de entrada del frontend hacia la API REST. Las pantallas llaman métodos de alto nivel como `login`, `createSurvey`, `submitJudgeVote` o `submitPublicVote`, sin conocer `fetch`, rutas internas ni headers.

## Variables

Copiar `.env.example` a `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```
