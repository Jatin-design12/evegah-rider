import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

import { apiFetch } from "../../config/api";
import { Users, Bike, IndianRupee, BarChart2, Activity, Package, RotateCcw, MapPin, Battery, Zap, Clock, TrendingUp, ExternalLink, X, Maximize2, Download } from "lucide-react";

import { MultiLayerRevenueChart } from "../../components/Charts";
import {
	ResponsiveContainer,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Bar,
	PieChart,
	Pie,
	Cell
} from "recharts";

import vehicleImage from "../../assets/image-removebg-preview (1).png";

const BRAND = "#2A195C";
const BRAND_MED = "#7c6bc4";

// Donut colors
const DONUT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const ChartDownloadMenu = ({ includeImage = true }) => {
	const [open, setOpen] = useState(false);
	const opts = includeImage ? ["CSV", "Excel", "SVG", "PNG"] : ["CSV", "Excel"];
	return (
		<div style={{ position: "relative" }}>
			<button type="button" onClick={() => setOpen(!open)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.2rem" }}>
				<Download size={18} style={{ color: "#64748b" }} />
			</button>
			{open && (
				<>
					<div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
					<div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.25rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.35rem", zIndex: 50, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", minWidth: "130px" }}>
						{opts.map(opt => (
							<button key={opt} onClick={() => setOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.82rem", color: "#475569", borderRadius: "0.25rem", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
								Download {opt}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [stats, setStats] = useState([
		{ title: "Total Riders", value: "-", icon: Users, color: "#3b82f6", borderColor: "#3b82f6" },
		{ title: "Total Rentals", value: "-", icon: Bike, color: "#22c55e", borderColor: "#22c55e" },
		{ title: "Revenue", value: "-", icon: IndianRupee, color: "#f59e0b", borderColor: "#f59e0b" },
		{ title: "Active Rides", value: "-", icon: Activity, color: "#8b5cf6", borderColor: "#8b5cf6" },
	]);

	const [multiLayerData, setMultiLayerData] = useState([]);
	const [returnsData, setReturnsData] = useState([]);
	const [recentReturns, setRecentReturns] = useState([]);
	const [rentalsByPackageData, setRentalsByPackageData] = useState([]);
	const [rentalsByZoneData, setRentalsByZoneData] = useState([]);
	const [timeRange, setTimeRange] = useState("6months");

	const [mapOpen, setMapOpen] = useState(false);

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

			if (import.meta.env.VITE_MODE === "dev" || import.meta.env.Mode === "dev" || import.meta.env.VITE_MODE === "development") {
				console.log("Dev mode active: Using dummy data for dashboard");
				if (!mounted) return;
				
				setStats([
					{ title: "Total Riders", value: inr.format(15250), icon: Users, color: "#3b82f6", borderColor: "#3b82f6" },
					{ title: "Total Rentals", value: inr.format(42300), icon: Bike, color: "#22c55e", borderColor: "#22c55e" },
					{ title: "Revenue", value: `₹${inr.format(1250000)}`, icon: IndianRupee, color: "#f59e0b", borderColor: "#f59e0b" },
					{ title: "Active Rides", value: inr.format(142), icon: Activity, color: "#8b5cf6", borderColor: "#8b5cf6" },
				]);

				setMultiLayerData([
					{ name: "Jan", revenue: 200000, rentals: 400 },
					{ name: "Feb", revenue: 250000, rentals: 500 },
					{ name: "Mar", revenue: 280000, rentals: 600 },
					{ name: "Apr", revenue: 220000, rentals: 450 },
					{ name: "May", revenue: 300000, rentals: 650 },
					{ name: "Jun", revenue: 350000, rentals: 800 },
				]);
				setReturnsData([
					{ day: "Mon", returns: 45 },
					{ day: "Tue", returns: 52 },
					{ day: "Wed", returns: 38 },
					{ day: "Thu", returns: 65 },
					{ day: "Fri", returns: 70 },
					{ day: "Sat", returns: 85 },
					{ day: "Sun", returns: 90 },
				]);

				setRecentReturns([
					{ return_id: "RET-1", rental_id: "RNT-101", returned_at: new Date().toISOString(), condition_notes: "Good condition", feedback: "Great service!", bike_id: "BIKE-01", vehicle_number: "GJ-06-XX-1111", rider_full_name: "Rahul Sharma", rider_mobile: "9876543210" },
					{ return_id: "RET-2", rental_id: "RNT-102", returned_at: new Date(Date.now() - 3600000).toISOString(), condition_notes: "Minor scratch on right mirror", feedback: "", bike_id: "BIKE-02", vehicle_number: "GJ-06-XX-2222", rider_full_name: "Priya Patel", rider_mobile: "8765432109" },
					{ return_id: "RET-3", rental_id: "RNT-103", returned_at: new Date(Date.now() - 7200000).toISOString(), condition_notes: "Perfect", feedback: "Battery was fully charged, loved it", bike_id: "BIKE-03", vehicle_number: "GJ-06-XX-3333", rider_full_name: "Amit Kumar", rider_mobile: "7654321098" },
				]);
				setRentalsByPackageData([
					{ package: "Hourly", rentals: 1200 },
					{ package: "Daily", rentals: 800 },
					{ package: "Weekly", rentals: 350 },
					{ package: "Monthly", rentals: 150 },
				]);
				setRentalsByZoneData([
					{ zone: "Gotri", rentals: 750 },
					{ zone: "Manjalpur", rentals: 620 },
					{ zone: "Karelibaug", rentals: 580 },
					{ zone: "Akota", rentals: 420 },
					{ zone: "Sayajigunj", rentals: 350 },
				]);
				setLoading(false);
				return;
			}

			try {
				const [summary, analyticsSeries, returnsSeries, returnsRows, packageSeries, zoneSeries] =
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
					{ title: "Total Riders", value: inr.format(Number(summary?.totalRiders || 0)), icon: Users, color: "#3b82f6", borderColor: "#3b82f6" },
					{ title: "Total Rentals", value: inr.format(Number(summary?.totalRentals || 0)), icon: Bike, color: "#22c55e", borderColor: "#22c55e" },
					{ title: "Revenue", value: `₹${inr.format(Number(summary?.revenue || 0))}`, icon: IndianRupee, color: "#f59e0b", borderColor: "#f59e0b" },
					{ title: "Active Rides", value: inr.format(Number(summary?.activeRides || 0)), icon: Activity, color: "#8b5cf6", borderColor: "#8b5cf6" },
				]);

				if (Array.isArray(analyticsSeries) && analyticsSeries.length > 0) {
					setMultiLayerData(analyticsSeries);
				} else {
					setMultiLayerData([
						{ month: "Jan", rentals: 400, revenue: 2400 },
						{ month: "Feb", rentals: 300, revenue: 1398 },
						{ month: "Mar", rentals: 200, revenue: 9800 },
						{ month: "Apr", rentals: 278, revenue: 3908 },
						{ month: "May", rentals: 189, revenue: 4800 },
						{ month: "Jun", rentals: 239, revenue: 3800 },
					]);
				}
				setReturnsData(Array.isArray(returnsSeries) ? returnsSeries : []);

				const list = Array.isArray(returnsRows) ? returnsRows : [];
				const mapped = list.slice(0, 5).map((r) => {
					const meta = parseMaybeJson(r?.return_meta) || r?.return_meta || {};
					const feedback = meta && typeof meta === "object" ? meta.feedback : "";
					return { return_id: r?.return_id, rental_id: r?.rental_id, returned_at: r?.returned_at, condition_notes: r?.condition_notes, feedback: feedback || "", bike_id: r?.bike_id, vehicle_number: r?.vehicle_number, rider_full_name: r?.rider_full_name, rider_mobile: r?.rider_mobile };
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
		return () => { mounted = false; clearInterval(interval); };
	}, [inr, timeRange]);

	// Donut data for package distribution
	const stationDonut = useMemo(() => {
		const total = rentalsByPackageData.reduce((a, b) => a + (b.rentals || 0), 0);
		return rentalsByPackageData.map((d, i) => ({
			name: d.package, value: d.rentals || 0, color: DONUT_COLORS[i % DONUT_COLORS.length],
			pct: total > 0 ? Math.round(((d.rentals || 0) / total) * 100) : 0,
		}));
	}, [rentalsByPackageData]);

	const totalPackageRentals = rentalsByPackageData.reduce((a, b) => a + (b.rentals || 0), 0);

	/* ─── Card base ─── */
	const card = {
		background: "#ffffff",
		borderRadius: "1rem",
		boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
		border: "1px solid #f1f5f9",
	};

	/* ─── Colorful info card style (reference middle row) ─── */
	const infoCard = (bg) => ({
		borderRadius: "1rem",
		padding: "1.25rem",
		background: bg,
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
		transition: "transform 0.25s ease, box-shadow 0.25s ease",
		cursor: "pointer",
	});

	/* CSS for icon pulse animation */
	const pulseKeyframes = `
		@keyframes iconPulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.15); }
		}
		.dash-info-card:hover .dash-icon {
			animation: iconPulse 0.8s ease-in-out infinite;
		}
	`;

	return (
		<>
		<style>{pulseKeyframes}</style>
		<div className="h-screen w-full flex flex-col relative overflow-hidden" style={{ background: "#f0f2f5" }}>
			<AdminTopbar />
			<div className="flex relative z-10 w-full flex-1 min-h-0">
				<AdminSidebar />
				<div
					className="flex-1 overflow-y-auto min-h-0 min-w-0 sm:ml-[var(--admin-sidebar-width,15rem)]"
				>
					<div style={{ padding: "1.25rem 1.5rem 2rem" }}>
						{error && (
							<div style={{ ...card, padding: "1.25rem", marginBottom: "1.25rem", borderLeft: "4px solid #ef4444" }}>
								<div className="flex items-center gap-3">
									<span className="text-2xl">⚠️</span>
									<div>
										<h3 style={{ fontWeight: 700, color: "#991b1b", fontSize: "1rem" }}>Error Loading Data</h3>
										<p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>
									</div>
								</div>
							</div>
						)}

						{/* ═══ TOP ROW: Vehicle + Map ═══ */}
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

							{/* Vehicle Showcase — just image + label */}
							<div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", border: `2px solid ${BRAND}` }}>
								<img
									src={vehicleImage}
									alt="New Evegah Modal"
									style={{ maxWidth: "100%", maxHeight: "260px", objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
								/>
								<h3 style={{ marginTop: "1rem", fontSize: "1rem", fontWeight: 700, color: "#1e293b", letterSpacing: "0.02em" }}>
									New Evegah Modal
								</h3>
							</div>

							{/* Map */}
							<div style={{ ...card, overflow: "hidden" }}>
								<div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<MapPin size={16} style={{ color: BRAND }} />
										<span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
											Find your nearest eVEGAH station
										</span>
									</div>
									<button type="button" onClick={() => setMapOpen(true)} style={{
										padding: "0.35rem 0.85rem", borderRadius: "0.5rem", background: BRAND, color: "#fff",
										border: "none", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
										display: "flex", alignItems: "center", gap: "0.35rem",
									}}>
										<Maximize2 size={12} /> Full View
									</button>
								</div>
								<iframe
									title="eVEGAH Station Map"
									src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118108.58399507709!2d73.10063868513015!3d22.30728068498049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fc8ab91a3ddab%3A0x19f37603c3b98095!2sVadodara%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1"
									style={{ width: "100%", height: "280px", border: "none", display: "block" }}
									loading="lazy"
									allowFullScreen
								/>
							</div>
						</div>

						{/* ═══ STATS ROW ═══ */}
						<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "1.25rem" }}>
							{stats.map((item, i) => (
								<div key={i} style={{
									...card,
									padding: "1.25rem 1.5rem",
									borderTop: `3px solid ${item.borderColor}`,
									display: "flex", alignItems: "center", gap: "1rem",
									cursor: "pointer", transition: "box-shadow 0.2s",
								}}
									onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
									onMouseLeave={(e) => e.currentTarget.style.boxShadow = card.boxShadow}
								>
									<div style={{
										width: "2.75rem", height: "2.75rem", borderRadius: "50%",
										background: item.borderColor + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
									}}>
										<item.icon size={20} style={{ color: item.color }} />
									</div>
									<div>
										<div style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>
											{item.title}
										</div>
										<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>
											{item.value}
										</div>
									</div>
								</div>
							))}
						</div>

						{/* ═══ MIDDLE ROW: Rental Packages (colorful) + Activity Info (colorful) + Returns Bar ═══ */}
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

							{/* Rental Packages — Colorful Cards + Donut */}
							<div style={{ ...card, padding: "1.25rem" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
									<h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>Rental Packages</h3>
									<ChartDownloadMenu includeImage={true} />
								</div>
								
								<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
									{["24 hours", "30 days", "1 year"].map((r) => (
										<button key={r} type="button"
											style={{
												padding: "0.5rem 1rem", border: "none", cursor: "pointer",
												fontSize: "0.85rem", fontWeight: 500,
												background: r === "30 days" ? BRAND : "transparent",
												color: r === "30 days" ? "#fff" : "#475569",
												borderTopLeftRadius: "0.25rem", borderTopRightRadius: "0.25rem",
												transition: "all 0.15s",
											}}
										>
											{r === "1 year" ? "1 years" : r}
										</button>
									))}
								</div>

								{/* Top stats — matching reference sizing */}
								<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: "0.85rem" }}>
									<div>
										<div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginBottom: "0.25rem" }}>Total</div>
										<div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{totalPackageRentals.toLocaleString()}</div>
									</div>
									<div>
										<div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginBottom: "0.25rem" }}>Top Plan</div>
										<div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#22c55e", lineHeight: 1.1 }}>{rentalsByPackageData[0]?.package || "-"}</div>
									</div>
									<div>
										<div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, marginBottom: "0.25rem" }}>Packages</div>
										<div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ef4444", lineHeight: 1.1 }}>{rentalsByPackageData.length}</div>
									</div>
								</div>

								{/* Donut — larger */}
								<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
									<ResponsiveContainer width="100%" height={185}>
										<PieChart>
											<Pie data={stationDonut} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} dataKey="value" stroke="none">
												{stationDonut.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip contentStyle={{ borderRadius: "0.75rem", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "0.82rem" }} />
										</PieChart>
									</ResponsiveContainer>
								</div>

								{/* Legend */}
								<div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", justifyContent: "center", marginTop: "0.5rem" }}>
									{stationDonut.map((d, i) => (
										<div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "#475569", fontWeight: 500 }}>
											<span style={{ width: "9px", height: "9px", borderRadius: "50%", background: d.color, display: "inline-block" }} />
											{d.name} ({d.pct}%)
										</div>
									))}
								</div>
							</div>

							{/* Charging / Activity Info — Colorful Pastel Cards (like reference) */}
							<div style={{ ...card, padding: "1.5rem" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
									<h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>Quick Overview</h3>
									<span style={{ fontSize: "0.75rem", color: "#64748b", background: "#f1f5f9", padding: "0.3rem 0.75rem", borderRadius: "0.5rem", fontWeight: 500 }}>Live</span>
								</div>

								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
									{/* Row 1 */}
									<div className="dash-info-card" style={infoCard("#f3e8ff")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<Battery className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#7c3aed" }} />
										<div style={{ fontSize: "0.82rem", color: "#6b21a8", fontWeight: 500, marginTop: "0.25rem" }}>Active Rides</div>
										<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#5b21b6", lineHeight: 1.1 }}>{stats[3]?.value || "-"}</div>
									</div>
									<div className="dash-info-card" style={infoCard("#f1f5f9")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<Zap className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#22c55e" }} />
										<div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 500, marginTop: "0.25rem" }}>Revenue</div>
										<div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{stats[2]?.value || "-"}</div>
									</div>

									{/* Row 2 */}
									<div className="dash-info-card" style={infoCard("#fef3c7")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<Zap className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#f59e0b" }} />
										<div style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: 500, marginTop: "0.25rem" }}>Total Rentals</div>
										<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", lineHeight: 1.1 }}>{stats[1]?.value || "-"}</div>
									</div>
									<div className="dash-info-card" style={infoCard("#f1f5f9")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<Clock className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#3b82f6" }} />
										<div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 500, marginTop: "0.25rem" }}>Total Riders</div>
										<div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{stats[0]?.value || "-"}</div>
									</div>

									{/* Row 3 */}
									<div className="dash-info-card" style={infoCard("#ccfbf1")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<IndianRupee className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#0d9488" }} />
										<div style={{ fontSize: "0.82rem", color: "#115e59", fontWeight: 500, marginTop: "0.25rem" }}>Avg. Revenue</div>
										<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f766e", lineHeight: 1.1 }}>
											₹{totalPackageRentals > 0 ? inr.format(Math.round(1250000 / totalPackageRentals)) : "-"}
										</div>
									</div>
									<div className="dash-info-card" style={infoCard("#f1f5f9")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
										<RotateCcw className="dash-icon" size={26} strokeWidth={2.5} style={{ color: "#64748b" }} />
										<div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 500, marginTop: "0.25rem" }}>Returns</div>
										<div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{recentReturns.length}</div>
									</div>
								</div>
							</div>

							{/* Statistics — Returns This Week */}
							<div style={{ ...card, padding: "1.25rem" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
									<h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>Statistics</h3>
									<ChartDownloadMenu includeImage={true} />
								</div>
								
								<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
									{["weekly", "monthly", "6months"].map((r) => (
										<button key={r} type="button" onClick={() => setTimeRange(r)}
											style={{
												padding: "0.5rem 1rem", border: "none", cursor: "pointer",
												fontSize: "0.85rem", fontWeight: 500,
												background: timeRange === r ? BRAND : "transparent",
												color: timeRange === r ? "#fff" : "#475569",
												borderTopLeftRadius: "0.25rem", borderTopRightRadius: "0.25rem",
												transition: "all 0.15s",
											}}
										>
											{r === "weekly" ? "24 hours" : r === "monthly" ? "30 days" : "1 years"}
										</button>
									))}
								</div>

								{/* Summary heading like reference */}
								<div style={{ marginBottom: "0.5rem" }}>
									<div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Total Energy Usage</div>
									<div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
										<span style={{ fontSize: "2.2rem", fontWeight: 400, color: "#1e293b", lineHeight: 1 }}>
											{returnsData.reduce((a, b) => a + (b.returns || 0), 0) || 50}
										</span>
										<span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>kWh</span>
									</div>
								</div>

								<ResponsiveContainer width="100%" height={280}>
									<BarChart data={returnsData} layout="vertical" barSize={18}>
										<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
										<XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
										<YAxis type="category" dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={40} />
										<Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8rem" }} />
										<Bar dataKey="returns" fill={BRAND_MED} radius={[0, 4, 4, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* ═══ BOTTOM ROW: Revenue Chart + Zone ═══ */}
						<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

							{/* Revenue & Rentals */}
							<div style={{ ...card, padding: "1.25rem" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<TrendingUp size={16} style={{ color: BRAND }} />
										<h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Revenue & Rentals</h3>
									</div>
									<div style={{ display: "flex", gap: "0.3rem" }}>
										{["weekly", "monthly", "6months"].map((r) => (
											<button key={r} type="button" onClick={() => setTimeRange(r)}
												style={{
													padding: "0.25rem 0.55rem", borderRadius: "0.4rem", border: "none", cursor: "pointer",
													fontSize: "0.62rem", fontWeight: 600,
													background: timeRange === r ? BRAND : "#f1f5f9",
													color: timeRange === r ? "#fff" : "#64748b",
												}}
											>
												{r === "weekly" ? "Weekly" : r === "monthly" ? "Monthly" : "6 Months"}
											</button>
										))}
									</div>
								</div>
								<div style={{ background: "#fafafa", borderRadius: "0.75rem", padding: "0.75rem" }}>
									<MultiLayerRevenueChart data={multiLayerData} />
								</div>
							</div>

							{/* Rentals by Zone */}
							<div style={{ ...card, padding: "1.25rem" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
										<MapPin size={15} style={{ color: "#06b6d4" }} />
										<h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Rentals by Zone</h3>
									</div>
									<ChartDownloadMenu includeImage={true} />
								</div>
								
								<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
									{["24 hours", "30 days", "1 year"].map((r) => (
										<button key={r} type="button"
											style={{
												padding: "0.45rem 0.85rem", border: "none", cursor: "pointer",
												fontSize: "0.8rem", fontWeight: 500,
												background: r === "30 days" ? BRAND : "transparent",
												color: r === "30 days" ? "#fff" : "#475569",
												borderTopLeftRadius: "0.25rem", borderTopRightRadius: "0.25rem",
												transition: "all 0.15s",
											}}
										>
											{r === "30 days" ? "30d" : r === "1 year" ? "1 years" : r}
										</button>
									))}
								</div>

								<ResponsiveContainer width="100%" height={240}>
									<BarChart data={rentalsByZoneData} barSize={24}>
										<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
										<XAxis dataKey="zone" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
										<YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={30} />
										<Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8rem" }} />
										<Bar dataKey="rentals" fill={BRAND_MED} radius={[0, 0, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* ═══ RECENT RETURNS TABLE ═══ */}
						<div style={{ ...card, padding: "1.25rem", marginBottom: "2rem" }}>
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
								<div>
									<h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Recent Returns</h3>
									<p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0.1rem 0 0" }}>Vehicle condition and rider feedback</p>
								</div>
								<span style={{ fontSize: "0.65rem", color: "#94a3b8", background: "#f8fafc", padding: "0.2rem 0.55rem", borderRadius: "999px", fontWeight: 600 }}>Latest</span>
							</div>

							<div style={{ overflowX: "auto" }}>
								<table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
									<thead>
										<tr style={{ borderBottom: "2px solid #f1f5f9" }}>
											{["Returned", "Rider", "Vehicle", "Condition", "Feedback"].map((h) => (
												<th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{loading ? (
											<tr><td style={{ padding: "1rem 0.75rem", color: "#94a3b8" }} colSpan={5}>Loading...</td></tr>
										) : recentReturns.length === 0 ? (
											<tr><td style={{ padding: "1rem 0.75rem", color: "#94a3b8" }} colSpan={5}>No recent returns.</td></tr>
										) : (
											recentReturns.map((r) => (
												<tr key={String(r?.return_id || r?.rental_id || "")} style={{ borderBottom: "1px solid #f8fafc" }}>
													<td style={{ padding: "0.6rem 0.75rem", color: "#475569", whiteSpace: "nowrap" }}>
														{r?.returned_at ? new Date(r.returned_at).toLocaleString() : "-"}
													</td>
													<td style={{ padding: "0.6rem 0.75rem", color: "#1e293b", whiteSpace: "nowrap" }}>
														{r?.rider_full_name || "-"}
														{r?.rider_mobile ? <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{r.rider_mobile}</div> : null}
													</td>
													<td style={{ padding: "0.6rem 0.75rem", color: "#475569", whiteSpace: "nowrap" }}>
														{r?.bike_id || r?.vehicle_number || "-"}
													</td>
													<td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
														{r?.condition_notes ? String(r.condition_notes) : "-"}
													</td>
													<td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
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

	{/* ═══ MAP POPUP MODAL ═══ */}
	{mapOpen && (
		<div
			style={{
				position: "fixed", inset: 0, zIndex: 9999,
				background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
				display: "flex", alignItems: "center", justifyContent: "center",
				padding: "2rem",
			}}
			onClick={() => setMapOpen(false)}
		>
			<div
				style={{
					width: "100%", maxWidth: "1100px", height: "80vh",
					background: "#fff", borderRadius: "1.25rem",
					overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
					display: "flex", flexDirection: "column",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div style={{
					padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9",
					display: "flex", alignItems: "center", justifyContent: "space-between",
				}}>
					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						<MapPin size={18} style={{ color: BRAND }} />
						<h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>eVEGAH Station Map</h3>
					</div>
					<button
						type="button"
						onClick={() => setMapOpen(false)}
						style={{
							width: "2.25rem", height: "2.25rem", borderRadius: "50%",
							border: "1px solid #e2e8f0", background: "#f8fafc",
							display: "flex", alignItems: "center", justifyContent: "center",
							cursor: "pointer",
						}}
					>
						<X size={16} style={{ color: "#64748b" }} />
					</button>
				</div>
				<iframe
					title="eVEGAH Station Map Full"
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118108.58399507709!2d73.10063868513015!3d22.30728068498049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fc8ab91a3ddab%3A0x19f37603c3b98095!2sVadodara%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1"
					style={{ width: "100%", flex: 1, border: "none" }}
					loading="lazy"
					allowFullScreen
				/>
			</div>
		</div>
	)}
	</>
	);
}
