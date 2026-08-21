import { isAuthenticated, json } from './_lib/auth.mjs';

export default async (req) => {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const authenticated = Boolean(secret) && isAuthenticated(req, secret);
  return json({ authenticated });
};

export const config = { path: '/api/admin/session' };
