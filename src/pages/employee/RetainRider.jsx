import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

import EmployeeLayout from "../../components/layouts/EmployeeLayout";
import useAuth from "../../hooks/useAuth";
import { BATTERY_ID_OPTIONS } from "../../utils/batteryIds";
import {
  filterVehicleIdGroups,
  flattenVehicleIdGroups,
  getVehicleIdGroupsForModel,
  VEHICLE_MODEL_OPTIONS,
} from "../../utils/vehicleIds";
import { apiFetch, getPublicConfig } from "../../config/api";
import { RiderFormProvider } from "./RiderFormContext";
import { useRiderForm } from "./useRiderForm";
import { downloadRiderReceiptPdf } from "../../utils/riderReceiptPdf";

const sanitizeNumericInput = (value, maxLength) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, maxLength);

const toDateTimeLocal = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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

function RetainRiderInner() {
  // State for completion message
  const [retainSuccess, setRetainSuccess] = useState(false);

  const clampSplitValue = (value) => {
    const next = Number(value);
    if (Number.isNaN(next)) return 0;
    return Math.max(0, next);
  };

  // Handle split payment field changes
  const handleCashChange = (val) => {
    const total = Number(formData.totalAmount || 0);
    const cash = Math.min(clampSplitValue(val), total);
    updateForm({ cashAmount: cash, onlineAmount: Math.max(0, total - cash) });
  };
  const handleOnlineChange = (val) => {
    const total = Number(formData.totalAmount || 0);
    const online = Math.min(clampSplitValue(val), total);
    updateForm({ onlineAmount: online, cashAmount: Math.max(0, total - online) });
  };
  // Payment mode change handler for split/cash/online
  const handlePaymentModeChange = (mode) => {
    if (mode === "cash") {
      updateForm({ paymentMode: mode, cashAmount: formData.totalAmount || 0, onlineAmount: 0 });
    } else if (mode === "online") {
      updateForm({ paymentMode: mode, cashAmount: 0, onlineAmount: formData.totalAmount || 0 });
    } else if (mode === "split") {
      const total = Number(formData.totalAmount || 0);
      const nextCash = Math.round(total / 2);
      updateForm({ paymentMode: mode, cashAmount: nextCash, onlineAmount: total - nextCash });
    } else {
      updateForm({ paymentMode: mode });
    }
  };
  const { formData, updateForm, resetForm } = useRiderForm();
  // Set default rentalStart to now when a rider is selected and value is empty
  useEffect(() => {
    if (formData.isRetainRider && formData.existingRiderId && !formData.rentalStart) {
      updateForm({ rentalStart: toDateTimeLocal(new Date()) });
    }
  }, [formData.isRetainRider, formData.existingRiderId]);
  const { user } = useAuth();

  const preRidePhotosInputRef = useRef(null);

  const [searchPhone, setSearchPhone] = useState("");
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [activeRideExpectedEnd, setActiveRideExpectedEnd] = useState("");
  const [activeRideStart, setActiveRideStart] = useState("");
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [batteryDropdownOpen, setBatteryDropdownOpen] = useState(false);
  const [batteryQuery, setBatteryQuery] = useState("");

  const [unavailableVehicleIds, setUnavailableVehicleIds] = useState([]);
  const [unavailableBatteryIds, setUnavailableBatteryIds] = useState([]);

  const vehicleDropdownRef = useRef(null);
  const vehicleQueryRef = useRef(null);
  const batteryDropdownRef = useRef(null);
  const batteryQueryRef = useRef(null);

  useEffect(() => {
    if (!imagePreview?.src) return;
    const prevOverflow = document.body.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [imagePreview?.src]);

  const normalizeIdForCompare = (value) =>
    String(value || "")
      .replace(/[^a-z0-9]+/gi, "")
      .toUpperCase();

  const normalizeModel = (value) => String(value || "").trim().toLowerCase();
  const isDefaultBatteryModel = DEFAULT_BATTERY_MODELS.has(normalizeModel(formData.bikeModel));

  const unavailableVehicleSet = useMemo(
    () => new Set((Array.isArray(unavailableVehicleIds) ? unavailableVehicleIds : []).map(normalizeIdForCompare).filter(Boolean)),
    [unavailableVehicleIds]
  );
  const unavailableBatterySet = useMemo(
    () => new Set((Array.isArray(unavailableBatteryIds) ? unavailableBatteryIds : []).map(normalizeIdForCompare).filter(Boolean)),
    [unavailableBatteryIds]
  );

  useEffect(() => {
    let mounted = true;
    apiFetch("/api/availability")
      .then((data) => {
        if (!mounted) return;
        setUnavailableVehicleIds(Array.isArray(data?.unavailableVehicleIds) ? data.unavailableVehicleIds : []);
        setUnavailableBatteryIds(Array.isArray(data?.unavailableBatteryIds) ? data.unavailableBatteryIds : []);
      })
      .catch(() => {
        if (!mounted) return;
        setUnavailableVehicleIds([]);
        setUnavailableBatteryIds([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isDefaultBatteryModel) {
      if (formData.batteryId !== "Default") {
        updateForm({ batteryId: "Default" });
      }
      setBatteryDropdownOpen(false);
      setBatteryQuery("");
      return;
    }

    if (formData.batteryId === "Default") {
      updateForm({ batteryId: "" });
    }
  }, [isDefaultBatteryModel, formData.batteryId, updateForm]);

  const selected = Boolean(formData.isRetainRider && formData.existingRiderId);

  const PACKAGE_OPTIONS = ["hourly", "daily", "weekly", "monthly"];
  const PAYMENT_OPTIONS = ["cash", "online", "split"];
  const BIKE_MODEL_OPTIONS = VEHICLE_MODEL_OPTIONS;
  const DEFAULT_BATTERY_MODELS = new Set([
    "paddle cycle",
    "electric scooter",
    "kids ev car",
    "kids paddle scooter",
    "double seat cycle",
  ]);
  const ACCESSORY_OPTIONS = [
    { key: "mobile_holder", label: "Mobile holder" },
    { key: "mirror", label: "Mirror" },
    { key: "helmet", label: "Helmet" },
    { key: "extra_battery", label: "Extra battery" },
  ];

  const toggleAccessory = (key) => {
    const current = Array.isArray(formData.accessories) ? formData.accessories : [];
    if (current.includes(key)) {
      updateForm({ accessories: current.filter((x) => x !== key) });
    } else {
      updateForm({ accessories: [...current, key] });
    }
  };

  const handleSearch = async () => {
    setError("");

    const mobileDigits = sanitizeNumericInput(searchPhone, 10);
    const name = String(searchName || "").trim();

    if (!mobileDigits && !name) {
      setError("Enter mobile number or name to search.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "20");
      if (mobileDigits) params.set("search", mobileDigits);
      if (name) params.set("search", name);

      const result = await apiFetch(`/api/riders?${params.toString()}`);
      const rows = Array.isArray(result?.data) ? result.data : [];
      setResults(rows);
      if (rows.length === 0) {
        setError("No rider found for the given search.");
      }
    } catch (e) {
      setError(String(e?.message || e || "Unable to search riders"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicleGroups = useMemo(
    () => filterVehicleIdGroups(vehicleQuery, getVehicleIdGroupsForModel(formData.bikeModel)),
    [vehicleQuery, formData.bikeModel]
  );
  const filteredVehicleIds = useMemo(() => flattenVehicleIdGroups(filteredVehicleGroups), [filteredVehicleGroups]);

  const filteredBatteryIds = useMemo(() => {
    const q = String(batteryQuery || "").trim().toUpperCase();
    if (!q) return BATTERY_ID_OPTIONS;
    return BATTERY_ID_OPTIONS.filter((id) => id.includes(q));
  }, [batteryQuery]);

  useEffect(() => {
    if (!vehicleDropdownOpen && !batteryDropdownOpen) return;

    const onMouseDown = (e) => {
      const root = vehicleDropdownRef.current;
      const batteryRoot = batteryDropdownRef.current;

      if (vehicleDropdownOpen && root && !root.contains(e.target)) {
        setVehicleDropdownOpen(false);
      }
      if (batteryDropdownOpen && batteryRoot && !batteryRoot.contains(e.target)) {
        setBatteryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [vehicleDropdownOpen, batteryDropdownOpen]);

  const selectVehicleId = (id) => {
    updateForm({ bikeId: id });
    setVehicleDropdownOpen(false);
    setVehicleQuery("");
  };

  const selectBatteryId = (id) => {
    updateForm({ batteryId: id });
    setBatteryDropdownOpen(false);
    setBatteryQuery("");
  };

  const prefillFromLastRental = async (riderId, { preferZone } = {}) => {
    if (!riderId) return;
    try {
      const rentals = await apiFetch(`/api/riders/${encodeURIComponent(riderId)}/rentals`);
      const last = Array.isArray(rentals) ? rentals[0] : null;
      if (!last) return;

      const rentalMeta = parseMaybeJson(last?.meta) || {};

      const vehicleId = String(last.bike_id || "").trim();
      const batteryId = String(last.battery_id || "").trim();

      const next = {};
      if (preferZone && rentalMeta?.zone) {
        next.operationalZone = String(rentalMeta.zone || "").trim();
      }
      if (vehicleId && !unavailableVehicleSet.has(normalizeIdForCompare(vehicleId))) {
        next.bikeId = vehicleId;
      }
      if (batteryId && !unavailableBatterySet.has(normalizeIdForCompare(batteryId))) {
        next.batteryId = batteryId;
      }

      if (Object.keys(next).length > 0) {
        updateForm(next);
      }
    } catch {
      // If prefill fails, keep manual selection.
    }
  };

  const prefillFromActiveRental = async ({ mobileDigits }) => {
    if (!mobileDigits) return null;
    try {
      const active = await apiFetch(`/api/rentals/active?mobile=${encodeURIComponent(mobileDigits)}`);
      return active || null;
    } catch {
      return null;
    }
  };

  const handleSelect = async (r) => {
    const name = r?.full_name || r?.name || "";
    const phone = sanitizeNumericInput(r?.mobile || r?.phone || "", 10);
    const aadhaar = sanitizeNumericInput(r?.aadhaar || "", 12);
    const gender = r?.gender || "";

    const dobRaw = r?.dob || r?.date_of_birth || "";
    const dob = dobRaw ? String(dobRaw).slice(0, 10) : "";

    const riderMeta = parseMaybeJson(r?.meta) || {};
    const riderCode = String(r?.rider_code || riderMeta?.rider_code || riderMeta?.riderCode || "").trim();
    const permanentAddress = r?.permanent_address || r?.permanentAddress || "";
    const temporaryAddress = r?.temporary_address || r?.temporaryAddress || "";
    const reference = r?.reference || "";

    const inferredZone =
      String(riderMeta?.zone || r?.operationalZone || r?.zone || "").trim() || "";

    const preferZoneFromRentals = !inferredZone;

    updateForm({
      name,
      phone,
      aadhaar,
      gender,
      dob,
      reference,
      permanentAddress,
      temporaryAddress,
      operationalZone: inferredZone,
      riderCode,
      aadhaarVerified: Boolean(aadhaar),
      isRetainRider: true,
      existingRiderId: r?.id || null,
      activeRentalId: null,
    });

    setSelectedRiderSnapshot({
      name,
      phone,
      aadhaar,
      gender,
      dob,
      reference,
      permanentAddress,
      temporaryAddress,
      operationalZone: inferredZone,
      rider_code: riderCode,
      riderCode,
      existingRiderId: r?.id || null,
    });
    setResults([]);
    setError("");

    // If the rider has NOT ended the ride, auto-assign the active rental's vehicle+battery.
    const active = await prefillFromActiveRental({ mobileDigits: phone });
    if (active?.id) {
      const activeMeta = parseMaybeJson(active?.meta) || {};
      const expectedEnd = active?.expected_end_time || activeMeta?.expected_end_time || "";
      updateForm({
        activeRentalId: active.id,
        rentalStart: toDateTimeLocal(active.start_time),
        rentalPackage: active.rental_package || formData.rentalPackage || "daily",
        bikeId: String(active.bike_id || "").trim() || formData.bikeId,
        batteryId: String(active.current_battery_id || active.battery_id || "").trim() || formData.batteryId,
        operationalZone:
          inferredZone || (preferZoneFromRentals ? String(activeMeta?.zone || "").trim() : "") || "",
      });
      setActiveRideExpectedEnd(expectedEnd);
      setActiveRideStart(active?.start_time || "");
      setError("");
      return;
    }

    setActiveRideExpectedEnd("");
    setActiveRideStart("");

    // Otherwise, prefill from the last rental.
    await prefillFromLastRental(r?.id, { preferZone: preferZoneFromRentals });
  };

  const [publicConfig, setPublicConfig] = useState({ upiId: null, payeeName: "Evegah" });
  useEffect(() => {
    getPublicConfig().then(setPublicConfig);
  }, []);

  const configuredUpiId = import.meta.env.VITE_EVEGAH_UPI_ID || publicConfig.upiId;
  const defaultUpiId = "temp.evegah@okaxis";
  const effectiveUpiId = configuredUpiId || defaultUpiId;
  const payeeName = import.meta.env.VITE_EVEGAH_PAYEE_NAME || publicConfig.payeeName || "Evegah";
  const iciciEnabled =
    String(import.meta.env.VITE_ICICI_ENABLED || "")
      .trim()
      .replace(/^"+|"+$/g, "")
      .toLowerCase() === "true";
  const amount = Number(formData.totalAmount || 0);
  const cashAmount = Number(formData.cashAmount || 0);
  const onlineAmount = Number(formData.onlineAmount || 0);
  const totalPaid = cashAmount + onlineAmount;
  const paymentMode = formData.paymentMode || "cash";

  // For QR generation: use onlineAmount for split mode, total amount for online mode
  const qrAmount = paymentMode === "split" ? onlineAmount : (paymentMode === "online" ? amount : 0);
  const shouldShowQR = paymentMode === "online" || (paymentMode === "split" && onlineAmount > 0);

  const upiPayload = useMemo(() => {
    if (!effectiveUpiId || !shouldShowQR || !qrAmount) return "";
    const params = new URLSearchParams({
      pa: effectiveUpiId,
      pn: payeeName,
      am: String(qrAmount),
      cu: "INR",
    });
    return `upi://pay?${params.toString()}`;
  }, [effectiveUpiId, payeeName, qrAmount, shouldShowQR]);

  const [iciciQrData, setIciciQrData] = useState(null);
  const [iciciQrLoading, setIciciQrLoading] = useState(false);
  const [iciciQrError, setIciciQrError] = useState("");

  const iciciMerchantTranId = useMemo(() => {
    const v =
      formData?.iciciMerchantTranId ||
      formData?.merchantTranId ||
      iciciQrData?.merchantTranId ||
      iciciQrData?.merchant_tran_id ||
      null;
    const s = String(v || "").trim();
    return s || null;
  }, [formData?.iciciMerchantTranId, formData?.merchantTranId, iciciQrData]);

  const [iciciTxnStatus, setIciciTxnStatus] = useState("");
  const [iciciTxnError, setIciciTxnError] = useState("");
  const [iciciTxnVerified, setIciciTxnVerified] = useState(false);

  // Generate ICICI QR when ICICI is enabled and QR should be shown.
  useEffect(() => {
    if (!iciciEnabled || !shouldShowQR || !qrAmount || !formData.name) {
      setIciciQrData(null);
      setIciciQrError("");
      return;
    }

    let cancelled = false;

    const generateQr = async () => {
      setIciciQrLoading(true);
      setIciciQrError("");
      try {
        const response = await apiFetch("/api/payments/icici/qr", {
          method: "POST",
          body: {
            amount: qrAmount,
            transactionType: "RETAIN_RIDER",
            riderId: formData.existingRiderId || null,
            rentalId: formData.activeRentalId || null,
            merchantTranId: `EVG${Date.now()}${Math.random().toString(16).slice(2, 6)}`.slice(0, 35),
            billNumber: `EVG-${Date.now()}`.slice(0, 50),
          },
        });

        if (!cancelled) {
          setIciciQrData(response);
          const nextMerchantTranId = String(
            response?.merchantTranId || response?.merchant_tran_id || ""
          ).trim();
          const nextPaymentTransactionId = String(
            response?.paymentTransactionId || response?.payment_transaction_id || ""
          ).trim();
          updateForm({
            ...(nextMerchantTranId
              ? { iciciMerchantTranId: nextMerchantTranId, merchantTranId: nextMerchantTranId }
              : {}),
            ...(nextPaymentTransactionId ? { paymentTransactionId: nextPaymentTransactionId } : {}),
          });
        }
      } catch (error) {
        console.error("ICICI QR generation failed:", error);
        if (!cancelled) setIciciQrError(String(error?.message || error));
      } finally {
        if (!cancelled) setIciciQrLoading(false);
      }
    };

    generateQr();
    return () => {
      cancelled = true;
    };
  }, [iciciEnabled, shouldShowQR, qrAmount, formData.name, formData.existingRiderId, formData.activeRentalId]);

  // Poll ICICI status so the UI can auto-detect payment completion.
  useEffect(() => {
    if (!iciciEnabled || !shouldShowQR) {
      setIciciTxnStatus("");
      setIciciTxnError("");
      setIciciTxnVerified(false);
      return;
    }

    if (!iciciMerchantTranId || retainSuccess || String(paymentMode || "").toLowerCase() === "cash") {
      setIciciTxnStatus("");
      setIciciTxnError("");
      setIciciTxnVerified(false);
      return;
    }

    let cancelled = false;
    let intervalId = null;
    let attempts = 0;
    const maxAttempts = 60; // ~5 min at 5s interval

    const poll = async () => {
      attempts += 1;
      try {
        const decoded = await apiFetch("/api/payments/icici/status", {
          method: "POST",
          body: { merchantTranId: iciciMerchantTranId },
        });

        const raw = String(decoded?.status || decoded?.Status || "").trim();
        const next = raw ? raw.toUpperCase() : "";
        if (!cancelled) {
          setIciciTxnStatus(next);
          setIciciTxnError("");
        }

        if (next === "SUCCESS") {
          if (!cancelled) setIciciTxnVerified(true);
          if (intervalId) window.clearInterval(intervalId);
        } else if (next === "FAILURE" || next === "FAILED") {
          if (!cancelled) setIciciTxnVerified(false);
          if (intervalId) window.clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          if (intervalId) window.clearInterval(intervalId);
        }
      } catch (e) {
        if (!cancelled) setIciciTxnError(String(e?.message || e || "Unable to check payment status"));
      }
    };

    poll();
    intervalId = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [iciciEnabled, shouldShowQR, iciciMerchantTranId, retainSuccess, paymentMode]);

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const getImageDataUrl = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && typeof value.dataUrl === "string") return value.dataUrl;
    return "";
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const validateImageFile = (file) => {
    if (!file) return "No file selected";
    if (!String(file.type || "").startsWith("image/")) return "Please select an image file";
    if (file.size > MAX_IMAGE_BYTES) return "Image must be 5MB or smaller";
    return "";
  };

  const handlePreRidePhotosPick = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    const current = Array.isArray(formData.preRidePhotos) ? formData.preRidePhotos : [];
    const remainingSlots = Math.max(0, 8 - current.length);
    if (remainingSlots === 0) {
      setPaymentError("You can upload up to 8 pre-ride photos.");
      return;
    }

    const picked = list.slice(0, remainingSlots);
    try {
      const uploads = await Promise.all(
        picked.map(async (file) => {
          const validation = validateImageFile(file);
          if (validation) throw new Error(validation);
          const dataUrl = await readFileAsDataUrl(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            updatedAt: new Date().toISOString(),
          };
        })
      );
      updateForm({ preRidePhotos: [...current, ...uploads] });
    } catch (e) {
      setPaymentError(String(e?.message || e || "Unable to upload pre-ride photos"));
    }
  };

  const handleComplete = async () => {
    setPaymentError("");
    setRetainSuccess(false);

    if (!formData.existingRiderId) {
      setPaymentError("Select a rider before completing payment.");
      return;
    }

    if (!String(formData.name || "").trim()) {
      setPaymentError("Rider name is missing. Re-select the rider.");
      return;
    }

    if (String(formData.phone || "").replace(/\D/g, "").slice(0, 10).length !== 10) {
      setPaymentError("Valid 10-digit mobile number is required.");
      return;
    }

    if (!formData.rentalStart) {
      setPaymentError("Rental start date & time is required.");
      return;
    }

    if (!String(formData.issuedByName || "").trim()) {
      setPaymentError("Issued by name is required.");
      return;
    }

    const isUpdatingActiveRental = Boolean(formData.activeRentalId);
    const startMs = formData.rentalStart ? new Date(formData.rentalStart).getTime() : NaN;
    const activeStartMs = activeRideStart ? new Date(activeRideStart).getTime() : NaN;
    const activeEndMs = activeRideExpectedEnd ? new Date(activeRideExpectedEnd).getTime() : NaN;
    const canScheduleAfterActive =
      isUpdatingActiveRental &&
      Number.isFinite(startMs) &&
      Number.isFinite(activeEndMs) &&
      startMs >= activeEndMs;
    const creatingNewBooking = !isUpdatingActiveRental || canScheduleAfterActive;

    if (isUpdatingActiveRental && !creatingNewBooking) {
      if (Number.isFinite(activeEndMs) && Number.isFinite(startMs)) {
        if (Number.isFinite(activeStartMs) && startMs !== activeStartMs && startMs < activeEndMs) {
          setPaymentError("Retain ride start must be after the current active ride end time.");
          return;
        }
      } else if (Number.isFinite(startMs) && Number.isFinite(activeStartMs) && startMs !== activeStartMs) {
        setPaymentError("Active ride end time is missing. Choose a start time after the active ride ends.");
        return;
      }
    }

    if (totalPaid !== amount) {
      setPaymentError("Cash + UPI payment totals must equal the total amount.");
      return;
    }

    if (iciciEnabled && String(paymentMode || "").toLowerCase() !== "cash") {
      if (!iciciMerchantTranId) {
        setPaymentError("ICICI payment reference not found. Please re-generate the QR and complete payment.");
        return;
      }

      if (!iciciTxnVerified) {
        try {
          const decoded = await apiFetch("/api/payments/icici/status", {
            method: "POST",
            body: { merchantTranId: iciciMerchantTranId },
          });
          const raw = String(decoded?.status || decoded?.Status || "").trim();
          const next = raw ? raw.toUpperCase() : "";
          setIciciTxnStatus(next);
          if (next !== "SUCCESS") {
            setPaymentError(`Payment not completed. Current status: ${next || "PENDING"}.`);
            return;
          }
          setIciciTxnVerified(true);
        } catch (e) {
          setPaymentError(String(e?.message || e || "Unable to verify payment. Please try again."));
          return;
        }
      }
    }

    if (creatingNewBooking) {
      if (!Array.isArray(formData.preRidePhotos) || formData.preRidePhotos.length === 0) {
        setPaymentError("Upload at least one pre-ride vehicle photo.");
        return;
      }
    }

    if (creatingNewBooking) {
      if (formData.bikeId && unavailableVehicleSet.has(normalizeIdForCompare(formData.bikeId))) {
        setPaymentError("Selected vehicle is unavailable.");
        return;
      }

      if (!isDefaultBatteryModel && formData.batteryId && unavailableBatterySet.has(normalizeIdForCompare(formData.batteryId))) {
        setPaymentError("Selected battery is unavailable.");
        return;
      }
    }

    setSavingPayment(true);
    try {
      const startIso = new Date(formData.rentalStart).toISOString();
      const endIso = formData.rentalEnd ? new Date(formData.rentalEnd).toISOString() : null;

      const iciciMerchantTranId = String(
        formData?.iciciMerchantTranId ||
        formData?.merchantTranId ||
        formData?.paymentDetails?.iciciMerchantTranId ||
        formData?.paymentDetails?.merchantTranId ||
        ""
      ).trim() || null;

      const paymentTransactionId = String(
        formData?.paymentTransactionId ||
        formData?.paymentDetails?.paymentTransactionId ||
        ""
      ).trim() || null;

      let savedRental = null;

      if (isUpdatingActiveRental && !creatingNewBooking) {
        savedRental = await apiFetch(`/api/rentals/${encodeURIComponent(formData.activeRentalId)}`, {
          method: "PATCH",
          body: {
            rental_package: formData.rentalPackage || null,
            rental_amount: Number(formData.rentalAmount || 0),
            deposit_amount: Number(formData.securityDeposit || 0),
            total_amount: Number(formData.totalAmount || 0),
            payment_mode: formData.paymentMode || null,
            bike_model: formData.bikeModel || null,
            expected_end_time: endIso,
            meta: {
              issued_by_name: formData.issuedByName || null,
              paymentBreakdown: {
                cash: Number(formData.cashAmount || 0),
                online: Number(formData.onlineAmount || 0),
              },
              ...(iciciMerchantTranId ? { iciciMerchantTranId, merchantTranId: iciciMerchantTranId } : {}),
              ...(paymentTransactionId ? { paymentTransactionId } : {}),
            },
          },
        });
      } else {
        savedRental = await apiFetch("/api/rentals", {
          method: "POST",
          body: {
            rider_id: formData.existingRiderId,
            start_time: startIso,
            end_time: endIso,
            vehicle_number: formData.vehicleNumber || formData.bikeId || null,
            rental_package: formData.rentalPackage || null,
            rental_amount: Number(formData.rentalAmount || 0),
            deposit_amount: Number(formData.securityDeposit || 0),
            total_amount: Number(formData.totalAmount || 0),
            payment_mode: formData.paymentMode || null,
            bike_model: formData.bikeModel || null,
            bike_id: formData.bikeId || null,
            battery_id: formData.batteryId || null,
            accessories: Array.isArray(formData.accessories) ? formData.accessories : [],
            other_accessories: formData.otherAccessories || null,
            meta: {
              zone: formData.operationalZone || null,
              issued_by_name: formData.issuedByName || null,
              employee_uid: user?.uid || null,
              employee_email: user?.email || null,
              paymentBreakdown: {
                cash: Number(formData.cashAmount || 0),
                online: Number(formData.onlineAmount || 0),
              },
              ...(iciciMerchantTranId ? { iciciMerchantTranId, merchantTranId: iciciMerchantTranId } : {}),
              ...(paymentTransactionId ? { paymentTransactionId } : {}),
            },
            documents: {
              preRidePhotos: Array.isArray(formData.preRidePhotos) ? formData.preRidePhotos : [],
            },
          },
        });
      }

      alert(isUpdatingActiveRental ? "Rental updated" : "Payment recorded");
      setCompleted(true);
      setRegistration({
        id: formData.existingRiderId,
        rentalId: savedRental?.id || formData.activeRentalId || null,
        ...(iciciMerchantTranId ? { merchantTranId: iciciMerchantTranId, iciciMerchantTranId } : {}),
        ...(paymentTransactionId ? { paymentTransactionId } : {}),
      });
      setRetainSuccess(true);
    } catch (e) {
      setPaymentError(String(e?.message || e || "Unable to save payment"));
    } finally {
      setSavingPayment(false);
    }
  };

  const [completed, setCompleted] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState("");
  const [whatsAppStatusType, setWhatsAppStatusType] = useState("");
  const [whatsAppFallback, setWhatsAppFallback] = useState(null);

  const [selectedRiderSnapshot, setSelectedRiderSnapshot] = useState(null);

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(blob);
      } catch (e) {
        reject(e);
      }
    });

  const fetchUrlAsDataUrl = async (url) => {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Unable to fetch file (HTTP ${res.status})`);
    const blob = await res.blob();
    return blobToDataUrl(blob);
  };

  const hydrateReceiptPayloadForRetain = async ({ riderId, basePayload }) => {
    const next = { ...(basePayload || {}) };

    // Ensure we have the rider unique code for the PDF header.
    // Prefer whatever we already know from selection/search.
    if (!next.riderCode) {
      const candidate =
        String(selectedRiderSnapshot?.rider_code || selectedRiderSnapshot?.riderCode || "").trim() ||
        String(formData?.riderCode || "").trim();
      if (candidate) next.riderCode = candidate;
    }

    // If signature is missing, pull the latest stored signature for this rider.
    if (!next.riderSignature || !String(next.riderSignature).startsWith("data:image/")) {
      try {
        if (riderId) {
          const docs = await apiFetch(`/api/riders/${encodeURIComponent(riderId)}/documents`);
          const rows = Array.isArray(docs) ? docs : [];
          const signatureDoc = rows.find((d) => String(d?.kind || "").toLowerCase() === "rider_signature" && d?.url);
          if (signatureDoc?.url) {
            const dataUrl = await fetchUrlAsDataUrl(String(signatureDoc.url));
            if (dataUrl && String(dataUrl).startsWith("data:image/")) {
              next.riderSignature = dataUrl;
              if (!next.agreementAccepted) next.agreementAccepted = true;
              if (!next.agreementDate && signatureDoc.created_at) next.agreementDate = signatureDoc.created_at;
            }
          }
        }
      } catch {
        // Ignore hydration failures; allow receipt download without signature.
      }
    }

    return next;
  };

  const buildReceiptPayload = (snapshot) => ({
    fullName: snapshot?.fullName || snapshot?.name || "",
    name: snapshot?.name || snapshot?.fullName || "",
    phone: snapshot?.phone || "",
    mobile: snapshot?.mobile || snapshot?.phone || "",
    aadhaar: snapshot?.aadhaar || "",
    dob: snapshot?.dob || null,
    gender: snapshot?.gender || "",
    reference: snapshot?.reference || "",
    permanentAddress: snapshot?.permanentAddress || "",
    temporaryAddress: snapshot?.temporaryAddress || "",
    operationalZone: snapshot?.operationalZone || snapshot?.zone || "",
    agreementAccepted: Boolean(snapshot?.agreementAccepted),
    agreementDate: snapshot?.agreementDate || null,
    issuedByName: snapshot?.issuedByName || null,
    rentalStart: snapshot?.rentalStart || null,
    rentalEnd: snapshot?.rentalEnd || null,
    rentalPackage: snapshot?.rentalPackage || null,
    bikeModel: snapshot?.bikeModel || null,
    bikeId: snapshot?.bikeId || null,
    batteryId: snapshot?.batteryId || null,
    vehicleNumber: snapshot?.vehicleNumber || snapshot?.bikeId || null,
    accessories: Array.isArray(snapshot?.accessories) ? snapshot.accessories : [],
    otherAccessories: snapshot?.otherAccessories || null,
    paymentMode: snapshot?.paymentMode || null,
    rentalAmount: snapshot?.rentalAmount ?? null,
    securityDeposit: snapshot?.securityDeposit ?? null,
    totalAmount: snapshot?.totalAmount ?? null,
    amountPaid: snapshot?.amountPaid ?? snapshot?.paidAmount ?? snapshot?.totalAmount ?? null,
    merchantTranId:
      snapshot?.merchantTranId ||
      snapshot?.iciciMerchantTranId ||
      snapshot?.paymentDetails?.merchantTranId ||
      snapshot?.paymentDetails?.iciciMerchantTranId ||
      null,
    iciciMerchantTranId:
      snapshot?.iciciMerchantTranId ||
      snapshot?.merchantTranId ||
      snapshot?.paymentDetails?.iciciMerchantTranId ||
      snapshot?.paymentDetails?.merchantTranId ||
      null,
    paymentTransactionId:
      snapshot?.paymentTransactionId ||
      snapshot?.paymentDetails?.paymentTransactionId ||
      null,
    riderSignature: typeof snapshot?.riderSignature === "string" ? snapshot.riderSignature : null,
  });

  const handleDownloadReceipt = async () => {
    setWhatsAppStatus("");
    setWhatsAppStatusType("");
    setWhatsAppFallback(null);
    try {
      const snapshot = { ...(selectedRiderSnapshot || {}), ...(formData || {}) };
      const base = buildReceiptPayload(snapshot);
      const hydrated = await hydrateReceiptPayloadForRetain({
        riderId: snapshot?.existingRiderId || formData?.existingRiderId,
        basePayload: base,
      });

      const reg = {
        ...(registration || {}),
        riderCode: String(hydrated?.riderCode || registration?.riderCode || "").trim() || undefined,
      };
      await downloadRiderReceiptPdf({ formData: hydrated, registration: reg });
    } catch (e) {
      setWhatsAppStatusType("error");
      setWhatsAppStatus(
        e?.message ? `Unable to generate receipt: ${e.message}` : "Unable to generate receipt."
      );
    }
  };

  const handleSendWhatsApp = async () => {
    setWhatsAppStatus("");
    setWhatsAppStatusType("");
    setWhatsAppFallback(null);
    const snapshot = { ...(selectedRiderSnapshot || {}), ...(formData || {}) };
    const phoneDigits = String(snapshot?.phone || "").replace(/\D/g, "").slice(0, 10);
    if (phoneDigits.length !== 10) {
      setWhatsAppStatusType("error");
      setWhatsAppStatus("Valid 10-digit mobile number is required.");
      return;
    }
    const receiptPayload = buildReceiptPayload(snapshot);
    setSendingWhatsApp(true);
    try {
      const res = await apiFetch("/api/whatsapp/send-receipt", {
        method: "POST",
        body: {
          to: phoneDigits,
          formData: receiptPayload,
          registration,
        },
      });
      if (res?.sent) {
        setWhatsAppStatusType("success");
        setWhatsAppStatus("Receipt sent to rider successfully.");
      } else if (res?.mediaUrl) {
        setWhatsAppFallback({ phoneDigits, mediaUrl: res.mediaUrl });
        setWhatsAppStatusType("error");
        setWhatsAppStatus(
          String(res?.reason || res?.error || "Failed to send receipt on WhatsApp.")
        );
      } else {
        setWhatsAppStatusType("error");
        setWhatsAppStatus(
          String(res?.reason || res?.error || "Failed to send receipt on WhatsApp.")
        );
      }
    } catch (e) {
      setWhatsAppStatusType("error");
      setWhatsAppStatus(String(e?.message || e || "Failed to send receipt on WhatsApp."));
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const openManualWhatsApp = () => {
    if (!whatsAppFallback?.phoneDigits || !whatsAppFallback?.mediaUrl) return;
    const text = encodeURIComponent(`EVegah Receipt (PDF): ${whatsAppFallback.mediaUrl}`);
    window.open(`https://wa.me/91${whatsAppFallback.phoneDigits}?text=${text}`, "_self");
  };

  return (
    <EmployeeLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-evegah-border bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Riders
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-evegah-text">Retain Rider</h1>
              <p className="text-sm text-gray-600">
                Find an existing rider, update rental details, and take payment.
              </p>
            </div>
            <div className="text-xs text-gray-500">Search • Assign • Payment</div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


            <div>
              <label className="label">Rider Name</label>
              <input
                className="input"
                placeholder="Enter name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>


            <div>
              <label className="label">Registered Mobile Number</label>
              <input
                className="input"
                placeholder="Enter mobile number"
                value={searchPhone}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => setSearchPhone(sanitizeNumericInput(e.target.value, 10))}
              />
            </div>



            <div className="flex items-end">
              <button
                type="button"
                className="btn-primary w-full disabled:opacity-60"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-evegah-border">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Mobile</th>
                    <th className="py-2 pr-3 font-medium">Aadhaar</th>
                    <th className="py-2 pr-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-3">{r.full_name || "-"}</td>
                      <td className="py-3 pr-3">{r.mobile || "-"}</td>
                      <td className="py-3 pr-3">{r.aadhaar || "-"}</td>
                      <td className="py-3 pr-3">
                        <button type="button" className="btn-outline" onClick={() => handleSelect(r)}>
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="card space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-evegah-text">Rider Details</h3>
                <p className="text-sm text-gray-500">Prefilled from registration.</p>
              </div>
              <button
                type="button"
                className="btn-muted"
                onClick={() => {
                  resetForm();
                  setResults([]);
                  setRetainSuccess(false);
                  setActiveRideExpectedEnd("");
                  setActiveRideStart("");
                }}
              >
                Change Rider
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="text-sm text-evegah-text font-medium">{formData.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-sm text-evegah-text font-medium">{formData.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Aadhaar</p>
                <p className="text-sm text-evegah-text font-medium">{formData.aadhaar || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm text-evegah-text font-medium">{formData.gender || "-"}</p>
              </div>
            </div>
          </div>
        ) : null}

        {selected ? (
          <div className="card space-y-6">
            <div>
              <h3 className="text-base font-semibold text-evegah-text">Rental Details</h3>
              <p className="text-sm text-gray-500">Update rental plan and accessories.</p>
              
            </div>
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Operational Zone</label>
                <select
                  className="select"
                  value={formData.operationalZone || ""}
                  onChange={(e) => updateForm({ operationalZone: e.target.value })}
                >
                  <option>Gotri Zone</option>
                  <option>Manjalpur</option>
                  <option>Karelibaug</option>
                  <option>Daman</option>
                  <option>Aatapi</option>
                </select>
              </div>
            </div>
            {/* Rental Details: Sequence as per screenshot */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Rental Package */}
              <div>
                <label className="label">Rental Package</label>
                <select
                  className="select"
                  value={formData.rentalPackage || "daily"}
                  onChange={(e) => updateForm({ rentalPackage: e.target.value })}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {/* Rental Start Date & Time */}
              <div>
                <label className="label">Rental Start Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.rentalStart || ""}
                  onChange={(e) => updateForm({ rentalStart: e.target.value })}
                />
              </div>
            </div>
           
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Return Date (editable) */}
              <div>
                <label className="label">Return Date</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.rentalEnd || ""}
                  onChange={e => updateForm({ rentalEnd: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto: calculated from package, but you can edit
                </p>
              </div>
              {/* Payment Mode */}
              <div>
                <label className="label">Payment Mode</label>
                <select
                  className="select"
                  value={formData.paymentMode || "cash"}
                  onChange={(e) => handlePaymentModeChange(e.target.value)}
                >
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p === "online" ? "UPI" : p === "split" ? "Split (cash + UPI)" : "Cash"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

           

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="label">Rental Package Amount</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={formData.rentalAmount ?? ""}
                  onChange={(e) => updateForm({ rentalAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Security Deposit</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={formData.securityDeposit ?? ""}
                  onChange={(e) => updateForm({ securityDeposit: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Total Rental Amount</label>
                <input type="number" className="input" value={formData.totalAmount ?? 0} readOnly />
                <p className="mt-1 text-xs text-gray-500">Auto: amount + deposit</p>
              </div>
            </div>
            {formData.paymentMode === "split" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Cash Paid</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalAmount ?? 0}
                    className="input"
                    value={formData.cashAmount ?? 0}
                    onChange={e => handleCashChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">UPI Paid</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalAmount ?? 0}
                    className="input"
                    value={formData.onlineAmount ?? 0}
                    onChange={e => handleOnlineChange(e.target.value)}
                  />
                </div>
              </div>
            )}

            {formData.paymentMode === "split" && totalPaid !== amount ? (
              <p className="error">Cash + UPI payment totals must equal the total amount ({amount}).</p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">E-bike Model</label>
                <select
                  className="select"
                  value={formData.bikeModel || "MINK"}
                  onChange={(e) => updateForm({ bikeModel: e.target.value })}
                >
                  {BIKE_MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">E-Bike ID No</label>
                <div ref={vehicleDropdownRef} className="relative">
                  <button
                    type="button"
                    className="select flex items-center justify-between gap-3"
                    aria-haspopup="listbox"
                    aria-expanded={vehicleDropdownOpen}
                    onClick={() => {
                      setVehicleDropdownOpen((v) => {
                        const next = !v;
                        if (!v && next) {
                          setTimeout(() => vehicleQueryRef.current?.focus(), 0);
                        }
                        return next;
                      });
                    }}
                  >
                    <span className={formData.bikeId ? "text-evegah-text" : "text-gray-500"}>
                      {formData.bikeId || "Select E-Bike ID"}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>

                  {vehicleDropdownOpen ? (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-evegah-border bg-white shadow-card p-2">
                      <input
                        ref={vehicleQueryRef}
                        className="input"
                        placeholder="Search vehicle id..."
                        value={vehicleQuery}
                        onChange={(e) => setVehicleQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setVehicleDropdownOpen(false);
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredVehicleIds.length === 1) {
                              selectVehicleId(filteredVehicleIds[0]);
                            }
                          }
                        }}
                      />

                      <div className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                        {filteredVehicleIds.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No matching vehicle id.</div>
                        ) : (
                          filteredVehicleGroups.map((group) => (
                            <div key={group.label}>
                              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                {group.label}
                              </div>
                              {(group.ids || []).map((id) => {
                                const unavailable = unavailableVehicleSet.has(normalizeIdForCompare(id));
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    disabled={unavailable}
                                    aria-disabled={unavailable}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${unavailable ? "cursor-not-allowed text-gray-400" : "hover:bg-gray-50"} ${id === formData.bikeId ? "bg-gray-100" : ""}`}
                                    onClick={() => {
                                      if (unavailable) return;
                                      selectVehicleId(id);
                                    }}
                                  >
                                    {id}
                                    {unavailable ? " (Unavailable)" : ""}
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Battery ID</label>
                <div ref={batteryDropdownRef} className="relative">
                  <button
                    type="button"
                    className={`select flex items-center justify-between gap-3 ${
                      isDefaultBatteryModel ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={batteryDropdownOpen}
                    disabled={isDefaultBatteryModel}
                    aria-disabled={isDefaultBatteryModel}
                    onClick={() => {
                      if (isDefaultBatteryModel) return;
                      setBatteryDropdownOpen((v) => {
                        const next = !v;
                        if (!v && next) {
                          setTimeout(() => batteryQueryRef.current?.focus(), 0);
                        }
                        return next;
                      });
                    }}
                  >
                    <span className={formData.batteryId ? "text-evegah-text" : "text-gray-500"}>
                      {isDefaultBatteryModel ? "Default" : formData.batteryId || "Select Battery ID"}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>

                  {batteryDropdownOpen && !isDefaultBatteryModel ? (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-evegah-border bg-white shadow-card p-2">
                      <input
                        ref={batteryQueryRef}
                        className="input"
                        placeholder="Search battery id..."
                        value={batteryQuery}
                        onChange={(e) => setBatteryQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setBatteryDropdownOpen(false);
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredBatteryIds.length === 1) {
                              selectBatteryId(filteredBatteryIds[0]);
                            }
                          }
                        }}
                      />

                      <div className="mt-2 max-h-48 overflow-y-auto" role="listbox">
                        {filteredBatteryIds.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No matching battery id.</div>
                        ) : (
                          filteredBatteryIds.map((id) => (
                            (() => {
                              const unavailable = unavailableBatterySet.has(normalizeIdForCompare(id));
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  disabled={unavailable}
                                  aria-disabled={unavailable}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${unavailable
                                      ? "cursor-not-allowed text-gray-400"
                                      : "hover:bg-gray-50"
                                    } ${id === formData.batteryId ? "bg-gray-100" : ""}`}
                                  onClick={() => {
                                    if (unavailable) return;
                                    selectBatteryId(id);
                                  }}
                                >
                                  {id}
                                  {unavailable ? " (Unavailable)" : ""}
                                </button>
                              );
                            })()
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                {isDefaultBatteryModel ? (
                  <p className="text-xs text-gray-500 mt-1">Default (non-removable) battery.</p>
                ) : null}
              </div>
              <div>
                <label className="label">Accessories Issued</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ACCESSORY_OPTIONS.map((a) => (
                    <label
                      key={a.key}
                      className="flex items-center gap-2 text-sm text-evegah-text"
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={(Array.isArray(formData.accessories) ? formData.accessories : []).includes(a.key)}
                        onChange={() => toggleAccessory(a.key)}
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Other Accessories</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Optional"
                value={formData.otherAccessories || ""}
                onChange={(e) => updateForm({ otherAccessories: e.target.value })}
              />
            </div>
                   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Issued By (Name)</label>
                <input
                  className="input"
                  placeholder="Enter your name"
                  value={formData.issuedByName || ""}
                  onChange={(e) => updateForm({ issuedByName: e.target.value })}
                />
              </div>
            </div>  
            <div className="rounded-xl border border-evegah-border bg-gray-50 p-4 space-y-3">
              <h3 className="font-medium text-evegah-text">Pre-ride Photos (Required)</h3>
              <p className="text-sm text-gray-500">
                Upload photos of the vehicle before handing over to the rider.
              </p>

              <input
                ref={preRidePhotosInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  handlePreRidePhotosPick(e.target.files);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                className="w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-sm text-gray-500 p-5 hover:bg-gray-50 transition"
                onClick={() => preRidePhotosInputRef.current?.click()}
              >
                <p className="mt-1 font-medium">
                  {Array.isArray(formData.preRidePhotos) && formData.preRidePhotos.length > 0
                    ? "Add more photos"
                    : "Click to upload photos"}
                </p>
                <p className="text-xs">PNG, JPG, WEBP (max 5MB each, up to 8)</p>
              </button>

              {Array.isArray(formData.preRidePhotos) && formData.preRidePhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {formData.preRidePhotos.slice(0, 8).map((p, idx) => (
                    <div
                      key={`${p?.name || "photo"}-${idx}`}
                      className="relative rounded-lg overflow-hidden border border-evegah-border bg-white"
                    >
                      <button
                        type="button"
                        className="block w-full"
                        onClick={() =>
                          setImagePreview({
                            src: getImageDataUrl(p),
                            title: "Pre-ride Photo",
                          })
                        }
                        title="Open preview"
                      >
                        <img
                          src={getImageDataUrl(p)}
                          alt="Pre-ride"
                          className="h-16 w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full border border-evegah-border bg-white/90 text-gray-700 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = [...formData.preRidePhotos];
                          next.splice(idx, 1);
                          updateForm({ preRidePhotos: next });
                        }}
                        title="Remove"
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No pre-ride photos uploaded yet.</p>
              )}
            </div>
          </div>
        ) : null}

        {selected ? (
          <div className="card space-y-6">
            <div>
              <h3 className="text-base font-semibold text-evegah-text">Payment</h3>
              <p className="text-sm text-gray-500">Scan QR to collect payment.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-evegah-border bg-gray-50 p-4 space-y-3">
                <h4 className="font-medium text-evegah-text">Payment QR</h4>
                {shouldShowQR ? (
                  iciciEnabled ? (
                    <>
                      {iciciQrLoading && (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evegah-primary"></div>
                          <span className="ml-2 text-sm text-gray-500">Generating QR...</span>
                        </div>
                      )}

                      {iciciQrError && (
                        <p className="text-sm text-red-600">
                          ICICI QR generation failed: {iciciQrError}
                        </p>
                      )}

                      {iciciMerchantTranId ? (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>
                            <span className="text-gray-500">Merchant Tran ID:</span> {iciciMerchantTranId}
                          </div>
                          {iciciTxnVerified ? (
                            <div className="text-green-700">Payment received (SUCCESS).</div>
                          ) : iciciTxnError ? (
                            <div className="text-red-600">Payment status check failed: {iciciTxnError}</div>
                          ) : iciciTxnStatus ? (
                            <div>Payment status: {iciciTxnStatus}</div>
                          ) : (
                            <div>Waiting for payment confirmation...</div>
                          )}
                        </div>
                      ) : null}

                      {iciciQrData?.qrCode && (
                        <div className="rounded-xl border border-evegah-border bg-white p-4 inline-flex">
                          {iciciQrData.qrCode.startsWith("data:") || iciciQrData.qrCode.startsWith("http") ? (
                            <img src={iciciQrData.qrCode} alt="ICICI Payment QR" className="w-45 h-45" />
                          ) : (
                            <img
                              src={`data:image/png;base64,${iciciQrData.qrCode}`}
                              alt="ICICI Payment QR"
                              className="w-45 h-45"
                            />
                          )}
                        </div>
                      )}

                      {iciciQrData?.qrString && !iciciQrData?.qrCode && (
                        <div className="rounded-xl border border-evegah-border bg-white p-4 inline-flex">
                          <QRCodeCanvas value={iciciQrData.qrString} size={180} />
                        </div>
                      )}

                      {!iciciQrLoading && !iciciQrError && !iciciQrData?.qrCode && !iciciQrData?.qrString ? (
                        <p className="text-sm text-gray-500">ICICI QR not available</p>
                      ) : null}
                    </>
                  ) : upiPayload ? (
                    <>
                      <div className="rounded-xl border border-evegah-border bg-white p-4 inline-flex">
                        <QRCodeCanvas value={upiPayload} size={180} />
                      </div>
                      {!configuredUpiId ? (
                        <p className="text-sm text-red-600">
                          UPI QR is not configured. Set <code>VITE_EVEGAH_UPI_ID</code> in frontend <code>.env</code> or <code>EVEGAH_UPI_ID</code> (or <code>ICICI_VPA</code>) in backend <code>server/.env</code>.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-red-600">
                      UPI QR is not configured. Set <code>VITE_EVEGAH_UPI_ID</code> in frontend <code>.env</code> or <code>EVEGAH_UPI_ID</code> (or <code>ICICI_VPA</code>) in backend <code>server/.env</code>.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-gray-600">Cash payment selected — no UPI QR required.</p>
                )}
                <div className="text-sm text-evegah-text space-y-1 mt-4">
                  <div>
                    <span className="text-gray-500">Total Amount:</span> {amount}
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Mode:</span> {paymentMode === "online" ? "UPI" : paymentMode === "split" ? "Split" : "Cash"}
                  </div>
                  <div>
                    <span className="text-gray-500">Cash Paid:</span> {cashAmount}
                  </div>
                  <div>
                    <span className="text-gray-500">UPI Paid:</span> {onlineAmount}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-evegah-border bg-white p-4 space-y-3">
                <h4 className="font-medium text-evegah-text">Actions</h4>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    className="btn-primary disabled:opacity-60"
                    onClick={handleComplete}
                    disabled={
                      savingPayment ||
                      (iciciEnabled && String(paymentMode || "").toLowerCase() !== "cash" && !iciciTxnVerified)
                    }
                  >
                    {savingPayment ? "Saving..." : "Complete"}
                  </button>
                </div>

                {paymentError ? <p className="error">{paymentError}</p> : null}
                {retainSuccess && !paymentError && (
                  <div className="mt-4">
                    <div className="text-green-600 font-semibold mb-2">Rider retained successfully</div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary" onClick={handleSendWhatsApp}>
                        Send Receipt to WhatsApp
                      </button>
                      <button type="button" className="btn-outline" onClick={handleDownloadReceipt}>
                        Download Receipt
                      </button>
                    </div>

                    {whatsAppStatus ? (
                      <div
                        className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                          whatsAppStatusType === "success"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {whatsAppStatus}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {imagePreview?.src ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-evegah-border bg-white shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-evegah-border px-4 py-3">
              <div className="text-sm font-semibold text-evegah-text truncate">
                {imagePreview.title || "Preview"}
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-xl border border-evegah-border bg-white text-gray-600 hover:bg-gray-50"
                onClick={() => setImagePreview(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <div className="bg-black/5 p-3">
              <img
                src={imagePreview.src}
                alt={imagePreview.title || "Preview"}
                className="max-h-[75vh] w-full object-contain rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeLayout>
  );
}

export default function RetainRider() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <RiderFormProvider user={user}>
      <RetainRiderInner />
    </RiderFormProvider>
  );
}
