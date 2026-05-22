import React, { useState } from "react";
import { FlockBatch } from "../types";
import { 
  Plus, 
  Calendar, 
  PenTool, 
  Archive, 
  Trash2, 
  Hash, 
  Tag, 
  Info, 
  CheckCircle, 
  ChevronRight, 
  X,
  FileCheck2,
  Sparkles,
  Pill,
  AlertTriangle
} from "lucide-react";
import { calculateAgeDetails, getPoultryAdvisory, Advisory, getLocalYYYYMMDD } from "../utils/poultryHelpers";

interface BatchesTabProps {
  batches: FlockBatch[];
  onAddBatch: (batch: Omit<FlockBatch, "id" | "currentCount" | "status">) => void;
  onUpdateBatch: (batch: FlockBatch) => void;
  onDeleteBatch: (id: string) => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingBatch, setEditingBatch] = useState<FlockBatch | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Isa Brown");
  const [purpose, setPurpose] = useState<"Layers" | "Broilers" | "Dual-Purpose">("Layers");
  const [initialCount, setInitialCount] = useState<number | "">(500);
  const [arrivalDate, setArrivalDate] = useState(getLocalYYYYMMDD());
  const [arrivalWeeks, setArrivalWeeks] = useState<number | "">("");
  const [arrivalDays, setArrivalDays] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setBreed("Isa Brown");
    setPurpose("Layers");
    setInitialCount(500);
    setArrivalDate(getLocalYYYYMMDD());
    setArrivalWeeks("");
    setArrivalDays("");
    setNotes("");
    setFormError(null);
    setIsRegistering(false);
    setEditingBatch(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const w = arrivalWeeks === "" ? 0 : Number(arrivalWeeks);
    const d = arrivalDays === "" ? 0 : Number(arrivalDays);
    const totalDaysValue = (w * 7) + d;

    if (totalDaysValue === 0) {
      const errMsg = "Age at arrival cannot be 0 weeks and 0 days. Please specify the age at arrival (minimum 1 day).";
      setFormError(errMsg);
      return;
    }

    setFormError(null);
    const resolvedWeeks = Math.floor(totalDaysValue / 7);

    onAddBatch({
      name,
      breed,
      purpose,
      initialCount: initialCount === "" ? 0 : Number(initialCount),
      arrivalDate,
      ageWeeksAtArrival: resolvedWeeks,
      ageAtArrivalUnit: "days",
      ageAtArrivalValue: totalDaysValue,
      notes,
    });
    resetForm();
  };

  const handleEditClick = (b: FlockBatch) => {
    setEditingBatch(b);
    setName(b.name);
    setBreed(b.breed);
    setPurpose(b.purpose);
    setInitialCount(b.initialCount);
    setArrivalDate(b.arrivalDate);
    setFormError(null);
    
    // Parse existing formats back to composite Weeks & Days
    const unit = b.ageAtArrivalUnit || "weeks";
    const val = b.ageAtArrivalValue !== undefined ? b.ageAtArrivalValue : b.ageWeeksAtArrival;
    const totalDays = unit === "days" ? val : val * 7;

    setArrivalWeeks(Math.floor(totalDays / 7));
    setArrivalDays(totalDays % 7);
    
    setNotes(b.notes || "");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !name.trim()) return;

    const w = arrivalWeeks === "" ? 0 : Number(arrivalWeeks);
    const d = arrivalDays === "" ? 0 : Number(arrivalDays);
    const totalDaysValue = (w * 7) + d;

    if (totalDaysValue === 0) {
      const errMsg = "Age at arrival cannot be 0 weeks and 0 days. Please specify the age at arrival (minimum 1 day).";
      setFormError(errMsg);
      return;
    }

    setFormError(null);
    const resolvedWeeks = Math.floor(totalDaysValue / 7);

    onUpdateBatch({
      ...editingBatch,
      name,
      breed,
      purpose,
      initialCount: initialCount === "" ? 0 : Number(initialCount),
      arrivalDate,
      ageWeeksAtArrival: resolvedWeeks,
      ageAtArrivalUnit: "days",
      ageAtArrivalValue: totalDaysValue,
      notes,
    });
    resetForm();
  };

  const handleToggleStatus = (b: FlockBatch) => {
    const nextStatus = b.status === "Active" ? "Closed" : "Active";
    onUpdateBatch({
      ...b,
      status: nextStatus,
    });
  };

  const standardBreeds = [
    "Isa Brown",
    "White Leghorn",
    "Lohmann Brown",
    "Cobb 500",
    "Ross 308",
    "Rhode Island Red",
    "Bovans Black",
    "Local Indigenous Breed",
  ];

  return (
    <div id="batches-management" className="space-y-6">
      {!isRegistering && !editingBatch && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight">Flock & Batch Management</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Register new pens, monitor bird age, and update stock counts.</p>
          </div>
          <button
            id="register-flock-btn"
            onClick={() => setIsRegistering(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm select-none"
          >
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        </div>
      )}

      {/* Form Area: Create / Edit */}
      {(isRegistering || editingBatch) && (
        <div id="batch-form-container" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-display font-medium text-slate-900 flex items-center gap-2">
              <FileCheck2 className="text-emerald-600 w-5 h-5" />
              {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Register New Flock Batch"}
            </h3>
            <button 
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={editingBatch ? handleUpdateSubmit : handleRegisterSubmit} className="space-y-4">
            {formError && (
              <div id="batch-form-error" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 flex items-start gap-2 text-xs sm:text-sm animate-pulse">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batch/Pen Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Batch / Pen Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broiler Batch #4 (Pen A)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                />
              </div>

              {/* Bird Breed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Bird Breed</label>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                >
                  {standardBreeds.map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Purpose / Classification</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                >
                  <option value="Layers">Layers (Egg Production Focus)</option>
                  <option value="Broilers">Broilers (Meat Production Focus)</option>
                  <option value="Dual-Purpose">Dual-Purpose (Eggs & Meat)</option>
                </select>
              </div>

              {/* Initial Bird Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Initial Bird Count</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={initialCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInitialCount(val === "" ? "" : parseInt(val, 10));
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                />
              </div>

              {/* Arrival Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Arrival Date</label>
                <input
                  type="date"
                  required
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                />
              </div>

              {/* Age at Arrival (Weeks & Days Inputs) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Age at Arrival</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={arrivalWeeks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setArrivalWeeks(val === "" ? "" : parseInt(val, 10));
                      }}
                      placeholder="0"
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl pl-4 pr-12 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-slate-400 uppercase select-none pointer-events-none">Wks</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={arrivalDays}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setArrivalDays("");
                          return;
                        }
                        const numericVal = parseInt(val, 10);
                        if (isNaN(numericVal)) {
                          setArrivalDays(0);
                          return;
                        }
                        if (numericVal >= 7) {
                          const addedWeeks = Math.floor(numericVal / 7);
                          const remainingDays = numericVal % 7;
                          setArrivalWeeks((prev) => (prev === "" ? 0 : Number(prev)) + addedWeeks);
                          setArrivalDays(remainingDays);
                        } else {
                          setArrivalDays(numericVal);
                        }
                      }}
                      placeholder="0"
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl pl-4 pr-12 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-slate-400 uppercase select-none pointer-events-none">Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Bio-Security or Nutritional Notes</label>
              <textarea
                rows={3}
                placeholder="List source quality (e.g., hatchery name), vaccine certificates accompanying entry, special lighting plan, or current layout status..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none resize-none font-sans"
              />
            </div>

            {/* Submission buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2  bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer select-none"
              >
                {editingBatch ? "Save Changes" : "Register Batch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batches Grid Display */}
      {!isRegistering && !editingBatch && (
        <div id="batches-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((b) => {
            const ageInfo = calculateAgeDetails(b);
            const advisory = getPoultryAdvisory(b.purpose, ageInfo.totalDays);
            const isLayer = b.purpose === "Layers" || b.purpose === "Dual-Purpose";

            return (
              <div 
                key={b.id} 
                className={`bg-white border rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  b.status === "Active" ? "border-slate-200" : "border-slate-100 opacity-75 bg-slate-50/50"
                }`}
              >
                {/* Card Header Banner */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.purpose === "Layers" 
                          ? "bg-amber-100 text-amber-800" 
                          : b.purpose === "Broilers" 
                          ? "bg-sky-100 text-sky-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {b.purpose}
                      </span>
                      <h4 className="text-base font-display font-medium text-slate-900 mt-2">{b.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{b.breed}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                      b.status === "Active" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Card Body Stats */}
                <div className="p-5 grid grid-cols-2 gap-4 text-xs sm:text-sm border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-bold">Active Count</span>
                    <span className="text-base font-display font-medium text-slate-800 block mt-0.5">
                      {b.currentCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {b.initialCount}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-bold">Current Age</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 block mt-1">
                      {ageInfo.formatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-bold">Arrival Date</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 block mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.arrivalDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-bold">Laying Status</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 block mt-1">
                      {isLayer ? (
                        ageInfo.weeks >= 20 ? (
                          <span className="text-emerald-700 font-black flex items-center gap-1 font-display">🥚 Active Laying</span>
                        ) : ageInfo.weeks >= 16 ? (
                          <span className="text-amber-600 font-black animate-pulse flex items-center gap-1 font-display">⏳ Approaching Lay ({ageInfo.weeks}w)</span>
                        ) : (
                          <span className="text-slate-500 font-normal">🐣 Growing (Pre-lay)</span>
                        )
                      ) : (
                        <span className="text-slate-600">🍗 Meat maturity</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Dynamic Veterinary Day Advisory Panel */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Veterinary Advice (Day {ageInfo.totalDays})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${advisory.badgeColor}`}>
                      {advisory.type}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-155 shadow-3xs">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {advisory.title}
                    </h5>
                    <p className="text-[11px] sm:text-xs text-slate-600 mt-1 font-sans leading-relaxed">
                      <strong>Instructions:</strong> {advisory.instructions}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-normal italic font-sans border-t border-slate-100 pt-1">
                      {advisory.details}
                    </p>
                  </div>
                </div>

                {/* Bio Notes */}
                {b.notes && (
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-600 leading-relaxed flex gap-2 items-start">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p>{b.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-3 bg-slate-50/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(b)}
                    className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer select-none"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    {b.status === "Active" ? "Retire Bird Batch" : "Activate Batch"}
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditClick(b)}
                      className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Edit details"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBatch(b.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      title="Delete flock record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {batches.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Tag className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 mt-3">No flock batches found</h4>
              <p className="text-slate-400 text-xs mt-1">Register your active pen counts to start generating daily reports.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
