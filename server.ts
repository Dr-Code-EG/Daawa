import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { createCanvas, registerFont } from "canvas";
import cors from "cors";
import FormData from "form-data";

// Set ffmpeg and ffprobe paths
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Download and register font
const fontPath = path.join(process.cwd(), "temp", "Amiri-Regular.ttf");
const setupFont = async () => {
  try {
    if (!fs.existsSync(path.dirname(fontPath))) {
      fs.mkdirSync(path.dirname(fontPath), { recursive: true });
    }
    if (!fs.existsSync(fontPath)) {
      console.log("Downloading Amiri font from Google Fonts...");
      const response = await axios({
        url: "https://fonts.gstatic.com/s/amiri/v26/J7afp9id8zNT9LkmKy7u.ttf",
        method: "GET",
        responseType: "stream"
      });
      const writer = fs.createWriteStream(fontPath);
      response.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", reject);
      });
      console.log("Font downloaded successfully.");
    }
    registerFont(fontPath, { family: "Amiri" });
    console.log("Amiri font registered successfully.");
  } catch (error) {
    console.error("Failed to setup font:", error);
  }
};

const setupNatureSounds = async () => {
  const sounds = [
    { id: "rain", url: "https://www.soundjay.com/nature/rain-01.mp3" },
    { id: "wind", url: "https://www.soundjay.com/nature/wind-01.mp3" },
    { id: "birds", url: "https://www.soundjay.com/nature/birds-01.mp3" },
    { id: "ocean", url: "https://www.soundjay.com/nature/ocean-waves-1.mp3" }
  ];

  if (!fs.existsSync(path.join(process.cwd(), "assets"))) {
    fs.mkdirSync(path.join(process.cwd(), "assets"), { recursive: true });
  }

  for (const sound of sounds) {
    const soundPath = path.join(process.cwd(), "assets", `nature_${sound.id}.mp3`);
    if (!fs.existsSync(soundPath)) {
      try {
        console.log(`Downloading nature sound: ${sound.id}...`);
        const response = await axios({
          url: sound.url,
          method: "GET",
          responseType: "stream",
          timeout: 30000
        });
        const writer = fs.createWriteStream(soundPath);
        response.data.pipe(writer);
        await new Promise<void>((resolve, reject) => {
          writer.on("finish", () => resolve());
          writer.on("error", reject);
        });
      } catch (e) {
        console.error(`Failed to download nature sound ${sound.id}:`, e);
      }
    }
  }
};

const app = express();
const PORT = 3000;

const ORNAMENTS = [
  { id: "frame1", url: "https://i.ibb.co/L6vV5vK/ornament1.png" },
  { id: "frame2", url: "https://i.ibb.co/vXzYqXz/ornament2.png" },
  { id: "corner1", url: "https://i.ibb.co/mS0Yy0Y/ornament3.png" },
];

const PARTICLE_OVERLAYS = [
  { id: "dust", url: "https://assets.mixkit.co/videos/preview/mixkit-dust-particles-flying-in-the-air-9125-large.mp4" },
  { id: "bokeh", url: "https://assets.mixkit.co/videos/preview/mixkit-white-bokeh-particles-on-black-background-4417-large.mp4" },
  { id: "light-leaks", url: "https://assets.mixkit.co/videos/preview/mixkit-warm-light-leaks-on-black-background-4418-large.mp4" },
];

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure directories exist
const isVercel = process.env.VERCEL === "1";
const baseDir = isVercel ? "/tmp" : process.cwd();

const uploadsDir = path.join(baseDir, "uploads");
const outputsDir = path.join(baseDir, "outputs");
const tempDir = path.join(baseDir, "temp");
const assetsDir = path.join(baseDir, "assets");

[uploadsDir, outputsDir, tempDir, assetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Job tracking with persistence
const JOBS_FILE = path.join(tempDir, "jobs.json");
let jobs: { [key: string]: { status: string, progress: number, error?: string, videoUrl?: string, steps: string[], timestamp: number } } = {};

const saveJobs = () => {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (e) {
    console.error("Failed to save jobs", e);
  }
};

const loadJobs = () => {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, "utf8");
      jobs = JSON.parse(data);
      console.log(`Loaded ${Object.keys(jobs).length} jobs from persistence.`);
    }
  } catch (e) {
    console.error("Failed to load jobs", e);
    jobs = {};
  }
};

