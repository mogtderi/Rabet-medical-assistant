import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, 
  Send, 
  Sliders, 
  Sparkles, 
  RotateCw, 
  ShieldAlert, 
  Settings, 
  X, 
  MessageSquare, 
  Phone, 
  Info,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { RoseCanvas } from './components/RoseCanvas';
import { Message, RoseSettings } from './types';

export default function App() {
  // 3D Rose settings state
  const [roseSettings, setRoseSettings] = useState<RoseSettings>({
    color: '#ff4d94', // Neon Pink
    rotationSpeed: 0.15,
    glowIntensity: 1.5,
    orbitSpeed: 0.4,
    sparkleDensity: 800,
    nebulaColor: '#3a0ca3', // Purple nebula
    showHelpers: false
  });

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `**سلام و درود! من رابت هستم.** 🚨

من یک دستیار هوشمند کمک‌های اولیه و فوریت‌های پزشکی هستم که توسط علی مقتدری طراحی شده‌ام تا در مواقع بحرانی یا برای یادگیری کمک‌های اولیه به شما کمک کنم.

**چند پیشنهاد برای شروع گفتگو:**
- 🔴 "احیای قلبی ریوی (CPR) چگونه انجام می‌شود؟"
- 🧠 "نشانه‌های سکته مغزی چیست؟"
- 🩹 "برای خونریزی شدید چه اقدامی لازم است؟"
- 🌸 "تو کدام هوش مصنوعی هستی؟"

*⚠️ توجه: خدمات من جنبه راهنمایی اولیه دارد و جایگزین فوریت‌های پزشکی یا پزشک نمی‌شود. در شرایط وخیم فوراً با **۱۱۵** تماس بگیرید.*`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Color Presets for Neon Crystal Rose
  const colorPresets = [
    { name: 'رز صورتی نئونی', color: '#ff4d94', nebula: '#3a0ca3', bgGlow: 'from-rose-500/10 to-indigo-500/5' },
    { name: 'سایبر فیروزه‌ای', color: '#00f0ff', nebula: '#03045e', bgGlow: 'from-cyan-500/10 to-blue-500/5' },
    { name: 'یاقوت بنفش', color: '#9d4edf', nebula: '#240046', bgGlow: 'from-purple-500/10 to-pink-500/5' },
    { name: 'طلای کهکشانی', color: '#ffb703', nebula: '#600020', bgGlow: 'from-yellow-500/10 to-rose-500/5' },
    { name: 'سبز زمردین', color: '#10b981', nebula: '#064e3b', bgGlow: 'from-emerald-500/10 to-teal-500/5' }
  ];

  // Auto scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle preset selection
  const applyPreset = (color: string, nebula: string) => {
    setRoseSettings(prev => ({
      ...prev,
      color,
      nebulaColor: nebula
    }));
  };

  // Quick prompt helper
  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
    sendMessage(promptText);
  };

  // Safe markdown simplifier (simple converter for bold, alert headers, etc.)
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;
      
      // Handle bold Markdown: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex);
        content = parts.map((part, pIdx) => {
          return pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-white text-base neon-text-pink">{part}</strong> : part;
        });
      }

      // Handle custom urgent tags or warnings
      if (line.includes('⚠️') || line.includes('🚨') || line.includes('اورژانس')) {
        return (
          <p key={idx} className="my-1.5 text-amber-200/95 font-medium leading-relaxed flex items-start gap-1">
            <span>{content}</span>
          </p>
        );
      }

      return (
        <p key={idx} className="my-1 text-slate-100/90 leading-relaxed text-[15px]">
          {content}
        </p>
      );
    });
  };

  // Submit message to the Express server
  const sendMessage = async (overrideMsg?: string) => {
    const messageToSend = overrideMsg || inputMessage;
    if (!messageToSend.trim() || isLoading) return;

    if (!overrideMsg) setInputMessage('');
    setIsLoading(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageToSend,
          history: chatHistory.slice(-6) // Send last 6 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('خطا در پاسخ سرور');
      }

      const data = await response.json();

      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: data.text,
        isUrgent: data.isUrgent,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        sender: 'bot',
        text: `⚠️ خطایی در ارتباط با دستیار پزشکی رابت رخ داد. لطفاً مطمئن شوید کلید API متصل است و دوباره تلاش کنید.\n\nمن رابت هستم، یک دستیار هوش مصنوعی برای کمک‌های اولیه پزشکی، و این سایت توسط علی مقتدری طراحی شده است.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-row select-none bg-[#010103]">
      
      {/* IMMERSIVE NEBULA BACKDROP UNDERLAYS */}
      <div className="immersive-nebula-purple top-[-200px] left-[-200px]" />
      <div className="immersive-nebula-blue bottom-[-100px] right-[-100px]" />
      
      {/* 3D WEBGL ROSE BACKDROP */}
      <div className="absolute inset-0 z-0">
        <RoseCanvas settings={roseSettings} />
      </div>

      {/* GLOWING TITLE BOX IN COSMIC BACKGROUND */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-1 text-center pointer-events-none select-none">
        <h2 className="text-xl md:text-2xl font-extralight text-white tracking-[8px] neon-text-pink mb-1">
         تقدیم به تو 
        </h2>
        <p className="text-[10px] text-cyan-400 tracking-[3px] font-bold uppercase">
          CREATED by MOGHTADERI
        </p>
      </div>

      {/* DUST/AMBIENT COLOR OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-1 bg-gradient-to-tr from-black/60 via-transparent to-black/70" />

      {/* HEADER BAR FOR WEB */}
      <header className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* Title Badge */}
        <div className="pointer-events-auto flex items-center gap-3 glass-panel rounded-full px-5 py-2.5 shadow-xl border-white/10">
          <HeartPulse className="w-6 h-6 text-pink-400 animate-pulse" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-wide">رابت • دستیار هوشمند فوریت‌های پزشکی</h1>
            <p className="text-[10px] text-pink-400/80 font-medium">طراحی شده توسط علی مقتدری</p>
          </div>
        </div>

        {/* Action Controls for sidebar */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-3 rounded-full glass-panel cursor-pointer shadow-lg hover:border-pink-500/50 transition-all ${isSidebarOpen ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'text-slate-300'}`}
            title="تنظیمات گل رز ۳بعدی"
          >
            <Sliders className="w-5 h-5" />
          </button>
          
          {!isChatOpen && (
            <button 
              onClick={() => setIsChatOpen(true)}
              className="p-3 rounded-full bg-pink-500 hover:bg-pink-600 cursor-pointer shadow-lg hover:shadow-pink-500/20 text-white transition-all pulsing-glow flex items-center gap-2 px-5"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold">گفتگو با رابت</span>
            </button>
          )}
        </div>
      </header>

      {/* LEFT SIDEBAR: 3D ROSE SETTINGS PANEL */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute lg:relative z-20 left-4 top-20 bottom-4 w-[310px] glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-2xl border-white/10 pointer-events-auto overflow-y-auto"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-pink-400" />
                  <h2 className="text-base font-bold text-white">شخصی‌سازی رز سه بعدی</h2>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Presets Grid */}
              <div className="mb-6">
                <label className="text-xs text-slate-400 font-semibold mb-3 block">پالت‌های کهکشانی آماده:</label>
                <div className="grid grid-cols-1 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => applyPreset(preset.color, preset.nebula)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${roseSettings.color === preset.color ? 'bg-white/10 border-pink-500/50' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs font-medium text-slate-200">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {/* Color Picker */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                    <span>رنگ سفارشی گل رز:</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={roseSettings.color}
                      onChange={(e) => setRoseSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={roseSettings.color}
                      onChange={(e) => setRoseSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-pink-300 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Rotation Speed */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>سرعت چرخش رز:</span>
                    <span className="font-mono text-pink-400">{Math.round(roseSettings.rotationSpeed * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="0.6" 
                    step="0.05"
                    value={roseSettings.rotationSpeed}
                    onChange={(e) => setRoseSettings(prev => ({ ...prev, rotationSpeed: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Orbit Speed */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>سرعت چرخش رینگ خاردار:</span>
                    <span className="font-mono text-pink-400">{Math.round(roseSettings.orbitSpeed * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.5" 
                    step="0.1"
                    value={roseSettings.orbitSpeed}
                    onChange={(e) => setRoseSettings(prev => ({ ...prev, orbitSpeed: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Glow Intensity */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>شدت درخشش نئون:</span>
                    <span className="font-mono text-pink-400">{roseSettings.glowIntensity}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1"
                    value={roseSettings.glowIntensity}
                    onChange={(e) => setRoseSettings(prev => ({ ...prev, glowIntensity: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Nebula Color */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                    <span>رنگ سحابی کهکشان:</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={roseSettings.nebulaColor}
                      onChange={(e) => setRoseSettings(prev => ({ ...prev, nebulaColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={roseSettings.nebulaColor}
                      onChange={(e) => setRoseSettings(prev => ({ ...prev, nebulaColor: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-pink-300 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>کلیک و درگ برای چرخاندن آزادانه دوربین سه بعدی</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT (CENTER GLOW) */}
      <main className="flex-1" />

      {/* RIGHT SIDEBAR: RABET MEDICAL ASSISTANT CHAT PANEL */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 180 }}
            className="absolute lg:relative z-20 right-4 top-20 bottom-4 w-full md:w-[440px] glass-panel-neon rounded-3xl flex flex-col justify-between shadow-2xl overflow-hidden pointer-events-auto border-pink-500/20"
          >
            {/* Chat Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-pink-950/20 to-purple-950/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/40">
                    <HeartPulse className="w-6 h-6 text-pink-400 animate-pulse" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0f061e] rounded-full animate-ping" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0f061e] rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    رابت
                    <span className="text-[10px] bg-pink-500/30 text-pink-300 font-semibold px-2 py-0.5 rounded-full">کمک‌های اولیه</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">پاسخ‌های کوتاه، دقیق و مبتنی بر مراجع معتبر علمی</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="بستن چت"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Quick First Aid Fast Triggers */}
            <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button 
                onClick={() => handleQuickPrompt("احیای قلبی ریوی (CPR)")}
                className="text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/35 rounded-full px-3 py-1 hover:bg-rose-500/25 transition-all cursor-pointer font-semibold flex items-center gap-1 shrink-0"
              >
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                احیای قلبی (CPR)
              </button>
              <button 
                onClick={() => handleQuickPrompt("نشانه‌ها و کمک‌های اولیه سکته مغزی چیست؟")}
                className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/35 rounded-full px-3 py-1 hover:bg-indigo-500/25 transition-all cursor-pointer shrink-0"
              >
                سکته مغزی
              </button>
              <button 
                onClick={() => handleQuickPrompt("برای خفگی و گرفتگی راه هوایی چه باید کرد؟")}
                className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/35 rounded-full px-3 py-1 hover:bg-amber-500/25 transition-all cursor-pointer shrink-0"
              >
                رفع خفگی
              </button>
              <button 
                onClick={() => handleQuickPrompt("روش مهار خونریزی شدید چیست؟")}
                className="text-[11px] bg-red-500/10 text-red-300 border border-red-500/35 rounded-full px-3 py-1 hover:bg-red-500/25 transition-all cursor-pointer shrink-0"
              >
                کنترل خونریزی
              </button>
              <button 
                onClick={() => handleQuickPrompt("تو کدوم هوش مصنوعی هستی؟")}
                className="text-[11px] bg-pink-500/10 text-pink-300 border border-pink-500/35 rounded-full px-3 py-1 hover:bg-pink-500/25 transition-all cursor-pointer shrink-0"
              >
                هویت رابت؟ 🌸
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0f061e]/30 to-[#03000a]/50">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} gap-2`}
                >
                  {msg.sender === 'user' ? (
                    <div className="max-w-[85%] bg-slate-800/80 border border-white/5 rounded-2xl rounded-tr-none p-4 shadow-md">
                      <p className="text-[14px] text-slate-100 leading-relaxed font-medium text-right">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 mt-2 block text-left font-mono">{msg.timestamp}</span>
                    </div>
                  ) : (
                    <div className={`max-w-[88%] rounded-2xl rounded-tl-none p-4 shadow-lg border text-right transition-all duration-300 ${
                      msg.isUrgent 
                        ? 'bg-rose-950/40 border-red-500/40 shadow-red-500/5 neon-border-pink' 
                        : 'bg-indigo-950/30 border-pink-500/15'
                    }`}>
                      {msg.isUrgent && (
                        <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-2 pb-1.5 border-b border-red-500/10">
                          <ShieldAlert className="w-4 h-4 animate-bounce" />
                          <span>🚨 وضعیت اورژانسی شناسایی شد!</span>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {renderMessageText(msg.text)}
                      </div>
                      
                      <span className="text-[9px] text-slate-400 mt-2 block text-left font-mono">{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-end">
                  <div className="bg-indigo-950/30 border border-pink-500/15 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-3">
                    <div className="flex space-x-1.5 justify-center items-center">
                      <span className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-pink-500 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xs text-pink-300/80 font-medium">رابت در حال بررسی منابع معتبر پزشکی...</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Emergency fast-dial buttons inside panel */}
            <div className="p-4 bg-red-950/10 border-t border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <Phone className="w-4 h-4 animate-pulse text-red-400" />
                تماس فوری با اورژانس ایران:
              </span>
              <div className="flex gap-2">
                <a 
                  href="tel:115"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg hover:shadow-red-500/30 transition-all cursor-pointer inline-flex items-center gap-1 pulsing-glow"
                >
                  اورژانس ۱۱۵
                </a>
                <a 
                  href="tel:112"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs px-3.5 py-1.5 rounded-full border border-white/5 shadow-md transition-all cursor-pointer"
                >
                  هلال‌احمر ۱۱۲
                </a>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#0a0414]/90 border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="relative flex items-center"
              >
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="سوال پزشکی خود را بنویسید (مثلاً: CPR چگونه است؟)..."
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-400/80 focus:outline-none focus:border-pink-500/50 transition-all font-medium disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute left-1.5 p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-slate-800/40 disabled:text-slate-500 transition-all cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5 transform -rotate-180" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
