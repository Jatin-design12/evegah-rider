import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import EmployeeLayout from "../../components/layouts/EmployeeLayout";
import { RiderFormProvider } from "./RiderFormContext";
import { useRiderForm } from "./useRiderForm";

import useAuth from "../../hooks/useAuth";

import Step1RiderDetails from "./riderSteps/Step1RiderDetails";
import Step2Identity from "./riderSteps/Step2Identity";
import Step3Agreement from "./riderSteps/Step3Agreement";
import Step4Photos from "./riderSteps/Step4Photos";
import Step5Payment from "./riderSteps/Step5Payment";

import { Check } from "lucide-react";

const STEPS = [
  {
    path: "step-1",
    title: "Rider Details",
    description:
      "Capture rider information before moving to identity verification.",
  },
  {
    path: "step-2",
    title: "Rental Details",
    description: "Update plan, vehicle details, accessories, and totals.",
  },
  {
    path: "step-3",
    title: "Agreement",
    description: "Review and accept the rental agreement.",
  },
  {
    path: "step-4",
    title: "Photos",
    description: "Capture rider and vehicle condition photos.",
  },
  {
    path: "step-5",
    title: "Payment",
    description: "Record payment details and complete registration.",
  },
];

function Stepper({ currentIndex, onStepClick }) {
  return (
    <div className="w-full">
      <div className="flex items-start gap-0">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const showConnector = index < STEPS.length - 1;

          const circleClass = isComplete
            ? "bg-evegah-primary text-white border-evegah-primary"
            : isActive
            ? "bg-white text-evegah-primary border-evegah-primary"
            : "bg-white text-gray-400 border-evegah-border";

          const connectorClass = isComplete
            ? "bg-evegah-primary"
            : "bg-gray-200";

          const canNavigate = typeof onStepClick === "function";

          return (
            <div key={step.path} className="flex-1">
              <button
                type="button"
                onClick={() => canNavigate && onStepClick(index)}
                disabled={!canNavigate}
                className={`flex w-full flex-col items-start gap-2 text-left bg-transparent p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evegah-primary ${
                  canNavigate ? "hover:bg-gray-50" : "cursor-default"
                }`}
              >
                <div className="flex items-center w-full">
                  <div
                    className={
                      "h-8 w-8 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 " +
                      circleClass
                    }
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isComplete ? <Check size={16} /> : index + 1}
                  </div>

                  {showConnector ? (
                    <div className="flex-1 px-2">
                      <div className={"h-[2px] w-full rounded-full " + connectorClass} />
                    </div>
                  ) : null}
                </div>

                <div className="mt-2">
                  <p
                    className={
                      "text-xs font-semibold " +
                      (isComplete || isActive ? "text-evegah-text" : "text-gray-400")
                    }
                  >
                    {step.title}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiderStepProgress() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, resetForm, saveDraft } = useRiderForm();
  const [actionNote, setActionNote] = useState(null);

  const match = location.pathname.match(/\/(step-\d+)\b/);
  const stepPath = match?.[1] || "step-1";
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.path === stepPath)
  );

  const total = STEPS.length;
  const percent = ((currentIndex + 1) / total) * 100;
  const title = STEPS[currentIndex]?.title || "";
  const description = STEPS[currentIndex]?.description || "";

  const basePath = location.pathname.replace(/\/(step-\d+)\b.*$/, "");
  const currentStepPath = STEPS[currentIndex]?.path || "step-1";
  const normalizedBasePath = basePath.replace(/\/+$/, "");
  const buildStepPath = (step) =>
    normalizedBasePath ? `${normalizedBasePath}/${step}` : `/${step}`;

  const showActionNote = (type, message) => {
    setActionNote({ type, message });
    window.clearTimeout(showActionNote._t);
    showActionNote._t = window.setTimeout(() => setActionNote(null), 3000);
  };

  const handleStepClick = (index) => {
    const step = STEPS[index];
    if (!step) return;
    const targetPath = buildStepPath(step.path);
    navigate(targetPath);
  };

  const handleClearForm = () => {
    resetForm();
    navigate(buildStepPath("step-1"), { replace: true });
    showActionNote("info", "Form cleared.");
  };

  const handleSaveDraft = async () => {
    if (!formData?.name && !formData?.phone && !formData?.aadhaar) {
      showActionNote("warning", "Add rider details before saving a draft.");
      return;
    }

    try {
      await saveDraft({
        stepLabel: title || `Step ${currentIndex + 1}`,
        stepPath: currentStepPath,
      });
      showActionNote("success", "Draft saved.");
    } catch (e) {
      showActionNote(
        "error",
        e?.message ? `Unable to save draft: ${e.message}` : "Unable to save draft."
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Rider Onboarding
          </p>
          <h2 className="text-2xl font-semibold text-evegah-text">
            Step {currentIndex + 1} · {title}
          </h2>
          {description ? <p className="text-sm text-gray-500">{description}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {currentStepPath !== "step-5" ? (
            <button type="button" className="btn-muted" onClick={handleClearForm}>
              Clear Form
            </button>
          ) : null}
          <button type="button" className="btn-outline" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </div>

      <Stepper currentIndex={currentIndex} onStepClick={handleStepClick} />

      {actionNote ? (
        <p
          className={`mt-2 text-xs text-center ${
            actionNote.type === "success"
              ? "text-green-600"
              : actionNote.type === "error"
              ? "text-red-600"
              : actionNote.type === "warning"
              ? "text-yellow-700"
              : "text-blue-600"
          }`}
        >
          {actionNote.message}
        </p>
      ) : null}
    </div>
  );
}

export default function RiderForm() {
  const { user, loading } = useAuth();
  const { draftId } = useParams();
  const [searchParams] = useSearchParams();
  const quickRideMode = ["1", "true", "yes"].includes(
    String(searchParams.get("quick") || "").toLowerCase()
  );

  if (loading) return null;

  return (
    <EmployeeLayout>
      <RiderFormProvider
        user={user}
        initialDraftId={draftId || null}
        initialQuickRideMode={quickRideMode}
      >
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <RiderStepProgress />
          <Routes>
            <Route path="/" element={<Navigate to="step-1" replace />} />
            <Route path="step-1" element={<Step1RiderDetails />} />
            <Route path="step-2" element={<Step2Identity />} />
            <Route path="step-3" element={<Step3Agreement />} />
            <Route path="step-4" element={<Step4Photos />} />
            <Route path="step-5" element={<Step5Payment />} />
          </Routes>
        </div>
      </RiderFormProvider>
    </EmployeeLayout>
  );
}
