import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoPngUrl from "../assets/logo.png";
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "./dateFormat";

function safeString(value) {
  if (value === null || value === undefined) return "-";
  const s = String(value);
  return s.trim() ? s : "-";
}

function formatPublicId(value) {
  const s = String(value || "").trim();
  if (!s) return "-";
  const base = s.split("-")[0] || s;
  if (base && base.length >= 6) return `EVEGAH-${base.toUpperCase()}`;
  return s;
}

function formatDateTime(value) {
  return formatDateTimeDDMMYYYY(value, safeString(value));
}

function maskAadhaar(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 12) return safeString(value);
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function toInr(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return safeString(value);
  return `₹ ${n.toFixed(2)}`;
}

const BRAND = {
  primary: [26, 87, 74],
  border: [210, 210, 210],
  mutedText: [90, 90, 90],
};

async function downscaleDataUrl(dataUrl, {
  maxWidth = 1000,
  maxHeight = 400,
  mimeType = "image/jpeg",
  quality = 0.75,
} = {}) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return null;
  }

  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // White background for JPEG
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const out = canvas.toDataURL(mimeType, quality);
        resolve(out || dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

let cachedLogoDataUrl = null;
let cachedLogoJpegDataUrl = null;

async function urlToDataUrl(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Logo fetch failed");
  const blob = await resp.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Logo read failed"));
    reader.readAsDataURL(blob);
  });
}

async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    cachedLogoDataUrl = await urlToDataUrl(logoPngUrl);
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

async function getLogoJpegDataUrl() {
  if (cachedLogoJpegDataUrl) return cachedLogoJpegDataUrl;
  const png = await getLogoDataUrl();
  if (!png) return null;
  cachedLogoJpegDataUrl =
    (await downscaleDataUrl(png, { maxWidth: 600, maxHeight: 600, mimeType: "image/jpeg", quality: 0.75 })) || png;
  return cachedLogoJpegDataUrl;
}

function drawHeader(doc, { receiptNo, generatedAt, logoDataUrl }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerTop = 10;
  const headerBottom = 44;

  // Logo
  if (logoDataUrl && logoDataUrl.startsWith("data:image/")) {
    try {
      doc.addImage(logoDataUrl, "JPEG", margin, headerTop, 26, 26);
    } catch {
      // ignore
    }
  }

  // Title
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Rider Registration", margin + 30, headerTop + 9);

  doc.setFontSize(12);
  doc.setTextColor(...BRAND.mutedText);
  doc.text("Payment Receipt", margin + 30, headerTop + 16);

  // Receipt meta (right)
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.mutedText);
  doc.text(`Receipt No: ${safeString(receiptNo)}`, pageWidth - margin, headerTop + 9, {
    align: "right",
  });
  doc.text(`Date: ${safeString(generatedAt)}`, pageWidth - margin, headerTop + 16, {
    align: "right",
  });

  // Accent bars (similar layout to provided sample)
  doc.setFillColor(...BRAND.primary);
  doc.rect(margin, headerBottom - 10, pageWidth - margin * 2, 8, "F");
  doc.setFillColor(230, 243, 239);
  doc.rect(margin, headerBottom - 2, pageWidth - margin * 2, 2, "F");

  return headerBottom;
}

function addSection(doc, title, rows) {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = (doc.lastAutoTable?.finalY || 44) + 10;

  doc.setFillColor(...BRAND.primary);
  doc.rect(margin, startY, pageWidth - margin * 2, 8, "F");
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text(title, margin + 3, startY + 5.6);

  autoTable(doc, {
    startY: startY + 10,
    theme: "grid",
    body: rows,
    styles: { fontSize: 10, cellPadding: 2, textColor: 30 },
    tableLineColor: BRAND.border,
    tableLineWidth: 0.2,
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold", textColor: 60 },
      1: { cellWidth: pageWidth - margin * 2 - 58 },
    },
    margin: { left: margin, right: margin },
  });
}

function addBulletedSection(doc, title, bullets) {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = (doc.lastAutoTable?.finalY || 44) + 10;

  doc.setFillColor(...BRAND.primary);
  doc.rect(margin, startY, pageWidth - margin * 2, 8, "F");
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text(title, margin + 3, startY + 5.6);

  const rows = (bullets || []).map((text, idx) => [`${idx + 1}.`, safeString(text)]);

  autoTable(doc, {
    startY: startY + 10,
    theme: "grid",
    body: rows,
    styles: { fontSize: 9, cellPadding: 2, textColor: 30, valign: "top" },
    tableLineColor: BRAND.border,
    tableLineWidth: 0.2,
    columnStyles: {
      0: { cellWidth: 14, fontStyle: "bold", textColor: 60 },
      1: { cellWidth: pageWidth - margin * 2 - 14 },
    },
    margin: { left: margin, right: margin },
  });
}

function ensureSpace(doc, requiredHeightMm) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentY = (doc.lastAutoTable?.finalY || 20) + 10;
  if (currentY + requiredHeightMm > pageHeight - 10) {
    doc.addPage();
  }
}

