import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
config({ path: path.join(repoRoot, '.env') });

const PORT = Number(process.env.LOCAL_API_PORT || 8787);
const HOST = '127.0.0.1';
let GEMINI_API_KEYS = process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : [];
let GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
let geminiKeyCursor = 0;
const localSettingsPath = path.join(repoRoot, '.local-storage', 'admin-ai-settings.json');
const uploadDir = path.join(repoRoot, '.local-storage', 'uploads');

try {
  const persistedSettings = JSON.parse(await readFile(localSettingsPath, 'utf8'));
  if (Array.isArray(persistedSettings.apiKeys)) GEMINI_API_KEYS = persistedSettings.apiKeys.filter((key) => typeof key === 'string' && key.length > 0);
  else if (typeof persistedSettings.apiKey === 'string') GEMINI_API_KEYS = [persistedSettings.apiKey];
  if (typeof persistedSettings.model === 'string') GEMINI_MODEL = persistedSettings.model;
} catch {}

const app = new Hono();
let demoSessionActive = false;

const demoUser = {
  id: 'demo-user-001',
  email: process.env.LOCAL_DEMO_EMAIL || 'demo@nutrilens.local',
  name: process.env.LOCAL_DEMO_NAME || 'NutriLens Demo User',
  role: (process.env.LOCAL_DEMO_ROLE || 'user').trim().toLowerCase(),
};

const profile = {
  userId: demoUser.id,
  email: demoUser.email,
  fullName: demoUser.name,
  age: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  healthConditions: [],
  dietaryPreferences: [],
  isAdmin: demoUser.role === 'admin',
};

const images = new Map();
const analyses = new Map();
const userAccounts = new Map([
  [
    demoUser.id,
    {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      status: 'Active',
      role: demoUser.role === 'admin' ? 'Admin' : 'User',
      joinedDate: new Date().toISOString(),
      scansCount: 0,
    },
  ],
]);
const logs = ['Local demo API started. Cloud database and R2 are not required in this mode.'];

const FOOD_ANALYSIS_INSTRUCTIONS = `Analyze this food image. Identify the primary dish and estimate nutrition for the visible portion. Return only the requested JSON. Nutrition is an estimate, not medical advice. Use confidence from 0 to 1.

If the image does not clearly show food, set isFood to false, foodName to "Not food", and all nutrition values to 0. Set healthBenefits, warnings, and suggestions to empty arrays. Set explanation to "This image does not show food, so nutrition information is unavailable." If it shows food, set isFood to true.

Write for an everyday person with no nutrition knowledge. Keep every response compact and easy to scan:
- healthBenefits: exactly 2 short phrases, 3-7 words each, such as "Steady energy for your day" or "Helps you stay full". Do not use nutrition jargon by itself.
- warnings: exactly 2 short phrases, 3-9 words each, such as "Heavy meal for weight loss" or "Watch salt if eaten often". Keep them non-alarming.
- suggestions: exactly 2 short action phrases, 3-8 words each, such as "Add a side of vegetables" or "Choose water with this meal".
- explanation: one friendly sentence of 8-16 words. Say the main practical takeaway only.
Avoid medical claims, diagnoses, acronyms, and unexplained terms. Do not promise weight loss or muscle gain; use supportive wording such as "can help support".`;

const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean' },
    foodName: { type: 'string' }, confidence: { type: 'number' },
    nutrition: { type: 'object', properties: {
      calories: { type: 'number' }, protein: { type: 'number' }, carbohydrates: { type: 'number' },
      fats: { type: 'number' }, fiber: { type: 'number' }, servingSize: { type: 'string' },
    }, required: ['calories', 'protein', 'carbohydrates', 'fats', 'fiber'] },
    healthBenefits: { type: 'array', description: 'Exactly 2 plain-language benefit phrases, 3-7 words each.', items: { type: 'string' } },
    warnings: { type: 'array', description: 'Exactly 2 plain-language caution phrases, 3-9 words each.', items: { type: 'string' } },
    suggestions: { type: 'array', description: 'Exactly 2 short, practical action phrases, 3-8 words each.', items: { type: 'string' } },
    explanation: { type: 'string', description: 'One friendly 8-16 word sentence with the main practical takeaway.' },
    classification: { type: 'string', enum: ['Healthy', 'Moderate', 'Unhealthy'] },
  },
  required: ['isFood', 'foodName', 'confidence', 'nutrition', 'classification'],
};

