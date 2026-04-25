import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { getStorageItem, setStorageItem, LOCAL_STORAGE_KEYS } from '../../lib/storage';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, increment, setDoc } from 'firebase/firestore';

const PRAYERS = [
  "اللهم اغفر للأستاذ خالد كوثر وارحمه",
  "اللهم اجعل مرضه شفيعاً له",
  "اللهم وسع مدخله وأدخله الجنة",
  "اللهم اجعل قبره روضة من رياض الجنة",
  "اللهم ثبته عند السؤال",
  "اللهم اجعل كل حرف يقرأ نوراً في قبره",
  "اللهم تقبل هذا العمل صدقة جارية عنه",
  "اللهم اجمعه مع الصالحين في الفردوس الأعلى"
];

export default function Prayers() {
  const [amenCount, setAmenCount] = useState(0);
  const [hasPrayed, setHasPrayed] = useState(getStorageItem(LOCAL_STORAGE_KEYS.HAS_PRAYED, false));

  useEffect(() => {
    const statsRef = doc(db, 'stats', 'global');
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setAmenCount(doc.data().amenCount || 0);
      } else {
        // Initialize if doesn't exist
        setDoc(statsRef, { amenCount: 0, completedKhatmas: 0 }).catch(e => {
           // Silently fail if not admin, or handle it
           console.warn("Could not initialize stats, possibly limited permissions.");
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'stats/global');
    });

    return () => unsub();
  }, []);

  const handleAmen = async () => {
    if (hasPrayed) return;
    
    // Optimistic UI
    setAmenCount(prev => prev + 1);
    setHasPrayed(true);
    setStorageItem(LOCAL_STORAGE_KEYS.HAS_PRAYED, true);

    try {
      await updateDoc(doc(db, 'stats', 'global'), {
        amenCount: increment(1)
      });
    } catch (err) {
      // Revert optimistic update if fail
      setAmenCount(prev => prev - 1);
      setHasPrayed(false);
      setStorageItem(LOCAL_STORAGE_KEYS.HAS_PRAYED, false);
      handleFirestoreError(err, OperationType.UPDATE, 'stats/global');
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 flex flex-col items-center max-w-2xl mx-auto">
        {/* Removed all background glows and boxes */}
        
        <div className="relative text-center space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-block"
          >
            <div className="w-24 h-24 glass-card rounded-3xl flex items-center justify-center relative border border-white/10 shadow-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 opacity-40" />
              <Heart className="w-10 h-10 text-primary relative z-10 opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" fill="currentColor" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-bold gold-text tracking-tight">الأستاذ خالد كوثر</h2>
            <div className="h-px w-24 bg-primary/20 mx-auto rounded-full" />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-white/70 font-medium italic"
            >
              "رحمه الله وغفر له وأسكنه فسيح جناته"
            </motion.p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/60 max-w-md mx-auto leading-relaxed text-sm md:text-base px-6 font-medium"
          >
            هذا الموقع صدقة جارية تخليداً لذكراه الطيبة، يجمع محبيه على طاعة الله والدعاء له.
          </motion.p>
        </div>
      </section>

      <div className="text-center space-y-2 pt-0">
        <h2 className="text-base md:text-lg font-bold text-white/70 flex items-center justify-center gap-2">
          <span className="w-4 h-px bg-white/5" />
          أدعية مأثورة
          <span className="w-4 h-px bg-white/5" />
        </h2>
      </div>

      <div className="grid gap-4">
        {PRAYERS.map((prayer, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.5 }}
            className="group glass-card p-6 rounded-3xl hover:border-primary/20 transition-all duration-500 relative flex items-center justify-between gap-6"
          >
            <p className="text-base md:text-lg text-white/80 font-medium leading-relaxed">
              {prayer}
            </p>
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs text-white/20 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
              {index + 1}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-8 flex flex-col items-center gap-6">
        <button
          onClick={handleAmen}
          disabled={hasPrayed}
          className={`
            relative overflow-hidden px-16 py-5 rounded-3xl font-bold text-xl transition-all duration-500 active:scale-95
            ${hasPrayed 
              ? 'bg-white/5 text-white/20 border border-white/5 cursor-default' 
              : 'bg-primary text-bg hover:shadow-[0_10px_30px_rgba(197,160,89,0.3)] gold-shadow'}
          `}
        >
          {hasPrayed ? 'آمين' : 'آمين'}
          {!hasPrayed && (
             <motion.div 
               className="absolute inset-0 bg-white/20"
               initial={{ x: '-100%' }}
               animate={{ x: '100%' }}
               transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
             />
          )}
        </button>
        
        <div className="text-center">
          <p className="text-primary text-2xl font-bold">{amenCount.toLocaleString()}</p>
          <p className="text-white/40 text-xs">شخص دعوا له</p>
        </div>
      </div>
    </div>
  );
}
