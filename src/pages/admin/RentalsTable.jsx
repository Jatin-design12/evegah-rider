import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch } from "../../config/api";
import { Search } from "lucide-react";
import { formatRentalId } from "../../utils/entityId";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";

export default function RentalsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async ({ showLoading } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const rows = await apiFetch("/api/rentals");
      setData(rows || []);
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

  const fmtDateTime = (value) => {
    return formatDateTimeDDMMYYYY(value, "-");
  };

  const formatINR = (value) => {
    const n = Number(value || 0);
    const safe = Number.isFinite(n) ? n : 0;
    return `₹${safe.toLocaleString("en-IN")}`;
  };

  const parseMaybeJson = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const rows = useMemo(() => {
    return (data || []).map((r) => {
      const meta = parseMaybeJson(r?.meta) || {};
      const expected = r?.expected_end_time || meta?.expected_end_time || "";
      const returnedAt = r?.returned_at || null;
      const status = returnedAt ? "Returned" : "Active";

      const paymentMode = String(r?.payment_mode || "").trim();
      const deposit = Number(r?.deposit_amount || 0);
      const rent = Number(r?.rental_amount || 0);
      const total = Number(r?.total_amount || 0);

      return {
        ...r,
        rental_id_display: formatRentalId(r?.id),
        expected_end_time_value: expected,
        returned_at_value: returnedAt,
        status_display: status,
        payment_mode_display: paymentMode || "-",
        deposit_value: deposit,
        rent_value: rent,
        total_value: total,
      };
    });
  }, [data]);

  const filteredRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && String(r.status_display || "").toLowerCase() !== statusFilter) {
        return false;
      }

      if (!q) return true;
      const hay = [
        r?.rider_full_name,
        r?.rider_mobile,
        r?.rider_code,
        r?.vehicle_number,
        r?.bike_id,
        r?.battery_id,
        r?.rental_package,
        r?.payment_mode_display,
        r?.id,
        r?.rental_id_display,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const totalRentals = filteredRows.length;
    const activeRentals = filteredRows.filter((r) => r.status_display === "Active").length;
    const returnedRentals = totalRentals - activeRentals;
    const depositTotal = filteredRows.reduce((sum, r) => sum + Number(r.deposit_value || 0), 0);
    const rentTotal = filteredRows.reduce((sum, r) => sum + Number(r.rent_value || 0), 0);
    return { totalRentals, activeRentals, returnedRentals, depositTotal, rentTotal };
  }, [filteredRows]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold">Rentals</h1>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Total Rentals</p>
            <h2 className="text-2xl font-bold">{summary.totalRentals}</h2>
          </div>
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Active</p>
            <h2 className="text-2xl font-bold text-green-700">{summary.activeRentals}</h2>
          </div>
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Returned</p>
            <h2 className="text-2xl font-bold text-gray-900">{summary.returnedRentals}</h2>
          </div>
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Deposit Total</p>
            <h2 className="text-2xl font-bold text-green-700">{formatINR(summary.depositTotal)}</h2>
          </div>
          <div className="bg-white shadow rounded-xl p-4 border">
            <p className="text-gray-500 text-sm">Rent Total</p>
            <h2 className="text-2xl font-bold">{formatINR(summary.rentTotal)}</h2>
          </div>
        </div>

        {/* SEARCH + FILTER */}
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

          <select
            className="border rounded-md px-4 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Status filter"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
          </select>
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
                <th className="px-4 py-3 text-left">Expected Return</th>
                <th className="px-4 py-3 text-left">Returned At</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Deposit</th>
                <th className="px-4 py-3 text-right">Rent</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Rental ID</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r, i) => {
                const statusTone = r.status_display === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
                return (
                  <tr key={r.id || i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{r.rider_full_name || "-"}</div>
                      <div className="text-xs text-gray-500">{r.rider_code || ""}</div>
                    </td>
                    <td className="px-4 py-2">{r.rider_mobile || "-"}</td>
                    <td className="px-4 py-2">{r.vehicle_number || "-"}</td>
                    <td className="px-4 py-2">{r.bike_id || "-"}</td>
                    <td className="px-4 py-2">{r.battery_id || "-"}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.start_time)}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.expected_end_time_value)}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.returned_at_value)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusTone}`}>
                        {r.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-green-700">{formatINR(r.deposit_value)}</td>
                    <td className="px-4 py-2 text-right">{formatINR(r.rent_value)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatINR(r.total_value)}</td>
                    <td className="px-4 py-2">{r.payment_mode_display}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-600">{r.rental_id_display}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && !loading ? (
            <div className="p-6 text-center text-gray-500">No records found</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
