import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
config({ path: path.join(repoRoot, '.env') });

const PORT = Number(process.env.LOCAL_API_PORT || 8787);
const HOST = '127.0.0.1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const uploadDir = path.join(repoRoot, '.local-storage', 'uploads');

const app = new Hono();

const demoUser = {
  id: 'demo-user-001',
  email: process.env.LOCAL_DEMO_EMAIL || 'demo@nutrilens.local',
  name: process.env.LOCAL_DEMO_NAME || 'NutriLens Demo User',
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
  isAdmin: true,
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
      role: 'Admin',
      joinedDate: new Date().toISOString(),
      scansCount: 0,
    },
  ],
]);
const logs = ['Local demo API started. Cloud database and R2 are not required in this mode.'];

const FOOD_ANALYSIS_INSTRUCTIONS = `Analyze this food image. Identify the primary dish and estimate nutrition for the visible portion. Return only the requested JSON. Nutrition is an estimate, not medical advice. Use confidence from 0 to 1.

Write for an everyday person with no nutrition knowledge. Make the advice useful and direct:
- healthBenefits: 2-3 short, concrete positives such as steady energy, staying full longer, supporting muscle recovery, or helping a balanced diet. Do not say only "high protein", "fiber-rich", or other jargon; explain the practical benefit instead.
- warnings: 1-3 short, non-alarming cautions in plain language, such as "May not suit a weight-loss goal if eaten often because it is calorie-dense." Explain why it matters.
- suggestions: 2-3 simple next actions, such as add vegetables, choose water, reduce the portion, or pair it with a lighter meal later.
- explanation: a friendly 2-3 sentence summary. State who may enjoy the meal (for energy, muscle support, or a filling meal) and who may want to adjust it (for weight loss, lower salt, or lower sugar goals).
Avoid medical claims, diagnoses, acronyms, and unexplained terms. Do not promise weight loss or muscle gain; use supportive wording such as "can help support".`;

const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    foodName: { type: 'string' }, confidence: { type: 'number' },
    nutrition: { type: 'object', properties: {
      calories: { type: 'number' }, protein: { type: 'number' }, carbohydrates: { type: 'number' },
      fats: { type: 'number' }, fiber: { type: 'number' }, servingSize: { type: 'string' },
    }, required: ['calories', 'protein', 'carbohydrates', 'fats', 'fiber'] },
    healthBenefits: { type: 'array', description: '2-3 plain-language practical benefits for an everyday user.', items: { type: 'string' } },
    warnings: { type: 'array', description: '1-3 plain-language cautions that explain why the food may not fit some goals.', items: { type: 'string' } },
    suggestions: { type: 'array', description: '2-3 easy actions a user can take with this meal.', items: { type: 'string' } },
    explanation: { type: 'string', description: 'A friendly 2-3 sentence everyday summary with no unexplained nutrition jargon.' },
    classification: { type: 'string', enum: ['Healthy', 'Moderate', 'Unhealthy'] },
  },
  required: ['foodName', 'confidence', 'nutrition', 'classification'],
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
  const ai = { ready: Boolean(GEMINI_API_KEY), status: GEMINI_API_KEY ? 'configured' : 'not_configured', provider: 'Gemini', model: GEMINI_MODEL };
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
app.get('/api/auth/session', (c) => authResponse(c));
app.post('/api/auth/sign-out', (c) => {
  c.header('Set-Cookie', 'nutrilens_demo_session=; Path=/; Max-Age=0; SameSite=Lax');
  return c.json({ success: true, message: 'Signed out from local demo session.' });
});

app.use('/api/v1/*', async (c, next) => {
  c.set('user', demoUser);
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
        message: GEMINI_API_KEY ? 'Food analysis service is unavailable.' : 'Food analysis is not configured. Add GEMINI_API_KEY to .env.',
      },
      503,
    );
  }

  const analysis = {
    analysisId: crypto.randomUUID(),
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
  if (body.email) {
    demoUser.email = body.email;
    demoUser.name = body.name || body.email.split('@')[0] || demoUser.name;
    profile.email = demoUser.email;
    profile.fullName = demoUser.name;
    const account = userAccounts.get(demoUser.id);
    if (account) {
      account.email = demoUser.email;
      account.name = demoUser.name;
    }
  }
  c.header('Set-Cookie', 'nutrilens_demo_session=demo; Path=/; HttpOnly; SameSite=Lax');
  return c.json({ user: demoUser });
}

async function requestPrediction(image) {
  if (!GEMINI_API_KEY) throw new Error('Gemini is not configured.');
  const buffer = await readFile(image.filePath);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      contents: [{ parts: [
        { text: FOOD_ANALYSIS_INSTRUCTIONS },
        { inlineData: { mimeType: image.mimeType, data: buffer.toString('base64') } },
      ] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA, temperature: 0.2 },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw new Error(`Gemini returned ${response.status}.`);
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) throw new Error('Gemini returned no content.');
  let prediction;
  try { prediction = JSON.parse(text); } catch { throw new Error('Gemini returned invalid JSON.'); }
  if (!isValidPrediction(prediction)) {
    throw new Error('AI service returned an invalid prediction payload.');
  }
  return { ...prediction, modelName: 'gemini', modelVersion: GEMINI_MODEL };
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
