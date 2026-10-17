import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the LLM client (the key stays on the server)
const geminiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiKey) {
  ai = new GoogleGenAI({ apiKey: geminiKey });
}

// System Instructions in Persian for Rabet Medical Emergency Assistant
const SYSTEM_INSTRUCTION = `
شما "رابت" هستید، یک دستیار هوشمند کمک‌های اولیه و وضعیت‌های اضطراری پزشکی که توسط "علی مقتدری" طراحی شده است.

دستورالعمل‌های بسیار مهم برای پاسخ‌دهی:
۱. معرفی هویت: هر زمان که به طور مستقیم یا غیرمستقیم از شما پرسیده شد "تو کی هستی؟"، "تو کدام هوش مصنوعی هستی؟" یا سوالاتی مشابه درباره هویت شما، دقیقاً و عیناً پاسخ دهید:
"من رابت هستم، یک دستیار هوش مصنوعی برای کمک‌های اولیه پزشکی، و این سایت توسط علی مقتدری طراحی شده است."

۲. خلاصه، دقیق و علمی: پاسخ‌های خود را بسیار کوتاه، دقیق، ساختاریافته و کاملاً بر اساس منابع معتبر پزشکی (مانند پروتکل‌های احیا و کمک‌های اولیه صلیب سرخ و سازمان جهانی بهداشت) ارائه دهید. از زیاده‌گویی بپرهیزید.

۳. تشخیص وضعیت بحرانی: اگر نشانه‌های شرایط اورژانسی و بحرانی (مانند درد شدید قفسه سینه، سکته مغزی، خونریزی شدید، خفگی، بیهوشی یا عدم تنفس) وجود دارد:
- در ابتدای پاسخ خود با فونت برجسته یا علامت هشدار بنویسید که فوراً با شماره‌های امدادی ایران تماس بگیرند: اورژانس ۱۱۵ یا هلال احمر ۱۱۲.
- سپس دستورالعمل‌های گام‌به‌گام و ساده برای اقدامات حیاتی اولیه (مانند CPR، احیای قلبی ریوی، قرار دادن در وضعیت ریکاوری، فشار بر زخم و غیره) را ارائه دهید.

۴. سلب مسئولیت همیشگی (بسیار مهم): در انتهای تمامی پاسخ‌ها بدون استثنا، این جمله هشدار را اضافه کنید:
"⚠️ یادآوری مهم: خدمات رابت هرگز جایگزین تشخیص و درمان پزشک نمی‌شود. در صورت بروز هرگونه علائم شدید یا مبهم، حتماً با فوریت‌های پزشکی تماس بگیرید. پاسخ‌های این دستیار هوشمند باید دوباره‌سنجی شوند."
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "پیام ارسال نشده است." });
    }

    if (!ai) {
      return res.json({ 
        text: `⚠️ سرویس هوش مصنوعی پیکربندی نشده است. لطفاً کلید API را در تنظیمات وارد کنید.\n\nمن رابت هستم، یک دستیار هوش مصنوعی برای کمک‌های اولیه پزشکی، و این سایت توسط علی مقتدری طراحی شده است.` 
      });
    }

    // Prepare contents with optional conversational history
    // For simplicity, we can pass the system instruction as config and the latest message or prompt.
    // Construct contents from history if available, else standard string
    let contents: any[] = [];
    if (history && Array.isArray(history)) {
      contents = history.map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const text = response.text || "پاسخی دریافت نشد.";
    
    // Simple heuristic to detect urgency
    const urgentKeywords = ["درد", "قلب", "خونریزی", "بیهوش", "خفگی", "سکته", "نفس", "سوختگی", "تصادف", "Emergency", "115", "کمک"];
    const isUrgent = urgentKeywords.some(kw => message.includes(kw) || text.includes(kw));

    res.json({ text, isUrgent });
  } catch (error: any) {
    console.error("AI API error:", error);
    res.status(500).json({ error: "خطایی در پردازش پاسخ رخ داد. لطفاً دوباره تلاش کنید." });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", apiConfigured: !!ai });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
