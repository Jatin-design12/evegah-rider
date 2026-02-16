import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch } from "../../config/api";
import { Search, FileText, Play, CheckCircle, DollarSign, Receipt, RefreshCw, Download, Columns } from "lucide-react";
import { formatRentalId } from "../../utils/entityId";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";
import { downloadCsv } from "../../utils/downloadCsv";
import { sortRows, toggleSort } from "../../utils/sortRows";


export default function RentalsTable() {
  const VISIBLE_COLS_STORAGE_KEY = "evegah.admin.rentals.visibleCols.v1";
  const COLUMNS_SCROLL_STORAGE_KEY = "evegah.admin.rentals.columnsDropdownScrollTop.v1";
  const columnsWrapRef = useRef(null);
  const columnsListRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sort, setSort] = useState({ key: "start_time", direction: "desc" });
  const [page, setPage] = useState(1);
  const [expandedRiders, setExpandedRiders] = useState([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsScrollTop, setColumnsScrollTop] = useState(0);
  const [visibleCols, setVisibleCols] = useState({
    rider_full_name: true,
    rider_mobile: true,
    bike_id: true,
    battery_id: true,
    zone_display: true,
    start_time: true,
    expected_end_time_value: true,
    returned_at_value: true,
    status_display: true,
    deposit_value: true,
    rent_value: true,
    total_value: true,
  });
  const pageSize = 10;

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

  const columnOptions = [
    { key: "rider_full_name", label: "Rider" },
    { key: "rider_mobile", label: "Mobile" },
    { key: "bike_id", label: "E-Bike ID" },
    { key: "battery_id", label: "Battery ID" },
    { key: "zone_display", label: "Zone" },
    { key: "start_time", label: "Start" },
    { key: "expected_end_time_value", label: "Expected Return" },
    { key: "returned_at_value", label: "Returned At" },
    { key: "status_display", label: "Status" },
    { key: "deposit_value", label: "Deposit" },
    { key: "rent_value", label: "Rent" },
    { key: "total_value", label: "Total" },
  ];

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
    setPage(1);
  }, [search, statusFilter, fromDate, toDate]);

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

  const normalizeZone = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    const cleaned = raw.replace(/\bzone\b/g, "").replace(/\s+/g, " ").trim();
    if (cleaned.includes("gotri")) return "Gotri";
    if (cleaned.includes("manjalpur")) return "Manjalpur";
    if (cleaned.includes("karelibaug")) return "Karelibaug";
    if (cleaned.includes("daman")) return "Daman";
    if (cleaned.includes("aatapi") || cleaned.includes("atapi")) return "Aatapi";
    if (cleaned.includes("waghodiya")) return "Waghodiya";
    if (cleaned.includes("ajwa")) return "Ajwa Road";
    if (cleaned.includes("chhani")) return "Chhani";
    if (cleaned.includes("anand")) return "Anand";
    return "";
  };

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

  const getZoneTone = (zone) => {
    const z = String(zone || "").toLowerCase();
    if (z.includes("gotri")) return "bg-indigo-100 text-indigo-700";
    if (z.includes("manjalpur")) return "bg-emerald-100 text-emerald-700";
    if (z.includes("karelibaug")) return "bg-amber-100 text-amber-700";
    if (z.includes("daman")) return "bg-sky-100 text-sky-700";
    if (z.includes("aatapi")) return "bg-rose-100 text-rose-700";
    if (z.includes("waghodiya")) return "bg-indigo-100 text-indigo-700";
    if (z.includes("ajwa")) return "bg-emerald-100 text-emerald-700";
    if (z.includes("chhani")) return "bg-amber-100 text-amber-700";
    if (z.includes("anand")) return "bg-sky-100 text-sky-700";
    return "bg-gray-100 text-gray-700";
  };

  const baseRows = useMemo(() => {
    return (data || []).map((r) => {
      const meta = parseMaybeJson(r?.meta) || {};
      const expected = r?.expected_end_time || meta?.expected_end_time || "";
      const returnedAt = r?.returned_at || null;
      const status = returnedAt ? "Returned" : "Active";

      const paymentMode = String(r?.payment_mode || "").trim();
      const deposit = Number(r?.deposit_amount || 0);
      const rent = Number(r?.rental_amount || 0);
      const total = Number(r?.total_amount || 0);
      const zoneRaw = r?.zone || r?.operational_zone || meta?.zone || "";
      const zone = normalizeZone(zoneRaw) || "-";

      return {
        ...r,
        expected_end_time_value: expected,
        returned_at_value: returnedAt,
        status_display: status,
        payment_mode_display: paymentMode || "-",
        deposit_value: deposit,
        rent_value: rent,
        total_value: total,
        zone_display: zone,
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
        map.set(String(ride?.id || ""), `EVR-${type}_${seq}`);
      });
    });

    return map;
  }, [baseRows]);

  const rows = useMemo(() => {
    return baseRows.map((r) => ({
      ...r,
      rental_id_display: rentalIdMap.get(String(r?.id || "")) || formatRentalId(r?.id),
    }));
  }, [baseRows, rentalIdMap]);

  const groupedRows = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      const key = String(r?.rider_id || r?.rider_mobile || r?.rider_code || r?.id || "");
      if (!key) return;
      const prev = map.get(key);
      if (prev) {
        prev.rides.push(r);
        return;
      }
      map.set(key, {
        key,
        rider_id: r?.rider_id || null,
        rider_full_name: r?.rider_full_name || "-",
        rider_mobile: r?.rider_mobile || "-",
        rider_code: r?.rider_code || "",
        rides: [r],
      });
    });

    return Array.from(map.values()).map((group) => {
      const sorted = [...group.rides].sort((a, b) => Date.parse(b?.start_time || "") - Date.parse(a?.start_time || ""));
      const active = sorted.find((r) => r.status_display === "Active") || null;
      const primary = active || sorted[0] || null;
      return {
        ...group,
        primary,
        rides: sorted,
        ride_count: sorted.length,
      };
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    return groupedRows.filter((g) => {
      const primary = g.primary || {};
      if (statusFilter !== "all" && String(primary.status_display || "").toLowerCase() !== statusFilter) {
        return false;
      }

      // Date range applies to rental start_time
      if (!isWithinDateRange(primary?.start_time, fromDate, toDate)) return false;

      if (!q) return true;
      const matches = (value) => String(value || "").toLowerCase().includes(q);
      if (
        matches(g.rider_full_name) ||
        matches(g.rider_mobile) ||
        matches(g.rider_code)
      ) {
        return true;
      }
      return (g.rides || []).some((r) => {
        return [
          r?.vehicle_number,
          r?.bike_id,
          r?.battery_id,
          r?.rental_package,
          r?.payment_mode_display,
          r?.zone_display,
          r?.id,
          r?.rental_id_display,
        ].some((v) => matches(v));
      });
    });
  }, [groupedRows, search, statusFilter, fromDate, toDate, isWithinDateRange]);

  const sortedRows = useMemo(() => {
    const sortable = filteredRows.map((g) => {
      const primary = g.primary || {};
      return {
        ...primary,
        group_key: g.key,
        ride_count: g.ride_count,
        rider_full_name: g.rider_full_name,
        rider_mobile: g.rider_mobile,
        rider_code: g.rider_code,
        _group: g,
      };
    });
    return sortRows(sortable, { key: sort?.key, direction: sort?.direction });
  }, [filteredRows, sort]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRows.length / pageSize));
  }, [sortedRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page]);

  const summary = useMemo(() => {
    const totalRentals = rows.length;
    const activeRentals = rows.filter((r) => r.status_display === "Active").length;
    const returnedRentals = totalRentals - activeRentals;
    const depositTotal = rows.reduce((sum, r) => sum + Number(r.deposit_value || 0), 0);
    const rentTotal = rows.reduce((sum, r) => sum + Number(r.rent_value || 0), 0);
    return { totalRentals, activeRentals, returnedRentals, depositTotal, rentTotal };
  }, [rows]);

  const onExport = () => {
    downloadCsv({
      filename: `rentals_${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { key: "rider_full_name", header: "Rider" },
        { key: "rider_code", header: "Rider Code" },
        { key: "rider_mobile", header: "Mobile" },
        { key: "bike_id", header: "E-Bike ID" },
        { key: "battery_id", header: "Battery ID" },
        { key: "start_time", header: "Start" },
        { key: "expected_end_time_value", header: "Expected Return" },
        { key: "returned_at_value", header: "Returned At" },
        { key: "status_display", header: "Status" },
        { key: "deposit_value", header: "Deposit" },
        { key: "rent_value", header: "Rent" },
        { key: "total_value", header: "Total" },
        { key: "zone_display", header: "Zone" },
      ],
      rows: sortedRows.map((r) => ({
        ...r,
        rider_full_name: r.rider_full_name,
        rider_mobile: r.rider_mobile,
        rider_code: r.rider_code,
      })),
    });
  };

  const toggleExpanded = (key) => {
    setExpandedRiders((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRefresh = () => {
    load({ showLoading: true });
  };

  const renderSortableTh = ({ label, sortKey, align = "left" }) => {
    const active = sort?.key === sortKey;
    const dir = active ? sort?.direction : null;
    const arrow = !active ? "" : dir === "asc" ? "▲" : "▼";
    const alignClass = align === "right" ? "text-right" : "text-left";
    return (
      <th
        key={sortKey}
        className={`px-4 py-3 ${alignClass} select-none cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-700`}
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

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 p-10 px-10 overflow-x-hidden sm:ml-[var(--admin-sidebar-width,16rem)]" style={{ zoom: "0.95" }}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-evegah-primary tracking-tight">
              Active Rentals
            </h1>

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

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              ["Total Rentals", summary.totalRentals, "text-slate-800", FileText],
              ["Active", summary.activeRentals, "text-green-600", Play],
              ["Returned", summary.returnedRentals, "text-slate-800", CheckCircle],
              ["Deposit Total", formatINR(summary.depositTotal), "text-green-600", DollarSign],
              ["Rent Total", formatINR(summary.rentTotal), "text-slate-800", Receipt],
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
          <div className="relative z-30 bg-white/80 backdrop-blur-xl border border-evegah-border rounded-2xl shadow-card p-4 flex flex-wrap items-center gap-4 mb-5">
            <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-evegah-primary/20">
              <Search size={18} className="text-slate-600" />
              <input
                className="bg-transparent outline-none ml-3 w-full text-base font-normal placeholder-slate-400"
                placeholder="Search rider, mobile, vehicle, bike, battery…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white rounded-2xl text-sm font-semibold border border-slate-200">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status filter"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
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

          {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}

          {/* TABLE */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden relative z-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm font-normal">
                <thead className="bg-slate-100">
                  <tr>
                    {visibleCols.rider_full_name ? renderSortableTh({ label: "Rider", sortKey: "rider_full_name" }) : null}
                    {visibleCols.rider_mobile ? renderSortableTh({ label: "Mobile", sortKey: "rider_mobile" }) : null}
                    {/* Vehicle column removed */}
                    {visibleCols.bike_id ? renderSortableTh({ label: "E-Bike ID", sortKey: "bike_id" }) : null}
                    {visibleCols.battery_id ? renderSortableTh({ label: "Battery ID", sortKey: "battery_id" }) : null}
                    {visibleCols.zone_display ? renderSortableTh({ label: "Zone", sortKey: "zone_display" }) : null}
                    {visibleCols.start_time ? renderSortableTh({ label: "Start", sortKey: "start_time" }) : null}
                    {visibleCols.expected_end_time_value ? renderSortableTh({ label: "Expected Return", sortKey: "expected_end_time_value" }) : null}
                    {visibleCols.returned_at_value ? renderSortableTh({ label: "Returned At", sortKey: "returned_at_value" }) : null}
                    {visibleCols.status_display ? renderSortableTh({ label: "Status", sortKey: "status_display" }) : null}
                    {visibleCols.deposit_value ? renderSortableTh({ label: "Deposit", sortKey: "deposit_value", align: "right" }) : null}
                    {visibleCols.rent_value ? renderSortableTh({ label: "Rent", sortKey: "rent_value", align: "right" }) : null}
                    {visibleCols.total_value ? renderSortableTh({ label: "Total", sortKey: "total_value", align: "right" }) : null}
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">Rides</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((r, i) => {
                    const group = r._group || {};
                    const rides = Array.isArray(group.rides) ? group.rides : [];
                    const primary = group.primary || r;
                    const statusTone = primary.status_display === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
                    const zoneTone = getZoneTone(primary.zone_display);
                    const expanded = expandedRiders.includes(group.key);
                    const subRows = rides.filter((ride) => String(ride?.id || "") !== String(primary?.id || ""));
                    return (
                      <Fragment key={group.key || i}>
                        <tr className="border-t hover:bg-gray-50">
                          {visibleCols.rider_full_name ? (
                            <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{group.rider_full_name || "-"}</div>
                              <div className="text-xs text-gray-500">
                                {group.rider_code || ""}
                              </div>
                            </div>
                            </td>
                          ) : null}
                          {visibleCols.rider_mobile ? (
                            <td className="px-4 py-3">{group.rider_mobile || "-"}</td>
                          ) : null}
                        {/* Vehicle column removed */}
                          {visibleCols.bike_id ? (
                            <td className="px-4 py-3">{primary.bike_id || "-"}</td>
                          ) : null}
                          {visibleCols.battery_id ? (
                            <td className="px-4 py-3">{primary.battery_id || "-"}</td>
                          ) : null}
                          {visibleCols.zone_display ? (
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${zoneTone}`}>
                                {primary.zone_display}
                              </span>
                            </td>
                          ) : null}
                          {visibleCols.start_time ? (
                            <td className="px-4 py-3">{fmtDateTime(primary.start_time)}</td>
                          ) : null}
                          {visibleCols.expected_end_time_value ? (
                            <td className="px-4 py-3">{fmtDateTime(primary.expected_end_time_value)}</td>
                          ) : null}
                          {visibleCols.returned_at_value ? (
                            <td className="px-4 py-3">{fmtDateTime(primary.returned_at_value)}</td>
                          ) : null}
                          {visibleCols.status_display ? (
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusTone}`}>
                                {primary.status_display}
                              </span>
                            </td>
                          ) : null}
                          {visibleCols.deposit_value ? (
                            <td className="px-4 py-3 text-right font-semibold text-green-700">{formatINR(primary.deposit_value)}</td>
                          ) : null}
                          {visibleCols.rent_value ? (
                            <td className="px-4 py-3 text-right">{formatINR(primary.rent_value)}</td>
                          ) : null}
                          {visibleCols.total_value ? (
                            <td className="px-4 py-3 text-right font-semibold">{formatINR(primary.total_value)}</td>
                          ) : null}
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(group.key)}
                              className="inline-flex items-center gap-2 rounded-full border border-evegah-primary/30 bg-evegah-primary/10 px-2.5 py-1 text-xs font-semibold text-evegah-primary hover:bg-evegah-primary/15"
                              title={expanded ? "Collapse" : "Expand"}
                            >
                              {group.ride_count}
                              <span className="text-[10px]">{expanded ? "Hide" : "Show"}</span>
                            </button>
                          </td>
                        </tr>
                        {expanded && subRows.map((ride) => {
                          const subStatusTone = ride.status_display === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
                          const subZoneTone = getZoneTone(ride.zone_display);
                          return (
                            <tr key={ride.id} className="border-t bg-slate-50/60">
                              {visibleCols.rider_full_name ? (
                                <td className="px-4 py-2">
                                <div className="pl-8 text-sm text-slate-600">Ride {ride.rental_id_display || formatRentalId(ride.id)}</div>
                                </td>
                              ) : null}
                              {visibleCols.rider_mobile ? (
                                <td className="px-4 py-2 text-slate-500">{group.rider_mobile || "-"}</td>
                              ) : null}
                              {visibleCols.bike_id ? (
                                <td className="px-4 py-2 text-slate-600">{ride.bike_id || "-"}</td>
                              ) : null}
                              {visibleCols.battery_id ? (
                                <td className="px-4 py-2 text-slate-600">{ride.battery_id || "-"}</td>
                              ) : null}
                              {visibleCols.zone_display ? (
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${subZoneTone}`}>
                                    {ride.zone_display}
                                  </span>
                                </td>
                              ) : null}
                              {visibleCols.start_time ? (
                                <td className="px-4 py-2 text-slate-600">{fmtDateTime(ride.start_time)}</td>
                              ) : null}
                              {visibleCols.expected_end_time_value ? (
                                <td className="px-4 py-2 text-slate-600">{fmtDateTime(ride.expected_end_time_value)}</td>
                              ) : null}
                              {visibleCols.returned_at_value ? (
                                <td className="px-4 py-2 text-slate-600">{fmtDateTime(ride.returned_at_value)}</td>
                              ) : null}
                              {visibleCols.status_display ? (
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${subStatusTone}`}>
                                    {ride.status_display}
                                  </span>
                                </td>
                              ) : null}
                              {visibleCols.deposit_value ? (
                                <td className="px-4 py-2 text-right text-slate-600">{formatINR(ride.deposit_value)}</td>
                              ) : null}
                              {visibleCols.rent_value ? (
                                <td className="px-4 py-2 text-right text-slate-600">{formatINR(ride.rent_value)}</td>
                              ) : null}
                              {visibleCols.total_value ? (
                                <td className="px-4 py-2 text-right text-slate-700">{formatINR(ride.total_value)}</td>
                              ) : null}
                              <td className="px-4 py-2 text-slate-600">{ride.rental_id_display || formatRentalId(ride.id)}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sortedRows.length === 0 && !loading ? (
              <div className="p-6 text-center text-gray-500">No records found</div>
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
        </main>
      </div>
    </div>
  );
}
