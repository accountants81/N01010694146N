import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Quote, User } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  status: 'pending' | 'approved';
}

export default function Biography() {
  const [bioText, setBioText] = useState("جاري التحميل...");
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [approvedMessages, setApprovedMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Load Bio
    const unsubBio = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setBioText(docSnap.data().bio || "");
      } else {
        setBioText("كان راجل محترم وخلوق، والكل يبشهد له بالخير. عاش حياته بيتقي الله في بيته، وربي أولاده أحسن تربية وطلعهم ناس محترمة زيه");
      }
    });

    // Load Approved Messages
    const q = query(
      collection(db, 'messages'), 
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setApprovedMessages(msgs);
    }, (err) => {
       console.error("Messages sync error:", err);
    });

    return () => {
      unsubBio();
      unsubMessages();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setMessage('');
      setIsSent(true);
      setTimeout(() => setIsSent(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="space-y-16">
      <div className="text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 glass-card rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 gold-shadow shadow-primary/10"
        >
          <Quote className="w-10 h-10 text-primary opacity-60 shrink-0" />
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-bold gold-text pb-2 tracking-tighter">سيرة عطرة</h2>
        <p className="text-white/40 max-w-sm mx-auto text-sm">عن الأستاذ خالد كوثر رحمه الله وطيب ثراه</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="glass-card p-12 md:p-16 rounded-[3.5rem] border-white/5 relative overflow-hidden text-center shadow-gold group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Quote className="w-48 h-48 text-white" />
        </div>
        <p className="text-xl md:text-2xl text-white/90 leading-[2.2] font-medium font-arabic">
          "{bioText}"
        </p>
      </motion.div>

      <div className="space-y-10 pt-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">دفتر المحبين</h3>
          <p className="text-white/30 text-sm">أضف دعاءً أو ذكرى صادقة تخليداً لمسيرته الطيبة</p>
        </div>
        
        <div className="glass-card p-8 rounded-[2.5rem] border-white/10 space-y-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-3xl p-8 min-h-[200px] focus:border-primary/50 outline-none transition-all resize-none text-white/90 placeholder:text-white/10 leading-loose text-lg"
            placeholder="اكتب هنا كلمة، دعاءً، أو موقفاً لا ينسى..."
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isSent || !message.trim()}
            className={`
              w-full flex items-center justify-center gap-4 py-6 rounded-3xl font-black text-xl transition-all duration-500 relative overflow-hidden group/btn
              ${isSent 
                ? 'bg-green-500/20 text-green-500 border border-green-500/20' 
                : 'bg-primary text-bg hover:shadow-2xl hover:opacity-90 active:scale-[0.98] shadow-gold'}
            `}
          >
            {isSent ? (
              <>تم إرسال رسالتكم الطيبة لمراجعتها</>
            ) : (
              <>
                <motion.div 
                  className="absolute inset-0 bg-white/20 translate-x-[-100%]"
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
                <Send className="w-6 h-6 -rotate-12 relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                <span className="relative z-10">إرسال للمراجعة</span>
              </>
            )}
          </button>
        </div>

        {/* Approved Messages Feed */}
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {approvedMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/[0.02] p-8 rounded-3xl border border-white/[0.05] relative group"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/80 leading-relaxed text-lg">
                      {msg.text}
                    </p>
                    <div className="pt-2">
                      <span className="text-[10px] text-white/20 uppercase tracking-widest">
                        {msg.createdAt?.toDate?.()?.toLocaleDateString('ar-EG') || "مؤخراً"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
