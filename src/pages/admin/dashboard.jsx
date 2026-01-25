import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import StatCard from "../../components/admin/StatCard";
import { apiFetch } from "../../config/api";
import { formatDateTimeDDMMYYYY } from "../../utils/dateFormat";
import { formatElapsedMDHM } from "../../utils/durationFormat";

import { Users, Bike, IndianRupee, Clock } from "lucide-react";

import {
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [stats, setStats] = useState([
		{ title: "Total Riders", value: "-", icon: Users },
		{ title: "Total Rentals", value: "-", icon: Bike },
		{ title: "Revenue", value: "-", icon: IndianRupee },
		{ title: "Active Rides", value: "-", icon: Clock },
	]);

	const [revenueData, setRevenueData] = useState([]);
	const [rentalsData, setRentalsData] = useState([]);
	const [returnsData, setReturnsData] = useState([]);
	const [rentalsByPackageData, setRentalsByPackageData] = useState([]);
	const [rentalsByZoneData, setRentalsByZoneData] = useState([]);
	const [recentUsers, setRecentUsers] = useState([]);
	const [activeRentals, setActiveRentals] = useState([]);

	const inr = useMemo(
		() => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }),
		[]
	);

	const formatDuration = (startTime) => formatElapsedMDHM(startTime, "-");

	const formatDateTime = (value) => {
		return formatDateTimeDDMMYYYY(value, "-");
	};

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const [
					summary,
					recentRiders,
					activeRows,
					revenueSeries,
					rentalsSeries,
					returnsSeries,
					packageSeries,
					zoneSeries,
				] =
					await Promise.all([
						apiFetch("/api/dashboard/summary"),
						apiFetch("/api/dashboard/recent-riders?limit=3"),
						apiFetch("/api/dashboard/active-rentals?limit=5"),
						apiFetch("/api/dashboard/revenue-months?months=6"),
						apiFetch("/api/dashboard/rentals-week"),
						apiFetch("/api/dashboard/returns-week"),
						apiFetch("/api/dashboard/rentals-by-package?days=30"),
						apiFetch("/api/dashboard/rentals-by-zone?days=30"),
					]);

				if (!mounted) return;

				setStats([
					{ title: "Total Riders", value: inr.format(Number(summary?.totalRiders || 0)), icon: Users },
					{ title: "Total Rentals", value: inr.format(Number(summary?.totalRentals || 0)), icon: Bike },
					{ title: "Revenue", value: `₹${inr.format(Number(summary?.revenue || 0))}`, icon: IndianRupee },
					{ title: "Active Rides", value: inr.format(Number(summary?.activeRides || 0)), icon: Clock },
				]);

				setRevenueData(Array.isArray(revenueSeries) ? revenueSeries : []);
				setRentalsData(Array.isArray(rentalsSeries) ? rentalsSeries : []);
				setReturnsData(Array.isArray(returnsSeries) ? returnsSeries : []);
				setRentalsByPackageData(Array.isArray(packageSeries) ? packageSeries : []);
				setRentalsByZoneData(Array.isArray(zoneSeries) ? zoneSeries : []);
				setRecentUsers(
					(Array.isArray(recentRiders) ? recentRiders : []).map((r) => ({
						name: r?.full_name || "-",
						mobile: r?.mobile || "-",
					}))
				);
				setActiveRentals(
					(Array.isArray(activeRows) ? activeRows : []).map((r) => ({
						id: r?.id,
						user: r?.full_name || "-",
						vehicle: r?.vehicle_number || "-",
						duration: formatDuration(r?.start_time),
						startLabel: formatDateTime(r?.start_time),
					}))
				);
			} catch (e) {
				if (!mounted) return;
				setError(String(e?.message || e || "Unable to load dashboard"));
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();

		const interval = setInterval(load, 15000);
		return () => {
			mounted = false;
			clearInterval(interval);
		};
	}, [inr]);

	return (
		<div className="flex min-h-screen bg-evegah-bg">
			<AdminSidebar />

			<div className="flex-1 p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-semibold text-evegah-text">Dashboard</h1>
					<p className="text-sm text-evegah-muted">Overview of riders, rentals, and revenue.</p>
				</div>

				{error ? (
					<div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}

				{/* KPI cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
					{stats.map((item, i) => (
						<StatCard key={i} title={item.title} value={item.value} icon={item.icon} />
					))}
				</div>

				{/* Main grid */}
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					<div className="xl:col-span-2 bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Revenue Overview</h2>
							<div className="flex items-center gap-2">
								<button type="button" className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700">
									24 hours
								</button>
								<button type="button" className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100">
									30 days
								</button>
								<button type="button" className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100">
									1 year
								</button>
							</div>
						</div>

						<div className="text-blue-600">
							<ResponsiveContainer width="100%" height={260}>
								<LineChart data={revenueData}>
									<Line type="monotone" dataKey="revenue" stroke="currentColor" strokeWidth={3} dot={false} />
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis />
									<Tooltip />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Weekly Rentals</h2>
							<button type="button" className="text-xs font-medium text-gray-600 hover:text-gray-900">
								Download
							</button>
						</div>

						<div className="text-blue-600">	
							<ResponsiveContainer width="100%" height={260}>
								<BarChart data={rentalsData}>
									<Bar dataKey="rentals" fill="currentColor" radius={[8, 8, 0, 0]} />
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="day" />
									<YAxis />
									<Tooltip />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Recent Rider</h2>
							<span className="text-xs text-evegah-muted">History</span>
						</div>

						<div className="space-y-3">
							{recentUsers.map((u, i) => (
								<div key={i} className="rounded-2xl border border-evegah-border bg-white p-4">
									<div className="text-sm font-semibold text-evegah-text">{u.name}</div>
									<div className="text-xs text-evegah-muted">{u.mobile}</div>
								</div>
							))}
						</div>
					</div>

					<div className="xl:col-span-2 bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Active Rentals</h2>
							<span className="text-xs text-evegah-muted">Live</span>
						</div>

						<div className="divide-y divide-evegah-border">
							{activeRentals.map((r, i) => (
								<div key={i} className="flex items-center justify-between gap-4 py-4">
									<div>
										<div className="text-sm font-semibold text-evegah-text">{r.user}</div>
										<div className="text-xs text-evegah-muted">
											{r.vehicle} • {r.id}
										</div>
										{r.startLabel && r.startLabel !== "-" ? (
											<div className="text-[11px] text-gray-400">Started {r.startLabel}</div>
										) : null}
									</div>
									<div className="text-sm font-semibold text-blue-700">{r.duration}</div>
								</div>
							))}

							{loading && activeRentals.length === 0 ? (
								<div className="py-4 text-sm text-evegah-muted">Loading...</div>
							) : null}
						</div>
					</div>

					<div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Rentals by Package (30 Days)</h2>
							<span className="text-xs text-evegah-muted">Breakdown</span>
						</div>

						<div className="text-blue-600">
							<ResponsiveContainer width="100%" height={260}>
								<BarChart data={rentalsByPackageData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="package" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="rentals" fill="currentColor" radius={[8, 8, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Returns This Week</h2>
							<span className="text-xs text-evegah-muted">Trend</span>
						</div>

						<div className="text-blue-600">
							<ResponsiveContainer width="100%" height={260}>
								<BarChart data={returnsData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="day" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="returns" fill="currentColor" radius={[8, 8, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-6">
						<div className="flex items-center justify-between gap-4 mb-4">
							<h2 className="text-base font-semibold text-evegah-text">Rentals by Zone (30 Days)</h2>
							<span className="text-xs text-evegah-muted">Distribution</span>
						</div>

						<div className="text-blue-600">
							<ResponsiveContainer width="100%" height={260}>
								<BarChart data={rentalsByZoneData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="zone" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="rentals" fill="currentColor" radius={[8, 8, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

}
