import { useState } from "react";
import { apiFetch } from "../../config/api";

export default function DeleteModal({ rider, bulkIds = [], close, reload, onBulkSuccess }) {
  const isBulk = Array.isArray(bulkIds) && bulkIds.length > 0;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteRider() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      if (isBulk) {
        try {
          await apiFetch("/api/riders/bulk-delete", {
            method: "POST",
            body: { ids: bulkIds },
          });
        } catch (bulkError) {
          // Fallback for older production backends where bulk-delete may be missing or broken.
          // Delete riders one-by-one using the existing single-delete endpoint.
          for (const id of bulkIds) {
            if (!id) continue;
            await apiFetch(`/api/riders/${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
          }
        }
      } else if (rider && rider.id) {
        await apiFetch(`/api/riders/${encodeURIComponent(rider.id)}`, {
          method: "DELETE",
        });
      }
      reload();
      if (isBulk && typeof onBulkSuccess === "function") {
        onBulkSuccess();
      }
      close();
    } catch (e) {
      setError(String(e?.message || e || "Unable to delete"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-6 z-50">
      <div className="bg-white p-6 rounded-xl w-[380px] shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4">
          {isBulk ? "Delete Selected Riders?" : "Delete Rider?"}
        </h2>
        <p className="text-gray-600 mb-6">
          {isBulk ? (
            <>
              Are you sure you want to delete the selected <strong>{bulkIds.length}</strong> riders?
            </>
          ) : (
            <>
              Are you sure you want to delete <strong>{rider?.full_name || "this rider"}</strong>?
            </>
          )}
        </p>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm text-left">
          {error}
        </div>
      ) : null}

        <div className="flex justify-center gap-3">
          <button onClick={close} disabled={deleting} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-60">
            Cancel
          </button>
          <button
            onClick={deleteRider}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-60"
          >
			{deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
