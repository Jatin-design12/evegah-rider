import { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch } from "../../config/api";
import { ChevronLeft, ChevronRight, Package, DollarSign, Search, Download, RefreshCw, Columns } from "lucide-react";
import { formatRentalId, formatReturnId } from "../../utils/entityId";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";
import { downloadCsv } from "../../utils/downloadCsv";
import { sortRows, toggleSort } from "../../utils/sortRows";


export default function ReturnsTable() {
  const VISIBLE_COLS_STORAGE_KEY = "evegah.admin.returns.visibleCols.v1";
  const COLUMNS_SCROLL_STORAGE_KEY = "evegah.admin.returns.columnsDropdownScrollTop.v1";
  const columnsWrapRef = useRef(null);
  const columnsListRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState("");
  const [depositFilter, setDepositFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState({ key: "returned_at", direction: "desc" });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsScrollTop, setColumnsScrollTop] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [visibleCols, setVisibleCols] = useState({
    rider_full_name_display: true,
    rider_mobile_display: true,
    bike_id: true,
    battery_id: true,
    start_time: true,
    returned_at: true,
    deposit_returned_amount_value: true,
    condition_notes: true,
    feedback: true,
  });

  const columnOptions = [
    { key: "rider_full_name_display", label: "Rider" },
    { key: "rider_mobile_display", label: "Mobile" },
    { key: "bike_id", label: "E-Bike ID" },
    { key: "battery_id", label: "Battery ID" },
    { key: "start_time", label: "Start" },
    { key: "returned_at", label: "Returned At" },
    { key: "deposit_returned_amount_value", label: "Deposit" },
    { key: "condition_notes", label: "Latest Condition" },
    { key: "feedback", label: "Latest Feedback" },
  ];

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
    if (!autoRefresh) return () => { mounted = false; };
    const interval = setInterval(() => {
      if (!mounted) return;
      load({ showLoading: false });
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_COLS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      setVisibleCols((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLUMNS_SCROLL_STORAGE_KEY);
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return;
      setColumnsScrollTop(n);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_COLS_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {
      // ignore
    }
  }, [visibleCols]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!columnsOpen) return;
      const el = columnsWrapRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setColumnsOpen(false);
    };
    const onKeyDown = (e) => {
      if (!columnsOpen) return;
      if (e.key === "Escape") setColumnsOpen(false);
    };
    const onVisibility = () => {
      if (document.hidden) setColumnsOpen(false);
    };
    const onBlur = () => setColumnsOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [columnsOpen]);

  useEffect(() => {
    if (!columnsOpen) return;
    requestAnimationFrame(() => {
      const el = columnsListRef.current;
      if (!el) return;
      el.scrollTop = columnsScrollTop;
    });
  }, [columnsOpen, columnsScrollTop]);

  useEffect(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, depositFilter, fromDate, toDate]);

  const isWithinDateRange = (value, from, to) => {
    if (!from && !to) return true;
    if (!value) return false;
    const t = Date.parse(value);
    if (!Number.isFinite(t)) return false;

    if (from) {
      const start = Date.parse(`${from}T00:00:00`);
      if (Number.isFinite(start) && t < start) return false;
    }
    if (to) {
      const end = Date.parse(`${to}T23:59:59.999`);
      if (Number.isFinite(end) && t > end) return false;
    }
    return true;
  };

  const fmtDateTime = (value) => {
    return formatDateTimeDDMMYYYY(value, "-");
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

  const formatINR = (value) => {
    const n = Number(value || 0);
    const safe = Number.isFinite(n) ? n : 0;
    return `₹${safe.toLocaleString("en-IN")}`;
  };

  const baseRows = useMemo(() => {
    return (data || []).map((r) => {
      const depositReturned = Boolean(r?.deposit_returned);
      const depositReturnedAmount = Number(r?.deposit_returned_amount || 0);
      const returnIdDisplay = formatReturnId(r?.return_id);
      const returnMeta = parseMaybeJson(r?.return_meta);
      const feedback = String(returnMeta?.feedback || "").trim();
      return {
        ...r,
        rider_full_name_display: r?.rider_full_name || "-",
        rider_mobile_display: r?.rider_mobile || "-",
        deposit_returned_display: depositReturned ? "Returned" : "-",
        deposit_returned_amount_value: depositReturned ? depositReturnedAmount : 0,
        return_id_display: returnIdDisplay,
        feedback,
      };
    });
  }, [data]);

  const rentalIdMap = useMemo(() => {
    const map = new Map();
    const byRider = new Map();

    baseRows.forEach((r) => {
      const key = String(r?.rider_id || r?.rider_mobile || r?.rider_code || "").trim();
      if (!key) return;
      const list = byRider.get(key) || [];
      list.push(r);
      byRider.set(key, list);
    });

    byRider.forEach((list) => {
      const sorted = [...list].sort((a, b) => Date.parse(a?.start_time || "") - Date.parse(b?.start_time || ""));
      sorted.forEach((ride, index) => {
        const seq = index + 1;
        const type = seq === 1 ? "NR" : "RR";
        map.set(String(ride?.rental_id || ""), `EVR-${type}_${seq}`);
      });
    });

    return map;
  }, [baseRows]);

  const rows = useMemo(() => {
    const withIds = baseRows.map((r) => ({
      ...r,
      rental_id_display: rentalIdMap.get(String(r?.rental_id || "")) || formatRentalId(r?.rental_id),
    }));

    const grouped = new Map();
    withIds.forEach((r) => {
      const key = String(r?.rider_id || r?.rider_mobile || r?.rider_code || "").trim();
      if (!key) return;
      const list = grouped.get(key) || [];
      list.push(r);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries()).map(([riderKey, riderRows]) => {
      const sortedByReturn = [...riderRows].sort(
        (a, b) => Date.parse(b?.returned_at || b?.return_created_at || "") - Date.parse(a?.returned_at || a?.return_created_at || "")
      );
      const latest = sortedByReturn[0] || riderRows[0] || {};
      const totalDepositReturned = riderRows.reduce(
        (sum, item) => sum + Number(item?.deposit_returned_amount_value || 0),
        0
      );

      return {
        ...latest,
        rider_key: riderKey,
        returns_count: riderRows.length,
        deposit_returned_amount_value: totalDepositReturned,
        all_returns: sortedByReturn,
      };
    });
  }, [baseRows, rentalIdMap]);

  const filteredRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();

    return rows.filter((r) => {
      if (depositFilter === "returned" && !r?.deposit_returned_amount_value) return false;
      if (depositFilter === "not_returned" && r?.deposit_returned_amount_value) return false;

      // Date range applies to return time
      if (!isWithinDateRange(r?.returned_at, fromDate, toDate)) return false;

      if (!q) return true;

      const hay = [
        r?.rider_full_name_display,
        r?.rider_mobile_display,
        r?.rider_code,
        r?.bike_id,
        r?.battery_id,
        r?.condition_notes,
        r?.feedback,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");

      return hay.includes(q);
    });
  }, [rows, search, depositFilter, fromDate, toDate]);

  const sortedRows = useMemo(() => {
    return sortRows(filteredRows, { key: sort?.key, direction: sort?.direction });
  }, [filteredRows, sort]);

  const summary = useMemo(() => {
    const totalReturns = sortedRows.length;
    const depositReturnedTotal = sortedRows.reduce(
      (sum, r) => sum + Number(r.deposit_returned_amount_value || 0),
      0
    );
    return { totalReturns, depositReturnedTotal };
  }, [sortedRows]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRows.length / pageSize));
  }, [sortedRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page]);

  const onExport = () => {
    downloadCsv({
      filename: `returns_${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { key: "rider_full_name_display", header: "Rider" },
        { key: "rider_code", header: "Rider Code" },
        { key: "rider_mobile_display", header: "Mobile" },
        { key: "bike_id", header: "E-Bike ID" },
        { key: "battery_id", header: "Battery ID" },
        { key: "start_time", header: "Start" },
        { key: "returned_at", header: "Latest Return" },
        { key: "returns_count", header: "Returns" },
        { key: "deposit_returned_amount_value", header: "Deposit Returned (Total)" },
      ],
      rows: sortedRows,
    });
  };

  const renderSortableTh = ({ label, sortKey, className = "" }) => {
    const active = sort?.key === sortKey;
    const dir = active ? sort?.direction : null;
    const arrow = !active ? "" : dir === "asc" ? "▲" : "▼";
    return (
      <th
        key={sortKey}
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 select-none cursor-pointer ${className}`}
        onClick={() => setSort((prev) => toggleSort(prev, sortKey))}
        title="Sort"
      >
        <span className="inline-flex items-center gap-2">
          {label}
          <span className={`text-xs ${active ? "text-slate-700" : "text-slate-400"}`}>{arrow || "▲"}</span>
        </span>
      </th>
    );
  };

  const onColumnsScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    setColumnsScrollTop(top);
    try {
      localStorage.setItem(COLUMNS_SCROLL_STORAGE_KEY, String(top));
    } catch {
      // ignore
    }
  };

  const toggleColumn = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefresh = () => {
    load({ showLoading: true });
  };

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto relative z-10 p-8 pb-0 overflow-x-hidden sm:ml-[var(--admin-sidebar-width,16rem)]">
          <div className="p-6 pb-0 space-y-8">
            {/* Hero Header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                  Returns Management
                </h1>
                <p className="text-slate-600 text-base font-normal">
                  Track and manage all vehicle returns and deposit refunds
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 backdrop-blur border border-white/30 shadow-sm text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="h-4 w-4 rounded accent-evegah-primary"
                  />
                  <span className="hidden sm:inline">Auto-refresh</span>
                  <span className="sm:hidden">Auto</span>
                </label>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-evegah-primary to-brand-medium text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  disabled={loading}
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                  <span className="hidden sm:inline">{loading ? "Refreshing…" : "Refresh"}</span>
                </button>

                <button
                  type="button"
                  onClick={onExport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                  title="Export CSV"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </div>
            </div>

          
            {error ? (
              <div className="rounded-3xl border border-red-200/50 bg-red-50/70 backdrop-blur-xl px-6 py-4 text-sm text-red-700 shadow-lg">
                {error}
              </div>
            ) : null}

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["Total Returns", summary.totalReturns, "text-slate-800", Package],
                ["Deposit Returned", formatINR(summary.depositReturnedTotal), "text-green-600", DollarSign],
              ].map(([label, value, color, Icon]) => (
                <div key={label} className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-102 transition-all duration-300 cursor-pointer">
                  {/* Floating geometric shapes */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-xl translate-y-3 -translate-x-3 group-hover:rotate-12 transition-transform duration-300"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl opacity-20 group-hover:opacity-60 transition-opacity duration-300 font-bold text-slate-400">
                        #
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {label}
                      </div>
                      <div className={`text-2xl font-black ${color} group-hover:text-blue-600 transition-colors duration-300`}>
                        {value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                {/* SEARCH + FILTER */}
            <div className="relative z-30 bg-white/80 backdrop-blur-xl border border-evegah-border rounded-2xl shadow-card p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-evegah-primary/20">
                <Search size={18} className="text-slate-600" />
                <input
                  className="bg-transparent outline-none ml-3 w-full text-base font-normal placeholder-slate-400"
                  placeholder="Search rider, mobile, vehicle, bike, battery, feedback…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white rounded-2xl text-sm font-semibold border border-slate-200">
                <span className="text-slate-600">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                />

                <span className="text-slate-600">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                />
              </div>

              <select
                className="border border-slate-200 rounded-2xl px-4 py-3 text-base font-medium bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary"
                value={depositFilter}
                onChange={(e) => setDepositFilter(e.target.value)}
                aria-label="Deposit filter"
              >
                <option value="all">All deposits</option>
                <option value="returned">Deposit returned</option>
                <option value="not_returned">Deposit not returned</option>
              </select>

              <div ref={columnsWrapRef} className="relative ml-auto z-[2000]">
                <button
                  type="button"
                  onClick={() => setColumnsOpen((v) => !v)}
                  className={`h-12 w-12 rounded-2xl grid place-items-center bg-white border border-slate-200 text-evegah-primary shadow-sm hover:bg-brand-light/60 ${columnsOpen ? "ring-2 ring-evegah-primary/30" : ""}`}
                  aria-label="Toggle columns"
                  title="Columns"
                >
                  <Columns size={18} />
                </button>
                {columnsOpen ? (
                  <div className="absolute right-0 z-[2000] mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Toggle Columns
                    </p>
                    <div ref={columnsListRef} onScroll={onColumnsScroll} className="max-h-72 overflow-auto pr-1 space-y-2">
                      {columnOptions.map((col) => (
                        <label key={col.key} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(visibleCols[col.key])}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded"
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Loading…
              </div>
            ) : null}

            {/* TABLE */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden relative z-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm font-normal">
                  <thead className="bg-slate-100">
                    <tr>
                      {visibleCols.rider_full_name_display ? renderSortableTh({ label: "Rider", sortKey: "rider_full_name_display" }) : null}
                      {visibleCols.rider_mobile_display ? renderSortableTh({ label: "Mobile", sortKey: "rider_mobile_display" }) : null}
                      {visibleCols.bike_id ? renderSortableTh({ label: "E-Bike ID", sortKey: "bike_id" }) : null}
                      {visibleCols.battery_id ? renderSortableTh({ label: "Battery ID", sortKey: "battery_id" }) : null}
                      {visibleCols.start_time ? renderSortableTh({ label: "Start", sortKey: "start_time" }) : null}
                      {visibleCols.returned_at ? renderSortableTh({ label: "Returned At", sortKey: "returned_at" }) : null}
                      {renderSortableTh({ label: "Returns", sortKey: "returns_count" })}
                      {visibleCols.deposit_returned_amount_value ? renderSortableTh({ label: "Deposit", sortKey: "deposit_returned_amount_value" }) : null}
                      {visibleCols.condition_notes ? renderSortableTh({ label: "Latest Condition", sortKey: "condition_notes" }) : null}
                      {visibleCols.feedback ? renderSortableTh({ label: "Latest Feedback", sortKey: "feedback" }) : null}
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageRows.map((r, i) => {
                      const depositTone = r.deposit_returned_amount_value > 0 ? "text-green-700" : "text-slate-600";
                      return (
                        <tr key={r.rider_key || r.return_id || i} className="border-t border-white/30 hover:bg-white/40 transition-colors duration-200">
                          {visibleCols.rider_full_name_display ? (
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{r.rider_full_name_display}</div>
                              <div className="text-xs text-slate-500">{r.rider_code || ""}</div>
                            </td>
                          ) : null}
                          {visibleCols.rider_mobile_display ? (
                            <td className="px-4 py-3 text-slate-600">{r.rider_mobile_display}</td>
                          ) : null}
                          {visibleCols.bike_id ? (
                            <td className="px-4 py-3 text-slate-600">{r.bike_id || "-"}</td>
                          ) : null}
                          {visibleCols.battery_id ? (
                            <td className="px-4 py-3 text-slate-600">{r.battery_id || "-"}</td>
                          ) : null}
                          {visibleCols.start_time ? (
                            <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.start_time)}</td>
                          ) : null}
                          {visibleCols.returned_at ? (
                            <td className="px-4 py-3 text-slate-600">{fmtDateTime(r.returned_at)}</td>
                          ) : null}
                          <td className="px-4 py-3 text-slate-700 font-medium">{Number(r.returns_count || 0)}</td>
                          {visibleCols.deposit_returned_amount_value ? (
                            <td className={`px-4 py-3 font-semibold ${depositTone}`}>
                              {r.deposit_returned_amount_value > 0 ? formatINR(r.deposit_returned_amount_value) : "-"}
                            </td>
                          ) : null}
                          {visibleCols.condition_notes ? (
                            <td className="px-4 py-3 max-w-[14rem] text-slate-600">
                              <span className="line-clamp-2">{r.condition_notes || "-"}</span>
                            </td>
                          ) : null}
                          {visibleCols.feedback ? (
                            <td className="px-4 py-3 max-w-[14rem] text-slate-600">
                              <span className="line-clamp-2">{r.feedback || "-"}</span>
                            </td>
                          ) : null}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setViewItem(r)}
                              className="px-3 py-1.5 rounded-xl bg-brand-light text-evegah-primary text-xs font-semibold hover:bg-brand-light/80"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {sortedRows.length === 0 && !loading ? (
                <div className="p-8 text-center text-slate-500">No records found</div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600 font-medium">Page {page} / {totalPages}</div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Next"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {viewItem ? (
        <div className="fixed inset-0 z-[3000] bg-black/40 p-4 sm:p-6" onClick={() => setViewItem(null)}>
          <div
            className="mx-auto mt-4 w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Return Details</h3>
                <p className="text-sm text-slate-600">
                  {viewItem?.rider_full_name_display || "-"} · {viewItem?.rider_mobile_display || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">Total Returns</div>
                <div className="text-lg font-semibold text-slate-900">{Number(viewItem?.returns_count || 0)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">Deposit Returned</div>
                <div className="text-lg font-semibold text-green-700">{formatINR(viewItem?.deposit_returned_amount_value || 0)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">Last Returned At</div>
                <div className="text-lg font-semibold text-slate-900">{fmtDateTime(viewItem?.returned_at)}</div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Returned At</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Deposit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Condition</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewItem?.all_returns || []).map((entry, index) => (
                    <tr key={`${entry?.return_id || index}`} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 text-slate-700">
                        <div>{fmtDateTime(entry?.returned_at)}</div>
                        <div className="text-xs text-slate-500">
                          {entry?.rental_id_display || "-"} · {entry?.return_id_display || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{entry?.vehicle_number || "-"}</div>
                        <div className="text-xs text-slate-500">Bike {entry?.bike_id || "-"} · Battery {entry?.battery_id || "-"}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-green-700">
                        {Number(entry?.deposit_returned_amount_value || 0) > 0
                          ? formatINR(entry?.deposit_returned_amount_value)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[22rem]">
                        <span className="whitespace-pre-wrap break-words">{entry?.condition_notes || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[22rem]">
                        <span className="whitespace-pre-wrap break-words">{entry?.feedback || "-"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
