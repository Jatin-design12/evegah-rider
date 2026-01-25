import { createContext, useContext, useEffect, useState } from "react";

import {
  createRiderDraft,
  getRiderDraft,
  updateRiderDraft,
} from "../../utils/riderDrafts";

const RiderFormContext = createContext();

const parseLocalDateTime = (value) => {
  const v = String(value || "").trim();
  const m = v.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const formatLocalDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const pad2 = (n) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const computeRentalEnd = (rentalStart, rentalPackage) => {
  const start = parseLocalDateTime(rentalStart);
  if (!start) return "";

  const pkg = String(rentalPackage || "").toLowerCase();
  const end = new Date(start.getTime());

  if (pkg === "hourly") {
    end.setHours(end.getHours() + 1);
  } else if (pkg === "daily") {
    end.setDate(end.getDate() + 1);
  } else if (pkg === "weekly") {
    end.setDate(end.getDate() + 7);
  } else if (pkg === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    // Default: daily
    end.setDate(end.getDate() + 1);
  }

  return formatLocalDateTime(end);
};

const PACKAGE_PRICING = {
  hourly: { rentalAmount: 250, securityDeposit: 300 },
  daily: { rentalAmount: 250, securityDeposit: 300 },
  weekly: { rentalAmount: 1500, securityDeposit: 300 },
  monthly: { rentalAmount: 5500, securityDeposit: 300 },
};

const getPackagePricing = (rentalPackage) => {
  const key = String(rentalPackage || "").toLowerCase();
  return PACKAGE_PRICING[key] || PACKAGE_PRICING.daily;
};

/* ---------------- DEFAULT STATE ---------------- */
const defaultFormData = {
  /* STEP 1 */
  name: "",
  phone: "",
  aadhaar: "",
  operationalZone: "Gotri Zone",
  permanentAddress: "",
  temporaryAddress: "",
  sameAddress: false,
  reference: "",
  dob: "",
  gender: "",
  riderPhoto: null,
  governmentId: null,
  aadhaarVerified: false,
  draftSavedAt: null,

  draftId: null,

  /* STEP 2 */
  rentalStart: "",
  rentalEnd: "",
  rentalEndManual: false,
  rentalPackage: "daily",
  rentalAmount: 250,
  securityDeposit: 300,
  totalAmount: 550,
  paymentMode: "cash",
  cashAmount: 550,
  onlineAmount: 0,
  bikeModel: "MINK",
  bikeId: "",
  batteryId: "",
  vehicleNumber: "",
  accessories: [],
  otherAccessories: "",
  preRidePhotos: [],

  /* STEP 3 */
  agreementAccepted: false,
  agreementConfirmInfo: false,
  agreementAcceptTerms: false,
  riderSignature: null,
  agreementDate: "",
  issuedByName: "",

  /* STEP 4 */
  paymentModeFinal: "",
  amountPaid: 0,

  /* RETAIN RIDER */
  isRetainRider: false,
  existingRiderId: null,
  activeRentalId: null,
};

/* ---------------- PROVIDER ---------------- */
export function RiderFormProvider({ children, user, initialDraftId = null }) {
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [errors, setErrors] = useState({});
  const [draftMeta, setDraftMeta] = useState(null);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(initialDraftId));

  /* AUTO TOTAL */
  useEffect(() => {
    const total =
      Number(formData.rentalAmount || 0) +
      Number(formData.securityDeposit || 0);

    setFormData((prev) => ({ ...prev, totalAmount: total }));
  }, [formData.rentalAmount, formData.securityDeposit]);

  /* AUTO RETURN DATE (based on package) */
  useEffect(() => {
    const nextEnd = computeRentalEnd(formData.rentalStart, formData.rentalPackage);

    setFormData((prev) => {
      // If the user manually edited return date/time, don't overwrite it.
      // If they clear it, allow auto to fill again.
      if (prev.rentalEndManual && (prev.rentalEnd || "")) return prev;
      // Keep it stable (avoid re-render loops)
      if ((prev.rentalEnd || "") === (nextEnd || "")) return prev;
      return { ...prev, rentalEnd: nextEnd, rentalEndManual: false };
    });
  }, [formData.rentalStart, formData.rentalPackage]);

  /* AUTO PACKAGE PRICING (rent + deposit) */
  useEffect(() => {
    const pricing = getPackagePricing(formData.rentalPackage);

    setFormData((prev) => {
      const nextRentalAmount = Number(pricing.rentalAmount || 0);
      const nextDeposit = Number(pricing.securityDeposit || 0);
      if (
        Number(prev.rentalAmount || 0) === nextRentalAmount &&
        Number(prev.securityDeposit || 0) === nextDeposit
      ) {
        return prev;
      }
      return {
        ...prev,
        rentalAmount: nextRentalAmount,
        securityDeposit: nextDeposit,
      };
    });
  }, [formData.rentalPackage]);

  const updateForm = (data) => {
    setFormData((prev) => {
      const next = { ...prev, ...data };

      const has = (k) => Object.prototype.hasOwnProperty.call(data || {}, k);
      const touchedStart = has("rentalStart");
      const touchedPackage = has("rentalPackage");
      const touchedEnd = has("rentalEnd");

      if (touchedEnd) {
        next.rentalEndManual = true;
      }

      // If start/package changes, switch back to auto-mode unless end is being
      // set in the same update.
      if ((touchedStart || touchedPackage) && !touchedEnd) {
        next.rentalEndManual = false;
      }

      return next;
    });
  };

  useEffect(() => {
    setFormData((prev) => {
      const total = Number(prev.totalAmount || 0);
      const cash = Number(prev.cashAmount || 0);
      const online = Number(prev.onlineAmount || 0);
      if (prev.paymentMode === "cash") {
        if (cash === total && online === 0) return prev;
        return { ...prev, cashAmount: total, onlineAmount: 0 };
      }
      if (prev.paymentMode === "online") {
        if (online === total && cash === 0) return prev;
        return { ...prev, cashAmount: 0, onlineAmount: total };
      }
      if (prev.paymentMode === "split") {
        if (cash + online === total) return prev;
        if (cash === 0 && online === 0) {
          const nextCash = Math.round(total / 2);
          return { ...prev, cashAmount: nextCash, onlineAmount: total - nextCash };
        }
        return prev;
      }
      return prev;
    });
  }, [formData.paymentMode, formData.totalAmount]);

  useEffect(() => {
    const load = async () => {
      if (!initialDraftId) {
        setLoadingDraft(false);
        return;
      }
      if (!user?.uid) return;

      try {
        setLoadingDraft(true);
        const draft = await getRiderDraft(initialDraftId);

        if (!draft) {
          setLoadingDraft(false);
          return;
        }

        if (draft.employee_uid !== user.uid) {
          // Basic client-side guard; real protection should be enforced server-side.
          setLoadingDraft(false);
          return;
        }

        const draftData = draft.data || {};

        setDraftId(draft.id);
        setDraftMeta(draft.meta || null);
        setFormData({
          ...defaultFormData,
          ...draftData,
          draftId: draft.id,
          draftSavedAt: draft.updated_at || draft.created_at || null,
        });
        setErrors({});
      } finally {
        setLoadingDraft(false);
      }
    };

    load();
  }, [initialDraftId, user?.uid]);

  const saveDraft = async (arg = { stepLabel: "Step 1", stepPath: "step-1" }) => {
    if (!user?.uid) throw new Error("User not available");

    const stepLabel = typeof arg === "string" ? arg : arg?.stepLabel || "Step 1";
    const stepPath = typeof arg === "string" ? "step-1" : arg?.stepPath || "step-1";

    const meta = {
      name: formData.name?.trim() || "Unnamed Rider",
      phone: formData.phone || "",
      step: stepLabel,
      stepPath,
      savedAt: new Date().toISOString(),
    };

    const payload = {
      employee_uid: user.uid,
      employee_email: user.email || null,
      name: meta.name,
      phone: meta.phone,
      step_label: stepLabel,
      step_path: stepPath,
      meta,
      data: { ...formData, draftId: undefined },
    };

    const saved = draftId
      ? await updateRiderDraft(draftId, payload)
      : await createRiderDraft(payload);

    setDraftId(saved.id);
    setDraftMeta(saved.meta || meta);
    setFormData((prev) => ({
      ...prev,
      draftId: saved.id,
      draftSavedAt: saved.updated_at || saved.created_at || meta.savedAt,
    }));
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setErrors({});
    setDraftMeta(null);
    setDraftId(null);
    setLoadingDraft(false);
  };

  return (
    <RiderFormContext.Provider
      value={{
        formData,
        setFormData,
        updateForm,
        errors,
        setErrors,
        resetForm,
        saveDraft,
        draftMeta,
        draftId,
        loadingDraft,
      }}
    >
      {children}
    </RiderFormContext.Provider>
  );
}

export function useRiderForm() {
  const ctx = useContext(RiderFormContext);
  if (!ctx) throw new Error("useRiderForm must be used inside provider");
  return ctx;
}
