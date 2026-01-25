import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch } from "../../config/api";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatRentalId, formatReturnId } from "../../utils/entityId";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";

export default function ReturnsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async ({ showLoading } = {}) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const rows = await apiFetch("/api/returns");
      setData(rows || []);
    } catch (e) {
      setData([]);
      setError(String(e?.message || e || "Unable to load returns"));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    load({ showLoading: true });
    const interval = setInterval(() => {
      if (!mounted) return;
      load({ showLoading: false });
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fmtDateTime = (value) => {
    return formatDateTimeDDMMYYYY(value, "-");
  };

  const formatINR = (value) => {
    const n = Number(value || 0);
    const safe = Number.isFinite(n) ? n : 0;
    return `₹${safe.toLocaleString("en-IN")}`;
  };

  const rows = useMemo(() => {
    return (data || []).map((r) => {
      const depositReturned = Boolean(r?.deposit_returned);
      const depositReturnedAmount = Number(r?.deposit_returned_amount || 0);
      const rentalIdDisplay = formatRentalId(r?.rental_id);
      const returnIdDisplay = formatReturnId(r?.return_id);
      return {
        ...r,
        rider_full_name_display: r?.rider_full_name || "-",
        rider_mobile_display: r?.rider_mobile || "-",
        deposit_returned_display: depositReturned ? "Returned" : "-",
        deposit_returned_amount_value: depositReturned ? depositReturnedAmount : 0,
        rental_id_display: rentalIdDisplay,
        return_id_display: returnIdDisplay,
      };
    });
  }, [data]);

  const filteredRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r?.rider_full_name,
        r?.rider_mobile,
        r?.rider_code,
        r?.vehicle_number,
        r?.bike_id,
        r?.battery_id,
        r?.payment_mode,
        r?.condition_notes,
        r?.rental_id,
        r?.return_id,
        r?.rental_id_display,
        r?.return_id_display,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
  }, [rows, search]);

  const summary = useMemo(() => {
    const totalReturns = filteredRows.length;
    const depositReturnedTotal = filteredRows.reduce(
      (sum, r) => sum + Number(r.deposit_returned_amount_value || 0),
      0
    );
    return { totalReturns, depositReturnedTotal };
  }, [filteredRows]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / pageSize));
  }, [filteredRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold">Returns</h1>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Total Returns</p>
            <h2 className="text-2xl font-bold">{summary.totalReturns}</h2>
          </div>
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Deposit Returned Total</p>
            <h2 className="text-2xl font-bold text-green-700">{formatINR(summary.depositReturnedTotal)}</h2>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white border rounded-xl shadow p-4 flex items-center gap-4">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md w-full">
            <Search size={16} className="text-gray-600" />
            <input
              className="bg-transparent outline-none ml-2 w-full"
              placeholder="Search rider, mobile, vehicle, bike, battery, rental id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}

        {/* TABLE */}
        <div className="bg-white border rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Rider</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">E-Bike ID</th>
                <th className="px-4 py-3 text-left">Battery ID</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">Returned At</th>
                <th className="px-4 py-3 text-left">Deposit</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Rental ID</th>
                <th className="px-4 py-3 text-left">Return ID</th>
              </tr>
            </thead>

            <tbody>
              {pageRows.map((r, i) => {
                const depositTone = r.deposit_returned_amount_value > 0 ? "text-green-700" : "text-gray-600";
                return (
                  <tr key={r.return_id || i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{r.rider_full_name_display}</div>
                      <div className="text-xs text-gray-500">{r.rider_code || ""}</div>
                    </td>
                    <td className="px-4 py-2">{r.rider_mobile_display}</td>
                    <td className="px-4 py-2">{r.vehicle_number || "-"}</td>
                    <td className="px-4 py-2">{r.bike_id || "-"}</td>
                    <td className="px-4 py-2">{r.battery_id || "-"}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.start_time)}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.returned_at)}</td>
                    <td className={`px-4 py-2 font-semibold ${depositTone}`}>
                      {r.deposit_returned_amount_value > 0 ? formatINR(r.deposit_returned_amount_value) : "-"}
                    </td>
                    <td className="px-4 py-2 max-w-md">
                      <span className="line-clamp-2">{r.condition_notes || "-"}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">{r.rental_id_display}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">{r.return_id_display}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && !loading ? (
            <div className="p-6 text-center text-gray-500">No records found</div>
          ) : null}

          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Page {page} / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
