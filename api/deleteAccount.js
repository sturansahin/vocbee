import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const RECENT_AUTH_SECONDS = 5 * 60;

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function getAllowedOrigins() {
  return (process.env.DELETE_ACCOUNT_ALLOWED_ORIGINS || process.env.GRAMMAR_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function assertCorsPreflightAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return;

  if (!getAllowedOrigins().includes(origin)) {
    throw new HttpError(403, 'ORIGIN_NOT_ALLOWED');
  }
}

function getFirebaseApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'vocbee-6fe24';
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    const serviceAccount = JSON.parse(rawServiceAccount);
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function verifyRecentFirebaseAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    throw new HttpError(401, 'AUTH_REQUIRED');
  }

  try {
    const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token, true);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      typeof decoded.auth_time !== 'number'
      || nowSeconds - decoded.auth_time > RECENT_AUTH_SECONDS
    ) {
      throw new HttpError(401, 'RECENT_LOGIN_REQUIRED');
    }

    return decoded.uid;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'INVALID_AUTH_TOKEN');
  }
}

function sendJson(res, status, body) {
  return res.status(status).json(body);
}

function sendError(res, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : 'INTERNAL_ERROR';
  return sendJson(res, status, { error: { code } });
}

export default async function handler(req, res) {
  applyCors(req, res);

  try {
    if (req.method === 'OPTIONS') {
      assertCorsPreflightAllowed(req);
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      throw new HttpError(405, 'METHOD_NOT_ALLOWED');
    }

    assertCorsPreflightAllowed(req);
    const uid = await verifyRecentFirebaseAuth(req);
    const app = getFirebaseApp();

    await getFirestore(app).collection('users').doc(uid).delete();

    try {
      await getAuth(app).deleteUser(uid);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendError(res, error);
  }
}
