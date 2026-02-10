import { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import { Edit, Eye, Trash2, Battery, TrendingUp, Car, Clock, Zap, User, CheckSquare, Square, RefreshCw, Download, FileText, Search, Columns } from "lucide-react";

import {
  adminBatterySwapsDaily,
  adminBatterySwapsTopBatteries,
  adminBatterySwapsTopVehicles,
  adminDeleteBatterySwap,
  adminDeleteBatterySwaps,
  adminListBatterySwaps,
  adminUpdateBatterySwap,
} from "../../utils/adminBatterySwaps";

import { BATTERY_ID_OPTIONS } from "../../utils/batteryIds";
import { filterVehicleIdGroups, flattenVehicleIdGroups } from "../../utils/vehicleIds";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";
import { downloadCsv } from "../../utils/downloadCsv";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { listAuthUsers } from "../../utils/adminUsers";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function AdminBatterySwapsPage() {
  const VISIBLE_COLS_STORAGE_KEY = "evegah.admin.batterySwaps.visibleCols.v1";
  const COLUMNS_SCROLL_STORAGE_KEY = "evegah.admin.batterySwaps.columnsDropdownScrollTop.v1";
  const columnsWrapRef = useRef(null);
  const columnsListRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnsScrollTop, setColumnsScrollTop] = useState(0);
  const [visibleCols, setVisibleCols] = useState({
    rider_full_name: true,
    rider_mobile: true,
    swapped_at: true,
    vehicle_number: true,
    battery_out: true,
    battery_in: true,
    swaps_count: true,
    actions: true,
  });

  const columnOptions = [
    { key: "rider_full_name", label: "Rider" },
    { key: "rider_mobile", label: "Mobile" },
    { key: "swapped_at", label: "Last Swap" },
    { key: "vehicle_number", label: "Vehicle" },
    { key: "battery_out", label: "Battery Out" },
    { key: "battery_in", label: "Battery In" },
    { key: "swaps_count", label: "Swaps" },
    { key: "actions", label: "Actions" },
  ];

  const [employeeNameMap, setEmployeeNameMap] = useState(() => new Map());

  const [batterySwaps, setBatterySwaps] = useState([]);
  const [batterySwapsDailyData, setBatterySwapsDailyData] = useState([]);
  const [batteryTopBatteriesData, setBatteryTopBatteriesData] = useState([]);
  const [batteryTopVehiclesData, setBatteryTopVehiclesData] = useState([]);

  const [swapRefresh, setSwapRefresh] = useState(0);

  const [editingSwapId, setEditingSwapId] = useState("");
  const [swapDraft, setSwapDraft] = useState(null);
  const [swapBusy, setSwapBusy] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [detailsSubtitle, setDetailsSubtitle] = useState("");
  const [detailsSearch, setDetailsSearch] = useState("");
  const [detailsSelectedRow, setDetailsSelectedRow] = useState(null);
  const [detailsMode, setDetailsMode] = useState("history"); // history | view | edit
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsRows, setDetailsRows] = useState([]);
  const [selectedSwapIds, setSelectedSwapIds] = useState([]);

  useEffect(() => {
    setPage(1);
  }, [search, fromDate, toDate]);

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
      localStorage.setItem(VISIBLE_COLS_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {
      // ignore
    }
  }, [visibleCols]);

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
    let mounted = true;
    const loadUsers = async () => {
      try {
        const next = new Map();

        // Firebase listUsers is paginated; fetch all pages so we can always map uid/email -> displayName.
        let pageToken = null;
        let safety = 0;
        while (safety < 50) {
          safety += 1;
          const data = await listAuthUsers({ pageToken });
          if (!mounted) return;

          const users = Array.isArray(data?.users) ? data.users : [];
          users.forEach((u) => {
            const name = String(u?.displayName || "").trim();
            if (!name) return;
            const uid = String(u?.uid || "").trim();
            const email = String(u?.email || "").trim().toLowerCase();
            if (uid) next.set(uid, name);
            if (email) next.set(email, name);
          });

          pageToken = data?.nextPageToken ? String(data.nextPageToken) : null;
          if (!pageToken) break;
        }

        setEmployeeNameMap(next);
      } catch {
        // ignore
      }
    };
    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsTitle("");
    setDetailsSubtitle("");
    setDetailsSearch("");
    setDetailsSelectedRow(null);
    setDetailsMode("history");
    setDetailsRows([]);
    setDetailsLoading(false);
  };

  const openDetailsWithSearch = async ({ title, subtitle, search, selectedRow }) => {
    setDetailsOpen(true);
    setDetailsTitle(title || "Details");
    setDetailsSubtitle(subtitle || "");
    setDetailsSearch(search || "");
    setDetailsSelectedRow(selectedRow || null);
    setDetailsMode(selectedRow ? "view" : "history");
    setDetailsLoading(true);
    setDetailsRows([]);
    try {
      const rows = await adminListBatterySwaps({ search: search || "" }).catch(() => []);
      setDetailsRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(String(e?.message || e || "Unable to load details"));
      setDetailsRows([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const vehicleDropdownRef = useRef(null);
  const vehicleQueryRef = useRef(null);
  const batteryInDropdownRef = useRef(null);
  const batteryInQueryRef = useRef(null);
  const batteryOutDropdownRef = useRef(null);
  const batteryOutQueryRef = useRef(null);

  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [editVehicleQuery, setEditVehicleQuery] = useState("");
  const [editBatteryInOpen, setEditBatteryInOpen] = useState(false);
  const [editBatteryInQuery, setEditBatteryInQuery] = useState("");
  const [editBatteryOutOpen, setEditBatteryOutOpen] = useState(false);
  const [editBatteryOutQuery, setEditBatteryOutQuery] = useState("");

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const fmtSwapTime = (value) => {
    return formatDateTimeDDMMYYYY(value, "-");
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [swapRows, swapDaily, topBatteries, topVehicles] = await Promise.all([
        adminListBatterySwaps().catch(() => []),
        adminBatterySwapsDaily({ days: 14 }).catch(() => []),
        adminBatterySwapsTopBatteries({ days: 30 }).catch(() => []),
        adminBatterySwapsTopVehicles({ days: 30 }).catch(() => []),
      ]);

      setBatterySwaps(Array.isArray(swapRows) ? swapRows : []);
      setBatterySwapsDailyData(Array.isArray(swapDaily) ? swapDaily : []);
      setBatteryTopBatteriesData(Array.isArray(topBatteries) ? topBatteries : []);
      setBatteryTopVehiclesData(Array.isArray(topVehicles) ? topVehicles : []);
    } catch (e) {
      setError(String(e?.message || e || "Unable to load battery swaps"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    load();
    if (!autoRefresh) return () => {
      mounted = false;
    };
    const interval = setInterval(() => {
      if (!mounted) return;
      load();
    }, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapRefresh, autoRefresh]);

  useEffect(() => {
    setSelectedSwapIds((prev) =>
      prev.filter((id) => (batterySwaps || []).some((row) => String(row?.id) === id))
    );
  }, [batterySwaps]);

  useEffect(() => {
    if (!detailsOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeDetails();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsOpen]);

  const startEditSwap = (row) => {
    setEditingSwapId(String(row?.id || ""));
    setSwapDraft({
      vehicle_number: row?.vehicle_number || "",
      battery_out: row?.battery_out || "",
      battery_in: row?.battery_in || "",
      swapped_at: toDateTimeLocal(row?.swapped_at || row?.created_at),
      notes: row?.notes || "",
      employee_email: row?.employee_email || "",
      employee_uid: row?.employee_uid || "",
    });

    setEditVehicleOpen(false);
    setEditBatteryInOpen(false);
    setEditBatteryOutOpen(false);
    setEditVehicleQuery("");
    setEditBatteryInQuery("");
    setEditBatteryOutQuery("");
  };

  const cancelEditSwap = () => {
    setEditingSwapId("");
    setSwapDraft(null);

    setEditVehicleOpen(false);
    setEditBatteryInOpen(false);
    setEditBatteryOutOpen(false);
    setEditVehicleQuery("");
    setEditBatteryInQuery("");
    setEditBatteryOutQuery("");
  };

  const filteredEditVehicleGroups = useMemo(() => filterVehicleIdGroups(editVehicleQuery), [editVehicleQuery]);
  const filteredEditVehicleIds = useMemo(
    () => flattenVehicleIdGroups(filteredEditVehicleGroups),
    [filteredEditVehicleGroups]
  );

  const filteredEditBatteryInIds = useMemo(() => {
    const q = String(editBatteryInQuery || "").trim().toUpperCase();
    if (!q) return BATTERY_ID_OPTIONS;
    return BATTERY_ID_OPTIONS.filter((id) => id.includes(q));
  }, [editBatteryInQuery]);

  const filteredEditBatteryOutIds = useMemo(() => {
    const q = String(editBatteryOutQuery || "").trim().toUpperCase();
    if (!q) return BATTERY_ID_OPTIONS;
    return BATTERY_ID_OPTIONS.filter((id) => id.includes(q));
  }, [editBatteryOutQuery]);

  useEffect(() => {
    if (!editVehicleOpen && !editBatteryInOpen && !editBatteryOutOpen) return;

    const onMouseDown = (e) => {
      if (editVehicleOpen && vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(e.target)) {
        setEditVehicleOpen(false);
      }
      if (editBatteryInOpen && batteryInDropdownRef.current && !batteryInDropdownRef.current.contains(e.target)) {
        setEditBatteryInOpen(false);
      }
      if (editBatteryOutOpen && batteryOutDropdownRef.current && !batteryOutDropdownRef.current.contains(e.target)) {
        setEditBatteryOutOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [editVehicleOpen, editBatteryInOpen, editBatteryOutOpen]);

  const saveSwap = async (id) => {
    if (!id || !swapDraft) return;
    setSwapBusy(true);
    try {
      const swappedAtIso = swapDraft.swapped_at ? new Date(swapDraft.swapped_at).toISOString() : null;
      const updated = await adminUpdateBatterySwap(id, {
        vehicle_number: swapDraft.vehicle_number,
        battery_out: swapDraft.battery_out,
        battery_in: swapDraft.battery_in,
        swapped_at: swappedAtIso,
        notes: swapDraft.notes,
        employee_email: swapDraft.employee_email,
        employee_uid: swapDraft.employee_uid,
      });

      setBatterySwaps((prev) =>
        (prev || []).map((r) => (String(r?.id) === String(id) ? { ...r, ...(updated || {}) } : r))
      );
      cancelEditSwap();
      setSwapRefresh((x) => x + 1);
    } catch (e) {
      setError(String(e?.message || e || "Unable to update swap"));
    } finally {
      setSwapBusy(false);
    }
  };

  const deleteSwap = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this battery swap?");
    if (!ok) return;
    setSwapBusy(true);
    try {
      await adminDeleteBatterySwap(id);
      setBatterySwaps((prev) => (prev || []).filter((r) => String(r?.id) !== String(id)));
      setSelectedSwapIds((prev) => prev.filter((x) => String(x) !== String(id)));
      if (String(editingSwapId) === String(id)) cancelEditSwap();
      setSwapRefresh((x) => x + 1);
    } catch (e) {
      setError(String(e?.message || e || "Unable to delete swap"));
    } finally {
      setSwapBusy(false);
    }
  };

  const toggleSwapSelection = (id) => {
    const key = String(id);
    setSelectedSwapIds((prev) => {
      if (prev.includes(key)) {
        return prev.filter((x) => x !== key);
      }
      return [...prev, key];
    });
  };

  const toggleSelectCurrentPage = () => {
    if (allPageSelected) {
      setSelectedSwapIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }
    setSelectedSwapIds((prev) => {
      const next = new Set(prev);
      currentPageIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const bulkDeleteSelected = async () => {
    if (selectedSwapIds.length === 0) return;
    const ok = window.confirm(`Delete ${selectedSwapIds.length} selected swap${selectedSwapIds.length === 1 ? "" : "s"
      }?`);
    if (!ok) return;
    setSwapBusy(true);
    try {
      await adminDeleteBatterySwaps(selectedSwapIds);
      setBatterySwaps((prev) =>
        (prev || []).filter((row) => !selectedSwapIds.includes(String(row?.id)))
      );
      setSelectedSwapIds([]);
      setSwapRefresh((x) => x + 1);
    } catch (e) {
      setError(String(e?.message || e || "Unable to delete selected swaps"));
    } finally {
      setSwapBusy(false);
    }
  };

  const headerStats = useMemo(() => {
    return {
      totalSwapsShown: (batterySwaps || []).length,
      topBattery: (batteryTopBatteriesData || [])[0]?.battery_id || "-",
      topVehicle: (batteryTopVehiclesData || [])[0]?.vehicle_number || "-",
    };
  }, [batterySwaps, batteryTopBatteriesData, batteryTopVehiclesData]);

  const visibleSwaps = useMemo(() => {
    return Array.isArray(batterySwaps) ? batterySwaps : [];
  }, [batterySwaps]);

  const riderRows = useMemo(() => {
    const map = new Map();
    (visibleSwaps || []).forEach((row) => {
      const key = String(row?.rider_mobile || row?.rider_id || "").trim();
      if (!key) return;
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    });

    const groups = [];
    map.forEach((list, key) => {
      const sorted = [...list].sort((a, b) => {
        const ta = Date.parse(a?.swapped_at || a?.created_at || "") || 0;
        const tb = Date.parse(b?.swapped_at || b?.created_at || "") || 0;
        return tb - ta;
      });
      const latest = sorted[0] || {};
      const lastTime = latest?.swapped_at || latest?.created_at || null;
      groups.push({
        _key: key,
        _count: sorted.length,
        _latest: latest,
        rider_full_name: latest?.rider_full_name || "-",
        rider_mobile: latest?.rider_mobile || key,
        vehicle_number: latest?.vehicle_number || "-",
        battery_out: latest?.battery_out || "-",
        battery_in: latest?.battery_in || "-",
        swapped_at: lastTime,
      });
    });

    groups.sort((a, b) => (Date.parse(b?.swapped_at || "") || 0) - (Date.parse(a?.swapped_at || "") || 0));
    return groups;
  }, [visibleSwaps]);

  const filteredRiderRows = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const inRange = (r) => isWithinDateRange(r?.swapped_at, fromDate, toDate);

    if (!q) return (riderRows || []).filter(inRange);
    return (riderRows || []).filter((r) => {
      if (!inRange(r)) return false;
      const hay = [
        r?.rider_full_name,
        r?.rider_mobile,
        r?.vehicle_number,
        r?.battery_out,
        r?.battery_in,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" | ");
      return hay.includes(q);
    });
  }, [riderRows, search, fromDate, toDate]);

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

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((filteredRiderRows || []).length / pageSize));
  }, [filteredRiderRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (filteredRiderRows || []).slice(start, start + pageSize);
  }, [filteredRiderRows, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const exportCsv = () => {
    downloadCsv({
      filename: `battery_swaps_riders_${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { key: "rider_full_name", header: "Rider" },
        { key: "rider_mobile", header: "Mobile" },
        { key: "swapped_at", header: "Last Swap" },
        { key: "vehicle_number", header: "Vehicle" },
        { key: "battery_out", header: "Battery Out" },
        { key: "battery_in", header: "Battery In" },
        { key: "_count", header: "Swaps" },
      ],
      rows: (filteredRiderRows || []).map((r) => ({
        ...r,
        swapped_at: fmtSwapTime(r?.swapped_at) || "-",
      })),
    });
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EVegah – Battery Swaps (Rider Summary)", 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [["Rider", "Mobile", "Last Swap", "Vehicle", "Battery Out", "Battery In", "Swaps"]],
      body: (filteredRiderRows || []).map((r) => [
        r?.rider_full_name || "-",
        r?.rider_mobile || "-",
        fmtSwapTime(r?.swapped_at) || "-",
        r?.vehicle_number || "-",
        r?.battery_out || "-",
        r?.battery_in || "-",
        String(r?._count ?? "-"),
      ]),
    });
    doc.save(`battery-swaps-riders_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const visibleSwapIds = useMemo(
    () => visibleSwaps.map((row) => String(row?.id || "")),
    [visibleSwaps]
  );

  const allVisibleSelected =
    visibleSwapIds.length > 0 && visibleSwapIds.every((id) => selectedSwapIds.includes(id));

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      setSelectedSwapIds((prev) => prev.filter((id) => !visibleSwapIds.includes(id)));
      return;
    }
    setSelectedSwapIds((prev) => {
      const next = new Set(prev);
      visibleSwapIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto relative z-10 p-8 pb-0 overflow-x-hidden sm:ml-[var(--admin-sidebar-width,16rem)]">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Battery Swaps</h1>
                <p className="text-slate-600 mt-2 text-base font-normal">View, edit, and manage battery swap records.</p>
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-evegah-primary to-brand-medium text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  disabled={swapBusy}
                  onClick={() => setSwapRefresh((x) => x + 1)}
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                  onClick={exportCsv}
                  title="Export CSV"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-lg hover:opacity-95"
                  onClick={exportPdf}
                  title="Export PDF"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ["Swaps Loaded", headerStats.totalSwapsShown, "text-slate-800", Battery],
                ["Top Battery (30 days)", headerStats.topBattery, "text-blue-600", TrendingUp],
                ["Top Vehicle (30 days)", headerStats.topVehicle, "text-green-600", Car],
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

            <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-base font-semibold text-evegah-text">Battery Swaps (14 Days)</h2>
                  <span className="text-xs text-evegah-muted">Area</span>
                </div>

                <div className="text-blue-600">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={batterySwapsDailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="swaps"
                        stroke="currentColor"
                        fill="currentColor"
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-base font-semibold text-evegah-text">Top Batteries (30 Days)</h2>
                  <span className="text-xs text-evegah-muted">Pie</span>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={batteryTopBatteriesData} dataKey="installs" nameKey="battery_id" outerRadius={90} label>
                      {(batteryTopBatteriesData || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden relative z-0">
              <div className="relative z-30 bg-white/80 backdrop-blur-xl border border-evegah-border p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-evegah-primary/20">
                  <Search size={18} className="text-slate-600" />
                  <input
                    className="bg-transparent outline-none ml-3 w-full text-base font-normal placeholder-slate-400"
                    placeholder="Search rider, mobile, vehicle, battery…"
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
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Toggle Columns</p>
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

              {loading && (batterySwaps || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500">Loading swaps…</div>
              ) : filteredRiderRows.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No riders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm font-normal">
                    <thead className="bg-slate-100">
                      <tr>
                        {visibleCols.rider_full_name ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Rider</th>
                        ) : null}
                        {visibleCols.rider_mobile ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Mobile</th>
                        ) : null}
                        {visibleCols.swapped_at ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Last Swap</th>
                        ) : null}
                        {visibleCols.vehicle_number ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Vehicle</th>
                        ) : null}
                        {visibleCols.battery_out ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Battery Out</th>
                        ) : null}
                        {visibleCols.battery_in ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Battery In</th>
                        ) : null}
                        {visibleCols.swaps_count ? (
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">Swaps</th>
                        ) : null}
                        {visibleCols.actions ? (
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">Actions</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r) => (
                        <tr key={r._key} className="border-t hover:bg-slate-50/50 transition-colors">
                          {visibleCols.rider_full_name ? (
                            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{r.rider_full_name || "-"}</td>
                          ) : null}
                          {visibleCols.rider_mobile ? (
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.rider_mobile || "-"}</td>
                          ) : null}
                          {visibleCols.swapped_at ? (
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtSwapTime(r.swapped_at) || "-"}</td>
                          ) : null}
                          {visibleCols.vehicle_number ? (
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.vehicle_number || "-"}</td>
                          ) : null}
                          {visibleCols.battery_out ? (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-700">
                                {r.battery_out || "-"}
                              </span>
                            </td>
                          ) : null}
                          {visibleCols.battery_in ? (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                                {r.battery_in || "-"}
                              </span>
                            </td>
                          ) : null}
                          {visibleCols.swaps_count ? (
                            <td className="px-4 py-3 text-right text-slate-700 font-semibold whitespace-nowrap">{r._count}</td>
                          ) : null}
                          {visibleCols.actions ? (
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                onClick={() =>
                                  openDetailsWithSearch({
                                    title: "Battery Swap History",
                                    subtitle: r?.rider_mobile
                                      ? `Rider: ${r?.rider_full_name || "-"} (${r?.rider_mobile})`
                                      : "Swap history",
                                    search: r?.rider_mobile || "",
                                    selectedRow: null,
                                  })
                                }
                                title="View history"
                                aria-label="View history"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

        {detailsOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(e) => {
              // close when clicking backdrop
              if (e.target === e.currentTarget) closeDetails();
            }}
          >
            <div className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
              <div className="flex items-start justify-between gap-4 border-b border-evegah-border p-4">
                <div>
                  <div className="text-lg font-semibold text-evegah-text">{detailsTitle}</div>
                  {detailsSubtitle ? <div className="text-sm text-evegah-muted">{detailsSubtitle}</div> : null}
                  {detailsSearch ? <div className="text-xs text-evegah-muted mt-1">Search: {detailsSearch}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  {detailsSelectedRow && detailsMode !== "edit" ? (
                    <>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={swapBusy}
                        onClick={() => {
                          setDetailsMode("edit");
                          startEditSwap(detailsSelectedRow);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-muted"
                        disabled={swapBusy}
                        onClick={async () => {
                          await deleteSwap(detailsSelectedRow?.id);
                          closeDetails();
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : null}

                  {detailsMode === "edit" ? (
                    <button
                      type="button"
                      className="btn-muted"
                      disabled={swapBusy}
                      onClick={() => {
                        cancelEditSwap();
                        setDetailsMode("view");
                      }}
                    >
                      Cancel Edit
                    </button>
                  ) : null}

                  <button type="button" className="btn-primary" onClick={closeDetails}>
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                {detailsMode === "edit" && swapDraft ? (
                  <div className="mb-4 rounded-2xl border border-evegah-border bg-evegah-card p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <div className="label">Swapped At</div>
                        <input
                          type="datetime-local"
                          className="input"
                          value={swapDraft?.swapped_at || ""}
                          onChange={(e) => setSwapDraft((p) => ({ ...(p || {}), swapped_at: e.target.value }))}
                        />
                      </div>

                      <div>
                        <div className="label">Vehicle</div>
                        <div ref={(el) => (vehicleDropdownRef.current = el)} className="relative">
                          <button
                            type="button"
                            className="select flex items-center justify-between gap-3"
                            aria-haspopup="listbox"
                            aria-expanded={editVehicleOpen}
                            onClick={() => {
                              setEditVehicleOpen((v) => {
                                const next = !v;
                                if (!v && next) setTimeout(() => vehicleQueryRef.current?.focus?.(), 0);
                                return next;
                              });
                            }}
                          >
                            <span className={swapDraft?.vehicle_number ? "text-evegah-text" : "text-gray-500"}>
                              {swapDraft?.vehicle_number || "Select Vehicle"}
                            </span>
                            <span className="text-gray-400">▾</span>
                          </button>
                          {editVehicleOpen ? (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-evegah-border bg-white shadow-card p-2">
                              <input
                                ref={(el) => (vehicleQueryRef.current = el)}
                                className="input"
                                placeholder="Search vehicle id..."
                                value={editVehicleQuery}
                                onChange={(e) => setEditVehicleQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditVehicleOpen(false);
                                  }
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (filteredEditVehicleIds.length === 1) {
                                      const id = filteredEditVehicleIds[0];
                                      setSwapDraft((p) => ({ ...(p || {}), vehicle_number: id }));
                                      setEditVehicleOpen(false);
                                      setEditVehicleQuery("");
                                    }
                                  }
                                }}
                              />
                              <div className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                                {filteredEditVehicleIds.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-gray-500">No matching vehicle id.</div>
                                ) : (
                                  filteredEditVehicleGroups.map((group) => (
                                    <div key={group.label}>
                                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                        {group.label}
                                      </div>
                                      {(group.ids || []).map((id) => (
                                        <button
                                          key={id}
                                          type="button"
                                          className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${id === swapDraft?.vehicle_number ? "bg-gray-100" : ""}`}
                                          onClick={() => {
                                            setSwapDraft((p) => ({ ...(p || {}), vehicle_number: id }));
                                            setEditVehicleOpen(false);
                                            setEditVehicleQuery("");
                                          }}
                                        >
                                          {id}
                                        </button>
                                      ))}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <div className="label">Battery OUT</div>
                        <div ref={(el) => (batteryOutDropdownRef.current = el)} className="relative">
                          <button
                            type="button"
                            className="select flex items-center justify-between gap-3"
                            aria-haspopup="listbox"
                            aria-expanded={editBatteryOutOpen}
                            onClick={() => {
                              setEditBatteryOutOpen((v) => {
                                const next = !v;
                                if (!v && next) setTimeout(() => batteryOutQueryRef.current?.focus?.(), 0);
                                return next;
                              });
                            }}
                          >
                            <span className={swapDraft?.battery_out ? "text-evegah-text" : "text-gray-500"}>
                              {swapDraft?.battery_out || "Select Battery OUT"}
                            </span>
                            <span className="text-gray-400">▾</span>
                          </button>
                          {editBatteryOutOpen ? (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-evegah-border bg-white shadow-card p-2">
                              <input
                                ref={(el) => (batteryOutQueryRef.current = el)}
                                className="input"
                                placeholder="Search battery id..."
                                value={editBatteryOutQuery}
                                onChange={(e) => setEditBatteryOutQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditBatteryOutOpen(false);
                                  }
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (filteredEditBatteryOutIds.length === 1) {
                                      const id = filteredEditBatteryOutIds[0];
                                      setSwapDraft((p) => ({ ...(p || {}), battery_out: id }));
                                      setEditBatteryOutOpen(false);
                                      setEditBatteryOutQuery("");
                                    }
                                  }
                                }}
                              />
                              <div className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                                {filteredEditBatteryOutIds.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-gray-500">No matching battery id.</div>
                                ) : (
                                  filteredEditBatteryOutIds.map((id) => (
                                    <button
                                      key={id}
                                      type="button"
                                      className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${id === swapDraft?.battery_out ? "bg-gray-100" : ""
                                        }`}
                                      onClick={() => {
                                        setSwapDraft((p) => ({ ...(p || {}), battery_out: id }));
                                        setEditBatteryOutOpen(false);
                                        setEditBatteryOutQuery("");
                                      }}
                                    >
                                      {id}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <div className="label">Battery IN</div>
                        <div ref={(el) => (batteryInDropdownRef.current = el)} className="relative">
                          <button
                            type="button"
                            className="select flex items-center justify-between gap-3"
                            aria-haspopup="listbox"
                            aria-expanded={editBatteryInOpen}
                            onClick={() => {
                              setEditBatteryInOpen((v) => {
                                const next = !v;
                                if (!v && next) setTimeout(() => batteryInQueryRef.current?.focus?.(), 0);
                                return next;
                              });
                            }}
                          >
                            <span className={swapDraft?.battery_in ? "text-evegah-text" : "text-gray-500"}>
                              {swapDraft?.battery_in || "Select Battery IN"}
                            </span>
                            <span className="text-gray-400">▾</span>
                          </button>
                          {editBatteryInOpen ? (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-evegah-border bg-white shadow-card p-2">
                              <input
                                ref={(el) => (batteryInQueryRef.current = el)}
                                className="input"
                                placeholder="Search battery id..."
                                value={editBatteryInQuery}
                                onChange={(e) => setEditBatteryInQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditBatteryInOpen(false);
                                  }
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (filteredEditBatteryInIds.length === 1) {
                                      const id = filteredEditBatteryInIds[0];
                                      setSwapDraft((p) => ({ ...(p || {}), battery_in: id }));
                                      setEditBatteryInOpen(false);
                                      setEditBatteryInQuery("");
                                    }
                                  }
                                }}
                              />
                              <div className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                                {filteredEditBatteryInIds.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-gray-500">No matching battery id.</div>
                                ) : (
                                  filteredEditBatteryInIds.map((id) => (
                                    <button
                                      key={id}
                                      type="button"
                                      className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${id === swapDraft?.battery_in ? "bg-gray-100" : ""
                                        }`}
                                      onClick={() => {
                                        setSwapDraft((p) => ({ ...(p || {}), battery_in: id }));
                                        setEditBatteryInOpen(false);
                                        setEditBatteryInQuery("");
                                      }}
                                    >
                                      {id}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="label">Notes</div>
                        <textarea
                          className="textarea h-[78px]"
                          value={swapDraft?.notes || ""}
                          onChange={(e) => setSwapDraft((p) => ({ ...(p || {}), notes: e.target.value }))}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={swapBusy}
                            onClick={async () => {
                              await saveSwap(detailsSelectedRow?.id);
                              setDetailsMode("view");
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-muted"
                            disabled={swapBusy}
                            onClick={() => {
                              cancelEditSwap();
                              setDetailsMode("view");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="text-sm text-evegah-muted mb-3">
                  {detailsLoading ? "Loading details..." : `Records: ${(detailsRows || []).length}`}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-evegah-muted">
                        <th className="py-2 pr-3">Time</th>
                        <th className="py-2 pr-3">Rider</th>
                        <th className="py-2 pr-3">Mobile</th>
                        <th className="py-2 pr-3">Vehicle</th>
                        <th className="py-2 pr-3">Battery Out</th>
                        <th className="py-2 pr-3">Battery In</th>
                        <th className="py-2 pr-3">Employee</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-evegah-border">
                      {detailsLoading ? (
                        <tr>
                          <td className="py-3 text-evegah-muted" colSpan={8}>
                            Loading...
                          </td>
                        </tr>
                      ) : (detailsRows || []).length === 0 ? (
                        <tr>
                          <td className="py-3 text-evegah-muted" colSpan={8}>
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        (detailsRows || []).map((row) => (
                          <tr key={row.id}>
                            <td className="py-2 pr-3 whitespace-nowrap">{fmtSwapTime(row.swapped_at || row.created_at)}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">{row.rider_full_name || "N/A"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap text-evegah-muted">{row.rider_mobile || "N/A"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">{row.vehicle_number || "N/A"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">{row.battery_out || "N/A"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">{row.battery_in || "N/A"}</td>
                            <td className="py-2 pr-3 whitespace-nowrap text-evegah-muted">
                              {employeeNameMap.get(String(row.employee_uid || "").trim()) ||
                                employeeNameMap.get(String(row.employee_email || "").trim().toLowerCase()) ||
                                row.employee_email ||
                                "N/A"}
                            </td>
                            <td className="py-2">
                              {row.notes ? (
                                row.notes
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                                  Paid Battery
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