app.use(
  '*',
  cors({
    origin: (origin) => ['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin) ? origin : '',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'NutriLens Local Demo API',
    mode: 'local-demo',
    health: '/health',
    frontend: 'http://localhost:3000',
    aiProvider: 'Gemini',
  }),
);

app.get('/health', async (c) => {
  const ai = { ready: GEMINI_API_KEYS.length > 0, status: GEMINI_API_KEYS.length ? 'configured' : 'not_configured', provider: 'Gemini', model: GEMINI_MODEL };
  return c.json({
    status: ai.ready ? 'healthy' : 'degraded',
    server: { status: 'up', mode: 'local-demo' },
    database: { status: 'not_required_in_local_demo' },
    storage: { status: 'local_filesystem', path: uploadDir },
    ai,
    timestamp: new Date().toISOString(),
  });
});

app.get('/help', (c) =>
  c.json({
    success: true,
    message: 'Local demo mode implements the same frontend-facing routes without Neon, R2, or Cloudflare.',
    endpoints: [
      'POST /api/auth/sign-up',
      'POST /api/auth/sign-in',
      'GET /api/auth/session',
      'POST /api/auth/sign-out',
      'GET /api/v1/profile',
      'POST /api/v1/profile',
      'POST /api/v1/upload-food-image',
      'POST /api/v1/analyze-food',
      'GET /api/v1/analysis-history',
      'GET /api/v1/admin/overview',
    ],
  }),
);

app.post('/api/auth/sign-up', async (c) => authResponse(c, await readJsonSafe(c)));
app.post('/api/auth/sign-up/email', async (c) => authResponse(c, await readJsonSafe(c)));
app.post('/api/auth/sign-in', async (c) => authResponse(c, await readJsonSafe(c)));
app.post('/api/auth/sign-in/email', async (c) => authResponse(c, await readJsonSafe(c)));
app.get('/api/auth/session', (c) => {
  if (!hasDemoSession(c)) return c.json({ success: false, message: 'Authentication required.' }, 401);
  return authResponse(c);
});
app.post('/api/auth/sign-out', (c) => {
  demoSessionActive = false;
  c.header('Set-Cookie', 'nutrilens_demo_session=; Path=/; Max-Age=0; SameSite=Lax');
  return c.json({ success: true, message: 'Signed out from local demo session.' });
});

app.use('/api/v1/*', async (c, next) => {
  if (!hasDemoSession(c)) return c.json({ success: false, message: 'Authentication required.' }, 401);
  c.set('user', demoUser);
  await next();
});

app.use('/api/v1/admin/*', async (c, next) => {
  if (demoUser.role !== 'admin') {
    return c.json({ success: false, message: 'Administrator access required.' }, 403);
  }
  await next();
});

app.get('/api/v1/profile', (c) => c.json({ success: true, data: profile }));

app.post('/api/v1/profile', async (c) => {
  const body = await readJsonSafe(c);
  profile.fullName = body.fullName ?? profile.fullName;
  profile.age = numberOrNull(body.age);
  profile.gender = body.gender ?? profile.gender;
  profile.heightCm = numberOrNull(body.heightCm);
  profile.weightKg = numberOrNull(body.weightKg);
  profile.healthConditions = Array.isArray(body.healthConditions) ? body.healthConditions : profile.healthConditions;
  profile.dietaryPreferences = Array.isArray(body.dietaryPreferences) ? body.dietaryPreferences : profile.dietaryPreferences;

  const account = userAccounts.get(demoUser.id);
  if (account) account.name = profile.fullName;
  logs.unshift(`Profile updated at ${new Date().toLocaleString()}.`);
  return c.json({ success: true, message: 'Profile updated successfully.', data: profile });
});

app.post('/api/v1/upload-food-image', async (c) => {
  if (!profile.fullName?.trim() || !Number.isFinite(profile.age) || profile.age < 13 || profile.age > 120 || !Number.isFinite(profile.heightCm) || profile.heightCm < 50 || profile.heightCm > 260 || !Number.isFinite(profile.weightKg) || profile.weightKg < 20 || profile.weightKg > 500) {
    return c.json({ success: false, message: 'Complete your display name, age, height, and weight before scanning food.' }, 403);
  }
  await mkdir(uploadDir, { recursive: true });
  const form = await c.req.formData();
  const image = form.get('image');

  if (!isFileLike(image)) {
    return c.json({ success: false, message: 'Image file is required.' }, 400);
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
    return c.json({ success: false, message: 'Only JPG, PNG, and WebP food images are supported.' }, 400);
  }

  const maxBytes = Number(process.env.MAX_IMAGE_UPLOAD_BYTES || 8 * 1024 * 1024);
  if (Number.isFinite(maxBytes) && image.size > maxBytes) {
    return c.json({ success: false, message: `Image is too large. Maximum allowed size is ${Math.round(maxBytes / 1024 / 1024)} MB.` }, 400);
  }

  const bytes = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  if (!matchesImageSignature(bytes, image.type)) {
    return c.json({ success: false, message: 'The file contents do not match the declared image type.' }, 400);
  }

  const imageId = crypto.randomUUID();
  const safeName = (image.name || 'food-image').replace(/[^a-zA-Z0-9._-]/g, '-');
  const extension = path.extname(safeName) || mimeExtension(image.type);
  const fileName = `${imageId}${extension}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, Buffer.from(await image.arrayBuffer()));

  const record = {
    imageId,
    fileName: safeName,
    filePath,
    mimeType: image.type,
    imageUrl: `/api/v1/food-images/${imageId}`,
    createdAt: new Date().toISOString(),
  };
  images.set(imageId, record);
  logs.unshift(`Uploaded ${safeName}.`);

  return c.json({
    success: true,
    message: 'Image uploaded successfully.',
    data: { imageId, objectKey: fileName, imageUrl: record.imageUrl },
  });
});

app.get('/api/v1/food-images/:imageId', async (c) => {
  const record = images.get(c.req.param('imageId'));
  if (!record || !existsSync(record.filePath)) {
    return c.json({ success: false, message: 'Food image was not found.' }, 404);
  }

  const file = await readFile(record.filePath);
  return new Response(file, {
    headers: {
      'Content-Type': record.mimeType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
});

app.post('/api/v1/analyze-food', async (c) => {
  const startedAt = Date.now();
  const body = await readJsonSafe(c);
  const imageId = body.imageId;

  if (typeof imageId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(imageId)) {
    return c.json({ success: false, message: 'imageId is required.' }, 400);
  }

  const image = images.get(imageId);
  if (!image || !existsSync(image.filePath)) {
    return c.json({ success: false, message: 'Food image was not found.' }, 404);
  }

  let prediction;
  try {
    prediction = await requestPrediction(image);
  } catch (error) {
    console.error('Gemini request failed.', error instanceof Error ? error.name : 'UnknownError');
    logs.unshift(`AI analysis failed for ${image.fileName}.`);
    return c.json(
      {
        success: false,
        message: GEMINI_API_KEYS.length ? 'Food analysis service is unavailable.' : 'Food analysis is not configured. Add keys in Admin AI settings or configure GEMINI_API_KEY in .env.',
      },
      503,
    );
  }

  const analysis = {
    analysisId: crypto.randomUUID(),
    isFood: prediction.isFood,
    foodName: prediction.foodName,
    confidence: prediction.confidence,
    imageUrl: image.imageUrl,
    createdAt: new Date().toISOString(),
    nutrition: prediction.nutrition,
    healthBenefits: prediction.healthBenefits || [],
    warnings: prediction.warnings || [],
    suggestions: prediction.suggestions || [],
    explanation: prediction.explanation || `${prediction.foodName} was identified with ${Math.round(prediction.confidence * 100)}% confidence.`,
    classification: prediction.classification || 'Moderate',
    modelName: prediction.modelName || 'gemini',
    modelVersion: prediction.modelVersion || GEMINI_MODEL,
    topPredictions: prediction.topPredictions || [],
    responseTimeMs: Date.now() - startedAt,
  };

  analyses.set(analysis.analysisId, analysis);
  const account = userAccounts.get(demoUser.id);
  if (account) account.scansCount += 1;
  logs.unshift(`Analyzed ${image.fileName} as ${analysis.foodName}.`);

  return c.json({ success: true, message: 'Food analysis completed.', data: analysis });
});

app.get('/api/v1/analysis-history', (c) => {
  const data = [...analyses.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return c.json({ success: true, data });
});

app.get('/api/v1/analysis-history/:analysisId', (c) => {
  const analysis = analyses.get(c.req.param('analysisId'));
  if (!analysis) return c.json({ success: false, message: 'Analysis was not found.' }, 404);
  return c.json({ success: true, data: analysis });
});

app.get('/api/v1/nutrition-lookup', (c) =>
  c.json({
    success: true,
    data: {
      foodName: c.req.query('food') || 'Sample food',
      calories: 240,
      protein: 8,
      carbohydrates: 30,
      fats: 10,
      fiber: 2,
    },
  }),
);

app.get('/api/v1/health-insights', (c) =>
  c.json({
    success: true,
    data: {
      summary: 'Local demo mode is running. Upload a JPG, PNG, or WebP image to test the full AI flow.',
      suggestions: ['Use clear food photos.', 'Confirm portion sizes manually for real nutrition decisions.'],
    },
  }),
);

app.get('/api/v1/admin/overview', (c) => {
  const totalScans = [...userAccounts.values()].reduce((sum, account) => sum + account.scansCount, 0);
  return c.json({
    success: true,
    data: {
      currentUserId: demoUser.id,
      users: [...userAccounts.values()],
      stats: {
        totalUsers: userAccounts.size,
        totalScans,
        activeUsers24h: 1,
        averageResponseTime: 1.1,
        systemStatus: 'Healthy',
        modelAccuracy: 86,
      },
      logs: logs.slice(0, 20),
    },
  });
});

app.get('/api/v1/admin/uploads', async (c) => {
  const data = await Promise.all([...images.values()].map(async (image) => {
    const analysis = [...analyses.values()].find((item) => item.imageUrl === image.imageUrl);
    return {
      imageId: image.imageId,
      userId: demoUser.id,
      userName: demoUser.name,
      userEmail: demoUser.email,
      fileName: image.fileName,
      imageUrl: `/api/v1/admin/uploads/${image.imageId}/image`,
      mimeType: image.mimeType,
      sizeBytes: existsSync(image.filePath) ? (await stat(image.filePath)).size : 0,
      createdAt: image.createdAt,
      foodName: analysis?.foodName ?? null,
    };
  }));
  return c.json({ success: true, data: data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.get('/api/v1/admin/uploads/:imageId/image', async (c) => {
  const record = images.get(c.req.param('imageId'));
  if (!record || !existsSync(record.filePath)) return c.json({ success: false, message: 'Food image was not found.' }, 404);
  const file = await readFile(record.filePath);
  return new Response(file, { headers: { 'Content-Type': record.mimeType || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
});

app.get('/api/v1/admin/ai-settings', (c) => c.json({
  success: true,
  data: { configured: GEMINI_API_KEYS.length > 0, keyCount: GEMINI_API_KEYS.length, model: GEMINI_MODEL },
}));

app.put('/api/v1/admin/ai-settings', async (c) => {
  const body = await readJsonSafe(c);
  const apiKeys = Array.isArray(body.apiKeys) ? body.apiKeys.map((key) => typeof key === 'string' ? key.trim() : '') : [];
  const model = typeof body.model === 'string' ? body.model.trim() : '';
  if (Object.keys(body).some((key) => !['apiKeys', 'model'].includes(key))) return c.json({ success: false, message: 'Request contains an unsupported field.' }, 400);
  if (apiKeys.length < 1 || apiKeys.length > 20 || apiKeys.some((key) => key.length < 10 || key.length > 500)) return c.json({ success: false, message: 'apiKeys must contain between 1 and 20 keys, each 10 to 500 characters long.' }, 400);
  if (new Set(apiKeys).size !== apiKeys.length) return c.json({ success: false, message: 'Each API key must be unique.' }, 400);
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(model)) return c.json({ success: false, message: 'model must be a valid Gemini model identifier.' }, 400);

  GEMINI_API_KEYS = apiKeys;
  geminiKeyCursor = 0;
  GEMINI_MODEL = model;
  await mkdir(path.dirname(localSettingsPath), { recursive: true });
  await writeFile(localSettingsPath, `${JSON.stringify({ apiKeys, model }, null, 2)}\n`, { mode: 0o600 });

  const safeModel = model.replace(/\\/g, '\\\\').replace(/\r?\n/g, '');
  const envPath = path.join(repoRoot, '.env');
  let envContents = '';
  try { envContents = await readFile(envPath, 'utf8'); } catch {}
  for (const [key, value] of [['GEMINI_MODEL', safeModel]]) {
    const expression = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    if (expression.test(envContents)) envContents = envContents.replace(expression, `${key}=${value}`);
    else envContents += `${envContents.endsWith('\n') || !envContents ? '' : '\n'}${key}=${value}\n`;
  }
  await writeFile(envPath, envContents, { mode: 0o600 });
  logs.unshift('Gemini model settings were updated.');
  return c.json({ success: true, data: { configured: true, keyCount: apiKeys.length, model } });
});

app.put('/api/v1/admin/users/:userId/status', async (c) => {
  const account = userAccounts.get(c.req.param('userId'));
  if (!account) return c.json({ success: false, message: 'User was not found.' }, 404);
  const body = await readJsonSafe(c);
  if (!['Active', 'Suspended'].includes(body.status)) {
    return c.json({ success: false, message: 'status must be Active or Suspended.' }, 400);
  }
  account.status = body.status;
  logs.unshift(`User ${account.email} status changed to ${account.status}.`);
  return c.json({ success: true, data: account });
});

function authResponse(c, body = {}) {
  demoSessionActive = true;
  if (body.email) {
    demoUser.email = body.email;
    demoUser.name = body.name || body.email.split('@')[0] || demoUser.name;
    profile.email = demoUser.email;
    profile.fullName = demoUser.name;
    const account = userAccounts.get(demoUser.id);
    if (account) {
      account.email = demoUser.email;
      account.name = demoUser.name;
      account.role = demoUser.role === 'admin' ? 'Admin' : 'User';
    }
  }
  c.header('Set-Cookie', 'nutrilens_demo_session=demo; Path=/; HttpOnly; SameSite=Lax');
  return c.json({ user: demoUser });
}

function hasDemoSession(c) {
  return demoSessionActive && (c.req.header('Cookie') || '').split(';').some((cookie) => cookie.trim() === 'nutrilens_demo_session=demo');
}

async function requestPrediction(image) {
  if (!GEMINI_API_KEYS.length) throw new Error('Gemini is not configured.');
  const buffer = await readFile(image.filePath);
  const requestBody = JSON.stringify({
      contents: [{ parts: [
        { text: FOOD_ANALYSIS_INSTRUCTIONS },
        { inlineData: { mimeType: image.mimeType, data: buffer.toString('base64') } },
      ] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA, temperature: 0.2 },
    });

  for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt += 1) {
    const apiKey = GEMINI_API_KEYS[geminiKeyCursor % GEMINI_API_KEYS.length];
    geminiKeyCursor = (geminiKeyCursor + 1) % GEMINI_API_KEYS.length;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(30_000),
      body: requestBody,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const quotaLimited = response.status === 429 || (response.status === 403 && /quota|rate.?limit|resource.?exhausted|too many requests/i.test(errorBody));
      if (quotaLimited && keyAttempt + 1 < GEMINI_API_KEYS.length) continue;
      throw new Error(quotaLimited ? 'Gemini API key pool is quota limited.' : `Gemini returned ${response.status}.`);
    }

    const payload = await response.json().catch(() => null);
    if (!payload) throw new Error('Gemini returned an invalid response.');
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!text) throw new Error('Gemini returned no content.');
    let prediction;
    try { prediction = JSON.parse(text); } catch { throw new Error('Gemini returned invalid JSON.'); }
    if (!isValidPrediction(prediction)) {
      throw new Error('AI service returned an invalid prediction payload.');
    }
    return { ...prediction, modelName: 'gemini', modelVersion: GEMINI_MODEL };
  }
  throw new Error('Gemini API key pool is quota limited.');
}

async function readJsonSafe(c) {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function isFileLike(value) {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && 'name' in value;
}

function matchesImageSignature(bytes, mimeType) {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mimeType === 'image/webp') return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}

function isValidPrediction(value) {
  if (typeof value.isFood !== 'boolean') return false;
  if (!value || typeof value !== 'object' || typeof value.foodName !== 'string' || !value.foodName.trim() || value.foodName.length > 120) return false;
  if (!Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return false;
  if (!value.nutrition || !['calories', 'protein', 'carbohydrates', 'fats', 'fiber'].every((key) => Number.isFinite(value.nutrition[key]) && value.nutrition[key] >= 0)) return false;
  if (!['Healthy', 'Moderate', 'Unhealthy'].includes(value.classification)) return false;
  if (!['healthBenefits', 'warnings', 'suggestions'].every((field) => value[field] === undefined || (Array.isArray(value[field]) && value[field].length <= 10 && value[field].every((item) => typeof item === 'string' && item.length <= 300)))) return false;
  return (value.explanation === undefined || (typeof value.explanation === 'string' && value.explanation.length <= 1500)) &&
    (value.nutrition.servingSize === undefined || (typeof value.nutrition.servingSize === 'string' && value.nutrition.servingSize.length <= 100));
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mimeExtension(mimeType) {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`NutriLens local demo API running at http://${info.address}:${info.port}`);
  console.log('Mode: local demo; Neon, R2, and Cloudflare credentials are not required.');
});
