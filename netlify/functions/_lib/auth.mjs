// Sesión del dashboard: una sola contraseña compartida (DASHBOARD_PASSWORD),
// no hay usuarios/cuentas. Al hacer login se firma una cookie con HMAC
// (DASHBOARD_SESSION_SECRET) que expira sola — sin JWT libs, solo `crypto`
// de Node, para no meter dependencias nuevas a las funciones.

import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'bf_admin_session';
const SESSION_HOURS = 12;

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionCookie(secret) {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(exp);
  const sig = sign(payload, secret);
  const value = `${payload}.${sig}`;
  const maxAge = SESSION_HOURS * 60 * 60;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(req, name) {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

/** true/false — nunca lanza. */
export function isAuthenticated(req, secret) {
  const value = readCookie(req, COOKIE_NAME);
  if (!value) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;

  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

/** Compara contraseñas en tiempo constante (evita timing attacks). */
export function passwordMatches(input, expected) {
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(String(expected || ''));
  if (a.length !== b.length) {
    // Igual gastamos el tiempo de la comparación para no filtrar longitud.
    timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) }
  });
}

/** Úsalo al inicio de cada función admin: si devuelve algo, es la Response de 401 a retornar. */
export function requireAuth(req) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) {
    return json({ error: 'DASHBOARD_SESSION_SECRET no está configurada.' }, { status: 500 });
  }
  if (!isAuthenticated(req, secret)) {
    return json({ error: 'No autenticado.' }, { status: 401 });
  }
  return null;
}
