import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Hand } from 'lucide-react';
import { getStorageItem, setStorageItem, LOCAL_STORAGE_KEYS } from '../../lib/storage';

const TREASURES = [
  { id: '1', title: 'سبحان الله وبحمده', defaultTarget: 33 },
  { id: '2', title: 'سبحان الله العظيم', defaultTarget: 33 },
  { id: '3', title: 'لا إله إلا الله', defaultTarget: 33 },
  { id: '4', title: 'الحمد لله', defaultTarget: 33 },
  { id: '5', title: 'الله أكبر', defaultTarget: 33 },
  { id: '6', title: 'لا حول ولا قوة إلا بالله', defaultTarget: 33 },
  { id: '7', title: 'أستغفر الله وأتوب إليه', defaultTarget: 33 },
];

interface Progress {
  count: number;
  target: number;
}

export default function Treasures() {
  const [progress, setProgress] = useState<Record<string, Progress>>({});

  useEffect(() => {
    const saved = getStorageItem<Record<string, Progress>>(LOCAL_STORAGE_KEYS.TREASURES_PROGRESS, {});
    const initialProgress: Record<string, Progress> = {};
    TREASURES.forEach(t => {
      initialProgress[t.id] = saved[t.id] || { count: 0, target: t.defaultTarget };
    });
    setProgress(initialProgress);
  }, []);

  const handleIncrement = (id: string) => {
    const current = progress[id];
    const newCount = current.count + 1;
    
    if (newCount >= current.target) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      alert("أكملت التسبيحة - جعلها الله في ميزان حسنات الأستاذ خالد كوثر");
      updateItem(id, { ...current, count: 0 });
    } else {
      updateItem(id, { ...current, count: newCount });
      if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  const handleTargetChange = (id: string, newTarget: number) => {
    const current = progress[id];
    updateItem(id, { ...current, target: Math.max(1, newTarget) });
  };

  const handleReset = (id: string) => {
    const current = progress[id];
    updateItem(id, { ...current, count: 0 });
  };

  const updateItem = (id: string, item: Progress) => {
    const newProgress = { ...progress, [id]: item };
    setProgress(newProgress);
    setStorageItem(LOCAL_STORAGE_KEYS.TREASURES_PROGRESS, newProgress);
  };

  return (
    <div className="space-y-16">
      <div className="text-center space-y-6">
        <motion.div 
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 glass-card rounded-full flex items-center justify-center mx-auto mb-6 border-primary/30 gold-shadow"
        >
          <SparklesIcon />
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold gold-text">الكنوز السبعة</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 max-w-3xl mx-auto px-4">
        {TREASURES.map((treasure, index) => {
          const data = progress[treasure.id] || { count: 0, target: treasure.defaultTarget };
          const percentage = (data.count / data.target) * 100;
          
          return (
             <motion.div 
               key={treasure.id}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: index * 0.05 }}
               className="glass-card p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-primary/20 transition-all duration-500"
             >
               <button 
                 onClick={() => handleReset(treasure.id)}
                 className="absolute top-4 left-4 p-2 text-white/[0.05] hover:text-red-400/60 transition-all hover:rotate-[-180deg] duration-700"
               >
                 <RotateCcw className="w-5 h-5" />
               </button>

               <div className="text-center space-y-8">
                 <h3 className="text-xl md:text-2xl font-bold text-white/80">{treasure.title}</h3>
                 
                 <div className="flex flex-col items-center gap-8">
                    {/* Ring Counter */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          fill="transparent"
                          stroke="rgba(255,255,255,0.02)"
                          strokeWidth="8"
                        />
                        <motion.circle
                          cx="80"
                          cy="80"
                          r="72"
                          fill="transparent"
                          stroke="#C5A059"
                          strokeWidth="8"
                          strokeDasharray={452.4}
                          initial={{ strokeDashoffset: 452.4 }}
                          animate={{ strokeDashoffset: 452.4 - (452.4 * Math.min(percentage, 100)) / 100 }}
                          strokeLinecap="round"
                          transition={{ type: 'spring', damping: 20 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                          key={data.count}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-bold text-white/90"
                        >
                          {data.count}
                        </motion.span>
                        <span className="text-sm text-white/20">/ {data.target}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/[0.02] py-2 px-6 rounded-2xl border border-white/[0.05]">
                      <span className="text-xs text-white/20 italic">الهدف:</span>
                      <input 
                        type="number" 
                        value={data.target}
                        onChange={(e) => handleTargetChange(treasure.id, parseInt(e.target.value) || 1)}
                        className="w-16 bg-transparent text-center text-primary font-bold text-sm outline-none"
                      />
                    </div>

                    <button 
                      onClick={() => handleIncrement(treasure.id)}
                      className="w-full max-w-[280px] bg-primary/90 text-bg font-bold py-5 rounded-[2rem] text-xl hover:bg-primary transition-all active:scale-[0.96] relative overflow-hidden group/btn"
                    >
                      <motion.div 
                        className="absolute inset-0 bg-white/10 translate-x-[-100%]"
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.5 }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        سَبِّح
                        <Hand className="w-6 h-6" />
                      </span>
                    </button>
                 </div>
               </div>
             </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
