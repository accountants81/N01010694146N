import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CircleCheck, User, Lock, BookOpen, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, collection, onSnapshot, setDoc, updateDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: localStorage.getItem('quran_user_id'), // Report the local pseudo-ID in logs
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type PartStatus = 'available' | 'reserved' | 'completed';

interface Part {
  id: number;
  status: PartStatus;
  userName?: string;
  ownerId?: string;
  readCount?: number;
}

const getUserId = () => {
  let id = localStorage.getItem('quran_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('quran_user_id', id);
  }
  return id;
};

interface PartItemProps {
  part: Part;
  onClick: (id: number) => void;
}

const PartItem = memo(({ part, onClick }: PartItemProps) => {
  return (
    <div
      key={part.id}
      onClick={() => onClick(part.id)}
      className={cn(
        "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative group cursor-pointer active:scale-95",
        part.status === 'available' && "bg-card border border-white/5",
        part.status === 'reserved' && "bg-[#333333] border border-white/10",
        part.status === 'completed' && "bg-primary/20 border border-primary/40"
      )}
    >
      {/* Read Count badge */}
      <div className="absolute -top-1 -right-1 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-1.5 py-0.5 z-10 pointer-events-none">
        <span className="text-[7px] text-primary font-bold">قرئ {part.readCount || 0}</span>
      </div>

      <span className={cn(
        "text-xl font-bold transition-transform duration-300",
        part.status === 'completed' ? "text-primary" : "text-white/80"
      )}>
        {part.id}
      </span>
      
      {part.status === 'reserved' && (
        <div className="flex flex-col items-center w-full px-2 overflow-hidden">
          <span className="text-[7px] text-white/40 truncate w-full text-center">
            {part.userName}
          </span>
        </div>
      )}
      
      {part.status === 'completed' && (
        <CircleCheck className="w-4 h-4 text-primary opacity-60 mt-1" />
      )}
    </div>
  );
});

PartItem.displayName = 'PartItem';

