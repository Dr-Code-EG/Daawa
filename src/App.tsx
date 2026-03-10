import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Settings, 
  Play, 
  Download, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Music,
  Image as ImageIcon,
  Type,
  Monitor,
  Smartphone,
  Square,
  Sparkles,
  Wind,
  CloudRain,
  Bird,
  Volume2,
  Languages,
  Layout,
  Layers,
  Palette
} from "lucide-react";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

// Particles Component
const Particles = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

interface Surah {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
}

interface Reciter {
  id: number;
  reciter_name: string;
  style: string;
}

const ASPECT_RATIOS = [
  { id: "9:16", name: "تيك توك/ريلز", icon: Smartphone },
  { id: "16:9", name: "يوتيوب", icon: Monitor },
  { id: "1:1", name: "إنستغرام", icon: Square },
  { id: "4:5", name: "فيسبوك", icon: Square },
  { id: "2:3", name: "بينتريست", icon: Smartphone },
];

const FONT_FAMILIES = [
  { id: "Amiri", name: "خط أميري" },
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "إنستغرام" },
  { id: "tiktok", name: "تيك توك" },
  { id: "youtube", name: "يوتيوب" },
  { id: "facebook", name: "فيسبوك" },
  { id: "twitter", name: "تويتر (X)" },
];

const TEMPLATES = [
  { id: "modern", name: "عصري", description: "خطوط بسيطة وخلفيات هادئة", settings: { fontSize: 50, fontColor: "#ffffff", fontBgColor: "rgba(0,0,0,0.4)", textShadow: "small", transition: "fade" } },
  { id: "classic", name: "كلاسيكي", description: "خطوط عثمانية وزخارف إسلامية", settings: { fontSize: 60, fontColor: "#f3f4f6", fontBgColor: "rgba(20,83,45,0.6)", textShadow: "large", transition: "none" } },
  { id: "cinematic", name: "سينمائي", description: "تأثيرات ضوئية وتركيز عالي", settings: { fontSize: 45, fontColor: "#ffffff", fontBgColor: "transparent", textShadow: "large", transition: "zoom-in", bgBlur: 2, bgBrightness: 0.8 } },
  { id: "minimal", name: "بسيط", description: "تركيز كامل على النص القرآني", settings: { fontSize: 40, fontColor: "#ffffff", fontBgColor: "transparent", textShadow: "small", transition: "fade", textOpacity: 0.9 } },
  { id: "nature", name: "طبيعة", description: "ألوان ترابية وتجربة مريحة", settings: { fontSize: 55, fontColor: "#ecfdf5", fontBgColor: "rgba(6,78,59,0.4)", textShadow: "small", transition: "slide-up", natureSound: "birds" } },
  { id: "dark", name: "ليلي", description: "تباين عالي للقراءة الليلية", settings: { fontSize: 50, fontColor: "#ffffff", fontBgColor: "#000000", fontBgOpacity: 0.8, textShadow: "none", transition: "fade" } },
];

const NATURE_SOUNDS = [
  { id: "none", name: "بدون", icon: Volume2 },
  { id: "rain", name: "مطر خفيف", icon: CloudRain },
  { id: "birds", name: "عصافير", icon: Bird },
  { id: "wind", name: "هواء هادئ", icon: Wind },
];

const ORNAMENTS = [
  { id: "none", name: "بدون", preview: "https://picsum.photos/seed/none/200/200?grayscale" },
  { id: "frame1", name: "إطار ذهبي", preview: "https://picsum.photos/seed/frame1/200/200", url: "https://i.ibb.co/L6vV5vK/ornament1.png" },
  { id: "frame2", name: "زخرفة إسلامية", preview: "https://picsum.photos/seed/frame2/200/200", url: "https://i.ibb.co/vXzYqXz/ornament2.png" },
  { id: "corner1", name: "زخرفة زوايا", preview: "https://picsum.photos/seed/corner1/200/200", url: "https://i.ibb.co/mS0Yy0Y/ornament3.png" },
];

const PARTICLE_OVERLAYS = [
  { id: "none", name: "بدون", preview: "https://picsum.photos/seed/none2/200/200?grayscale" },
  { id: "dust", name: "ذرات غبار", preview: "https://picsum.photos/seed/dust/200/200?blur=2", url: "https://assets.mixkit.co/videos/preview/mixkit-dust-particles-flying-in-the-air-9125-large.mp4" },
  { id: "bokeh", name: "أضواء بوكيه", preview: "https://picsum.photos/seed/bokeh/200/200?blur=5", url: "https://assets.mixkit.co/videos/preview/mixkit-white-bokeh-particles-on-black-background-4417-large.mp4" },
  { id: "light-leaks", name: "تسريب ضوئي", preview: "https://picsum.photos/seed/light/200/200?blur=10", url: "https://assets.mixkit.co/videos/preview/mixkit-warm-light-leaks-on-black-background-4418-large.mp4" },
];

