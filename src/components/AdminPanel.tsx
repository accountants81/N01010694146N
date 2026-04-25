import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Sparkles,
  RefreshCw,
  LogOut,
  Edit2,
  Lock,
  Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  getDoc,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  status: 'pending' | 'approved';
}

const ADMIN_EMAIL = "e0l3mdj6eua7l@gmail.com";

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    amenCount: 0,
    completedKhatmas: 0,
  });
  const [bioText, setBioText] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const ADMIN_PASSWORD = "01010694146";

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      setError(false);
      localStorage.setItem('admin_session', 'true');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session === 'true') {
      setIsUnlocked(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    // Load Stats
    const statsUnsub = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          amenCount: data.amenCount || 0,
          completedKhatmas: data.completedKhatmas || 0
        });
      }
    });

    // Load Bio
    const configUnsub = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setBioText(docSnap.data().bio || "");
      }
    });

    // Load Messages
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    const messagesUnsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    });

    return () => {
      statsUnsub();
      configUnsub();
      messagesUnsub();
    };
  }, [isUnlocked]);

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_session');
    setIsUnlocked(false);
    onLogout();
  };

  const handleMessageStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'rejected') {
        await deleteDoc(doc(db, 'messages', id));
      } else {
        await updateDoc(doc(db, 'messages', id), { status });
      }
    } catch (err) {
      console.error("Permission error (Rules might need update):", err);
    }
  };

  const saveBio = async () => {
    try {
      await setDoc(doc(db, 'config', 'general'), { bio: bioText }, { merge: true });
      setIsEditingBio(false);
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw className="animate-spin text-primary w-8 h-8" />
      <p className="text-white/40">جاري التحميل...</p>
    </div>
  );

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-8">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">لوحة التحكم</h2>
          <p className="text-white/40">يرجى إدخال كلمة المرور للمتابعة</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="كلمة المرور"
            className={cn(
              "w-full bg-white/5 border rounded-2xl py-4 px-6 text-center text-xl outline-none transition-all",
              error ? "border-red-500 animate-shake" : "border-white/10 focus:border-primary"
            )}
          />
          <button 
            onClick={handleUnlock}
            className="w-full bg-primary text-bg font-bold py-4 rounded-2xl hover:opacity-90 transition-all active:scale-95"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gold-text">لوحة التحكم</h2>
        <button 
          onClick={handleAdminLogout}
          className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors"
        >
          <span>تسجيل الخروج</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} label="عدد الدعوات" value={stats.amenCount} />
        <StatCard icon={BookOpen} label="الختمات المكتملة" value={stats.completedKhatmas} />
        <StatCard icon={Clock} label="رسائل الزوار" value={messages.length} />
      </div>

      {/* Content Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">إدارة نصوص الموقع</h3>
          {!isEditingBio ? (
            <button onClick={() => setIsEditingBio(true)} className="p-2 bg-white/5 rounded-lg text-primary hover:bg-white/10 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={saveBio} className="px-4 py-2 bg-primary text-bg rounded-lg font-bold text-xs uppercase hover:opacity-90 transition-opacity">حفظ</button>
          )}
        </div>
        
        <div className="bg-card p-6 rounded-2xl border border-white/5">
          <label className="block text-xs text-white/40 mb-2 font-medium">نص السيرة (سيرة عطرة)</label>
          <textarea
            disabled={!isEditingBio}
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[160px] focus:border-primary outline-none transition-all disabled:opacity-50 text-white/80 resize-none"
            placeholder="اكتب هنا سيرة الفقيد..."
          />
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">إدارة رسائل الزوار</h3>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-card p-12 rounded-2xl border border-white/5 text-center text-white/20">
              لا توجد رسائل حالياً
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-card p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                     <p className="text-xs text-white/30">{msg.createdAt?.toDate?.()?.toLocaleString() || "جاري التحميل..."}</p>
                     <p className="text-white/80 leading-relaxed">{msg.text}</p>
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase ${msg.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                     {msg.status === 'approved' ? 'منشورة' : 'انتظار'}
                   </span>
                </div>
                
                <div className="flex gap-2 justify-end border-t border-white/5 pt-4">
                  {msg.status !== 'approved' && (
                    <button 
                      onClick={() => handleMessageStatus(msg.id, 'approved')}
                      className="flex items-center gap-2 bg-green-500 text-bg px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle className="w-3 h-3" />
                      موافقة
                    </button>
                  )}
                  <button 
                    onClick={() => handleMessageStatus(msg.id, 'rejected')}
                    className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-white/5 flex items-center gap-6">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="text-white/40 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
