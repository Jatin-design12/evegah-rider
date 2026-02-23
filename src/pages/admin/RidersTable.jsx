import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch, apiFetchBlob } from "../../config/api";

import EditRiderModal from "./EditRiderModal";
import DeleteModal from "./DeleteModal";
import RiderProfileModal from "./RiderProfileModal";

import { formatDateDDMMYYYY } from "../../utils/dateFormat";
import { Eye, Edit, Trash2, Users, Bike, UserCheck, UserX, Search, RefreshCw, Download, FileText, Columns, Upload } from "lucide-react";
import { downloadCsv } from "../../utils/downloadCsv";
import { sortRows, toggleSort } from "../../utils/sortRows";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RidersTable() {
  const VISIBLE_COLS_STORAGE_KEY = "evegah.admin.riders.visibleCols.v1";
  const COLUMNS_SCROLL_STORAGE_KEY = "evegah.admin.riders.columnsDropdownScrollTop.v1";
  const columnsWrapRef = useRef(null);
  const columnsListRef = useRef(null);
  const importArchiveInputRef = useRef(null);
  const transferMenuRef = useRef(null);

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Summary stats
  const [totalRiders, setTotalRiders] = useState(0);
  const [activeRentedVehicles, setActiveRentedVehicles] = useState(0);
  const [retainRiders, setRetainRiders] = useState(0);
  const [endedRiders, setEndedRiders] = useState(0);

  // Bulk select
  const [selected, setSelected] = useState([]);
  const selectAllRef = useRef(null);

  // Filter/sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState({ key: "created_at", direction: "desc" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsScrollTop, setColumnsScrollTop] = useState(0);
  const [visibleCols, setVisibleCols] = useState({
    full_name: true,
    mobile: true,
    aadhaar: true,
    ride_status: true,
    rider_type: true,
    created_at: true,
    actions: true,
  });

  const columnOptions = [
    { key: "full_name", label: "Name" },
    { key: "mobile", label: "Mobile" },
    { key: "aadhaar", label: "Aadhaar" },
    { key: "ride_status", label: "Ride" },
    { key: "rider_type", label: "Type" },
    { key: "created_at", label: "Created" },
    { key: "actions", label: "Actions" },
  ];

  // Modals
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [profilesBusy, setProfilesBusy] = useState(false);
  const [profilesNotice, setProfilesNotice] = useState("");
  const [profilesError, setProfilesError] = useState("");
  const [transferMenuOpen, setTransferMenuOpen] = useState(false);

  /* ===================== API ===================== */

  const loadStats = useCallback(async () => {
    const stats = await apiFetch("/api/riders/stats");
    setTotalRiders(stats?.totalRiders || 0);
    setActiveRentedVehicles(stats?.activeRentedVehicles || 0);
    setRetainRiders(stats?.retainRiders || 0);
    setEndedRiders(stats?.endedRiders || 0);
  }, []);

  const loadRiders = useCallback(async () => {
    setLoading(true);

    try {
      const pageLimit = 100; // server caps at 100
      const nextRows = [];
      let nextPage = 1;
      let totalCount = null;

      // Fetch all pages so client-side search/sort/pagination operate on the full dataset.
      // Safety guard to avoid infinite loops if the API misbehaves.
      const maxPages = 2000;

      while (nextPage <= maxPages) {
        const res = await apiFetch(`/api/riders?page=${nextPage}&limit=${pageLimit}`);
        const rows = Array.isArray(res?.data) ? res.data : [];

        if (totalCount === null) {
          totalCount = Number(res?.totalCount);
          if (!Number.isFinite(totalCount) || totalCount < 0) totalCount = null;
        }

        nextRows.push(...rows);

        if (rows.length === 0) break;
        if (totalCount !== null && nextRows.length >= totalCount) break;
        if (rows.length < pageLimit) break;

        nextPage += 1;
      }

      setRiders(nextRows);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===================== EFFECTS ===================== */

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
    const onTransferPointerDown = (e) => {
      if (!transferMenuOpen) return;
      const el = transferMenuRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setTransferMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (!columnsOpen) return;
      if (e.key === "Escape") setColumnsOpen(false);
      if (e.key === "Escape") setTransferMenuOpen(false);
    };
    const onVisibility = () => {
      if (document.hidden) setColumnsOpen(false);
      if (document.hidden) setTransferMenuOpen(false);
    };
    const onBlur = () => {
      setColumnsOpen(false);
      setTransferMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousedown", onTransferPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("mousedown", onTransferPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [columnsOpen, transferMenuOpen]);

  useEffect(() => {
    if (!columnsOpen) return;
    requestAnimationFrame(() => {
      const el = columnsListRef.current;
      if (!el) return;
      el.scrollTop = columnsScrollTop;
    });
  }, [columnsOpen, columnsScrollTop]);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats();
      loadRiders();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadRiders, loadStats]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, fromDate, toDate]);

  /* ===================== EXPORT ===================== */

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

  const filteredRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    return (riders || []).filter((r) => {
      if (statusFilter !== "all" && String(r?.status || "").toLowerCase() !== statusFilter) return false;
      if (typeFilter !== "all" && String(r?.rider_type || "").toLowerCase() !== typeFilter) return false;

      // Date range applies to created_at
      if (!isWithinDateRange(r?.created_at, fromDate, toDate)) return false;

      if (!q) return true;
      const hay = [
        r?.full_name,
        r?.mobile,
        r?.aadhaar,
        r?.status,
        r?.ride_status,
        r?.rider_type,
        r?.id,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
  }, [riders, search, statusFilter, typeFilter, fromDate, toDate]);

  const sortedRows = useMemo(() => {
    return sortRows(filteredRows, { key: sort?.key, direction: sort?.direction });
  }, [filteredRows, sort]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRows.length / pageSize));
  }, [sortedRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page]);

  const pageRowIds = useMemo(() => pageRows.map((r) => r.id).filter(Boolean), [pageRows]);
  const selectedOnPageCount = useMemo(
    () => pageRowIds.reduce((sum, id) => sum + (selected.includes(id) ? 1 : 0), 0),
    [pageRowIds, selected]
  );
  const allOnPageSelected = pageRowIds.length > 0 && selectedOnPageCount === pageRowIds.length;
  const someOnPageSelected = selectedOnPageCount > 0 && selectedOnPageCount < pageRowIds.length;

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const toggleSelectAllOnPage = () => {
    if (pageRowIds.length === 0) return;
    setSelected((prev) => {
      const prevSet = new Set(prev);
      if (allOnPageSelected) {
        pageRowIds.forEach((id) => prevSet.delete(id));
      } else {
        pageRowIds.forEach((id) => prevSet.add(id));
      }
      return Array.from(prevSet);
    });
  };

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const exportRows = (rows, filename) => {
    downloadCsv({
      filename,
      columns: [
        { key: "full_name", header: "Name" },
        { key: "mobile", header: "Mobile" },
        { key: "aadhaar", header: "Aadhaar" },
        { key: "status", header: "Status" },
        { key: "ride_status", header: "Ride" },
        { key: "rider_type", header: "Type" },
        { key: "created_at", header: "Created At" },
      ],
      rows,
    });
  };

  const exportSelected = () => {
    exportRows(
      (riders || []).filter((r) => selected.includes(r.id)),
      `riders_selected_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const exportCurrentView = () => {
    exportRows(sortedRows, `riders_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EVegah – Riders Report", 14, 18);

    autoTable(doc, {
      startY: 26,
      head: [["Name", "Mobile", "Aadhaar", "Status", "Ride", "Type", "Created"]],
      body: sortedRows.map((r) => [
        r.full_name || "-",
        r.mobile || "-",
        r.aadhaar || "-",
        r.status || "-",
        r.ride_status || "-",
        r.rider_type || "-",
        formatDateDDMMYYYY(r.created_at, "-") || "-",
      ]),
    });

    doc.save("riders-report.pdf");
  };

  const parseDownloadFileName = (contentDisposition, fallback) => {
    const source = String(contentDisposition || "");
    const utf8Match = source.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        return utf8Match[1];
      }
    }
    const basicMatch = source.match(/filename="?([^";]+)"?/i);
    return basicMatch?.[1] || fallback;
  };

  const downloadBlobToFile = (blob, fileName) => {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 5000);
  };

  const exportProfilesArchive = useCallback(async ({ riderIds, fallbackName, emptyMessage }) => {
    const ids = Array.isArray(riderIds) ? riderIds.filter(Boolean) : [];
    if (ids.length === 0) {
      setProfilesError(emptyMessage || "No riders available for export.");
      setProfilesNotice("");
      return;
    }

    setProfilesBusy(true);
    setProfilesError("");
    setProfilesNotice("");

    try {
      const { blob, contentDisposition } = await apiFetchBlob("/api/riders/export-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderIds: ids }),
      });
      const name = parseDownloadFileName(contentDisposition, fallbackName || "rider-profiles.zip");
      downloadBlobToFile(blob, name);
      setProfilesNotice(`Exported ${ids.length} profile${ids.length > 1 ? "s" : ""} as ZIP.`);
    } catch (e) {
      setProfilesError(String(e?.message || e || "Unable to export rider profiles."));
    } finally {
      setProfilesBusy(false);
    }
  }, []);

  const handleImportProfilesClick = () => {
    if (profilesBusy) return;
    importArchiveInputRef.current?.click();
  };

  const handleImportProfiles = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0] || null;
    input.value = "";
    if (!file) return;

    setProfilesBusy(true);
    setProfilesError("");
    setProfilesNotice("");

    try {
      const formData = new FormData();
      formData.append("archive", file);
      const result = await apiFetch("/api/riders/import-profiles", {
        method: "POST",
        body: formData,
      });

      await Promise.all([loadStats(), loadRiders()]);

      const failedCount = Number(result?.failedRiders?.length || 0);
      const imported = Number(result?.ridersImported || 0);
      setProfilesNotice(
        `Imported ${imported} rider profile${imported !== 1 ? "s" : ""}${failedCount ? ` (${failedCount} failed)` : ""}.`
      );
    } catch (e) {
      setProfilesError(String(e?.message || e || "Unable to import rider profiles."));
    } finally {
      setProfilesBusy(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
    loadRiders();
  };

  const statuses = useMemo(() => {
    const set = new Set();
    (riders || []).forEach((r) => {
      const s = String(r?.status || "").trim().toLowerCase();
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [riders]);

  const types = useMemo(() => {
    const set = new Set();
    (riders || []).forEach((r) => {
      const s = String(r?.rider_type || "").trim().toLowerCase();
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [riders]);

  const renderSortableTh = ({ label, sortKey }) => {
    const active = sort?.key === sortKey;
    const dir = active ? sort?.direction : null;
    const arrow = !active ? "" : dir === "asc" ? "▲" : "▼";
    return (
      <th
        key={sortKey}
        className="px-4 py-3 text-left select-none cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-700"
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

  const getRideTone = (value) => {
    const v = String(value || "").toLowerCase();
    if (v.includes("active") || v.includes("riding")) return "bg-emerald-100 text-emerald-700";
    if (v.includes("returned") || v.includes("ended")) return "bg-slate-200 text-slate-700";
    return "bg-amber-100 text-amber-700";
  };

  const getTypeTone = (value) => {
    const v = String(value || "").toLowerCase();
    if (v.includes("retain")) return "bg-indigo-100 text-indigo-700";
    if (v.includes("new")) return "bg-sky-100 text-sky-700";
    return "bg-gray-100 text-gray-700";
  };

  /* ===================== UI ===================== */

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto relative z-10 p-10 overflow-x-hidden sm:ml-[var(--admin-sidebar-width,16rem)]">
          <div className="p-0 max-w-full">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Riders Management
                </h1>
                <p className="text-slate-600 mt-2 text-base font-normal">
                  Oversee your rider network and track performance metrics
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <input
                  ref={importArchiveInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={handleImportProfiles}
                />

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
                  onClick={exportCurrentView}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                  title="Export CSV"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                <div ref={transferMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setTransferMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                    disabled={profilesBusy}
                    title="Import/Export Profiles"
                  >
                    <Upload size={16} />
                    <span>Import/Export</span>
                  </button>

                  {transferMenuOpen ? (
                    <div className="absolute right-0 z-[2200] mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setTransferMenuOpen(false);
                          exportProfilesArchive({
                            riderIds: (riders || []).filter((r) => selected.includes(r.id)).map((r) => r.id),
                            fallbackName: `rider-profiles-selected-${new Date().toISOString().slice(0, 10)}.zip`,
                            emptyMessage: "Select riders first, then export.",
                          });
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Export Selected Profiles
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransferMenuOpen(false);
                          handleImportProfilesClick();
                        }}
                        className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Import Profiles ZIP
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={exportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                  title="Export PDF"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>

            {profilesError ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {profilesError}
              </div>
            ) : null}

            {profilesNotice ? (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {profilesNotice}
              </div>
            ) : null}
            
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                ["Total Riders", totalRiders, "text-slate-800", Users],
                ["Active Rented", activeRentedVehicles, "text-green-600", Bike],
                ["Retain Riders", retainRiders, "text-blue-600", UserCheck],
                ["Ended Riders", endedRiders, "text-slate-800", UserX],
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
              {/* SEARCH + FILTERS */}
            <div className="relative z-30 mb-6 bg-white/80 backdrop-blur-xl border border-evegah-border rounded-2xl shadow-card p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-evegah-primary/20">
                <Search size={18} className="text-slate-600" />
                <input
                  className="bg-transparent outline-none ml-3 w-full text-base font-normal placeholder-slate-400"
                  placeholder="Search name, mobile, aadhaar, status…"
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
                <option value="all">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                className="border border-slate-200 rounded-2xl px-4 py-3 text-base font-medium bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Type filter"
              >
                <option value="all">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
            {/* BULK BAR */}
            {selected.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-3 bg-white/70 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/30">
                <span className="font-semibold">{selected.length} selected</span>
                <button
                  type="button"
                  onClick={exportSelected}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem({ bulk: true, ids: selected })}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="mb-8" />



            {/* TABLE */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden relative z-0">
              {loading ? (
                <div className="p-8 text-center">Loading riders…</div>
              ) : sortedRows.length === 0 ? (
                <div className="p-8 text-center">No riders found</div>
              ) : (
                <table className="w-full text-sm font-medium">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          aria-label="Select all rows on this page"
                        />
                      </th>
                      {visibleCols.full_name ? renderSortableTh({ label: "Name", sortKey: "full_name" }) : null}
                      {visibleCols.mobile ? renderSortableTh({ label: "Mobile", sortKey: "mobile" }) : null}
                      {visibleCols.aadhaar ? renderSortableTh({ label: "Aadhaar", sortKey: "aadhaar" }) : null}
                      {visibleCols.ride_status ? renderSortableTh({ label: "Ride", sortKey: "ride_status" }) : null}
                      {visibleCols.rider_type ? renderSortableTh({ label: "Type", sortKey: "rider_type" }) : null}
                      {visibleCols.created_at ? renderSortableTh({ label: "Created", sortKey: "created_at" }) : null}
                      {visibleCols.actions ? (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Actions</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={() =>
                              setSelected((prev) =>
                                prev.includes(r.id)
                                  ? prev.filter((x) => x !== r.id)
                                  : [...prev, r.id]
                              )
                            }
                          />
                        </td>
                        {visibleCols.full_name ? <td className="p-4">{r.full_name}</td> : null}
                        {visibleCols.mobile ? <td className="p-4">{r.mobile}</td> : null}
                        {visibleCols.aadhaar ? <td className="p-4">{r.aadhaar}</td> : null}
                        {visibleCols.ride_status ? (
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getRideTone(r.ride_status)}`}>
                              {r.ride_status || "-"}
                            </span>
                          </td>
                        ) : null}
                        {visibleCols.rider_type ? (
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getTypeTone(r.rider_type)}`}>
                              {r.rider_type || "-"}
                            </span>
                          </td>
                        ) : null}
                        {visibleCols.created_at ? (
                          <td className="p-4">{formatDateDDMMYYYY(r.created_at, "-")}</td>
                        ) : null}
                        {visibleCols.actions ? (
                          <td className="p-4 flex gap-2">
                            <button
                              onClick={() =>
                                exportProfilesArchive({
                                  riderIds: [r.id],
                                  fallbackName: `rider-profile-${String(r.full_name || r.id || "rider").replace(/\s+/g, "-")}.zip`,
                                  emptyMessage: "Rider not available for profile export.",
                                })
                              }
                              disabled={profilesBusy}
                              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                              title="Export Profile ZIP"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => setViewItem(r)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditItem(r)}
                              className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteItem(r)}
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

        {/* MODALS */}
        {editItem && (
          <EditRiderModal
            rider={editItem}
            close={() => setEditItem(null)}
            reload={loadRiders}
          />
        )}
        {deleteItem && (
          <DeleteModal
            rider={deleteItem?.bulk ? null : deleteItem}
            bulkIds={deleteItem?.bulk ? deleteItem.ids : []}
            close={() => setDeleteItem(null)}
            reload={loadRiders}
            onBulkSuccess={() => setSelected([])}
          />
        )}
        {viewItem && (
          <RiderProfileModal
            rider={viewItem}
            close={() => setViewItem(null)}
          />
        )}
      </div>
    </div>
  );
}
