import AdminSidebar from "../../components/admin/AdminSidebar";
import { apiFetch } from "../../config/api";

import EditRiderModal from "./EditRiderModal";
import DeleteModal from "./DeleteModal";
import RiderProfileModal from "./RiderProfileModal";

import { formatDateDDMMYYYY } from "../../utils/dateFormat";
import { Search, Eye, Edit, Trash2, Download } from "lucide-react";

import { useEffect, useState } from "react";

export default function RidersTable() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [rideStatus, setRideStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination

  // Summary stats
  const [totalRiders, setTotalRiders] = useState(0);
  const [activeRentedVehicles, setActiveRentedVehicles] = useState(0);
  const [retainRiders, setRetainRiders] = useState(0);
  const [endedRiders, setEndedRiders] = useState(0);

  // Bulk actions
  const [selected, setSelected] = useState([]);

  // Modals
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  async function loadStats() {
    const stats = await apiFetch("/api/riders/stats");
    setTotalRiders(stats?.totalRiders || 0);
    setActiveRentedVehicles(stats?.activeRentedVehicles || 0);
    setRetainRiders(stats?.retainRiders || 0);
    setEndedRiders(stats?.endedRiders || 0);
  }

  async function loadRiders() {
    setLoading(true);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (rideStatus && rideStatus !== "all") params.set("rideStatus", rideStatus);
    if (dateRange.start) params.set("start", dateRange.start);
    if (dateRange.end) params.set("end", dateRange.end);

    const query = params.toString();
    const result = await apiFetch(`/api/riders${query ? `?${query}` : ""}`);
    setRiders(result?.data || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRiders();
  }, [search, rideStatus, dateRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
      loadRiders();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rideStatus, dateRange]);

  function exportCSV(data) {
    const csv =
      "Name,Mobile,Aadhaar,Status,Created At\n" +
      data
        .map(
          (r) =>
            `${r.full_name},${r.mobile},${r.aadhaar},${r.status},${r.created_at}`
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "riders_export.csv";
    a.click();
  }

  function exportSelected() {
    const filtered = riders.filter((r) => selected.includes(r.id));
    exportCSV(filtered);
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Riders</h1>

          <button
            onClick={() => exportCSV(riders)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-xl p-4">
            <p className="text-gray-500 text-sm">Total Riders</p>
            <h2 className="text-2xl font-bold">{totalRiders}</h2>
          </div>

          <div className="bg-white shadow rounded-xl p-4">
            <p className="text-gray-500 text-sm">Active Rented Vehicles</p>
            <h2 className="text-2xl font-bold text-green-600">{activeRentedVehicles}</h2>
          </div>

          <div className="bg-white shadow rounded-xl p-4">
            <p className="text-gray-500 text-sm">Retain Riders</p>
            <h2 className="text-2xl font-bold text-blue-700">{retainRiders}</h2>
          </div>

          <div className="bg-white shadow rounded-xl p-4">
            <p className="text-gray-500 text-sm">Ended Riders</p>
            <h2 className="text-2xl font-bold text-gray-900">{endedRiders}</h2>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {selected.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white p-3 rounded-xl shadow border">
            <span className="font-medium">{selected.length} selected</span>

            <button
              onClick={exportSelected}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Export Selected
            </button>

            <button
              onClick={() => setDeleteItem({ bulk: true, ids: [...selected] })}
              className="px-3 py-2 bg-red-600 text-white rounded"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="bg-white p-4 shadow rounded-xl mb-6 flex justify-between items-center border">
          {/* SEARCH BAR LEFT */}
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md w-72">
            <Search size={16} className="text-gray-600" />
            <input
              placeholder="Search name, mobile, Aadhaar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none ml-2 w-full"
            />
          </div>

          {/* FILTERS RIGHT */}
          <div className="flex items-center gap-3">
            <select
              value={rideStatus}
              onChange={(e) => setRideStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Ride</option>
              <option value="riding">Riding</option>
              <option value="returned">Returned</option>
              <option value="no_ride">No Ride</option>
            </select>

            <input
              type="date"
              className="border px-3 py-2 rounded-md"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />

            <span>to</span>

            <input
              type="date"
              className="border px-3 py-2 rounded-md"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Loading riders…
            </div>
          ) : riders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No riders found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.length === riders.length}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? riders.map((r) => r.id) : []
                        )
                      }
                    />
                  </th>

                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Aadhaar</th>
                  <th className="p-3 text-left">Ride</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {riders.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => {
                          if (selected.includes(r.id)) {
                            setSelected(selected.filter((s) => s !== r.id));
                          } else {
                            setSelected([...selected, r.id]);
                          }
                        }}
                      />
                    </td>

                    <td className="p-3 font-medium">{r.full_name}</td>
                    <td className="p-3">{r.mobile}</td>
                    <td className="p-3">{r.aadhaar}</td>

                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                            r.ride_status === "Riding"
                              ? "bg-green-100 text-green-700"
                              : r.ride_status === "Returned"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {r.ride_status || "-"}
                        </span>
                        {r.active_vehicle_number ? (
                          <span className="text-xs text-gray-500">
                            Vehicle: {r.active_vehicle_number}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.rider_type === "Retain"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.rider_type || "-"}
                      </span>
                    </td>

                    <td className="p-3">
                      {formatDateDDMMYYYY(r.created_at, "-")}
                    </td>

                    <td className="p-3 flex justify-center gap-2">
                      <button
                        onClick={() => setViewItem(r)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => setEditItem(r)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteItem(r)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
        <RiderProfileModal rider={viewItem} close={() => setViewItem(null)} />
      )}
    </div>
  );
}
