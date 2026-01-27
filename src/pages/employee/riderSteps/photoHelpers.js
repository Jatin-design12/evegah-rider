import { apiFetch } from "../../../config/api";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 1.2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];

export const getImageDataUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.previewUrl || value.dataUrl || "";
  }
  return "";
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const getBase64Chunk = (dataUrl) => {
  if (!dataUrl) return "";
  const commaIndex = String(dataUrl).indexOf(",");
  if (commaIndex === -1) return "";
  return dataUrl.slice(commaIndex + 1);
};

const getDataUrlByteSize = (dataUrl) => {
  const base64 = getBase64Chunk(dataUrl);
  if (!base64) return 0;
  const paddingMatch = base64.match(/=+$/);
  const paddingLength = paddingMatch ? paddingMatch[0].length : 0;
  return Math.ceil((base64.length * 3) / 4) - paddingLength;
};

const dataUrlToBlob = (dataUrl) => {
  const base64 = getBase64Chunk(dataUrl);
  if (!base64) return new Blob();
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  const mimeMatch = String(dataUrl || "").match(/^data:([^;]+);base64,/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  return new Blob([buffer], { type: mime });
};

const loadImageFromDataUrl = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to decode image file"));
    img.src = dataUrl;
  });

const createCanvasForImage = (image) => {
  const maxSide = Math.max(image.width, image.height);
  const scale = maxSide > 0 ? Math.min(1, MAX_IMAGE_DIMENSION / maxSide) : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

export const compressImageFile = async (file) => {
  const rawDataUrl = await readFileAsDataUrl(file);
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof Image === "undefined"
  ) {
    return { dataUrl: rawDataUrl, mimeType: file.type };
  }

  const image = await loadImageFromDataUrl(rawDataUrl);
  const canvas = createCanvasForImage(image);
  if (!canvas) {
    return { dataUrl: rawDataUrl, mimeType: file.type };
  }

  const toDataUrl = (quality) => canvas.toDataURL("image/jpeg", quality);
  let finalDataUrl = toDataUrl(IMAGE_QUALITY_STEPS[0]);
  for (const quality of IMAGE_QUALITY_STEPS) {
    const candidate = toDataUrl(quality);
    finalDataUrl = candidate;
    if (getDataUrlByteSize(candidate) <= TARGET_IMAGE_BYTES) {
      break;
    }
  }

  return { dataUrl: finalDataUrl, mimeType: "image/jpeg" };
};

export const uploadCompressedImage = async (file) => {
  const { dataUrl } = await compressImageFile(file);
  const blob = dataUrlToBlob(dataUrl);
  const form = new FormData();
  form.append("photo", blob, file.name || "photo.jpg");
  const upload = await apiFetch("/api/uploads/image", {
    method: "POST",
    body: form,
  });
  return { dataUrl, upload };
};

export const buildUploadedPhotoEntry = (file, dataUrl, upload) => ({
  name: file.name,
  type: upload?.mime_type || file.type,
  size: Number(upload?.size_bytes ?? 0),
  dataUrl,
  previewUrl: dataUrl,
  upload,
  updatedAt: new Date().toISOString(),
});

export const validateImageFile = (file) => {
  if (!file) return "No file selected";
  if (!String(file.type || "").startsWith("image/")) return "Please select an image file";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 10MB or smaller";
  return "";
};