export async function downloadRiderReceiptPdf({ formData, registration } = {}) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });

  const receiptGeneratedAt = new Date();
  const receiptNo = registration?.rentalId || registration?.riderId
    ? formatPublicId(registration?.rentalId || registration?.riderId)
    : `LOCAL-${receiptGeneratedAt.getTime()}`;

  const logoDataUrl = await getLogoJpegDataUrl();
  drawHeader(doc, {
    receiptNo,
    generatedAt: formatDateTimeDDMMYYYY(receiptGeneratedAt, "-"),
    logoDataUrl,
  });

  // Rider details
  addSection(doc, "Rider Details", [
    ["Rider Unique ID", safeString(registration?.riderCode)],
    ["Full Name", safeString(formData?.name || formData?.fullName)],
    ["Mobile", safeString(formData?.phone || formData?.mobile)],
    ["Aadhaar", maskAadhaar(formData?.aadhaar)],
    ["DOB", formatDateDDMMYYYY(formData?.dob, safeString(formData?.dob))],
    ["Gender", safeString(formData?.gender)],
    ["Operational Zone", safeString(formData?.operationalZone)],
    ["Reference", safeString(formData?.reference)],
    ["Permanent Address", safeString(formData?.permanentAddress)],
    ["Temporary Address", safeString(formData?.temporaryAddress)],
  ]);

  // Rental details
  addSection(doc, "Rental Details", [
    ["Rental Start", formatDateTime(formData?.rentalStart)],
    ["Return Date", formatDateTime(formData?.rentalEnd)],
    ["Package", safeString(formData?.rentalPackage)],
    ["Bike Model", safeString(formData?.bikeModel)],
    ["Bike ID", safeString(formData?.bikeId)],
    ["Battery ID", safeString(formData?.batteryId)],
    [
      "Accessories",
      Array.isArray(formData?.accessories) && formData.accessories.length
        ? formData.accessories.join(", ")
        : "-",
    ],
    ["Other Accessories", safeString(formData?.otherAccessories)],
  ]);

  // Payment receipt
  addSection(doc, "Payment Receipt", [
    ["Payment Mode", safeString(formData?.paymentMode || formData?.paymentMethod)],
    ["Rental Amount", toInr(formData?.rentalAmount)],
    ["Security Deposit", toInr(formData?.securityDeposit)],
    ["Total Amount", toInr(formData?.totalAmount)],
    ["Amount Paid", toInr(formData?.amountPaid || formData?.paidAmount || formData?.totalAmount)],
  ]);

  // Agreement summary
  addSection(doc, "Agreement", [
    ["Accepted", formData?.agreementAccepted ? "Yes" : "No"],
    ["Agreement Date", formatDateTime(formData?.agreementDate)],
    ["Issued By", safeString(formData?.issuedByName)],
  ]);

  // Terms & Conditions
  addBulletedSection(doc, "Terms & Conditions", [
    "This receipt is proof of payment only; it does not guarantee vehicle availability.",
    "Security deposit (if any) is refundable subject to vehicle return and inspection as per company policy.",
    "Rider must carry valid ID and follow all traffic rules and local regulations.",
    "Charges may apply for damages, missing accessories, late returns, or policy violations.",
    "For corrections or support, contact the EVegah team with the receipt number.",
  ]);

  // Signature (optional)
  const signatureDataUrl =
    typeof formData?.riderSignature === "string" ? formData.riderSignature : "";

  if (signatureDataUrl && signatureDataUrl.startsWith("data:image/")) {
    ensureSpace(doc, 50);
    const y = (doc.lastAutoTable?.finalY || 20) + 14;
    doc.setFillColor(...BRAND.primary);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(11);
    doc.setTextColor(255);
    doc.text("Rider Signature", 17, y + 5.6);

    try {
      const signatureOptimized =
        (await downscaleDataUrl(signatureDataUrl, {
          maxWidth: 900,
          maxHeight: 300,
          mimeType: "image/jpeg",
          quality: 0.75,
        })) || signatureDataUrl;

      // Place signature box
      doc.setDrawColor(...BRAND.border);
      doc.rect(14, y + 10, 80, 30);
      doc.addImage(signatureOptimized, "JPEG", 16, y + 12, 76, 26);
    } catch {
      // Ignore image failures; the rest of the PDF is still valuable.
    }
  }

  ensureSpace(doc, 20);
  const footerY = (doc.lastAutoTable?.finalY || 20) + 18;
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    "This is a system-generated receipt. Please keep it for your records.",
    14,
    footerY
  );

  const phoneDigits =
    String(formData?.phone || formData?.mobile || "").replace(/\D/g, "").slice(-10) || "unknown";
  const ddmmyyyy = formatDateDDMMYYYY(receiptGeneratedAt, receiptGeneratedAt.toISOString().slice(0, 10));
  const code = String(registration?.riderCode || "").trim();
  const codePart = code ? `-${code}` : "";
  doc.save(`evegah-receipt${codePart}-${phoneDigits}-${ddmmyyyy}.pdf`);
}
