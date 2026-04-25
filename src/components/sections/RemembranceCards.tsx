import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Quote } from 'lucide-react';
import { domToPng } from 'modern-screenshot';

const CARDS = [
  {
    id: '1',
    text: "اللهم اغفر لفقيدنا وارحمه، وعافه واعف عنه، وأكرم نزله، ووسع مدخله، واغسله بالماء والثلج والبرد.",
    gradient: "linear-gradient(135deg, #2a2214 0%, #111111 100%)",
    filename: "بطاقة_خالد_كوثر_1.png"
  },
  {
    id: '2',
    text: "اللهم اجعل قبره روضة من رياض الجنة، ولا تجعله حفرة من حفر النار، اللهم افسح له في قبره مد بصره.",
    gradient: "linear-gradient(135deg, #1e1e1e 0%, #111111 100%)",
    filename: "بطاقة_خالد_كوثر_2.png"
  },
  {
    id: '3',
    text: "اللهم ارحمه فوق الأرض، وتحت الأرض، ويوم العرض عليك، اللهم قِهِ عذابك يوم تبعث عبادك.",
    gradient: "linear-gradient(135deg, #11221a 0%, #111111 100%)",
    filename: "بطاقة_خالد_كوثر_3.png"
  }
];

export const RemembranceCards: React.FC = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDownload = async (index: number, filename: string) => {
    const element = cardRefs.current[index];
    if (!element) return;

    setProcessingId(`download-${index}`);
    try {
      // modern-screenshot handles Arabic ligatures correctly
      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#111111',
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          transform: 'none',
          borderRadius: '32px'
        }
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      alert('تم تحميل البطاقة بنجاح!');
    } catch (err) {
      console.error('Download failed:', err);
      alert('عذراً، حدث خطأ أثناء تحميل الصورة.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleShare = async (index: number) => {
    const element = cardRefs.current[index];
    if (!element) return;

    setProcessingId(`share-${index}`);
    try {
      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#111111'
      });

      // Convert dataURL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `card-${index + 1}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'صدقة جارية',
          text: 'دعاء لفقيدنا الأستاذ خالد كوثر',
          files: [file]
        });
      } else {
        const message = `صدقة جارية عن روح الأستاذ خالد كوثر - ${window.location.href}`;
        await navigator.clipboard.writeText(message);
        alert('تم نسخ رابط الموقع للمشاركة');
      }
    } catch (err: any) {
      // Handle user cancellation gracefully
      if (err.name === 'AbortError') {
        console.log('Share was canceled by user.');
        return;
      }
      
      console.error('Share failed:', err);
      // Fallback: Copy link to clipboard
      try {
        const message = `صدقة جارية عن روح الأستاذ خالد كوثر - ${window.location.href}`;
        await navigator.clipboard.writeText(message);
        alert('حدث خطأ أثناء المشاركة، تم نسخ رابط الموقع بدلاً من ذلك');
      } catch (clipErr) {
        console.error('Clipboard fallback failed:', clipErr);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section id="remembrance" className="py-12">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold gold-text">بطاقات الذكرى</h2>
          <p className="text-white/40 max-w-sm mx-auto">شارك هديتك من الأدعية والذكر كصدقة جارية بلمسة واحدة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col gap-4"
            >
              <div
                ref={el => cardRefs.current[index] = el}
                dir="rtl"
                className="relative aspect-[5/6] p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border border-white/[0.05] shadow-lg overflow-hidden group/card"
                style={{ 
                  background: card.gradient,
                  color: '#ffffff',
                }}
              >
                <div className="absolute inset-0 bg-black/30 group-hover/card:bg-black/10 transition-colors duration-700" />
                <Quote className="w-8 h-8 text-primary mb-6 opacity-30 shrink-0 relative z-10" />
                <p className="text-lg md:text-xl leading-relaxed font-bold mb-6 whitespace-pre-wrap relative z-10 font-arabic">
                  {card.text}
                </p>
                <div className="mt-auto pt-4 border-t border-white/5 w-full relative z-10">
                  <p className="text-primary font-bold text-base mb-0.5">الأستاذ خالد كوثر</p>
                  <p className="text-white/20 text-[10px] tracking-widest">رحمه الله</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(index, card.filename)}
                  disabled={processingId !== null}
                  className="flex-1 h-11 rounded-xl glass-card hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 font-bold border-white/5 text-xs"
                >
                  <Download className={`w-4 h-4 ${processingId === `download-${index}` ? 'animate-pulse text-primary' : ''}`} />
                  <span>تحميل</span>
                </button>
                <button
                  onClick={() => handleShare(index)}
                  disabled={processingId !== null}
                  className="w-11 h-11 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 border border-primary/10"
                >
                  <Share2 className={`w-4 h-4 ${processingId === `share-${index}` ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
