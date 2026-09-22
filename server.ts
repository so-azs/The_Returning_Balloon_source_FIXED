import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow the game (hosted on itch.io / itch.zone or anywhere else) to call this
// TTS API from a different origin. Only GET data is served (no cookies/auth),
// so a permissive origin is safe here.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// In-memory audio cache for Arabic narration lines (MP3 buffers)
const ttsCache = new Map<string, Buffer>();

// Dedicated Voice: Shakir (Deep, warm, rich masculine Arabic narrator)
const SHAKIR_VOICE = 'ar-EG-ShakirNeural';

/**
 * Synthesizes Arabic male narrator voice with Shakir Neural model
 */
async function synthesizeShakirVoice(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(SHAKIR_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { pitch: '-1Hz', rate: '-2%' });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(new Error(`Neural TTS synthesis timeout for Shakir`));
    }, 8000);

    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    audioStream.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Fetches high-quality Arabic male spoken audio for text using Shakir's voice
 */
async function getShakirAudioBuffer(text: string): Promise<Buffer> {
  const normalized = text.trim();

  if (ttsCache.has(normalized)) {
    return ttsCache.get(normalized)!;
  }

  const buffer = await synthesizeShakirVoice(normalized);
  if (buffer && buffer.length > 0) {
    ttsCache.set(normalized, buffer);
    return buffer;
  }

  throw new Error('Failed to generate audio with Shakir voice');
}

// Pre-warm primary game lines with Shakir's voice
const PREWARM_TEXTS = [
  'في يومٍ صيفي باغتته الرياح، انفلت من يد صاحبه، ليمضي في رحلة عبور ملحمية بين الآفاق وتيارات السحاب. رافق الخيط في مساره، واجمع قبسات الذكرى المضيئة، ليعود إلى حيث بدأ العهد وتستقر الطمأنينة.',
  'في يوم صيفي باغتته الرياح، انفلت من يد صاحبه، ليمضي في رحلة عبور ملحمية بين الآفاق وتيارات السحاب. رافق الخيط في مساره، واجمع قبسات الذكرى المضيئة، ليعود إلى حيث بدأ العهد وتستقر الطمأنينة.',
  'عُدْتُ.. طول مسير، فغدت كل سحابةٍ عَبَرْناها ذكرى محفورة في صفحة الوفاء.',
  'في ظلال هذا البستان، أدركتُ معنى أن يكون للمرء مأوى يألفه ويسكن إليه.',
  'كل زاوية هنا تحتفظ بأثرٍ طيّب من خطواتنا الهادئة وأحاديثنا الصادقة.',
  'كانت اليد التي أمسكت بي تُشعرني بأن الأمان قرار نتخذه معًا.',
  'حين باغتتني الرياح بالابتعاد، علمتُ أن المسافات لا تنال من ثبات العهد.',
  'البوصلة تظل دومًا مشدودة نحو البداية.',
  'من هذا العلو، تبدو تفاصيل الأماكن أكثر اتساعًا، ويتضح تسلسل الحكاية.',
  'المعالم التي عهدناها شاهدةٌ على أن للمودة موطنًا لا تُنسى ملامحه.',
  'أسراب الطيور العابرة تُدرك بفطرتها أن لكل جناحٍ غاية.',
  'بين تشابك الطرق وتقاطع المسارات، يستدلّ المرء بصدق مقصده ونقاء مبتغاه.',
  'المدى فسيح ومتشعب، غير أن وضوح الهدف كفيلٌ باختصار كل اغتراب.',
  'أن بعد كل عاصفة صفاءً وارتواء.',
  'مقاومة التيارات العاتية تمنح العزم صلابة، وتعلّمنا كيف نحافظ على وجهتنا.',
  'في قلب الضباب الكثيف، يظل اليقين سراجًا ينير المسار دون تردد.',
  'الغيوم الداكنة سرعان ما تنجلي، كاشفةً عن أفقٍ أرحب .',
  'كل ميلٍ نقطعه في وجه العواصف هو خطوةٌ راسخة نحو مرافئ الطمأنينة.',
  'في سكون الليل يتوارى ضجيج العالم، ولا يتبقى سوى صوت الحقيقة الداخلي.',
  'النجوم في عليائها تذكّرنا بأن الضوء الأصدق هو الذي ينبعث في أشد الأوقات حلكة.',
  'التحليق وسط هذا المدى الصامت يعلّم النفس فضيلة الصبر وحكمة الانتظار.',
  'الظلام ليس نهاية المطاف، بل هو المعبر الهادئ .',
  'حين تسكن الرياح ويقترب انبلاج الصبح، تكتمل ملامح الرحلة ومعانيها العميقة.',
  'يمنح الخطى فرصةً جديدة للبدء من جديد.',
  'تلوح ملامح المكان القديم في الأفق، دافئةً كما تركناها أول مرة.',
  'النافذة المفتوحة على سكون الفجر تؤكد أن الانتظار لم يكن يومًا سرابًا.',
  'حين يلتقي السعي بالوصول، تغدو كل مشقة خضناها فصلًا يستحق الذكرى.',
  '.. اكتملت الرحلة بسلامٍ ووئام.',
];

async function prewarmCache() {
  for (const txt of PREWARM_TEXTS) {
    try {
      await getShakirAudioBuffer(txt);
      await new Promise((r) => setTimeout(r, 60));
    } catch {
      // Continue silently
    }
  }
  console.log(`[TTS Engine] Pre-warmed ${ttsCache.size} narrations with Shakir male voice.`);
}

// API Routes FIRST
app.get('/api/tts', async (req, res) => {
  try {
    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';

    if (!text) {
      res.status(400).json({ error: 'Text query parameter is required' });
      return;
    }

    const audioBuffer = await getShakirAudioBuffer(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    // Ensure browsers do NOT use stale cache from earlier sessions
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    console.error('Error synthesizing Shakir male TTS:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    voice: 'ar-EG-ShakirNeural (Deep Male)',
    cachedNarrations: ttsCache.size,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT} with Shakir Arabic Male Voice`);
    prewarmCache().catch(() => {});
  });
}

startServer();
