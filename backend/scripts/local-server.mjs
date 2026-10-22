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
  allergies: [],
  foodGoal: 'Eat balanced',
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

If the image does not clearly show food, set isFood to false, foodName to "Not food", and all nutrition values to 0. Set healthBenefits, warnings, allergyMatches, and suggestions to empty arrays. Set explanation to "This image does not show food, so nutrition information is unavailable." If it shows food, set isFood to true.

Write the lower guidance for an everyday person with no nutrition knowledge. Do not mention protein, carbohydrates, fats, calories, macros, or nutrition jargon in healthBenefits, warnings, suggestions, or explanation. Explain practical effects in familiar terms (for example, "May keep you full longer", "Quite oily, so keep the portion small", "Add vegetables to balance the meal").
- healthBenefits: exactly 2 simple, concrete benefits, 3-12 words each.
- warnings: exactly 2 clear, non-alarming cautions, 3-16 words each.
- allergyMatches: only user-reported allergens that are clearly visible or explicitly identifiable in the food; use the exact profile label, otherwise an empty array. Never infer hidden ingredients.
- suggestions: exactly 2 practical actions, 3-12 words each.
- explanation: one friendly sentence, 8-20 words, giving the main takeaway for this user's goal.
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
    allergyMatches: { type: 'array', description: 'Exact matching user-reported allergens that are visible or identifiable; empty when none.', items: { type: 'string' } },
    suggestions: { type: 'array', description: 'Exactly 2 short, practical action phrases, 3-8 words each.', items: { type: 'string' } },
    explanation: { type: 'string', description: 'One friendly 8-16 word sentence with the main practical takeaway.' },
    classification: { type: 'string', enum: ['Healthy', 'Moderate', 'Unhealthy'] },
    recommendation: { type: 'string', enum: ['Eat', 'Limit', 'Avoid'] },
  },
  required: ['isFood', 'foodName', 'confidence', 'nutrition', 'classification', 'recommendation'],
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
  const allowedAllergies = ['Shrimp / Prawns (Chingri)', 'Crab (Kakra)', 'Fish (Ilish, Tuna, etc.)', 'Eggs (especially egg whites)', 'Milk', 'Peanuts (China Badam)', 'Tree nuts (Cashews, Almonds, Walnuts)', 'Wheat (Atta, Bread, Roti)', 'Soybeans (Soy milk, Tofu)', 'Sesame seeds (Til)'];
  if (body.allergies !== undefined && (!Array.isArray(body.allergies) || body.allergies.some((allergy) => !allowedAllergies.includes(allergy)))) {
    return c.json({ success: false, message: 'allergies contains an unsupported allergen.' }, 400);
  }
  profile.allergies = body.allergies ?? profile.allergies;
  if (body.foodGoal !== undefined && !['Lose weight', 'Gain weight', 'Eat balanced'].includes(body.foodGoal)) {
    return c.json({ success: false, message: 'foodGoal must be Lose weight, Gain weight, or Eat balanced.' }, 400);
  }
  profile.foodGoal = body.foodGoal ?? profile.foodGoal ?? 'Eat balanced';

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

  const healthConditions = profile.healthConditions.filter((condition) => typeof condition === 'string' && condition.toLowerCase() !== 'none');
  const allergies = profile.allergies.map((allergy) => allergy === "Milk (cow's milk)" ? 'Milk' : allergy);
  let prediction;
  try {
    prediction = await requestPrediction(image, { foodGoal: profile.foodGoal, allergies, healthConditions });
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

  const allergyMatches = mergeAllergyMatches(prediction.allergyMatches || [], findMatchingAllergies(prediction.foodName, allergies), allergies);
  const conditionGuidance = getConditionGuidance(prediction.foodName, healthConditions);
  const analysis = {
    analysisId: crypto.randomUUID(),
    isFood: prediction.isFood,
    foodName: prediction.foodName,
    confidence: prediction.confidence,
    imageUrl: image.imageUrl,
    createdAt: new Date().toISOString(),
    nutrition: prediction.nutrition,
    healthBenefits: prediction.healthBenefits || [],
    warnings: mergeGuidance(prediction.warnings || [], [...allergyWarning(allergyMatches), ...conditionGuidance.warnings]),
    allergyMatches,
    suggestions: mergeGuidance(conditionGuidance.suggestions, prediction.suggestions || []),
    explanation: conditionGuidance.explanation || prediction.explanation || `${prediction.foodName} was identified with ${Math.round(prediction.confidence * 100)}% confidence.`,
    classification: prediction.classification || 'Moderate',
    recommendation: allergyMatches.length ? 'Avoid' : conditionGuidance.recommendation || prediction.recommendation || 'Limit',
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

async function requestPrediction(image, userProfile = { foodGoal: 'Eat balanced', allergies: [], healthConditions: [] }) {
  if (!GEMINI_API_KEYS.length) throw new Error('Gemini is not configured.');
  const buffer = await readFile(image.filePath);
  const requestBody = JSON.stringify({
      contents: [{ parts: [
        { text: `${FOOD_ANALYSIS_INSTRUCTIONS}\n\nUser food goal: ${userProfile.foodGoal}. Base your recommendation on this goal. For "Lose weight", advise limiting calorie-dense or high-fat foods when appropriate; for "Gain weight", suggest energy-dense nutritious choices when appropriate; for "Eat balanced", consider overall balance. User health notes: ${userProfile.healthConditions.length ? userProfile.healthConditions.join(', ') : 'none reported'}. Use relevant notes in the advice: for diabetes, flag clearly sweet desserts and suggest a small portion or lower-sugar alternative; for heart problems, flag clearly fried/oily/high-saturated-fat foods and suggest less-fried options; for high blood pressure, flag clearly salty foods and suggest lower-salt options. Do not claim a food is medically safe or unsafe, infer ingredients or nutrient amounts not shown, or override a clinician's advice. User-reported allergies: ${userProfile.allergies.length ? userProfile.allergies.join(', ') : 'none reported'}. If the identified food or clearly visible ingredients match a reported allergy, include the exact profile label in allergyMatches, set recommendation to Avoid and add a direct warning naming it. Do not assume hidden ingredients that cannot be identified. Set recommendation to Eat, Limit, or Avoid based on the combined food goal, health notes, and confirmed allergy matches; explain briefly.` },
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

function findMatchingAllergies(foodName, allergies) {
  const food = ` ${normalizeFoodText(foodName)} `;
  const aliases = {
    'Shrimp / Prawns (Chingri)': ['shrimp', 'shrimps', 'prawn', 'prawns', 'chingri'],
    'Crab (Kakra)': ['crab', 'crabs', 'kakra'],
    'Fish (Ilish, Tuna, etc.)': ['fish', 'ilish', 'hilsa', 'tuna'],
    'Eggs (especially egg whites)': ['egg', 'eggs', 'omelet', 'omelette'],
    Milk: ['milk', 'dairy', 'cream', 'cheese', 'yogurt', 'curd', 'paneer', 'butter', 'ghee'],
    'Peanuts (China Badam)': ['peanut', 'groundnut', 'chinabadam'],
    'Tree nuts (Cashews, Almonds, Walnuts)': ['cashew', 'almond', 'walnut', 'pistachio', 'hazelnut', 'tree nut'],
    'Wheat (Atta, Bread, Roti)': ['wheat', 'atta', 'bread', 'roti', 'paratha', 'flour'],
    'Soybeans (Soy milk, Tofu)': ['soy', 'soya', 'tofu'],
    'Sesame seeds (Til)': ['sesame', 'tahini', 'til'],
  };
  return allergies.filter((allergy) => (aliases[allergy] || []).some((alias) => food.includes(` ${normalizeFoodText(alias)} `)));
}

function normalizeFoodText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mergeAllergyMatches(modelMatches, nameMatches, profileAllergies) {
  const allowed = new Map(profileAllergies.map((allergy) => [allergy.toLowerCase(), allergy]));
  const confirmedModelMatches = modelMatches.map((match) => allowed.get(match.toLowerCase())).filter(Boolean);
  return [...new Set([...nameMatches, ...confirmedModelMatches])];
}

function allergyWarning(matches) {
  return matches.length ? [`Allergy match: ${matches.join(', ')}. Avoid this food and verify ingredients to prevent exposure.`] : [];
}

function mergeGuidance(primary, secondary) {
  return [...new Set([...primary, ...secondary].map((item) => item.trim()).filter(Boolean))].slice(0, 10);
}

function getConditionGuidance(foodName, conditions) {
  const food = normalizeFoodText(foodName);
  const notes = new Set(conditions.map((condition) => condition.toLowerCase()));
  const warnings = [];
  const suggestions = [];
  let recommendation;
  let explanation = '';
  const isSweetDessert = /\b(cake|cupcake|pastry|cookie|cookies|biscuit|brownie|donut|doughnut|ice cream|dessert|candy|sweet|gulab jamun|rasgulla|halwa|mishti doi)\b/.test(food);
  const isFriedOrOily = /\b(fried|deep fried|oily|greasy|fries|french fries|chips|pakora|puri|luchi|samosa|fried chicken|fried rice)\b/.test(food);
  const isSalty = /\b(salty|salted|chips|crisps|instant noodles|processed meat|bacon|sausage|pickle|pickles)\b/.test(food);

  if (notes.has('diabetes') && isSweetDessert) {
    warnings.push('Diabetes note: sweet desserts can raise blood sugar.');
    suggestions.push('Avoid it when possible; otherwise choose a small serving.');
    recommendation = 'Limit';
    explanation = 'Because you noted diabetes, avoid this sweet dessert when possible or keep it small and follow your meal plan.';
  }
  if (notes.has('heart problem') && isFriedOrOily) {
    warnings.push('Heart health note: fried or oily foods are best limited, especially when often eaten.');
    suggestions.push('Choose a grilled, baked, or less-oily option.');
    recommendation = 'Limit';
    explanation = 'Because you noted a heart condition, a less-fried option may better fit your usual eating pattern.';
  }
  if (notes.has('high blood pressure') && isSalty) {
    warnings.push('Blood pressure note: salty foods can add a lot of sodium.');
    suggestions.push('Choose a lower-salt version when available.');
    recommendation = 'Limit';
    explanation = "Because you noted high blood pressure, consider a lower-salt option and follow your clinician's advice.";
  }
  return { warnings, suggestions, recommendation, explanation };
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
  if (!['healthBenefits', 'warnings', 'allergyMatches', 'suggestions'].every((field) => value[field] === undefined || (Array.isArray(value[field]) && value[field].length <= 10 && value[field].every((item) => typeof item === 'string' && item.length <= 300)))) return false;
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
