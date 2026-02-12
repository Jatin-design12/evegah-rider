import SignatureCanvas from "react-signature-canvas";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function SignaturePad({ value, onChange, height = 180 }) {
  const sigRef = useRef(null);
  const containerRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const [width, setWidth] = useState(700);
  const [saveError, setSaveError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const lastLoadedRef = useRef({ value: undefined, width: undefined, height: undefined });
  const isSaved = Boolean(value);

  useLayoutEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.max(260, Math.floor(el.clientWidth));
      setWidth(next);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!sigRef.current) return;

    const prev = lastLoadedRef.current;
    if (prev.value === value && prev.width === width && prev.height === height) return;
    lastLoadedRef.current = { value, width, height };

    if (!value) {
      // Only clear when parent explicitly sets value to null/empty after previously having a value.
      sigRef.current.clear();
      return;
    }

    // Draw the saved image scaled to the current canvas size.
    // This avoids the signature shifting to a corner (or appearing double) after Save or resize.
    try {
      const canvas = sigRef.current.getCanvas?.();
      const ctx = canvas?.getContext?.("2d");
      if (!canvas || !ctx) {
        sigRef.current.clear();
        sigRef.current.fromDataURL(value);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Clear both the signature pad internal state and the visible pixels.
        sigRef.current?.clear?.();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    } catch {
      // ignore invalid data urls
    }
  }, [value, width, height]);

  const handleClear = () => {
    sigRef.current?.clear();
    setSaveError("");
    setSavedNote("");
    onChange?.(null);
  };

  const handleSave = () => {
    if (!sigRef.current) return;
    if (sigRef.current.isEmpty()) {
      setSaveError("Please provide a signature first.");
      setSavedNote("");
      return;
    }
    setSaveError("");
    const dataUrl = sigRef.current.toDataURL("image/png");

    // Prevent an immediate value-driven re-draw (which can make the signature appear doubled
    // or shifted) by marking this value as already loaded for the current canvas size.
    lastLoadedRef.current = { value: dataUrl, width, height };

    onChange?.(dataUrl);
    setSavedNote("Signature saved.");
  };

  const handleBegin = () => {
    if (savedNote) {
      setSavedNote("");
    }
    setSaveError("");
  };

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={canvasWrapRef}
        className={`w-full overflow-hidden rounded-xl border border-evegah-border bg-gray-50 ${
          isSaved ? "pointer-events-none" : ""
        }`}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={
            {
              width,
              height,
              className: "block bg-gray-50",
            }
          }
          onBegin={handleBegin}
        />
      </div>

      {saveError ? <p className="error mt-2">{saveError}</p> : null}
      {savedNote ? <p className="text-sm text-emerald-600 mt-2">{savedNote}</p> : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="btn-outline disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-evegah-primary"
          disabled={isSaved}
        >
          Save
        </button>
        <button type="button" onClick={handleClear} className="btn-muted text-red-600">
          Clear
        </button>
      </div>
    </div>
  );
}
