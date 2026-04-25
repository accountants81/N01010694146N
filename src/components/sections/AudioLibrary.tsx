import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Music } from 'lucide-react';
import { cn } from '../../lib/utils';

const RECITERS = [
  { id: 'yasser', name: 'ياسر الدوسري', playlistId: 'PLCsl1e1vdmMp_C6cg2Cn1zBcxrcyJbbGc' },
  { id: 'maher', name: 'ماهر المعيقلي', playlistId: 'PLAnWEc4CufyptHlt78daX5zYTNJ2Piy9Y' },
  { id: 'menshawy', name: 'المنشاوي', playlistId: 'PL8e-VCpX32sYP-SG5-TSMR2nG9KuSVnmB' },
  { id: 'hussary', name: 'محمود خليل الحصري', playlistId: 'PLAwFv2Pp2unyyX8kj0B15xHEBaSc0tFBI' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد', playlistId: 'PLRS01CBgbAXvGzpWZ5annPgSfV36rPs3u' },
];

export default function AudioLibrary() {
  const [activeReciterId, setActiveReciterId] = useState<string | null>(null);

  const activeReciter = RECITERS.find(r => r.id === activeReciterId);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold gold-text">المكتبة الصوتية</h2>
        <p className="text-white/60">تلاوات مباركة بأصوات كبار القراء</p>
      </div>

      <div className="grid gap-4">
        {RECITERS.map((reciter) => (
          <div key={reciter.id} className="space-y-3">
            <button
              onClick={() => setActiveReciterId(activeReciterId === reciter.id ? null : reciter.id)}
              className={cn(
                "w-full flex items-center justify-between px-8 py-6 rounded-2xl transition-all duration-300 border",
                activeReciterId === reciter.id
                  ? "bg-primary text-bg font-bold border-primary shadow-lg"
                  : "bg-card border-white/5 text-white/80 hover:bg-white/5"
              )}
            >
              <span className="text-lg">{reciter.name}</span>
              <Play className={cn("w-5 h-5 transition-transform duration-300", activeReciterId === reciter.id ? "fill-bg rotate-90" : "fill-white/20")} />
            </button>

            <AnimatePresence>
              {activeReciterId === reciter.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-[#0d0d0d] rounded-3xl border border-white/5 overflow-hidden ring-1 ring-white/5 mx-2">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/videoseries?list=${reciter.playlistId}`}
                        title={`${reciter.name} Playlist`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="mt-4 text-center text-white/40 text-xs font-medium">
                      تلاوات مختارة للقارئ {reciter.name}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
