import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Sparkles, 
  History, 
  Music, 
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- Sections ---
import Prayers from './components/sections/Prayers';
import Quran from './components/sections/Quran';
import Treasures from './components/sections/Treasures';
import Biography from './components/sections/Biography';
import AudioLibrary from './components/sections/AudioLibrary';
import { RemembranceCards } from './components/sections/RemembranceCards';
import AdminPanel from './components/AdminPanel';

type Section = 'home' | 'quran' | 'treasures' | 'bio' | 'audio' | 'cards' | 'admin';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const titles: Record<Section, string> = {
      home: 'صدقة جارية | الرئيسية',
      quran: 'خدمة القرآن | ختمة جماعية',
      treasures: 'الكنوز السبعة | الأذكار',
      bio: 'سيرة عطرة | خالد كوثر',
      audio: 'المكتبة الصوتية | القرآن الكريم',
      cards: 'بطاقات الدعاء | تحميل',
      admin: 'لوحة التحكم | المسؤول'
    };
    document.title = titles[activeSection];
  }, [activeSection]);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'quran', label: 'ختمة القرآن', icon: BookOpen },
    { id: 'treasures', label: 'الكنوز السبعة', icon: Sparkles },
    { id: 'bio', label: 'سيرة عطرة', icon: History },
    { id: 'audio', label: 'المكتبة الصوتية', icon: Music },
    { id: 'cards', label: 'بطاقات الدعاء', icon: ImageIcon },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'home': return <Prayers />;
      case 'quran': return <Quran />;
      case 'treasures': return <Treasures />;
      case 'bio': return <Biography />;
      case 'audio': return <AudioLibrary />;
      case 'cards': return <RemembranceCards />;
      case 'admin': return <AdminPanel onLogout={() => setActiveSection('home')} />;
      default: return <Prayers />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card bg-bg/60 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 hover:bg-white/5 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-white/5 group"
        >
          <Menu className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
        </button>
        
        <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-3">
          <span className="gold-text">خالد كوثر</span>
          <span className="w-px h-4 bg-white/20" />
          <span className="text-white/40 font-medium whitespace-nowrap">صدقة جارية</span>
        </h1>
        
        <div className="w-10 h-10" />
      </header>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[300px] bg-[#0d0d0d] border-l border-white/5 z-[60] p-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-primary">القائمة</h2>
                  <p className="text-[10px] text-white/30 tracking-widest uppercase">صدقة جارية</p>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-2 hover:bg-white/5 rounded-full active:scale-90 transition-all border border-transparent hover:border-white/5"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    onClick={() => {
                      setActiveSection(item.id as Section);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      activeSection === item.id 
                        ? "bg-primary text-bg font-bold gold-shadow" 
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      activeSection === item.id ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="text-base">{item.label}</span>
                    {activeSection === item.id && (
                      <motion.div 
                        layoutId="nav-active-pill"
                        className="absolute right-2 w-1.5 h-1.5 bg-bg rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </nav>

              <div className="pt-8 border-t border-white/5 mt-auto text-center space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-white/40">عن روح الأستاذ خالد كوثر</p>
                  <p className="text-xs text-primary/60 font-medium">رحمه الله وغفر له</p>
                </div>
                {user && (
                   <button 
                     onClick={() => { setActiveSection('admin'); setIsSidebarOpen(false); }}
                     className="text-[10px] text-white/20 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                   >
                     <Lock className="w-3 h-3" />
                     لوحة التحكم
                   </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <motion.div
           key={activeSection}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderSection()}
          
          {activeSection === 'home' && (
            <div className="mt-16 text-center">
              <p className="text-white/20 text-[10px] flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-white/5" />
                <span>تصفح المزيد من الأقسام عبر القائمة</span>
                <span className="h-px w-8 bg-white/5" />
              </p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-12 px-4 bg-[#0d0d0d] border-t border-white/5 text-center space-y-6">
        <div className="max-w-xl mx-auto">
          <h2 className="text-primary text-xl font-bold mb-4">صدقة جارية | الأستاذ خالد كوثر</h2>
          <p className="text-white/60 text-sm leading-relaxed italic mb-8">
            "اللهم اجعل هذا العمل صدقة جارية في ميزان حسناته ونوراً له في قبره"
          </p>
          
          <div className="h-px bg-white/5 w-full mb-8" />
          
          <div className="flex flex-col items-center gap-4">
             <p className="text-white/30 text-[10px]">جميع الحقوق محفوظة © 2026</p>
             <button 
                onClick={() => setActiveSection('admin')}
                className="text-white/10 hover:text-primary transition-colors text-[10px] flex items-center gap-1.5 group"
              >
                <Lock className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                <span>دخول الإدارة</span>
              </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