// Initial load
loadJobs();

// Mark interrupted jobs as failed
Object.keys(jobs).forEach(id => {
  const status = jobs[id].status;
  if (status !== "completed" && status !== "failed" && status !== "تم الانتهاء") {
    jobs[id].status = "failed";
    jobs[id].error = "تم إعادة تشغيل الخادم، يرجى إعادة المحاولة.";
  }
});
saveJobs();

// Cleanup old jobs and output files every hour
setInterval(() => {
  const now = Date.now();
  let changed = false;
  Object.keys(jobs).forEach(id => {
    if (now - jobs[id].timestamp > 3600000) { // 1 hour
      const job = jobs[id];
      if (job.videoUrl) {
        const videoPath = path.join(baseDir, job.videoUrl);
        if (fs.existsSync(videoPath)) {
          try { fs.unlinkSync(videoPath); } catch (e) {}
        }
      }
      delete jobs[id];
      changed = true;
    }
  });
  if (changed) saveJobs();
}, 3600000);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    fieldSize: 10 * 1024 * 1024, // 10MB per field
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/surahs", async (req, res) => {
  try {
    const response = await axios.get("https://api.quran.com/api/v4/chapters?language=ar");
    res.json(response.data.chapters);
  } catch (error) {
    console.error("Failed to fetch surahs", error);
    res.status(500).json({ error: "فشل في جلب السور" });
  }
});

app.get("/api/reciters", async (req, res) => {
  try {
    const response = await axios.get("https://api.quran.com/api/v4/resources/recitations?language=ar");
    res.json(response.data.recitations);
  } catch (error) {
    console.error("Failed to fetch reciters", error);
    res.status(500).json({ error: "فشل في جلب القراء" });
  }
});