const TRANSLATION_LANGUAGES = [
  { id: "131", name: "الإنجليزية (Sahih International)" },
  { id: "31", name: "الفرنسية (Hamidullah)" },
  { id: "158", name: "الأوردو (Jalandhari)" },
  { id: "139", name: "الإسبانية (Garcia)" },
  { id: "234", name: "الألمانية (Bubenheim)" },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Form State
  const [selectedSurah, setSelectedSurah] = useState<number | "">("");
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState<number | "">("");
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [backgroundFiles, setBackgroundFiles] = useState<{ file: File | null, preview: string | null, type: "image" | "video", startAyah: number, endAyah: number }[]>([]);
  const [natureSound, setNatureSound] = useState("none");

  // Advanced Settings
  const [fontSize, setFontSize] = useState(50);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Amiri");
  const [fontPosition, setFontPosition] = useState("center");
  const [fontBgColor, setFontBgColor] = useState("transparent");
  const [fontBgOpacity, setFontBgOpacity] = useState(0.5);
  const [fontBgPadding, setFontBgPadding] = useState(40);
  const [fontBgBorderRadius, setFontBgBorderRadius] = useState(12);
  const [fontBgBorderColor, setFontBgBorderColor] = useState("transparent");
  const [fontBgBorderWidth, setFontBgBorderWidth] = useState(0);
  const [showSocial, setShowSocial] = useState(false);
  const [socialHandle, setSocialHandle] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("instagram");
  const [socialPosition, setSocialPosition] = useState("bottom-right");
  const [telegramUserId, setTelegramUserId] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState("131");
  const [translationFontSize, setTranslationFontSize] = useState(30);
  const [translationFontColor, setTranslationFontColor] = useState("#cccccc");
  const [selectedOrnament, setSelectedOrnament] = useState("none");
  const [selectedParticle, setSelectedParticle] = useState("none");
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const [customFontFile, setCustomFontFile] = useState<File | null>(null);

  // New Advanced Settings
  const [textShadow, setTextShadow] = useState("none");
  const [textOpacity, setTextOpacity] = useState(1);
  const [bgBlur, setBgBlur] = useState(0);
  const [bgBrightness, setBgBrightness] = useState(1);
  const [reciterVolume, setReciterVolume] = useState(1);
  const [natureVolume, setNatureVolume] = useState(0.15);
  const [transition, setTransition] = useState("none");

  const [previewVerse, setPreviewVerse] = useState<string>("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");

  // Load settings from LocalStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("quran_studio_settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSocialHandle(settings.socialHandle || "");
      setSocialPlatform(settings.socialPlatform || "instagram");
      setFontFamily(settings.fontFamily || "Amiri");
      setFontColor(settings.fontColor || "#ffffff");
    }
  }, []);

  // Save settings to LocalStorage
  useEffect(() => {
    const settings = {
      socialHandle,
      socialPlatform,
      fontFamily,
      fontColor,
    };
    localStorage.setItem("quran_studio_settings", JSON.stringify(settings));
  }, [socialHandle, socialPlatform, fontFamily, fontColor]);

  // Apply template defaults
  useEffect(() => {
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (template && template.settings) {
      const s = template.settings;
      if (s.fontSize) setFontSize(s.fontSize);
      if (s.fontColor) setFontColor(s.fontColor);
      if (s.fontBgColor) setFontBgColor(s.fontBgColor);
      if (s.fontBgOpacity) setFontBgOpacity(s.fontBgOpacity);
      if (s.textShadow) setTextShadow(s.textShadow);
      if (s.transition) setTransition(s.transition);
      if (s.bgBlur !== undefined) setBgBlur(s.bgBlur);
      if (s.bgBrightness !== undefined) setBgBrightness(s.bgBrightness);
      if (s.textOpacity !== undefined) setTextOpacity(s.textOpacity);
      if (s.natureSound) setNatureSound(s.natureSound);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [surahsRes, recitersRes] = await Promise.all([
          axios.get("/api/surahs", { timeout: 20000 }),
          axios.get("/api/reciters", { timeout: 20000 })
        ]);
        setSurahs(surahsRes.data);
        setReciters(recitersRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPreviewVerse = async () => {
      if (!selectedSurah) return;
      try {
        const res = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${selectedSurah}`, { timeout: 15000 });
        const verse = res.data.verses.find((v: any) => v.verse_key === `${selectedSurah}:${startAyah}`);
        if (verse) setPreviewVerse(verse.text_uthmani);
      } catch (e) {
        console.error("Failed to fetch preview verse", e);
      }
    };
    fetchPreviewVerse();
  }, [selectedSurah, startAyah]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files as FileList).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" as const : "image" as const,
        startAyah: startAyah,
        endAyah: endAyah
      }));
      setBackgroundFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeBackground = (index: number) => {
    setBackgroundFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateBackgroundRange = (index: number, field: "startAyah" | "endAyah", value: number) => {
    setBackgroundFiles(prev => prev.map((bg, i) => i === index ? { ...bg, [field]: value } : bg));
  };

  const handleGenerateAIBackground = async (mode: "single" | "all" = "single") => {
    if (!selectedSurah) return;
    setGeneratingAI(true);
    try {
      const surah = surahs.find(s => s.id === selectedSurah);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const ayahsToGenerate = mode === "all" 
        ? Array.from({ length: endAyah - startAyah + 1 }, (_, i) => startAyah + i)
        : [startAyah];

      // Fetch verses data if needed for specific prompts
      let versesData: any[] = [];
      if (mode === "all") {
        const res = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${selectedSurah}&per_page=300`);
        versesData = res.data.verses.filter((v: any) => {
          const num = parseInt(v.verse_key.split(":")[1]);
          return num >= startAyah && num <= endAyah;
        });
      }

      for (const ayahNum of ayahsToGenerate) {
        const verseText = versesData.find((v: any) => parseInt(v.verse_key.split(":")[1]) === ayahNum)?.text_uthmani || "";
        
        const promptResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Create a cinematic, spiritual, and peaceful image generation prompt for an Islamic background based on Surah ${surah?.name_simple} ${mode === "all" ? `and the meaning of this verse: "${verseText}"` : ""}. The prompt should focus on nature, light, and tranquility. No human figures. The output should be ONLY the prompt text.`
        });
        
        const prompt = promptResponse.text || "Peaceful Islamic nature background, cinematic lighting, spiritual atmosphere";
        
        // Map selected ratio to supported image ratios
        let imageRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
        if (selectedRatio === "9:16") imageRatio = "9:16";
        else if (selectedRatio === "16:9") imageRatio = "16:9";
        else if (selectedRatio === "1:1") imageRatio = "1:1";
        else if (selectedRatio === "4:5") imageRatio = "3:4"; // Closest
        else if (selectedRatio === "2:3") imageRatio = "9:16"; // Closest

        const imageResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: imageRatio } }
        });

        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64Data}`;
            
            // Convert base64 to File
            const res = await fetch(imageUrl);
            const blob = await res.blob() as Blob;
            const file = new File([blob], `ai_background_${ayahNum}.png`, { type: "image/png" });
            
            const newBg = {
              file,
              preview: imageUrl,
              type: "image" as const,
              startAyah: ayahNum,
              endAyah: mode === "all" ? ayahNum : endAyah
            };
            setBackgroundFiles(prev => [...prev, newBg]);
          }
        }
        
        // Small delay between generations to avoid rate limiting
        if (mode === "all" && ayahsToGenerate.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("فشل توليد الخلفية بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setWatermarkFile(file);
      setWatermarkPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!selectedSurah || !selectedReciter) {
      setGenerationError("يرجى اختيار السورة والقارئ أولاً");
      return;
    }
    if (backgroundFiles.length === 0) {
      setGenerationError("يرجى إضافة خلفية واحدة على الأقل");
      return;
    }

    setGenerating(true);
    setGenerationStatus("جاري بدء العملية...");
    setGenerationProgress(0);
    setGenerationError(null);
    setVideoUrl(null);

    const formData = new FormData();
    formData.append("surahId", selectedSurah.toString());
    formData.append("startAyah", startAyah.toString());
    formData.append("endAyah", endAyah.toString());
    formData.append("reciterId", selectedReciter.toString());
    formData.append("ratio", selectedRatio);
    formData.append("fontSize", fontSize.toString());
    formData.append("fontColor", fontColor);
    formData.append("fontFamily", fontFamily);
    formData.append("fontPosition", fontPosition);
    formData.append("fontBgColor", fontBgColor);
    formData.append("fontBgOpacity", fontBgOpacity.toString());
    formData.append("fontBgPadding", fontBgPadding.toString());
    formData.append("fontBgBorderRadius", fontBgBorderRadius.toString());
    formData.append("fontBgBorderColor", fontBgBorderColor);
    formData.append("fontBgBorderWidth", fontBgBorderWidth.toString());
    formData.append("showSocial", showSocial.toString());
    formData.append("socialHandle", socialHandle);
    formData.append("socialPlatform", socialPlatform);
    formData.append("socialPosition", socialPosition);
    formData.append("telegramUserId", telegramUserId);
    formData.append("natureSound", natureSound);
    formData.append("showTranslation", showTranslation.toString());
    formData.append("translationLanguage", translationLanguage);
    formData.append("translationFontSize", translationFontSize.toString());
    formData.append("translationFontColor", translationFontColor);
    formData.append("selectedOrnament", selectedOrnament);
    formData.append("selectedParticle", selectedParticle);
    formData.append("showProgressBar", showProgressBar.toString());
    formData.append("template", selectedTemplate);
    
    // New parameters
    formData.append("textShadow", textShadow);
    formData.append("textOpacity", textOpacity.toString());
    formData.append("bgBlur", bgBlur.toString());
    formData.append("bgBrightness", bgBrightness.toString());
    formData.append("reciterVolume", reciterVolume.toString());
    formData.append("natureVolume", natureVolume.toString());
    formData.append("transition", transition);

    backgroundFiles.forEach((bg, index) => {
      if (bg.file) {
        formData.append(`backgrounds`, bg.file);
        formData.append(`backgroundRanges`, JSON.stringify({ start: bg.startAyah, end: bg.endAyah }));
      }
    });
    if (watermarkFile) {
      formData.append("watermark", watermarkFile);
    }
    if (customFontFile) {
      formData.append("customFont", customFontFile);
    }

    try {
      const response = await axios.post("/api/generate", formData, {
        timeout: 600000 // 10 minutes for upload
      });
      const { jobId } = response.data;
      setCurrentJobId(jobId);
      pollJobStatus(jobId);
    } catch (error: any) {
      console.error("Generation failed", error);
      let msg = error.response?.data?.error || error.message;
      if (error.code === 'ECONNABORTED') msg = "انتهت مهلة الطلب. قد يكون حجم الملفات كبيراً جداً أو اتصال الإنترنت ضعيفاً.";
      if (error.message === 'Network Error') msg = "خطأ في الاتصال بالشبكة. يرجى التأكد من استقرار الإنترنت ومحاولة رفع ملفات أصغر حجماً.";
      setGenerationError(msg);
      setGenerating(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    let errorCount = 0;
    let consecutive404Count = 0;
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/job-status/${jobId}`, { timeout: 15000 });
        const { status, progress, error, videoUrl, steps } = response.data;
        
        errorCount = 0; // Reset error count on success
        consecutive404Count = 0; // Reset 404 count on success
        setGenerationStatus(status);
        setGenerationProgress(progress);
        setGenerationSteps(steps || []);

        if (status === "تم الانتهاء" || status === "completed") {
          clearInterval(interval);
          const absoluteUrl = window.location.origin + videoUrl;
          setVideoUrl(absoluteUrl);
          setStep(4);
          setGenerating(false);
        } else if (status === "failed") {
          clearInterval(interval);
          setGenerationError(error || "فشل إنشاء الفيديو");
          setGenerating(false);
        }
      } catch (e: any) {
        console.error("Polling failed", e);
        
        if (e.response?.status === 404) {
          consecutive404Count++;
          console.warn(`Job not found (404). Retry count: ${consecutive404Count}`);
          
          if (consecutive404Count > 5) { // Allow up to 5 retries for 404 (approx 10 seconds)
            clearInterval(interval);
            setGenerationError("فقد الاتصال بالعملية. قد يكون الخادم قد أعاد التشغيل أو أن العملية لم تعد موجودة. يرجى المحاولة مرة أخرى.");
            setGenerating(false);
          }
          // Otherwise, just wait for the next interval
        } else {
          errorCount++;
          if (errorCount > 30) { // Stop after 30 consecutive network errors (60 seconds)
            clearInterval(interval);
            setGenerationError("فشل الاتصال بالخادم بشكل متكرر. يرجى التحقق من اتصالك بالإنترنت.");
            setGenerating(false);
          }
        }
      }
    }, 2000);
  };

  const currentSurah = surahs.find(s => s.id === selectedSurah);

  return (
    <div className="min-h-screen bg-[#fdfcf8] text-zinc-900 font-sans selection:bg-emerald-500/30 islamic-pattern" dir="rtl">
      <Particles />
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/30 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block p-3 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6"
          >
            <Music className="w-8 h-8 text-emerald-700" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-light tracking-tight mb-4 text-emerald-900"
          >
            دعوة <span className="font-serif italic text-emerald-700">للقران الكريم</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-600 text-lg max-w-md mx-auto"
          >
            أنشئ فيديوهات قرآنية احترافية لمنصات التواصل الاجتماعي الخاصة بك في دقائق.
          </motion.p>
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12 gap-4 flex-row-reverse">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`h-1.5 w-16 rounded-full transition-all duration-500 ${
                step >= i ? "bg-emerald-700" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {/* Main Content Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Controls */}
          <main className="lg:col-span-7 glass-card p-8">
            <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Type className="w-4 h-4" /> اختر السورة والآيات
                  </label>
                  <select 
                    value={selectedSurah}
                    onChange={(e) => setSelectedSurah(Number(e.target.value))}
                    className="input-field text-lg"
                  >
                    <option value="">اختر سورة...</option>
                    {surahs.map(s => (
                      <option key={s.id} value={s.id}>{s.id}. {s.name_arabic}</option>
                    ))}
                  </select>

                  {selectedSurah && currentSurah && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase">من آية</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={currentSurah.verses_count}
                          value={startAyah}
                          onChange={(e) => setStartAyah(Number(e.target.value))}
                          className="input-field"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase">إلى آية</label>
                        <input 
                          type="number" 
                          min={startAyah} 
                          max={currentSurah.verses_count}
                          value={endAyah}
                          onChange={(e) => setEndAyah(Number(e.target.value))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Music className="w-4 h-4" /> اختر القارئ
                  </label>
                  <select 
                    value={selectedReciter}
                    onChange={(e) => setSelectedReciter(Number(e.target.value))}
                    className="input-field text-lg"
                  >
                    <option value="">اختر قارئاً...</option>
                    {reciters.map(r => (
                      <option key={r.id} value={r.id}>
                        {(r as any).translated_name?.name || r.reciter_name} {r.style ? `(${r.style})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={!selectedSurah || !selectedReciter}
                  onClick={() => setStep(2)}
                  className="w-full btn-primary"
                >
                  الخطوة التالية <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4" /> خلفيات الفيديو (متعددة)
                    </label>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleGenerateAIBackground("single")}
                        disabled={generatingAI || !selectedSurah}
                        className="flex items-center justify-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
                      >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        توليد خلفية واحدة للمدى
                      </button>
                      <button
                        onClick={() => handleGenerateAIBackground("all")}
                        disabled={generatingAI || !selectedSurah}
                        className="flex items-center justify-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-100 hover:bg-amber-100 transition-all disabled:opacity-50"
                      >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                        توليد خلفية لكل آية (تلقائي)
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {backgroundFiles.map((bg, idx) => (
                      <div key={idx} className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200">
                          {bg.type === "video" ? (
                            <video src={bg.preview!} className="w-full h-full object-cover" />
                          ) : (
                            <img src={bg.preview!} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-zinc-500">من آية:</span>
                            <input 
                              type="number" 
                              value={bg.startAyah} 
                              onChange={(e) => updateBackgroundRange(idx, "startAyah", Number(e.target.value))}
                              className="w-16 bg-white border border-emerald-100 rounded px-2 py-1 text-xs"
                            />
                            <span className="text-[10px] text-zinc-500">إلى:</span>
                            <input 
                              type="number" 
                              value={bg.endAyah} 
                              onChange={(e) => updateBackgroundRange(idx, "endAyah", Number(e.target.value))}
                              className="w-16 bg-white border border-emerald-100 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <button 
                            onClick={() => removeBackground(idx)}
                            className="text-[10px] text-red-600 hover:text-red-700 transition-colors"
                          >
                            حذف الخلفية
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => document.getElementById("bg-upload")?.click()}
                      className="border-2 border-dashed border-emerald-100 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all cursor-pointer group bg-white/50"
                    >
                      <input 
                        id="bg-upload" 
                        type="file" 
                        hidden 
                        multiple
                        accept="image/*,video/*" 
                        onChange={handleFileChange} 
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-emerald-700 transition-colors" />
                        <p className="text-xs text-zinc-500">أضف خلفيات إضافية وخصصها لآيات معينة</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Volume2 className="w-4 h-4" /> أصوات الطبيعة في الخلفية
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {NATURE_SOUNDS.map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => setNatureSound(sound.id)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                          natureSound === sound.id 
                            ? "bg-emerald-700 text-white border-emerald-700" 
                            : "bg-white border-emerald-100 text-zinc-500 hover:border-emerald-300"
                        }`}
                      >
                        <sound.icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium text-center">{sound.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary"
                  >
                    رجوع <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-[2] btn-primary"
                  >
                    الخطوة التالية <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Templates */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Layout className="w-4 h-4" /> القوالب الجاهزة
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-xl border transition-all text-right group ${
                          selectedTemplate === template.id 
                            ? "bg-emerald-700 text-white border-emerald-700" 
                            : "bg-white border-emerald-100 text-zinc-600 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{template.name}</span>
                          <CheckCircle2 className={`w-4 h-4 ${selectedTemplate === template.id ? "opacity-100" : "opacity-0"}`} />
                        </div>
                        <p className={`text-[10px] ${selectedTemplate === template.id ? "text-emerald-100" : "text-zinc-500"}`}>{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Monitor className="w-4 h-4" /> مقاس الفيديو
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => setSelectedRatio(ratio.id)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                          selectedRatio === ratio.id 
                            ? "bg-emerald-700 text-white border-emerald-700" 
                            : "bg-white border-emerald-100 text-zinc-500 hover:border-emerald-300"
                        }`}
                      >
                        <ratio.icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium text-center">{ratio.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Video Editor Settings */}
                <div className="space-y-6 pt-4 border-t border-emerald-100">
                  <h3 className="text-emerald-900 font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" /> إعدادات المحرر المتقدمة
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Text Styling */}
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-emerald-800 uppercase">مظهر النص</label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">شفافية النص</span>
                          <input 
                            type="range" min="0.1" max="1" step="0.1" 
                            value={textOpacity} onChange={(e) => setTextOpacity(Number(e.target.value))}
                            className="w-24 accent-emerald-700"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">ظل النص</span>
                          <select 
                            value={textShadow} onChange={(e) => setTextShadow(e.target.value)}
                            className="text-[10px] bg-white border border-emerald-100 rounded px-2 py-1"
                          >
                            <option value="none">بدون ظل</option>
                            <option value="small">ظل خفيف</option>
                            <option value="large">ظل قوي</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Background Effects */}
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-emerald-800 uppercase">تأثيرات الخلفية</label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">تغبيش الخلفية (Blur)</span>
                          <input 
                            type="range" min="0" max="20" step="1" 
                            value={bgBlur} onChange={(e) => setBgBlur(Number(e.target.value))}
                            className="w-24 accent-emerald-700"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">سطوع الخلفية</span>
                          <input 
                            type="range" min="0.1" max="1.5" step="0.1" 
                            value={bgBrightness} onChange={(e) => setBgBrightness(Number(e.target.value))}
                            className="w-24 accent-emerald-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Audio Mixing */}
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-emerald-800 uppercase">هندسة الصوت</label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">حجم صوت القارئ</span>
                          <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={reciterVolume} onChange={(e) => setReciterVolume(Number(e.target.value))}
                            className="w-24 accent-emerald-700"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">حجم صوت الطبيعة</span>
                          <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={natureVolume} onChange={(e) => setNatureVolume(Number(e.target.value))}
                            className="w-24 accent-emerald-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transitions */}
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-emerald-800 uppercase">الانتقالات</label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500">نوع الانتقال</span>
                          <select 
                            value={transition} onChange={(e) => setTransition(e.target.value)}
                            className="text-[10px] bg-white border border-emerald-100 rounded px-2 py-1"
                          >
                            <option value="none">بدون (قطع مباشر)</option>
                            <option value="fade">تلاشي (Fade)</option>
                            <option value="slide-up">انزلاق للأعلى</option>
                            <option value="slide-down">انزلاق للأسفل</option>
                            <option value="slide-left">انزلاق لليسار</option>
                            <option value="slide-right">انزلاق لليمين</option>
                            <option value="zoom-in">تكبير تدريجي (Zoom In)</option>
                            <option value="zoom-out">تصغير تدريجي (Zoom Out)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Settings */}
                <div className="space-y-6 border-t border-emerald-100 pt-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                    <Type className="w-4 h-4" /> إعدادات الخط
                  </label>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">نوع الخط</label>
                      <div className="flex flex-col gap-2">
                        <div className={`input-field flex items-center justify-between ${!customFontFile ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50'}`}>
                          <span>خط أميري (افتراضي)</span>
                          {!customFontFile && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <label className={`input-field flex items-center justify-between cursor-pointer transition-all ${customFontFile ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-zinc-50'}`}>
                          <span className="truncate">{customFontFile ? customFontFile.name : "رفع خط مخصص (.ttf)"}</span>
                          <input 
                            type="file" 
                            accept=".ttf,.otf" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setCustomFontFile(file);
                            }}
                          />
                          {customFontFile ? (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setCustomFontFile(null);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              إلغاء
                            </button>
                          ) : (
                            <Upload className="w-4 h-4 text-zinc-400" />
                          )}
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">حجم الخط ({fontSize}px)</label>
                      <input 
                        type="range" min="20" max="120" step="2"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">لون الخط</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="w-12 h-10 bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="flex-1 input-field text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">المكان</label>
                      <div className="flex bg-zinc-100 rounded-xl p-1 border border-emerald-100">
                        {[
                          { id: "top", name: "أعلى" },
                          { id: "center", name: "منتصف" },
                          { id: "bottom", name: "أسفل" }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            onClick={() => setFontPosition(pos.id)}
                            className={`flex-1 py-1 text-xs rounded-lg transition-all ${
                              fontPosition === pos.id ? "bg-emerald-700 text-white" : "text-zinc-500 hover:text-zinc-700"
                            }`}
                          >
                            {pos.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">صندوق الخلفية</label>
                      <select 
                        value={fontBgColor}
                        onChange={(e) => setFontBgColor(e.target.value)}
                        className="input-field"
                      >
                        <option value="transparent">بدون</option>
                        <option value="black">أسود</option>
                        <option value="white">أبيض</option>
                        <option value="#064e3b">أخضر داكن</option>
                        <option value="#451a03">كهرماني داكن</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase">خيارات إضافية</label>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setShowTranslation(!showTranslation)}
                          className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${showTranslation ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-emerald-100 text-zinc-500"}`}
                        >
                          <span className="text-xs">إظهار الترجمة</span>
                          <Languages className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowProgressBar(!showProgressBar)}
                          className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${showProgressBar ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-emerald-100 text-zinc-500"}`}
                        >
                          <span className="text-xs">شريط التقدم</span>
                          <Layers className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {showTranslation && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 pt-4 border-t border-emerald-50"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">لغة الترجمة</label>
                          <select 
                            value={translationLanguage}
                            onChange={(e) => setTranslationLanguage(e.target.value)}
                            className="input-field"
                          >
                            {TRANSLATION_LANGUAGES.map(lang => (
                              <option key={lang.id} value={lang.id}>{lang.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">حجم خط الترجمة ({translationFontSize}px)</label>
                          <input 
                            type="range" min="10" max="60" step="2"
                            value={translationFontSize}
                            onChange={(e) => setTranslationFontSize(Number(e.target.value))}
                            className="w-full accent-emerald-700"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">لون خط الترجمة</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={translationFontColor}
                              onChange={(e) => setTranslationFontColor(e.target.value)}
                              className="w-12 h-10 bg-transparent border-none cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={translationFontColor}
                              onChange={(e) => setTranslationFontColor(e.target.value)}
                              className="flex-1 input-field text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Ornaments Selection */}
                  <div className="space-y-4 pt-6 border-t border-emerald-100">
                    <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> الزخارف والإطارات الإسلامية
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {ORNAMENTS.map((orn) => (
                        <div key={orn.id} className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedOrnament(orn.id)}
                            className={`relative aspect-square rounded-xl border-2 transition-all overflow-hidden group ${
                              selectedOrnament === orn.id 
                                ? "border-emerald-600 ring-2 ring-emerald-500/20" 
                                : "border-emerald-100 hover:border-emerald-300"
                            }`}
                          >
                            <img src={orn.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {selectedOrnament === orn.id && (
                              <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                          <span className="text-[9px] text-center text-zinc-500 font-medium truncate">{orn.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Particle Overlays Selection */}
                  <div className="space-y-4 pt-6 border-t border-emerald-100">
                    <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                      <Layers className="w-4 h-4" /> تأثيرات الجسيمات والإضاءة
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {PARTICLE_OVERLAYS.map((part) => (
                        <div key={part.id} className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedParticle(part.id)}
                            className={`relative aspect-square rounded-xl border-2 transition-all overflow-hidden group ${
                              selectedParticle === part.id 
                                ? "border-emerald-600 ring-2 ring-emerald-500/20" 
                                : "border-emerald-100 hover:border-emerald-300"
                            }`}
                          >
                            <img src={part.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {selectedParticle === part.id && (
                              <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                          <span className="text-[9px] text-center text-zinc-500 font-medium truncate">{part.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {fontBgColor !== "transparent" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 pt-4 border-t border-emerald-50"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">شفافية الخلفية ({Math.round(fontBgOpacity * 100)}%)</label>
                          <input 
                            type="range" min="0" max="1" step="0.1"
                            value={fontBgOpacity}
                            onChange={(e) => setFontBgOpacity(Number(e.target.value))}
                            className="w-full accent-emerald-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">حواف الصندوق ({fontBgBorderRadius}px)</label>
                          <input 
                            type="range" min="0" max="100" step="1"
                            value={fontBgBorderRadius}
                            onChange={(e) => setFontBgBorderRadius(Number(e.target.value))}
                            className="w-full accent-emerald-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">حشو الصندوق (Padding: {fontBgPadding}px)</label>
                          <input 
                            type="range" min="0" max="100" step="5"
                            value={fontBgPadding}
                            onChange={(e) => setFontBgPadding(Number(e.target.value))}
                            className="w-full accent-emerald-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">سمك الإطار ({fontBgBorderWidth}px)</label>
                          <input 
                            type="range" min="0" max="20" step="1"
                            value={fontBgBorderWidth}
                            onChange={(e) => setFontBgBorderWidth(Number(e.target.value))}
                            className="w-full accent-emerald-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase">لون الإطار</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={fontBgBorderColor === "transparent" ? "#ffffff" : fontBgBorderColor}
                            onChange={(e) => setFontBgBorderColor(e.target.value)}
                            className="w-12 h-10 bg-transparent border-none cursor-pointer"
                          />
                          <button 
                            onClick={() => setFontBgBorderColor("transparent")}
                            className={`px-3 py-1 text-[10px] rounded-lg border ${fontBgBorderColor === "transparent" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-zinc-500 border-zinc-200"}`}
                          >
                            بدون إطار
                          </button>
                          <input 
                            type="text" 
                            value={fontBgBorderColor}
                            onChange={(e) => setFontBgBorderColor(e.target.value)}
                            className="flex-1 input-field text-sm"
                            placeholder="مثال: #ffffff"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Branding Settings */}
                <div className="space-y-6 border-t border-emerald-100 pt-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wider">
                      <Settings className="w-4 h-4" /> العلامة التجارية والتواصل
                    </label>
                    <button 
                      onClick={() => setShowSocial(!showSocial)}
                      className={`w-12 h-6 rounded-full transition-all relative ${showSocial ? "bg-emerald-700" : "bg-zinc-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showSocial ? "right-7" : "right-1"}`} />
                    </button>
                  </div>

                  {showSocial && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">المنصة</label>
                          <select 
                            value={socialPlatform}
                            onChange={(e) => setSocialPlatform(e.target.value)}
                            className="input-field"
                          >
                            {SOCIAL_PLATFORMS.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">اسم المستخدم</label>
                          <input 
                            type="text" 
                            placeholder="مثال: quran_studio"
                            value={socialHandle}
                            onChange={(e) => setSocialHandle(e.target.value)}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase flex justify-between">
                            معرف تيليجرام (اختياري)
                            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline">كيف أجد معرفي؟</a>
                          </label>
                          <input 
                            type="text" 
                            placeholder="مثال: 123456789"
                            value={telegramUserId}
                            onChange={(e) => setTelegramUserId(e.target.value)}
                            className="input-field"
                          />
                          <p className="text-[10px] text-zinc-400">سيتم إرسال الفيديو للبوت عند الانتهاء</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-500 uppercase">شعار مخصص (Watermark)</label>
                          <div 
                            onClick={() => document.getElementById("watermark-upload")?.click()}
                            className="border border-dashed border-emerald-100 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-all cursor-pointer group bg-white"
                          >
                            <input 
                              id="watermark-upload" 
                              type="file" 
                              hidden 
                              accept="image/*" 
                              onChange={handleWatermarkChange} 
                            />
                            {watermarkPreview ? (
                              <img src={watermarkPreview} alt="Logo" className="h-12 mx-auto object-contain" />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Upload className="w-4 h-4 text-zinc-400" />
                                <span className="text-[10px] text-zinc-500">رفع شعار</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 btn-secondary"
                  >
                    رجوع <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    disabled={generating}
                    onClick={handleGenerate}
                    className="flex-[2] btn-primary relative overflow-hidden"
                  >
                    {generating ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...
                        </div>
                        <span className="text-[10px] opacity-70 animate-pulse">{generationStatus}</span>
                      </div>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" /> إنشاء الفيديو
                      </>
                    )}
                  </button>
                </div>

                {generationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm text-center"
                  >
                    {generationError}
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-700" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-light text-emerald-900">الفيديو جاهز!</h2>
                  <p className="text-zinc-600">تم إنشاء الفيديو القرآني الخاص بك بنجاح.</p>
                </div>

                {videoUrl && (
                  <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl border border-emerald-100 bg-black">
                    <video 
                      key={videoUrl}
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                      style={{ 
                        aspectRatio: selectedRatio.replace(":", "/"),
                        maxHeight: "60vh"
                      }}
                      playsInline
                      preload="auto"
                    >
                      <source src={videoUrl} type="video/mp4" />
                      متصفحك لا يدعم تشغيل الفيديو.
                    </video>
                  </div>
                )}

                <div className="flex gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary"
                  >
                    إنشاء فيديو آخر
                  </button>
                  <a
                    href={videoUrl || "#"}
                    download={`quran_video_${currentJobId || 'result'}.mp4`}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> تحميل الفيديو
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Side: Real-time Preview */}
        <aside className="lg:col-span-5 sticky top-12">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
              <span className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <Play className="w-4 h-4" /> معاينة حقيقية
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div 
              className="relative bg-zinc-100 aspect-[9/16] w-full overflow-hidden shadow-inner"
              style={{ aspectRatio: selectedRatio.replace(":", "/") }}
            >
              {/* Background Preview */}
              {backgroundFiles.length > 0 ? (
                backgroundFiles[0].type === "video" ? (
                  <video 
                    src={backgroundFiles[0].preview!} 
                    autoPlay muted loop 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={backgroundFiles[0].preview!} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-zinc-900" />
              )}

              {/* Particle Overlay Preview */}
              {selectedParticle !== "none" && (
                <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
                  <img 
                    src={PARTICLE_OVERLAYS.find(p => p.id === selectedParticle)?.preview} 
                    className="w-full h-full object-cover blur-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Ornament Preview */}
              {selectedOrnament !== "none" && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <img 
                    src={ORNAMENTS.find(o => o.id === selectedOrnament)?.url} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Overlay Text */}
              <div className={`absolute inset-0 flex flex-col p-8 text-center pointer-events-none ${
                fontPosition === "top" ? "justify-start pt-20" : 
                fontPosition === "bottom" ? "justify-end pb-20" : 
                "justify-center"
              }`}>
                <motion.div
                  key={previewVerse}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    fontSize: `${fontSize * 0.8}px`,
                    color: fontColor,
                    fontFamily: fontFamily,
                    backgroundColor: fontBgColor === "transparent" ? "transparent" : `${fontBgColor}${Math.round(fontBgOpacity * 255).toString(16).padStart(2, '0')}`,
                    padding: fontBgColor === "transparent" ? "0" : `${fontBgPadding * 0.8}px`,
                    borderRadius: `${fontBgBorderRadius * 0.8}px`,
                    border: fontBgBorderColor !== "transparent" && fontBgBorderWidth > 0 ? `${fontBgBorderWidth * 0.8}px solid ${fontBgBorderColor}` : "none",
                    lineHeight: "1.6"
                  }}
                  className="font-arabic drop-shadow-lg"
                >
                  {previewVerse}
                  {showTranslation && (
                    <div 
                      style={{ 
                        fontSize: `${translationFontSize * 0.8}px`, 
                        color: translationFontColor,
                        marginTop: "10px",
                        fontFamily: "sans-serif",
                        direction: "ltr"
                      }}
                      className="opacity-80"
                    >
                      {selectedSurah ? "Bismillahir Rahmanir Rahim" : "Translation will appear here"}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Social Branding Preview */}
              {showSocial && socialHandle && (
                <div className={`absolute p-4 text-[10px] text-white/70 font-sans ${
                  socialPosition === "top-left" ? "top-0 left-0" :
                  socialPosition === "top-right" ? "top-0 right-0" :
                  socialPosition === "bottom-left" ? "bottom-0 left-0" :
                  "bottom-0 right-0"
                }`}>
                  {socialPlatform}: @{socialHandle}
                </div>
              )}

              {/* Watermark Preview */}
              {watermarkPreview && (
                <div className="absolute top-4 right-4 w-12 h-12 opacity-50">
                  <img src={watermarkPreview} className="w-full h-full object-contain" />
                </div>
              )}

              {/* Progress Bar Preview */}
              {showProgressBar && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full w-1/3 bg-emerald-500" />
                </div>
              )}
            </div>

            <div className="p-6 bg-emerald-50/30">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                <span>الدقة المتوقعة: 1080p</span>
                <span>النسبة: {selectedRatio}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                * هذه المعاينة تقريبية للنتيجة النهائية. قد تختلف الأبعاد والخطوط قليلاً بناءً على معالجة الفيديو.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Generation Overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full space-y-8 text-center">
              <div className="relative inline-block">
                <Loader2 className="w-16 h-16 text-emerald-700 animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-900">{generationProgress}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-light text-emerald-900">جاري إنشاء تحفتك الفنية...</h2>
                <p className="text-zinc-500 text-sm">{generationStatus}</p>
              </div>

              {/* Progress Steps Visualizer */}
              <div className="space-y-4 text-right">
                {generationSteps.map((stepName, idx) => {
                  const stepProgress = (idx + 1) * (100 / generationSteps.length);
                  const isCompleted = generationProgress >= stepProgress;
                  const isCurrent = generationProgress < stepProgress && (idx === 0 || generationProgress >= idx * (100 / generationSteps.length));
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isCompleted ? "bg-emerald-700 border-emerald-700 text-white" : 
                        isCurrent ? "border-emerald-700 text-emerald-700" : "border-zinc-200 text-zinc-300"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[10px]">{idx + 1}</span>}
                      </div>
                      <span className={`text-xs font-medium ${isCompleted ? "text-emerald-900" : isCurrent ? "text-emerald-700" : "text-zinc-400"}`}>
                        {stepName}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-700"
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                />
              </div>

              <p className="text-[10px] text-zinc-400 italic">
                نحن نتحقق من كل خطوة لضمان أعلى جودة. إذا واجهنا مشكلة بسيطة، سنحاول تخطيها بذكاء.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 text-center text-zinc-500 text-sm pb-12">
        <p>© 2024 استوديو فيديو القرآن. مدعوم بالذكاء الاصطناعي والمصادر المفتوحة.</p>
      </footer>
    </div>
  </div>
);
}
