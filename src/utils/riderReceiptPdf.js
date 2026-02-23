import { apiFetchBlob } from "../config/api";

function getFileNameFromContentDisposition(contentDisposition) {
  const header = String(contentDisposition || "").trim();
  if (!header) return "EVegah_Receipt.pdf";

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/[\\/:*?"<>|]+/g, "_");
    } catch {
      return utf8Match[1].replace(/[\\/:*?"<>|]+/g, "_");
    }
  }

  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].replace(/[\\/:*?"<>|]+/g, "_");
  }

  return "EVegah_Receipt.pdf";
}

export async function downloadRiderReceiptPdf({ formData, registration } = {}) {
  const { blob, contentType, contentDisposition } = await apiFetchBlob("/api/receipts/rider/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
    },
    body: JSON.stringify({ formData: formData || {}, registration: registration || {} }),
  });

  const pdfBlob =
    contentType && String(contentType).toLowerCase().includes("pdf")
      ? blob
      : new Blob([blob], { type: "application/pdf" });

  const downloadName = getFileNameFromContentDisposition(contentDisposition);
  const objectUrl = URL.createObjectURL(pdfBlob);

  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = downloadName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
