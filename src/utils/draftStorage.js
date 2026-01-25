const readJson = (key, fallback = null) => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error("Failed to read localStorage key", key, error);
    return fallback;
  }
};

export const DRAFT_FORM_KEY = "evegah_rider_draft";
export const DRAFT_META_KEY = "evegah_rider_draft_meta";

export const loadDraftForm = () => readJson(DRAFT_FORM_KEY, {});

export const loadDraftMeta = () => readJson(DRAFT_META_KEY, null);

export const saveDraftMeta = (meta) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.error("Failed to save draft meta", error);
  }
};

export const clearDraftMeta = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_META_KEY);
};

export const clearDraftStorage = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_FORM_KEY);
  window.localStorage.removeItem(DRAFT_META_KEY);
};