app.get("/api/job-status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  if (!job) {
    console.warn(`Job not found: ${jobId}. Available jobs: ${Object.keys(jobs).join(", ")}`);
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

app.post("/api/generate", (req, res, next) => {
  const contentLength = req.headers['content-length'];
  console.log(`Incoming generation request. Content-Length: ${contentLength} bytes`);
  next();
}, upload.fields([{ name: "backgrounds" }, { name: "watermark" }, { name: "customFont" }]), async (req, res) => {
  const { 
    surahId, 
    startAyah, 
    endAyah, 
    reciterId, 
    ratio,
    fontSize = 50,
    fontColor = "white",
    fontFamily = "Amiri",
    fontPosition = "center",
    fontBgColor = "transparent",
    fontBgOpacity = 0.5,
    fontBgPadding = 40,
    fontBgBorderRadius = 12,
    fontBgBorderColor = "transparent",
    fontBgBorderWidth = 0,
    showSocial = "false",
    socialHandle = "",
    socialPlatform = "instagram",
    socialPosition = "bottom-right",
    backgroundRanges = "[]",
    natureSound = "none",
    telegramUserId = "",
    // New parameters
    textShadow = "none",
    textOpacity = 1,
    bgBlur = 0,
    bgBrightness = 1,
    reciterVolume = 1,
    natureVolume = 0.15,
    transition = "none",
    showTranslation = "false",
    translationLanguage = "131",
    translationFontSize = 30,
    translationFontColor = "#cccccc",
    selectedOrnament = "none",
    selectedParticle = "none"
  } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const backgrounds = files["backgrounds"] || [];
  const watermark = files["watermark"] ? files["watermark"][0] : null;
  const customFont = files["customFont"] ? files["customFont"][0] : null;
  
  let parsedRanges: any[] = [];
  try {
    if (backgroundRanges) {
      if (Array.isArray(backgroundRanges)) {
        parsedRanges = backgroundRanges.map(r => JSON.parse(r));
      } else {
        parsedRanges = [JSON.parse(backgroundRanges)];
      }
    }
  } catch (e) {
    console.error("Failed to parse backgroundRanges", e);
  }

  if (!surahId || !startAyah || !endAyah || !reciterId) {
    return res.status(400).json({ error: "يرجى ملء جميع الحقول المطلوبة" });
  }

  const jobId = Date.now().toString();
  const jobDir = path.join(tempDir, jobId);
  
  // Initialize job
  jobs[jobId] = { 
    status: "starting", 
    progress: 0, 
    steps: ["بدء العملية", "جلب بيانات الآيات", "تحميل الملفات الصوتية", "توليد صور النصوص", "معالجة مقاطع الآيات", "إضافة المؤثرات الصوتية", "الدمج النهائي"],
    timestamp: Date.now()
  };
  saveJobs();

  // Start background process
  (async () => {
    const updateJob = (status: string, progress: number, error?: string, videoUrl?: string) => {
      if (jobs[jobId]) {
        jobs[jobId] = { ...jobs[jobId], status, progress, error, videoUrl };
        saveJobs();
      }
      console.log(`Job ${jobId}: ${status} (${progress}%)`);
    };

    const cleanup = () => {
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
          console.log(`Cleaned up job directory: ${jobDir}`);
        }
        // Clean up uploaded files
        backgrounds.forEach(bg => {
          if (bg.path && fs.existsSync(bg.path)) {
            try { fs.unlinkSync(bg.path); } catch (e) {}
          }
        });
        if (watermark && watermark.path && fs.existsSync(watermark.path)) {
          try { fs.unlinkSync(watermark.path); } catch (e) {}
        }
        if (customFont && customFont.path && fs.existsSync(customFont.path)) {
          try { fs.unlinkSync(customFont.path); } catch (e) {}
        }
      } catch (e) {
        console.error(`Failed to cleanup job directory ${jobDir}:`, e);
      }
    };

    try {
      fs.mkdirSync(jobDir);

      // Register custom font if provided
      let activeFontFamily = fontFamily as string;
      if (customFont) {
        const customFontPath = customFont.path;
        const customFontName = `Custom_${jobId}`;
        try {
          registerFont(customFontPath, { family: customFontName });
          activeFontFamily = customFontName;
        } catch (e) {
          console.error("Failed to register custom font", e);
        }
      }

      // Download Ornament if selected
      let localOrnamentPath: string | null = null;
      if (selectedOrnament !== "none") {
        const ornament = ORNAMENTS.find(o => o.id === selectedOrnament);
        if (ornament && ornament.url) {
          const p = path.join(jobDir, `ornament_${selectedOrnament}.png`);
          try {
            console.log(`Downloading ornament: ${ornament.url}`);
            const res = await axios({ 
              url: ornament.url, 
              method: "GET", 
              responseType: "stream",
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const writer = fs.createWriteStream(p);
            res.data.pipe(writer);
            await new Promise<void>((resolve, reject) => {
              writer.on("finish", () => resolve());
              writer.on("error", reject);
            });
            localOrnamentPath = p;
            console.log(`Ornament downloaded to: ${p}`);
          } catch (e) {
            console.error("Failed to download ornament", e);
          }
        }
      }

      // Download Particle Overlay if selected
      let localParticlePath: string | null = null;
      if (selectedParticle !== "none") {
        const particle = PARTICLE_OVERLAYS.find(p => p.id === selectedParticle);
        if (particle && particle.url) {
          const p = path.join(jobDir, `particle_${selectedParticle}.mp4`);
          try {
            console.log(`Downloading particle: ${particle.url}`);
            const res = await axios({ 
              url: particle.url, 
              method: "GET", 
              responseType: "stream",
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const writer = fs.createWriteStream(p);
            res.data.pipe(writer);
            await new Promise<void>((resolve, reject) => {
              writer.on("finish", () => resolve());
              writer.on("error", reject);
            });
            localParticlePath = p;
            console.log(`Particle downloaded to: ${p}`);
          } catch (e) {
            console.error("Failed to download particle overlay", e);
          }
        }
      }

      // 1. Fetch Ayah Data & Audio
      updateJob("جلب بيانات الآيات", 10);
      const versesResponse = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahId}&per_page=300`);
      const verses = versesResponse.data.verses.filter((v: any) => {
        const num = parseInt(v.verse_key.split(":")[1]);
        return num >= parseInt(startAyah) && num <= parseInt(endAyah);
      });

      if (verses.length === 0) throw new Error("لم يتم العثور على آيات في النطاق المحدد");

      const translations: (string | null)[] = [];
      if (showTranslation === "true") {
        updateJob("جلب الترجمات", 15);
        for (const verse of verses) {
          try {
            const transRes = await axios.get(`https://api.quran.com/api/v4/quran/translations/${translationLanguage}?verse_key=${verse.verse_key}`);
            if (transRes.data.translations && transRes.data.translations.length > 0) {
              // Remove HTML tags from translation
              const cleanText = transRes.data.translations[0].text.replace(/<[^>]*>?/gm, '');
              translations.push(cleanText);
            } else {
              translations.push(null);
            }
          } catch (e) {
            console.error(`Failed to fetch translation for ${verse.verse_key}`, e);
            translations.push(null);
          }
        }
      }

      const audioFiles: (string | null)[] = [];
      for (const verse of verses) {
        const vKey = verse.verse_key;
        try {
          const vAudio = await axios.get(`https://api.quran.com/api/v4/recitations/${reciterId}/by_ayah/${vKey}`);
          if (vAudio.data.audio_files && vAudio.data.audio_files.length > 0) {
            audioFiles.push(vAudio.data.audio_files[0].url);
          } else {
            console.warn(`No audio file found for verse ${vKey}`);
            audioFiles.push(null);
          }
        } catch (err: any) {
          console.error(`Error fetching audio for verse ${vKey}:`, err.message);
          audioFiles.push(null);
        }
      }

      if (audioFiles.every(f => f === null)) {
        throw new Error("لم يتم العثور على أي ملفات صوتية للقارئ المختار في هذا النطاق. يرجى تجربة قارئ آخر.");
      }

      // 2. Download Audio Files
      updateJob("تحميل الملفات الصوتية", 20);
      const localAudioPaths: (string | null)[] = await Promise.all(audioFiles.map(async (relativeUrl, i) => {
        if (!relativeUrl) return null;

        const baseUrls = [
          "https://verses.quran.com/", 
          "https://download.quranicaudio.com/",
          "https://mirrors.quranicaudio.com/"
        ];
        let lastError = "";
        
        // Construct URLs to try
        let urlsToTry: string[] = [];
        if (relativeUrl.startsWith("http")) {
          urlsToTry = [relativeUrl];
        } else if (relativeUrl.startsWith("//")) {
          urlsToTry = [`https:${relativeUrl}`];
        } else if (relativeUrl.includes("mirrors.quranicaudio.com") || relativeUrl.includes("download.quranicaudio.com") || relativeUrl.includes("verses.quran.com")) {
          // It contains a domain but no protocol
          const clean = relativeUrl.startsWith("/") ? relativeUrl.slice(1) : relativeUrl;
          urlsToTry = [`https://${clean}`];
        } else {
          const cleanRelative = relativeUrl.startsWith("/") ? relativeUrl.slice(1) : relativeUrl;
          urlsToTry = baseUrls.map(base => `${base}${cleanRelative}`);
        }

        for (const url of urlsToTry) {
          const p = path.join(jobDir, `audio_${i}.mp3`);
          const writer = fs.createWriteStream(p);
          try {
            console.log(`Trying to download audio from: ${url}`);
            const response = await axios({ 
              url, 
              method: "GET", 
              responseType: "stream", 
              timeout: 20000, 
              headers: { 'User-Agent': 'Mozilla/5.0' } 
            });
            response.data.pipe(writer);
            await new Promise<void>((resolve, reject) => {
              writer.on("finish", () => resolve());
              writer.on("error", reject);
            });
            return p;
          } catch (err: any) {
            lastError = err.message;
            if (fs.existsSync(p)) fs.unlinkSync(p);
            console.warn(`Failed to download from ${url}: ${err.message}`);
            continue;
          }
        }
        console.error(`Failed to download audio ${i} after trying all sources. Last error: ${lastError}`);
        return null; // Skip this audio
      }));

      // 3. Generate Text Images (Canvas)
      updateJob("توليد صور النصوص", 35);
      const textImagePaths: string[] = [];
      const [wRatio, hRatio] = ratio.split(":").map(Number);
      const width = 1080;
      let height = Math.round((1080 / wRatio) * hRatio);
      if (height % 2 !== 0) height++;

      const wrapText = (ctx: any, text: string, maxWidth: number) => {
        const words = text.split(" ");
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const w = ctx.measureText(currentLine + " " + word).width;
          if (w < maxWidth) currentLine += " " + word;
          else { lines.push(currentLine); currentLine = word; }
        }
        lines.push(currentLine);
        return lines;
      };

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      for (let i = 0; i < verses.length; i++) {
        if (!ctx) continue;
        ctx.clearRect(0, 0, width, height);
        ctx.direction = "rtl";

        const fSize = parseInt(fontSize as string);
        ctx.font = `${fSize}px "${activeFontFamily}"`;
        ctx.fillStyle = fontColor as string;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = parseFloat(textOpacity as string);

        // Text Shadow
        if (textShadow !== "none") {
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = textShadow === "large" ? 15 : 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        const text = verses[i].text_uthmani;
        const maxWidth = width * 0.85;
        const lines = wrapText(ctx, text, maxWidth);
        const lineHeight = fSize * 1.4;
        const totalHeight = lines.length * lineHeight;

        let startY: number;
        if (fontPosition === "top") startY = height * 0.2;
        else if (fontPosition === "bottom") startY = height * 0.8 - totalHeight;
        else startY = (height - totalHeight) / 2;

        if (fontBgColor !== "transparent") {
          const padding = parseInt(fontBgPadding as string);
          const radius = parseInt(fontBgBorderRadius as string);
          const boxX = width * 0.05;
          const boxY = startY - lineHeight / 2 - padding;
          const boxWidth = width * 0.9;
          const boxHeight = totalHeight + padding * 2;

          ctx.save();
          ctx.globalAlpha = parseFloat(fontBgOpacity as string);
          ctx.fillStyle = fontBgColor as string;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
          ctx.fill();
          ctx.restore();
        }

        let currentY = startY;
        lines.forEach((line) => {
          ctx.fillText(line, width / 2, currentY);
          currentY += lineHeight;
        });

        // Render Translation
        if (showTranslation === "true" && translations[i]) {
          ctx.save();
          const tSize = parseInt(translationFontSize as string);
          ctx.font = `${tSize}px sans-serif`;
          ctx.fillStyle = translationFontColor as string;
          ctx.direction = "ltr"; // Translations are usually LTR
          
          const tLines = wrapText(ctx, translations[i]!, maxWidth);
          const tLineHeight = tSize * 1.3;
          let tY = currentY + 20; // Small gap after Arabic text
          
          tLines.forEach((tLine) => {
            ctx.fillText(tLine, width / 2, tY);
            tY += tLineHeight;
          });
          ctx.restore();
        }

        if (showSocial === "true" && socialHandle) {
          ctx.save();
          ctx.font = "30px sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          let sX: number, sY: number;
          const margin = 50;
          if (socialPosition === "top-left") { sX = margin; sY = margin; ctx.textAlign = "left"; }
          else if (socialPosition === "top-right") { sX = width - margin; sY = margin; ctx.textAlign = "right"; }
          else if (socialPosition === "bottom-left") { sX = margin; sY = height - margin; ctx.textAlign = "left"; }
          else { sX = width - margin; sY = height - margin; ctx.textAlign = "right"; }
          ctx.fillText(`${socialPlatform}: @${socialHandle}`, sX, sY);
          ctx.restore();
        }

        const p = path.join(jobDir, `text_${i}.png`);
        fs.writeFileSync(p, canvas.toBuffer("image/png"));
        textImagePaths.push(p);
      }

      // 4. Combine with FFmpeg
      updateJob("معالجة مقاطع الآيات", 50);
      const outputFileName = `quran_video_${jobId}.mp4`;
      const outputPath = path.join(outputsDir, outputFileName);

      const getDuration = (filePath: string): Promise<number> => {
        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            resolve(metadata.format.duration || 0);
          });
        });
      };

      const ayahVideos: string[] = new Array(verses.length);
      const concurrencyLimit = 1;
      const queue = [...Array(verses.length).keys()];
      
      const processAyah = async (i: number) => {
        try {
          const audioPath = localAudioPaths[i];
          if (!audioPath) return; // Skip if audio failed

          const ayahVideoPath = path.join(jobDir, `ayah_${i}.mp4`);
          const duration = await getDuration(audioPath);
          const currentAyahNum = parseInt(verses[i].verse_key.split(":")[1]);

          let bgToUse = null;
          for (let j = 0; j < parsedRanges.length; j++) {
            const range = parsedRanges[j];
            if (currentAyahNum >= range.start && currentAyahNum <= range.end) {
              bgToUse = backgrounds[j];
              break;
            }
          }
          if (!bgToUse && backgrounds.length > 0) bgToUse = backgrounds[0];

          await new Promise<void>((resolve, reject) => {
            const cmd = ffmpeg();
            if (bgToUse) {
              const isVideo = bgToUse.mimetype.startsWith("video");
              if (isVideo) cmd.input(bgToUse.path).inputOptions(["-stream_loop -1"]);
              else cmd.input(bgToUse.path).inputOptions(["-loop 1"]);
              cmd.inputOptions([`-t ${duration}`]);
            } else {
              cmd.input(`color=c=black:s=${width}x${height}:d=${duration}`).inputFormat('lavfi');
            }

            cmd.input(textImagePaths[i]).inputOptions(["-loop 1", `-t ${duration}`]);
            if (watermark) {
              const isWatermarkVideo = watermark.mimetype.startsWith("video");
              if (isWatermarkVideo) cmd.input(watermark.path).inputOptions(["-stream_loop -1", `-t ${duration}`]);
              else cmd.input(watermark.path).inputOptions(["-loop 1", `-t ${duration}`]);
            }
            
            if (localOrnamentPath) {
              cmd.input(localOrnamentPath).inputOptions(["-loop 1", `-t ${duration}`]);
            }

            if (localParticlePath) {
              cmd.input(localParticlePath).inputOptions(["-stream_loop -1", `-t ${duration}`]);
            }

            cmd.input(audioPath);

            let nextInputIndex = 2;
            let watermarkIndex = -1;
            let ornamentIndex = -1;
            let particleIndex = -1;
            
            if (watermark) watermarkIndex = nextInputIndex++;
            if (localOrnamentPath) ornamentIndex = nextInputIndex++;
            if (localParticlePath) particleIndex = nextInputIndex++;
            const audioInputIndex = nextInputIndex;

            // Filters: Blur & Brightness
            let videoFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
            
            // Background Zoom Transition
            if (transition === "zoom-in") {
              videoFilter += `,zoompan=z='min(zoom+0.0015,1.5)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`;
            } else if (transition === "zoom-out") {
              videoFilter += `,zoompan=z='max(1.5-0.0015*on,1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`;
            }

            if (parseFloat(bgBlur as string) > 0) videoFilter += `,boxblur=${bgBlur}`;
            if (parseFloat(bgBrightness as string) !== 1) videoFilter += `,eq=brightness=${parseFloat(bgBrightness as string) - 1}`;
            videoFilter += `[bg];`;

            // Text Animations
            let textOverlay = `overlay=0:0`;
            if (transition === "slide-up") {
              textOverlay = `overlay=0:'if(lt(t,1),H-t*H/1,0)'`;
            } else if (transition === "slide-down") {
              textOverlay = `overlay=0:'if(lt(t,1),-H+t*H/1,0)'`;
            } else if (transition === "slide-left") {
              textOverlay = `overlay='if(lt(t,1),W-t*W/1,0)':0`;
            } else if (transition === "slide-right") {
              textOverlay = `overlay='if(lt(t,1),-W+t*W/1,0)':0`;
            } else if (transition === "fade") {
              videoFilter += `[1:v]format=yuva420p,fade=in:st=0:d=1[txt_faded];`;
              textOverlay = `overlay=0:0`;
            }

            videoFilter += `[bg]${transition === 'fade' ? '[txt_faded]' : '[1:v]'} ${textOverlay}[v_text]`;
            
            let lastV = "[v_text]";

            if (ornamentIndex !== -1) {
              videoFilter += `;[${ornamentIndex}:v]scale=${width}:${height}[orn];${lastV}[orn]overlay=0:0[v_orn]`;
              lastV = "[v_orn]";
            }

            if (particleIndex !== -1) {
              // Particle overlay with screen/addition mode if possible, or just low opacity
              videoFilter += `;[${particleIndex}:v]scale=${width}:${height},format=rgba,colorchannelmixer=aa=0.4[part];${lastV}[part]overlay=0:0[v_part]`;
              lastV = "[v_part]";
            }

            if (watermarkIndex !== -1) {
              videoFilter += `;[${watermarkIndex}:v]scale=150:-2[wm];${lastV}[wm]overlay=50:50[v]`;
            } else {
              videoFilter += `;${lastV}format=yuv420p[v]`;
            }

            cmd.complexFilter(videoFilter)
              .outputOptions([
                "-map [v]",
                `-map ${audioInputIndex}:a`,
                "-c:v libx264",
                "-preset ultrafast",
                "-pix_fmt yuv420p",
                "-r 30",
                "-g 60",
                "-c:a aac",
                "-ar 44100",
                "-ac 2",
                "-shortest",
                `-t ${duration}`
              ])
              .on("end", () => resolve())
              .on("error", (err, stdout, stderr) => {
                console.error(`FFmpeg error for ayah ${i}:`, stderr);
                reject(new Error(`FFmpeg error for ayah ${i}: ${err.message}`));
              })
              .save(ayahVideoPath);
          });
          ayahVideos[i] = ayahVideoPath;
          updateJob("معالجة مقاطع الآيات", 50 + Math.round((i / verses.length) * 20));
        } catch (e) {
          console.error(`Failed to process ayah ${i}, skipping. Error:`, e);
        }
      };

      const workers = Array(concurrencyLimit).fill(null).map(async () => {
        while (queue.length > 0) {
          const i = queue.shift();
          if (i !== undefined) await processAyah(i);
        }
      });
      await Promise.all(workers);

      // 5. Apply Nature Sounds (Parallel)
      updateJob("إضافة المؤثرات الصوتية", 80);
      const finalAyahVideos: string[] = new Array(ayahVideos.length);
      const natureQueue = [...Array(ayahVideos.length).keys()];

      const processNature = async (i: number) => {
        const v = ayahVideos[i];
        if (!v) return; // Skip if ayah was skipped

        const withNaturePath = path.join(jobDir, `ayah_nature_${i}.mp4`);
        const natureSoundPath = path.join(assetsDir, `nature_${natureSound}.mp3`);
        
        if (natureSound !== "none" && fs.existsSync(natureSoundPath)) {
          await new Promise<void>((resolve, reject) => {
            ffmpeg()
              .input(v)
              .input(natureSoundPath)
              .inputOptions(["-stream_loop -1"])
              .complexFilter([
                `[0:a]volume=${reciterVolume}[reciter]`,
                `[1:a]volume=${natureVolume}[nature]`,
                "[reciter][nature]amix=inputs=2:duration=first[a]"
              ])
              .outputOptions(["-map 0:v", "-map [a]", "-c:v copy", "-c:a aac", "-ar 44100", "-ac 2", "-shortest"])
              .on("end", () => { finalAyahVideos[i] = withNaturePath; resolve(); })
              .on("error", (err) => { console.warn(`Nature sound error for ayah ${i}:`, err.message); finalAyahVideos[i] = v; resolve(); })
              .save(withNaturePath);
          });
        } else {
          // Just apply reciter volume if no nature sound
          if (parseFloat(reciterVolume as string) !== 1) {
            await new Promise<void>((resolve, reject) => {
              ffmpeg()
                .input(v)
                .audioFilters(`volume=${reciterVolume}`)
                .outputOptions(["-c:v copy", "-c:a aac"])
                .on("end", () => { finalAyahVideos[i] = withNaturePath; resolve(); })
                .on("error", () => { finalAyahVideos[i] = v; resolve(); })
                .save(withNaturePath);
            });
          } else {
            finalAyahVideos[i] = v;
          }
        }
      };

      const natureWorkers = Array(concurrencyLimit).fill(null).map(async () => {
        while (natureQueue.length > 0) {
          const i = natureQueue.shift();
          if (i !== undefined) await processNature(i);
        }
      });
      await Promise.all(natureWorkers);

      // 6. Concat all ayah videos
      updateJob("الدمج النهائي", 90);
      const concatFile = path.join(jobDir, "concat.txt");
      const validVideos = finalAyahVideos.filter(v => v && fs.existsSync(v));
      console.log(`Concatenating ${validVideos.length} videos out of ${verses.length} requested.`);
      if (validVideos.length === 0) {
        console.error("No valid videos produced. ayahVideos:", ayahVideos, "finalAyahVideos:", finalAyahVideos);
        throw new Error("لم يتم إنتاج أي مقاطع فيديو صالحة للدمج. قد يكون ذلك بسبب فشل تحميل جميع الملفات الصوتية أو فشل معالجة جميع الآيات.");
      }

      const concatContent = validVideos.map(v => `file '${v.replace(/'/g, "'\\''")}'`).join("\n");
      fs.writeFileSync(concatFile, concatContent);

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatFile)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions(["-c copy", "-movflags +faststart"])
          .on("end", () => resolve())
          .on("error", (err, stdout, stderr) => {
            console.error("FFmpeg concat error:", stderr);
            ffmpeg().input(concatFile).inputOptions(["-f concat", "-safe 0"]).outputOptions(["-c:v libx264", "-preset ultrafast", "-c:a aac", "-movflags +faststart"]).on("end", () => resolve()).on("error", (err2) => reject(new Error(`فشل دمج المقاطع: ${err2.message}`))).save(outputPath);
          })
          .save(outputPath);
      });

      updateJob("تم الانتهاء", 100, undefined, `/outputs/${outputFileName}`);
      console.log("Generation complete!");

      // Send to Telegram if requested
      if (telegramUserId) {
        try {
          console.log(`Sending video to Telegram user: ${telegramUserId}`);
          const botToken = "6176214063:AAEpiPoT1cnQNvNUvTtJ_EnxVCmdcuNneKI";
          const telegramUrl = `https://api.telegram.org/bot${botToken}/sendVideo`;
          
          const form = new FormData();
          form.append("chat_id", telegramUserId);
          form.append("caption", "تم إنشاء الفيديو القرآني الخاص بك بنجاح! ✨");
          form.append("video", fs.createReadStream(outputPath));

          await axios.post(telegramUrl, form, {
            headers: {
              ...form.getHeaders()
            }
          });
          console.log("Video sent to Telegram successfully.");
        } catch (teleErr: any) {
          console.error("Failed to send video to Telegram:", teleErr.response?.data || teleErr.message);
        }
      }

      cleanup();
    } catch (error: any) {
      console.error("Generation failed:", error);
      updateJob("failed", 0, error.message || "فشل إنشاء الفيديو");
      cleanup();
    }
  })();

  res.json({ jobId });
});

// Serve static files with no-cache headers for outputs
app.use("/outputs", express.static(outputsDir, {
  setHeaders: (res, path) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    if (path.endsWith(".mp4")) {
      res.set("Content-Type", "video/mp4");
      const filename = path.split("/").pop();
      res.set("Content-Disposition", `attachment; filename="${filename}"`);
    }
  }
}));
app.use("/uploads", express.static(uploadsDir));

async function startServer() {
  await setupFont();
  await setupNatureSounds();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Error handler for multer and other errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `خطأ في رفع الملفات: ${err.message}` });
    }
    res.status(500).json({ error: "حدث خطأ داخلي في الخادم" });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started at ${new Date().toISOString()}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.timeout = 1800000; // 30 minutes timeout for long video generation
}

if (process.env.NODE_ENV !== "production" || !isVercel) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
  });
}

export default app;
