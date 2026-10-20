/**
 * Base URL of the API server. Empty = same origin (npm run dev / npm start).
 * For a static host such as GitHub Pages, set VITE_API_BASE at build time to a
 * deployed copy of server.ts; without it the app runs in offline mode.
 */
export const API_BASE: string = ((import.meta as any).env?.VITE_API_BASE ?? '').replace(/\/$/, '');
