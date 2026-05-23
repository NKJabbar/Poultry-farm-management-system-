import React, { useState } from "react";
import { FlockBatch, DailyRecord } from "../types";
import { 
  Check, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  Thermometer, 
  Activity, 
  ClipboardCheck, 
  Info,
  Layers,
  Sparkles
} from "lucide-react";

import { getLocalYYYYMMDD } from "../utils/poultryHelpers";

interface LoggingTabProps {
  batches: FlockBatch[];
  records: DailyRecord[];
  onAddRecord: (record: Omit<DailyRecord, "id">) => void;
  onDeleteRecord: (id: string) => void;
  onNavigateToChat: (prefilledMessage: string) => void;
}

export const LoggingTab: React.FC<LoggingTabProps> = ({
  batches,
  records,
  onAddRecord,
  onDeleteRecord,
  onNavigateToChat,
}) => {
  const activeBatches = batches.filter((b) => b.status === "Active");

  // Selection state
  const [selectedBatchId, setSelectedBatchId] = useState(
    activeBatches.length > 0 ? activeBatches[0].id : ""
  );
  const [date, setDate] = useState(getLocalYYYYMMDD());

  // Record Parameters State
  const [feedConsumption, setFeedConsumption] = useState<number>(0);
  const [waterConsumption, setWaterConsumption] = useState<number>(0);
  const [mortality, setMortality] = useState<number>(0);
  const [eggCollected, setEggCollected] = useState<number>(0);
  const [crackedEggs, setCrackedEggs] = useState<number>(0);
  const [avgTemperature, setAvgTemperature] = useState<number>(28);
  const [avgHumidity, setAvgHumidity] = useState<number>(65);
  const [notes, setNotes] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const isLayer = selectedBatch?.purpose === "Layers" || selectedBatch?.purpose === "Dual-Purpose";

  const symptomsList = [
    "Green watery diarrhea",
    "Watery white diarrhea",
    "Bloody or red-streaked droppings",
    "Gasping or coughing",
    "Nasal discharge",
    "Twisted neck / wing paralysis",
    "Swollen comb or wattle",
    "Yellow/black scabs on comb",
    "Sudden high flock mortality",
    "Extreme listlessness/lethargy",
  ];

  const handleSymptomToggle = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    onAddRecord({
      batchId: selectedBatchId,
      date,
      feedConsumption,
      waterConsumption,
      mortality,
      eggCollected: isLayer ? eggCollected : undefined,
      crackedEggs: isLayer ? crackedEggs : undefined,
      avgTemperature,
      avgHumidity,
      notes: notes.trim() || undefined,
      symptoms: selectedSymptoms,
    });

    // Reset entry inputs
    setFeedConsumption(0);
    setWaterConsumption(0);
    setMortality(0);
    setEggCollected(0);
    setCrackedEggs(0);
    setNotes("");
    setSelectedSymptoms([]);
    
    // Smooth scroll success
    const element = document.getElementById("log-history-divider");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter records for preview list (grouped by selection or all)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div id="logging-management" className="space-y-6">
      
      {activeBatches.length === 0 ? (
        <div className="py-12 bg-white border border-slate-200 rounded-3xl text-center p-6 md:p-12 shadow-xs">
          <Info className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="font-display font-medium text-slate-800 mt-3 tracking-tight">No active flock batches</h4>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Please register at least one active bird batch in the "Batches" screen first to start daily logging.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Logging Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
            <h3 className="text-base font-display font-medium text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ClipboardCheck className="text-emerald-700 w-5 h-5 pointer-events-none" />
              Write Daily Entry
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Batch & Date Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Pen / Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none font-medium"
                  >
                    {activeBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.purpose})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Reporting Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    max={getLocalYYYYMMDD()}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Core Poultry Consumption KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Feed Eaten (kg)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={feedConsumption || ""}
                    placeholder="e.g. 110"
                    onChange={(e) => setFeedConsumption(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Water Served (Liters)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={waterConsumption || ""}
                    placeholder="e.g. 230"
                    onChange={(e) => setWaterConsumption(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Sudden Deaths (Mortality)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={mortality || ""}
                    placeholder="0"
                    onChange={(e) => setMortality(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-rose-700 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Egg Production (Only relevant for layers) */}
              {isLayer && (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    Layer Egg Record Sheet
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-800 uppercase mb-1.5">Good Eggs Collected</label>
                      <input
                        type="number"
                        min="0"
                        value={eggCollected || ""}
                        placeholder="e.g. 800"
                        onChange={(e) => setEggCollected(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-amber-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-800 uppercase mb-1.5">Cracked Eggs Found</label>
                      <input
                        type="number"
                        min="0"
                        value={crackedEggs || ""}
                        placeholder="0"
                        onChange={(e) => setCrackedEggs(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-amber-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-950 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Climate Variables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Temperature (°C)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={avgTemperature || ""}
                    placeholder="e.g. 29"
                    onChange={(e) => setAvgTemperature(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Humidity (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={avgHumidity || ""}
                    placeholder="e.g. 65"
                    onChange={(e) => setAvgHumidity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Health Observations/Symptoms checklist */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Health Observations / Symptoms
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {symptomsList.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => handleSymptomToggle(sym)}
                        className={`text-xs px-3 py-2 rounded-xl border text-left flex items-start gap-1.5 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span className="leading-snug text-[11px] font-medium">{sym}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Entry Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Observation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record feed brands, treatments, weather shifts, or pen repairs made today..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none resize-none font-sans"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl cursor-pointer shadow-sm shadow-emerald-700/10 transition-colors uppercase tracking-wider select-none"
              >
                Submit and Save Logs
              </button>
            </form>
          </div>

          {/* Right Column: Dynamic Symptom Advisor Tool */}
          <div id="realtime-advisor-card" className="bg-emerald-950 text-emerald-50 rounded-2xl p-6 flex flex-col justify-between border border-emerald-900">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-base tracking-wide uppercase">Real-time Advisor</h3>
              </div>
              <p className="text-emerald-300 text-xs leading-relaxed mt-2">
                Selecting symptoms on the left triggers smart warning metrics. Review recommended immediate biosecurity actions or consult Gemini AI.
              </p>

              {selectedSymptoms.length > 0 ? (
                <div className="space-y-4 mt-6">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-900 text-emerald-300 px-2 py-1 rounded-md">Selected Symptoms ({selectedSymptoms.length})</span>
                    <ul className="space-y-1.5 mt-2 text-xs">
                      {selectedSymptoms.map((s, i) => (
                        <li key={i} className="flex gap-2 items-center text-emerald-200">
                          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-900 border border-emerald-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      Suggested Action
                    </span>
                    <p className="text-[11px] text-emerald-300 leading-relaxed">
                      Quarantine affected birds immediately. Ensure personnel disinfect hands and boots. Use the button below to feed this diagnostic directly to FlockIntel AI.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const payload = `My bird flock "${selectedBatch?.name || "Active birds"}" is displaying the following symptoms: ${selectedSymptoms.join(", ")}. Notes/observations: ${notes || "None specified"}. Please perform a diagnostic pre-screen and suggest immediate bio-security first-aid steps.`;
                      onNavigateToChat(payload);
                    }}
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Query FlockIntel AI with Symptoms
                  </button>
                </div>
              ) : (
                <div className="mt-12 text-center py-6 text-emerald-400/60 border border-emerald-900/60 border-dashed rounded-xl">
                  <Activity className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs mt-3 leading-relaxed px-4">
                    As you click and select symptoms above, this assistant will suggest diagnostics and generate smart actions.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-emerald-900/60 mt-6 text-[10px] text-emerald-400 leading-relaxed space-y-1">
              <span className="font-bold text-emerald-300 uppercase block">Bio-Security Standard:</span>
              <p>Keep a detailed history of your flock's water to feed consumption ratios (target ~2:1 or 2.5:1). Fluctuations are often the first sign of bacterial or viral challenges before mortality occurs.</p>
            </div>
          </div>

        </div>
      )}

      {/* Log History Header - Anchor */}
      <div id="log-history-divider" className="border-t border-slate-200 pt-6">
        <h3 className="text-base font-display font-medium text-slate-900">Historical Operations Logs</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">A comprehensive view of all daily batch entries. Inaccuracies can be deleted and re-logged.</p>
      </div>

      {/* Log list */}
      <div id="log-history-list" className="space-y-3">
        {sortedRecords.map((rec) => {
          const b = batches.find((x) => x.id === rec.batchId);
          return (
            <div 
              key={rec.id} 
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-5 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-extrabold uppercase">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {rec.date}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-display font-medium text-slate-900">{b?.name || "Unknown Flock"}</span>
                  {rec.symptoms.length > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1 leading-none">
                      ⚠️ {rec.symptoms.length} Symptoms
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
                  <div>
                    Feed: <strong className="text-slate-900">{rec.feedConsumption} kg</strong>
                  </div>
                  <div>
                    Water: <strong className="text-slate-900">{rec.waterConsumption} L</strong>
                  </div>
                  <div className={rec.mortality > 0 ? "text-rose-700 font-bold" : ""}>
                    Deaths: <strong className={rec.mortality > 0 ? "text-rose-700" : "text-slate-900"}>{rec.mortality}</strong>
                  </div>
                  {rec.eggCollected !== undefined && (
                    <div>
                      Eggs: <strong className="text-slate-900">{rec.eggCollected} <span className="text-slate-400 font-normal">({rec.crackedEggs} crk)</span></strong>
                    </div>
                  )}
                </div>

                {/* notes */}
                {rec.notes && (
                  <p className="text-xs text-slate-500 italic leading-relaxed pt-1.5 border-t border-slate-50 text-sans">
                    "{rec.notes}"
                  </p>
                )}

                {/* symptoms detail */}
                {rec.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rec.symptoms.map((s, idx) => (
                      <span key={idx} className="text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-100 rounded-md px-2 py-0.5 leading-none">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-2 sm:pt-0 border-t border-slate-50 sm:border-0 shrink-0">
                {pendingDeleteId === rec.id ? (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-50 border border-rose-100 px-2 py-1 rounded-md leading-none">Are you sure?</span>
                    <button
                      onClick={() => {
                        onDeleteRecord(rec.id);
                        setPendingDeleteId(null);
                      }}
                      className="text-[10px] sm:text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer select-none"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(null)}
                      className="text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer select-none"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPendingDeleteId(rec.id)}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-100/95 hover:border-rose-600 px-3.5 py-2 rounded-xl transition-all cursor-pointer bg-rose-50/50 select-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Entry
                  </button>
                )}
              </div>

            </div>
          );
        })}

        {sortedRecords.length === 0 && (
          <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
            <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs mt-3 text-slate-500 font-medium">No daily entries logged yet. Add your first entry using the log sheet above.</p>
          </div>
        )}
      </div>

    </div>
  );
};
