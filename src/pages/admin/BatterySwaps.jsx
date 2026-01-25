import { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import { Edit, Eye, Search, Trash2 } from "lucide-react";

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
import { VEHICLE_ID_OPTIONS } from "../../utils/vehicleIds";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [batterySwaps, setBatterySwaps] = useState([]);
  const [batterySwapsDailyData, setBatterySwapsDailyData] = useState([]);
  const [batteryTopBatteriesData, setBatteryTopBatteriesData] = useState([]);
  const [batteryTopVehiclesData, setBatteryTopVehiclesData] = useState([]);

  const [swapSearch, setSwapSearch] = useState("");
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [swapRows, swapDaily, topBatteries, topVehicles] = await Promise.all([
        adminListBatterySwaps({ search: swapSearch }).catch(() => []),
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
    const interval = setInterval(() => {
      if (!mounted) return;
      load();
    }, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapSearch, swapRefresh]);

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

  const filteredEditVehicleIds = useMemo(() => {
    const q = String(editVehicleQuery || "").trim().toUpperCase();
    if (!q) return VEHICLE_ID_OPTIONS;
    return VEHICLE_ID_OPTIONS.filter((id) => id.includes(q));
  }, [editVehicleQuery]);

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
    const ok = window.confirm(`Delete ${selectedSwapIds.length} selected swap${
      selectedSwapIds.length === 1 ? "" : "s"
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

  const visibleSwaps = batterySwaps || [];

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
    <div className="flex min-h-screen bg-evegah-bg">
      <AdminSidebar />

      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-evegah-text">Battery Swaps</h1>
          <p className="text-sm text-evegah-muted">View, edit, and delete battery swap records.</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-evegah-border bg-white p-4 shadow-card">
            <div className="text-xs text-evegah-muted">Swaps Loaded</div>
            <div className="mt-1 text-xl font-semibold text-evegah-text">{headerStats.totalSwapsShown}</div>
          </div>
          <div className="rounded-2xl border border-evegah-border bg-white p-4 shadow-card">
            <div className="text-xs text-evegah-muted">Top Battery (30 days)</div>
            <div className="mt-1 text-xl font-semibold text-evegah-text">{headerStats.topBattery}</div>
          </div>
          <div className="rounded-2xl border border-evegah-border bg-white p-4 shadow-card">
            <div className="text-xs text-evegah-muted">Top Vehicle (30 days)</div>
            <div className="mt-1 text-xl font-semibold text-evegah-text">{headerStats.topVehicle}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
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

          <div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
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

        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-semibold text-evegah-text">Battery Swaps</h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md w-full sm:w-72">
                <Search size={16} className="text-gray-600" />
                <input
                  placeholder="Search vehicle, battery, rider, employee"
                  value={swapSearch}
                  onChange={(e) => setSwapSearch(e.target.value)}
                  className="bg-transparent outline-none ml-2 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                {selectedSwapIds.length > 0 ? (
                  <span className="text-xs text-red-600">
                    {selectedSwapIds.length} selected
                  </span>
                ) : null}
                <button
                  type="button"
                  className="btn-outline text-red-600"
                  disabled={selectedSwapIds.length === 0 || swapBusy}
                  onClick={bulkDeleteSelected}
                >
                  Delete Selected
                </button>
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={swapBusy}
                onClick={() => setSwapRefresh((x) => x + 1)}
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && (batterySwaps || []).length === 0 ? (
            <div className="p-6 text-center text-gray-500">Loading swaps…</div>
          ) : visibleSwaps.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No swaps found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectVisible}
                        aria-label="Select swaps"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Battery Out</th>
                    <th className="px-4 py-3 text-left">Battery In</th>
                    <th className="px-4 py-3 text-left">Rider</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleSwaps.map((row) => (
                    <tr key={row?.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSwapIds.includes(String(row?.id || ""))}
                          onChange={() => toggleSwapSelection(row?.id)}
                          aria-label={`Select swap ${row?.id}`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtSwapTime(row?.swapped_at || row?.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row?.vehicle_number || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row?.battery_out || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row?.battery_in || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row?.rider_full_name || row?.rider_mobile || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded hover:bg-gray-100"
                            title="View"
                            onClick={() =>
                              openDetailsWithSearch({
                                title: row?.vehicle_number ? `Vehicle ${row.vehicle_number}` : "Swap Details",
                                subtitle: row?.rider_mobile
                                  ? `Rider: ${row.rider_full_name || "-"} (${row.rider_mobile})`
                                  : "Swap history",
                                search: row?.vehicle_number || row?.rider_mobile || "",
                                selectedRow: row,
                              })
                            }
                          >
                            <Eye size={16} className="text-gray-700" />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded hover:bg-gray-100"
                            title="Edit"
                            disabled={swapBusy}
                            onClick={() => {
                              openDetailsWithSearch({
                                title: row?.vehicle_number ? `Vehicle ${row.vehicle_number}` : "Swap Details",
                                subtitle: row?.rider_mobile
                                  ? `Rider: ${row.rider_full_name || "-"} (${row.rider_mobile})`
                                  : "Swap history",
                                search: row?.vehicle_number || row?.rider_mobile || "",
                                selectedRow: row,
                              });
                              setDetailsMode("edit");
                              startEditSwap(row);
                            }}
                          >
                            <Edit size={16} className="text-gray-700" />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded hover:bg-gray-100"
                            title="Delete"
                            disabled={swapBusy}
                            onClick={async () => {
                              await deleteSwap(row?.id);
                              setSwapRefresh((x) => x + 1);
                            }}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {detailsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            // close when clicking backdrop
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="w-full max-w-5xl rounded-2xl border border-evegah-border bg-white shadow-card">
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
                                filteredEditVehicleIds.map((id) => (
                                  <button
                                    key={id}
                                    type="button"
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                      id === swapDraft?.vehicle_number ? "bg-gray-100" : ""
                                    }`}
                                    onClick={() => {
                                      setSwapDraft((p) => ({ ...(p || {}), vehicle_number: id }));
                                      setEditVehicleOpen(false);
                                      setEditVehicleQuery("");
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
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                      id === swapDraft?.battery_out ? "bg-gray-100" : ""
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
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                      id === swapDraft?.battery_in ? "bg-gray-100" : ""
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
                          <td className="py-2 pr-3 whitespace-nowrap">{row.rider_full_name || "-"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap text-evegah-muted">{row.rider_mobile || "-"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{row.vehicle_number || "-"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{row.battery_out || "-"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{row.battery_in || "-"}</td>
                          <td className="py-2 pr-3 whitespace-nowrap text-evegah-muted">{row.employee_email || "-"}</td>
                          <td className="py-2">{row.notes || "-"}</td>
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
  );
}
