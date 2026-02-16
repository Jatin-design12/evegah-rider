import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import { apiFetch } from "../../config/api";
import { Users, Bike, IndianRupee, BarChart2, Activity, Package, RotateCcw, MapPin } from "lucide-react";

import { MultiLayerRevenueChart } from "../../components/Charts";
import {
	ResponsiveContainer,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Bar
} from "recharts";

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [stats, setStats] = useState([
		{ title: "Total Riders", value: "-", icon: Users, color: "bg-blue-100 text-blue-600" },
		{ title: "Total Rentals", value: "-", icon: Bike, color: "bg-green-100 text-green-600" },
		{ title: "Revenue", value: "-", icon: IndianRupee, color: "bg-yellow-100 text-yellow-600" },
		{ title: "Active Rides", value: "-", icon: Activity, color: "bg-purple-100 text-purple-600" },
	]);

	const [multiLayerData, setMultiLayerData] = useState([]);
	const [returnsData, setReturnsData] = useState([]);
	const [recentReturns, setRecentReturns] = useState([]);
	const [rentalsByPackageData, setRentalsByPackageData] = useState([]);
	const [rentalsByZoneData, setRentalsByZoneData] = useState([]);
	const [timeRange, setTimeRange] = useState("6months");

	const inr = useMemo(
		() => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }),
		[]
	);


	useEffect(() => {
		let mounted = true;

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

		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const [
					summary,
					analyticsSeries,
					returnsSeries,
					returnsRows,
					packageSeries,
					zoneSeries,
				] =
					await Promise.all([
						apiFetch("/api/dashboard/summary"),
						apiFetch(`/api/dashboard/analytics-months?months=${timeRange === "weekly" ? 1 : timeRange === "monthly" ? 1 : 6}`),
						apiFetch("/api/dashboard/returns-week"),
						apiFetch("/api/returns"),
						apiFetch("/api/dashboard/rentals-by-package?days=30"),
						apiFetch("/api/dashboard/rentals-by-zone?days=30"),
					]);

				if (!mounted) return;

				setStats([
					{ title: "Total Riders", value: inr.format(Number(summary?.totalRiders || 0)), icon: Users, color: "bg-blue-100 text-blue-600" },
					{ title: "Total Rentals", value: inr.format(Number(summary?.totalRentals || 0)), icon: Bike, color: "bg-green-100 text-green-600" },
					{ title: "Revenue", value: `₹${inr.format(Number(summary?.revenue || 0))}`, icon: IndianRupee, color: "bg-yellow-100 text-yellow-600" },
					{ title: "Active Rides", value: inr.format(Number(summary?.activeRides || 0)), icon: Activity, color: "bg-purple-100 text-purple-600" },
				]);

				setMultiLayerData(Array.isArray(analyticsSeries) ? analyticsSeries : []);
				setReturnsData(Array.isArray(returnsSeries) ? returnsSeries : []);

				const list = Array.isArray(returnsRows) ? returnsRows : [];
				const mapped = list.slice(0, 5).map((r) => {
					const meta = parseMaybeJson(r?.return_meta) || r?.return_meta || {};
					const feedback = meta && typeof meta === "object" ? meta.feedback : "";
					return {
						return_id: r?.return_id,
						rental_id: r?.rental_id,
						returned_at: r?.returned_at,
						condition_notes: r?.condition_notes,
						feedback: feedback || "",
						bike_id: r?.bike_id,
						vehicle_number: r?.vehicle_number,
						rider_full_name: r?.rider_full_name,
						rider_mobile: r?.rider_mobile,
					};
				});
				setRecentReturns(mapped);
				setRentalsByPackageData(Array.isArray(packageSeries) ? packageSeries : []);
				setRentalsByZoneData(Array.isArray(zoneSeries) ? zoneSeries : []);
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
	}, [inr, timeRange]);

	return (
		<div
			className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
			style={{
				paddingBottom: 0,
				marginBottom: 0,
				height: 'auto',
				overflow: 'hidden'
			}}
		>
			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
				<div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
			</div>

			<div className="flex relative z-10 w-full min-h-0">
				<AdminSidebar />
				<div
					className="flex-1 overflow-y-auto min-h-0 min-w-0 sm:ml-[var(--admin-sidebar-width,16rem)]"
					style={{
						minHeight: '100vh',
						paddingBottom: 0,
						marginBottom: 0,
						height: 'auto',
						overflow: 'hidden'
					}}
				>
					<div
						className="px-10 pt-10 pb-10"
						style={{
							paddingBottom: 10,
							marginBottom: 30
						}}
					>
						{/* Hero Header */}
						<div className="mb-6">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="text-3xl font-bold text-slate-900 tracking-tight">
										Dashboard Overview
									</h1>
									<p className="text-md text-slate-600 mt-2 max-w-2xl">
										Welcome back! Here's what's happening with your eVEGAH operations today.
									</p>
								</div>
								<div className="flex items-center space-x-4">
									<div className="bg-white/80 backdrop-blur-lg rounded-3xl px-8 py-4 shadow-2xl border border-white/30">
										<div className="text-sm text-slate-500 font-medium">Last updated</div>
										<div className="text-2xl font-bold text-slate-800">
											{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</div>
									</div>
								</div>
							</div>
						</div>

						{error ? (
							<div className="mb-6 bg-red-50/90 backdrop-blur-lg border border-red-200/50 rounded-3xl p-8 shadow-2xl">
								<div className="flex items-center space-x-4">
									<div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
										<span className="text-red-600 text-3xl">⚠️</span>
									</div>
									<div>
										<h3 className="text-2xl font-bold text-red-800">Error Loading Data</h3>
										<p className="text-red-600 text-lg mt-1">{error}</p>
									</div>
								</div>
							</div>
						) : null}

						{/* Stats Grid - Modern Glass Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							{stats.map((item, i) => (
								<div
									key={i}
									className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl hover:scale-102 transition-all duration-300 cursor-pointer"
								>

									{/* Floating geometric shapes */}
									<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-6 translate-x-6 group-hover:scale-110 transition-transform duration-300"></div>
									<div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-xl translate-y-3 -translate-x-3 group-hover:rotate-12 transition-transform duration-300"></div>

									<div className="relative z-10">
										<div className="flex items-center justify-between mb-4">
											<div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 shrink-0 ${item.color}`}>
												{item.icon ? <item.icon className="w-6 h-6" aria-hidden /> : <BarChart2 className="w-6 h-6" aria-hidden />}
											</div>
											<div className="text-2xl opacity-20 group-hover:opacity-60 transition-opacity duration-300 font-bold text-slate-400">
												#{i + 1}
											</div>
										</div>
										<div className="space-y-1">
											<div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
												{item.title}
											</div>
											<div className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors duration-300">
												{item.value}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Main Content - Creative Layout */}
						<div
							className="space-y-6 [&>*:last-child]:mb-0"
							style={{ paddingBottom: 0, marginBottom: 0 }}
						>
							{/* Primary Chart Section */}
							<div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
								<div className="flex items-center justify-between gap-6 mb-6">
									<div className="flex items-center space-x-4">
										<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
											<BarChart2 className="w-5 h-5 text-white" />
										</div>
										<div>
											<h2 className="text-2xl font-bold text-slate-800">Revenue & Rentals Overview</h2>
											<p className="text-slate-600 text-sm">Track your business performance over time</p>
										</div>
									</div>
									<div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
										<button
											type="button"
											onClick={() => setTimeRange("weekly")}
											className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${timeRange === "weekly"
												? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
												: "text-slate-600 hover:text-slate-800 hover:bg-white/50"
												}`}
										>
											Weekly
										</button>
										<button
											type="button"
											onClick={() => setTimeRange("monthly")}
											className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${timeRange === "monthly"
												? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
												: "text-slate-600 hover:text-slate-800 hover:bg-white/50"
												}`}
										>
											Monthly
										</button>
										<button
											type="button"
											onClick={() => setTimeRange("6months")}
											className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${timeRange === "6months"
												? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
												: "text-slate-600 hover:text-slate-800 hover:bg-white/50"
												}`}
										>
											6 Months
										</button>
									</div>
								</div>
								<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
									<MultiLayerRevenueChart data={multiLayerData} />
								</div>
							</div>

							{/* Bottom Analytics Row */}
							<div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{ paddingBottom: 0, marginBottom: 0 }}>
								{/* Rentals by Package */}
								<div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500">
									<div className="flex items-center justify-between gap-4 mb-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
													<Package className="w-5 h-5 text-white" />
												</div>
												<h3 className="text-xl font-bold text-slate-800">Rentals by Package</h3>
											</div>
										<span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">30 Days</span>
									</div>
									<div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
										<ResponsiveContainer width="100%" height={240}>
											<BarChart data={rentalsByPackageData}>
												<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
												<XAxis dataKey="package" stroke="#64748b" />
												<YAxis stroke="#64748b" />
												<Tooltip
													contentStyle={{
														backgroundColor: 'rgba(255, 255, 255, 0.95)',
														border: 'none',
														borderRadius: '16px',
														boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
													}}
												/>
												<Bar dataKey="rentals" fill="url(#packageGradient)" radius={[12, 12, 0, 0]} />
												<defs>
													<linearGradient id="packageGradient" x1="0" y1="0" x2="0" y2="1">
														<stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
														<stop offset="95%" stopColor="#a855f7" stopOpacity={0.8} />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>

								{/* Returns This Week */}
								<div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500">
									<div className="flex items-center justify-between gap-4 mb-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
													<RotateCcw className="w-5 h-5 text-white" />
												</div>
												<h3 className="text-xl font-bold text-slate-800">Returns This Week</h3>
											</div>
										<span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Trend</span>
									</div>
									<div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4">
										<ResponsiveContainer width="100%" height={240}>
											<BarChart data={returnsData}>
												<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
												<XAxis dataKey="day" stroke="#64748b" />
												<YAxis stroke="#64748b" />
												<Tooltip
													contentStyle={{
														backgroundColor: 'rgba(255, 255, 255, 0.95)',
														border: 'none',
														borderRadius: '16px',
														boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
													}}
												/>
												<Bar dataKey="returns" fill="url(#returnsGradient)" radius={[12, 12, 0, 0]} />
												<defs>
													<linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
														<stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
														<stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8} />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>

								{/* Rentals by Zone */}
								<div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500">
									<div className="flex items-center justify-between gap-4 mb-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
													<MapPin className="w-5 h-5 text-white" />
												</div>
												<h3 className="text-xl font-bold text-slate-800">Rentals by Zone</h3>
											</div>
										<span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">30 Days</span>
									</div>
									<div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4">
										<ResponsiveContainer width="100%" height={240}>
											<BarChart data={rentalsByZoneData}>
												<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
												<XAxis dataKey="zone" stroke="#64748b" />
												<YAxis stroke="#64748b" />
												<Tooltip
													contentStyle={{
														backgroundColor: 'rgba(255, 255, 255, 0.95)',
														border: 'none',
														borderRadius: '16px',
														boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
													}}
												/>
												<Bar dataKey="rentals" fill="url(#zoneGradient)" radius={[12, 12, 0, 0]} />
												<defs>
													<linearGradient id="zoneGradient" x1="0" y1="0" x2="0" y2="1">
														<stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
														<stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8} />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>

							{/* Recent Returns (Condition + Feedback) */}
							<div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
								<div className="flex items-center justify-between gap-4 mb-4">
									<div>
										<h3 className="text-xl font-bold text-slate-800">Recent Returns</h3>
										<p className="text-sm text-slate-600">Vehicle condition and rider feedback</p>
									</div>
									<span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Latest</span>
								</div>

								<div className="overflow-x-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="text-left text-slate-600">
												<th className="py-2 pr-4 font-semibold">Returned</th>
												<th className="py-2 pr-4 font-semibold">Rider</th>
												<th className="py-2 pr-4 font-semibold">Vehicle</th>
												<th className="py-2 pr-4 font-semibold">Condition</th>
												<th className="py-2 pr-4 font-semibold">Feedback</th>
											</tr>
										</thead>
										<tbody>
											{loading ? (
												<tr>
													<td className="py-3 pr-4 text-slate-500" colSpan={5}>
														Loading recent returns...
													</td>
												</tr>
											) : recentReturns.length === 0 ? (
												<tr>
													<td className="py-3 pr-4 text-slate-500" colSpan={5}>
														No recent returns found.
													</td>
												</tr>
											) : (
												recentReturns.map((r) => (
													<tr key={String(r?.return_id || r?.rental_id || "")} className="border-t border-slate-200/60">
														<td className="py-3 pr-4 text-slate-700 whitespace-nowrap">
															{r?.returned_at ? new Date(r.returned_at).toLocaleString() : "-"}
														</td>
														<td className="py-3 pr-4 text-slate-800 whitespace-nowrap">
															{r?.rider_full_name || "-"}
															{r?.rider_mobile ? (
																<div className="text-xs text-slate-500">{r.rider_mobile}</div>
															) : null}
														</td>
														<td className="py-3 pr-4 text-slate-700 whitespace-nowrap">
															{r?.bike_id || r?.vehicle_number || "-"}
														</td>
														<td className="py-3 pr-4 text-slate-700">
															{r?.condition_notes ? String(r.condition_notes) : "-"}
														</td>
														<td className="py-3 pr-4 text-slate-700">
															{r?.feedback ? String(r.feedback) : "-"}
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
				</div>
			</div>
		</div>
	);
}
