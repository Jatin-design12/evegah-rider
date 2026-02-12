import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

export default function Invoice() {
  const { receiptId, "*": invoicePath } = useParams();

  const decodeSafe = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  const normalizedId = useMemo(() => {
    const fromId = decodeSafe(receiptId);
    const fromPath = decodeSafe(invoicePath);

    // Case 1: /invoice/<id>
    if (fromId && !fromPath) return fromId;

    // Case 2: /invoice/api/uploads/<file>.pdf OR encoded variant.
    // Keep a readable label when the value is a path by showing final filename.
    const candidate = fromPath || fromId;
    if (!candidate) return null;

    if (candidate.includes("/")) {
      const parts = candidate.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    }

    return candidate;
  }, [receiptId, invoicePath]);

  const pdfUrl = useMemo(() => {
    const fromPathRaw = decodeSafe(invoicePath);
    const fromIdRaw = decodeSafe(receiptId);
    const raw = fromPathRaw || fromIdRaw;
    if (!raw) return null;

    // If WhatsApp button passed an uploads path, use it directly.
    // Supported examples:
    // - api/uploads/receipt_xxx.pdf
    // - /api/uploads/receipt_xxx.pdf
    // - uploads/receipt_xxx.pdf
    // - /uploads/receipt_xxx.pdf
    // Also handles malformed values like "{{1}}api/uploads/file.pdf".
    const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
    const normalizedRaw = withoutOrigin
      .replace(/^\{\{1\}\}/, "")
      .replace(/^%7B%7B1%7D%7D/i, "")
      .replace(/^\/+/, "");

    const uploadsMatch = normalizedRaw.match(/(?:^|\/)(api\/uploads\/.+|uploads\/.+)/i);
    if (uploadsMatch?.[1]) {
      return `/${uploadsMatch[1].replace(/^\/+/, "")}`;
    }

    // Otherwise treat it as receipt id and use the legacy naming convention.
    const fileName = `receipt_${raw}.pdf`;
    return `/api/uploads/${encodeURIComponent(fileName)}`;
  }, [receiptId, invoicePath]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-evegah-text">EVegah Receipt</h1>
          <p className="text-sm text-gray-500">
            {normalizedId ? (
              <>Receipt ID: <span className="font-medium text-gray-700">{normalizedId}</span></>
            ) : (
              "Missing receipt ID"
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-lg border border-evegah-border bg-white px-3 py-2 text-sm text-evegah-text hover:bg-gray-50"
          >
            Back
          </Link>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              className="rounded-lg bg-evegah-primary px-3 py-2 text-sm font-medium text-white hover:opacity-95"
              download
            >
              Download PDF
            </a>
          ) : null}
        </div>
      </div>

      {pdfUrl ? (
        <div className="overflow-hidden rounded-xl border border-evegah-border bg-white">
          <iframe
            title="Receipt PDF"
            src={pdfUrl}
            className="h-[80vh] w-full"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-evegah-border bg-white p-4 text-sm text-gray-600">
          Invalid receipt link.
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        If the PDF does not load, use the Download button.
      </div>
    </div>
  );
}
