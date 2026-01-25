import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

export default function Invoice() {
  const { receiptId } = useParams();

  const normalizedId = useMemo(() => {
    const v = String(receiptId || "").trim();
    return v || null;
  }, [receiptId]);

  const pdfUrl = useMemo(() => {
    if (!normalizedId) return null;
    const fileName = `receipt_${normalizedId}.pdf`;
    return `/api/uploads/${encodeURIComponent(fileName)}`;
  }, [normalizedId]);

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
