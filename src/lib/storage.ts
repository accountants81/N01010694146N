export const LOCAL_STORAGE_KEYS = {
  AMEN_COUNT: 'sadaka_amen_count_v2',
  HAS_PRAYED: 'sadaka_has_prayed_v2',
  QURAN_STATE: 'sadaka_quran_state_v2',
  COMPLETED_KHATMAS: 'sadaka_completed_khatmas_v2',
  TREASURES_PROGRESS: 'sadaka_treasures_progress_v2',
  VISITOR_MESSAGES: 'sadaka_visitor_messages_v2',
  BIO_TEXT: 'sadaka_bio_text_v2',
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

export const setStorageItem = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};