export default function Quran() {
  const [parts, setParts] = useState<Part[]>([]);
  const [completedKhatmas, setCompletedKhatmas] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState<number | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<number | null>(null);
  const [reserveName, setReserveName] = useState('');
  const [userId] = useState(getUserId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<number | null>(null);

  // Sync parts status
  useEffect(() => {
    let fired = false;
    const timeout = setTimeout(() => {
      if (!fired && isLoading) {
        setError('تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت أو إعدادات Firebase.');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const unsub = onSnapshot(collection(db, 'parts'), (snapshot) => {
      fired = true;
      clearTimeout(timeout);
      setError(null);
      
      const partsMap: Record<number, Part> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Omit<Part, 'id'>;
        const id = parseInt(docSnapshot.id);
        partsMap[id] = { ...data, id };
      });

      const fullParts = Array.from({ length: 30 }, (_, i) => {
        const id = i + 1;
        return partsMap[id] || { id, status: 'available' as const };
      });
      setParts(fullParts);
      setIsLoading(false);
    }, (err) => {
      fired = true;
      clearTimeout(timeout);
      console.error("Firestore parts sync error:", err);
      // Don't throw here to avoid crashing the whole UI, just show error state
      setError('حدث خطأ أثناء تحميل البيانات. يرجى التأكد من إضافة نطاق الموقع (Domain) إلى قائمة النطاقات المصرح بها في Firebase.');
      setIsLoading(false);
    });

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  // Sync khatmas count
  useEffect(() => {
    const statsRef = doc(db, 'stats', 'global');
    const unsub = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCompletedKhatmas(data?.completedKhatmas || 0);
      } else {
        // Initialize if not exists
        setDoc(statsRef, { amenCount: 0, completedKhatmas: 0 }, { merge: true }).catch(err => {
           console.warn("Could not init stats:", err);
        });
      }
    });

    return () => unsub();
  }, []);

  const handlePartClick = (partId: number) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    if (part.status === 'available') {
      setShowReservationModal(partId);
    } else {
      setShowInfoModal(partId);
    }
  };

  const confirmReservation = async () => {
    if (!reserveName.trim() || showReservationModal === null) return;

    const partId = showReservationModal;
    const path = `parts/${partId}`;
    setProcessingId(partId);
    try {
      await setDoc(doc(db, 'parts', partId.toString()), {
        status: 'reserved' as const,
        userName: reserveName.trim(),
        ownerId: userId,
        readCount: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setShowReservationModal(null);
      setReserveName('');
      setProcessingId(null);
    }
  };

  const cancelReservation = async (partId: number) => {
    const path = `parts/${partId}`;
    setProcessingId(partId);
    try {
      await updateDoc(doc(db, 'parts', partId.toString()), {
        status: 'available' as const,
        userName: '',
        ownerId: '',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setShowInfoModal(null);
      setProcessingId(null);
    }
  };

  const markAsCompleted = async (partId: number) => {
    const path = `parts/${partId}`;
    setProcessingId(partId);
    try {
      await updateDoc(doc(db, 'parts', partId.toString()), {
        status: 'completed' as const,
        readCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Auto-reset khatma if all done
      const currentParts = [...parts];
      const updatedParts = currentParts.map(p => p.id === partId ? { ...p, status: 'completed' as const } : p);
      
      if (updatedParts.every(p => p.status === 'completed')) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'stats', 'global'), {
          completedKhatmas: increment(1)
        });
        
        for (let i = 1; i <= 30; i++) {
          batch.set(doc(db, 'parts', i.toString()), {
            status: 'available',
            userName: '',
            ownerId: '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setShowInfoModal(null);
      setProcessingId(null);
    }
  };

  const undoCompletion = async (partId: number) => {
    const path = `parts/${partId}`;
    setProcessingId(partId);
    try {
      await updateDoc(doc(db, 'parts', partId.toString()), {
        status: 'reserved' as const,
        readCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setShowInfoModal(null);
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/60 font-medium animate-pulse text-lg">جاري الاتصال بقاعدة البيانات...</p>
        <p className="text-white/20 text-xs">يرجى الانتظار قليلاً</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 bg-red-500/5 rounded-[2.5rem] border border-red-500/10">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">عذراً، فشل الاتصال</h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
            {error}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 active:scale-95"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 glass-card rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 rotate-3 gold-shadow">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-bold gold-text pb-2">ختمة القرآن الجماعية</h2>
          <p className="text-white/40 text-sm md:text-base max-w-sm mx-auto">شاركونا في ختم كتاب الله وإهداء ثوابه لروح الفقيد، ليكون نوراً له في قبره</p>
        </div>

        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-center">
             <p className="text-primary text-3xl font-black">{completedKhatmas}</p>
             <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">ختمات مكتملة</p>
          </div>
          <div className="w-px h-12 bg-white/5" />
          <div className="text-center">
             <p className="text-white text-3xl font-black">
               {parts.filter(p => p.status === 'completed').length}/30
             </p>
             <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">الختمة الحالية</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
        {parts.map((part) => (
          <PartItem 
            key={part.id} 
            part={part} 
            onClick={handlePartClick} 
          />
        ))}
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showReservationModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReservationModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card p-8 rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-center mb-2">حجز الجزء {showReservationModal}</h3>
              <p className="text-white/40 text-xs text-center mb-6">هل تود حجز هذا الجزء لقراءته؟</p>
              
              <input 
                autoFocus
                type="text" 
                value={reserveName}
                onChange={(e) => setReserveName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-primary outline-none transition-all text-center mb-6"
                placeholder="أدخل اسمك"
              />
              
              <div className="flex gap-3">
                <button 
                  disabled={processingId !== null}
                  onClick={confirmReservation}
                  className="flex-1 bg-primary text-bg font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === showReservationModal ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'تأكيد الحجز'}
                </button>
                <button 
                  disabled={processingId !== null}
                  onClick={() => setShowReservationModal(null)}
                  className="flex-1 bg-white/5 py-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info / Completion Modal */}
      <AnimatePresence>
        {showInfoModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card p-8 rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl"
            >
              {(() => {
                const part = parts.find(p => p.id === showInfoModal);
                if (!part) return null;
                const isOwner = part.ownerId === userId;
                
                return (
                  <>
                    <h3 className="text-xl font-bold text-center mb-1">الجزء {part.id}</h3>
                    <div className="flex justify-center mb-6">
                      <span className="text-[10px] text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        قرئ {part.readCount || 0} مرات
                      </span>
                    </div>

                    <div className="space-y-4 text-center">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <User className="w-6 h-6 text-primary/40 mx-auto mb-2" />
                        <p className="text-white/60 text-sm">بواسطة</p>
                        <p className="text-lg font-bold text-primary">{part.userName}</p>
                        <p className="text-[10px] text-white/30 mt-1">حالة الجزء: {part.status === 'completed' ? 'تم القراءة' : 'قيد القراءة'}</p>
                      </div>

                      {isOwner && (
                        <div className="grid gap-3">
                          {part.status === 'reserved' && (
                            <button 
                              disabled={processingId !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsCompleted(part.id);
                              }}
                              className="w-full bg-primary text-bg font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {processingId === part.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'تمت القراءة بنجاح'}
                            </button>
                          )}
                          {part.status === 'completed' && (
                            <button 
                              disabled={processingId !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                undoCompletion(part.id);
                              }}
                              className="w-full bg-white/10 text-white/80 font-bold py-3 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {processingId === part.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'تراجع عن الإتمام'}
                            </button>
                          )}
                          <button 
                            disabled={processingId !== null}
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelReservation(part.id);
                            }}
                            className="w-full bg-red-500/10 text-red-400 font-medium py-3 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {processingId === part.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'إلغاء الحجز'}
                          </button>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setShowInfoModal(null)}
                        className="w-full py-2 text-white/30 text-sm hover:text-white/50 transition-colors"
                      >
                        إغلاق
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
