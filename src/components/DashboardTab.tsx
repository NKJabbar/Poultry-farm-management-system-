import React from "react";
import { FlockBatch, DailyRecord } from "../types";
import { 
  Plus, 
  Flame, 
  TrendingUp, 
  Egg, 
  AlertTriangle, 
  Compass, 
  Activity, 
  Droplet, 
  User, 
  HeartPulse,
  Phone,
  ArrowRight,
  Package
} from "lucide-react";
import { calculateAgeDetails, getPoultryAdvisory, getLocalYYYYMMDD } from "../utils/poultryHelpers";

interface DashboardTabProps {
  batches: FlockBatch[];
  records: DailyRecord[];
  onNavigateTo: (tab: "dashboard" | "batches" | "logging" | "analytics" | "chatbot" | "inventory") => void;
  onQuickAiSymptom: (symptom: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  batches,
  records,
  onNavigateTo,
  onQuickAiSymptom,
}) => {
  // Compute some core KPIs
  const activeBatches = batches.filter((b) => b.status === "Active");
  const totalBirds = activeBatches.reduce((acc, b) => acc + b.currentCount, 0);

  // Latest activities & logs
  const todayStr = getLocalYYYYMMDD();
  const todayRecords = records.filter((r) => r.date === todayStr);

  const totalEggsToday = todayRecords.reduce((acc, r) => acc + (r.eggCollected || 0), 0);
  const totalMortalityToday = todayRecords.reduce((acc, r) => acc + r.mortality, 0);

  // Weekly stats: past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRecords = records.filter((r) => new Date(r.date) >= sevenDaysAgo);

  const weeklyMortality = recentRecords.reduce((acc, r) => acc + r.mortality, 0);
  const weeklyEggs = recentRecords.reduce((acc, r) => acc + (r.eggCollected || 0), 0);
  const avgTemp = recentRecords.length
    ? Math.round(recentRecords.reduce((acc, r) => acc + (r.avgTemperature || 0), 0) / recentRecords.length)
    : 30; // standard temperature in Ghana

  // Scan recent records for safety anomalies
  const anomalies: { type: "heavy" | "warning"; message: string; actionText: string; actionTab: "chatbot" | "logging" | "analytics" }[] = [];

  // Check if any recent mortality spike occurred (mortality > 2 in a day)
  const recentSpikes = recentRecords.filter((r) => r.mortality >= 3);
  if (recentSpikes.length > 0) {
    anomalies.push({
      type: "heavy",
      message: `Critical mortality spike detected recently: ${recentSpikes[0].mortality} birds died on ${recentSpikes[0].date}.`,
      actionText: "Diagnose with AI Vet Advisor",
      actionTab: "chatbot",
    });
  }

  // Check if any dynamic symptoms exist on active batches in past 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const symptomsInPast3Days = records
    .filter((r) => new Date(r.date) >= threeDaysAgo && r.symptoms.length > 0)
    .flatMap((r) => r.symptoms.map((s) => ({ symptom: s, date: r.date, batchId: r.batchId })));

  if (symptomsInPast3Days.length > 0) {
    const uniqueSymptoms = Array.from(new Set(symptomsInPast3Days.map((s) => s.symptom)));
    const targetBatch = batches.find((b) => b.id === symptomsInPast3Days[0].batchId);
    anomalies.push({
      type: "warning",
      message: `Observed symptoms (${uniqueSymptoms.join(", ")}) on "${targetBatch?.name || "Flock"}" in the last 72 hours.`,
      actionText: "Analyze symptoms now",
      actionTab: "chatbot",
    });
  }

  // FCR Estimation
  // Standard feed consumed weekly vs flock weight gain. For simplicity, let's keep an operational health score
  const farmHealthScore = Math.max(
    60,
    100 - (weeklyMortality * 2) - (recentSpikes.length * 10)
  );

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Overview Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs gap-6">
        <div>
          <h2 id="hello-farmer" className="text-2xl font-display font-medium text-slate-900 tracking-tight">
            Akwaaba! Welcome back.
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
            You are currently managing <strong className="text-slate-950 underline decoration-emerald-500 decoration-2">{totalBirds.toLocaleString()}</strong> active birds across <strong className="text-slate-950 font-bold">{activeBatches.length}</strong> pens. All automated bio-monitors are active.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            id="manage-supplies-btn"
            onClick={() => onNavigateTo("inventory")}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            <Package className="w-4 h-4 text-emerald-600" />
            Manage Supplies
          </button>
          <button
            id="quick-log-btn"
            onClick={() => onNavigateTo("logging")}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Activity
          </button>
          <button
            id="chat-advisor-btn"
            onClick={() => onNavigateTo("chatbot")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            AI Vet Chat
          </button>
        </div>
      </div>

      {/* Critical Status & Anomalies */}
      {anomalies.length > 0 && (
        <div id="anomalies-list" className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-rose-800 uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            Active Advisories & Alarms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anno, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-xl flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 ${
                  anno.type === "heavy" 
                    ? "bg-rose-50/70 border-rose-200 text-rose-950" 
                    : "bg-amber-50/80 border-amber-200 text-amber-950"
                }`}
              >
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                    anno.type === "heavy" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {anno.type === "heavy" ? "Action Recommended" : "Observation Alert"}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">{anno.message}</p>
                </div>
                <button
                  onClick={() => onNavigateTo(anno.actionTab)}
                  className={`mt-4 flex items-center gap-1.5 text-xs font-semibold w-fit pb-1 border-b cursor-pointer transition-all ${
                    anno.type === "heavy"
                      ? "text-rose-700 hover:text-rose-900 border-rose-300"
                      : "text-amber-800 hover:text-amber-950 border-amber-300"
                  }`}
                >
                  {anno.actionText}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Daily Veterinary & Water Advisories Panel */}
      {activeBatches.length > 0 && (
        <div id="dynamic-daily-advisories" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-display font-medium text-slate-900 flex items-center gap-2">
              <Compass className="text-emerald-700 w-5 h-5 shrink-0" />
              Poultry Daily Routine & Medical Advisor
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
              Live Checklist
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBatches.map((b) => {
              const ageInfo = calculateAgeDetails(b);
              const advisory = getPoultryAdvisory(b.purpose, ageInfo.totalDays);
              return (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-150 bg-slate-50/55 flex flex-col justify-between space-y-4 shadow-3xs hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{b.name}</h4>
                      <p className="text-[10px] font-sans text-slate-500 mt-0.5">
                        {b.breed} • Age: {ageInfo.formatted} ({ageInfo.totalDays} Days)
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 border ${advisory.badgeColor}`}>
                      {advisory.type}
                    </span>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs space-y-1.5 flex-grow">
                    <h5 className="text-xs font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                      {advisory.title}
                    </h5>
                    <p className="text-[11px] text-slate-700 font-sans leading-relaxed">
                      <strong>Routine:</strong> {advisory.instructions}
                    </p>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed italic border-t border-slate-50 pt-1 mt-1">
                      {advisory.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Farm Live KPI Grid */}
      <div id="metric-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Birds */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="p-3.5 bg-sky-50 rounded-xl text-sky-800">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Flock Size</p>
            <h4 className="text-2xl font-display font-medium text-slate-900 mt-1">{totalBirds.toLocaleString()}</h4>
            <p className="text-emerald-700 font-medium text-xs mt-1 flex items-center gap-1">
              Active in {activeBatches.length} Pens
            </p>
          </div>
        </div>

        {/* KPI 2: Egg production (layers) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-805">
            <Egg className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Today's Eggs</p>
            <h4 className="text-2xl font-display font-medium text-slate-900 mt-1">
              {totalEggsToday > 0 ? `${totalEggsToday.toLocaleString()}` : "No report"}
            </h4>
            <p className="text-slate-500 text-xs mt-1">
              {weeklyEggs > 0 ? `${weeklyEggs.toLocaleString()} this week` : "0 logged this week"}
            </p>
          </div>
        </div>

        {/* KPI 3: Recent Mortality */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-700">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Weekly Losses</p>
            <h4 className={`text-2xl font-display font-medium mt-1 ${weeklyMortality > 4 ? "text-rose-700" : "text-slate-900"}`}>
              {weeklyMortality} birds
            </h4>
            <p className={`text-xs mt-1 ${weeklyMortality > 4 ? "text-rose-700 font-bold" : "text-slate-500"}`}>
              {totalMortalityToday} recorded today
            </p>
          </div>
        </div>

        {/* KPI 4: Farm Health Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-800">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Health Index</p>
            <h4 className="text-2xl font-display font-medium text-slate-900 mt-1">{farmHealthScore}%</h4>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  farmHealthScore > 85 ? "bg-emerald-600" : farmHealthScore > 70 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${farmHealthScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Quick diagnostic launch & contact list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Quick Diagnostic Symptoms Launcher */}
        <div id="quick-symptoms-launcher" className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
          <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
            <HeartPulse className="text-emerald-600 w-5 h-5 shrink-0" />
            Quick Disease Symptom Check
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Observe anything unusual? Tap any common symptom to instantly query the Google Gemini-powered Health Chatbot for diagnostic clues and critical steps:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
            <button
              onClick={() => onQuickAiSymptom("Birds are gasping for air, thin greenish-yellow droppings, and laying dropped instantly.")}
              className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 transition-all cursor-pointer flex gap-3.5 items-start hover:border-emerald-500 hover:shadow-xs group"
            >
              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-900 group-hover:text-emerald-950 transition-colors">Gasping & Green Droppings</span>
                <span className="text-xs text-slate-500 block mt-1">Highly indicative of Newcastle disease.</span>
              </div>
            </button>

            <button
              onClick={() => onQuickAiSymptom("Bloody, red-streaked wet stools on the litter, weak and pale birds huddling together.")}
              className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 transition-all cursor-pointer flex gap-3.5 items-start hover:border-emerald-500 hover:shadow-xs group"
            >
              <div className="w-2 h-2 bg-rose-600 rounded-full mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-900 group-hover:text-rose-950 transition-colors">Bloody Diarrhea & Huddling</span>
                <span className="text-xs text-slate-500 block mt-1">Highly indicative of Coccidiosis.</span>
              </div>
            </button>

            <button
              onClick={() => onQuickAiSymptom("Birds are very depressed, feathers ruffled, white watery diarrhea, pecking at their vents.")}
              className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 transition-all cursor-pointer flex gap-3.5 items-start hover:border-emerald-500 hover:shadow-xs group"
            >
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-900 group-hover:text-amber-950 transition-colors">White Loose Stools & Ruffled Feathers</span>
                <span className="text-xs text-slate-500 block mt-1">Indicative of Gumboro disease in chicks.</span>
              </div>
            </button>

            <button
              onClick={() => onQuickAiSymptom("Black or yellow raised scabs on feathers-less skin (combs, wattles, eyelids).")}
              className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 transition-all cursor-pointer flex gap-3.5 items-start hover:border-emerald-500 hover:shadow-xs group"
            >
              <div className="w-2 h-2 bg-slate-500 rounded-full mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-900 group-hover:text-slate-950 transition-colors">Scabs on Comb & Wattles</span>
                <span className="text-xs text-slate-500 block mt-1">Indicative of Fowl Pox vaccine gap.</span>
              </div>
            </button>
          </div>

          {/* Quick Guidance Box */}
          <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-amber-950 block">⚠️ Essential Ghanaian Biosecurity Rule:</span>
            <p>Ensure footbaths with a virucidal disinfectant (e.g., Virkon) are deployed at the entrance to all pens. Never permit visitors inside before disinfection. Change bird litter regularly and keep it bone dry to prevent coccidiosis spores from germinating.</p>
          </div>
        </div>

        {/* Right: Vet & Extension Contact List */}
        <div id="veterinary-directories" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
              <Phone className="text-emerald-600 w-5 h-5 shrink-0" />
              Veterinary Directory
            </h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              For on-field emergencies, vaccinations, and official confirmations, contact certified veterinary officers in Ghana:
            </p>

            <div className="space-y-4 mt-6">
              {/* MoFA Emergency */}
              <div className="border-b border-slate-100 pb-3.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">MoFA Animal Health Dept</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">Ministry of Food & Agri</span>
                <a href="tel:+233302666567" className="text-emerald-700 hover:text-emerald-600 font-extrabold text-xs sm:text-sm flex items-center gap-1 mt-1.5 hover:underline">
                  +233 (0) 302 666 567
                </a>
              </div>

              {/* Accra Veterinary Lab */}
              <div className="border-b border-slate-100 pb-3.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">National Vet Laboratory</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">Accra Research Lab</span>
                <a href="tel:+233244837581" className="text-emerald-700 hover:text-emerald-600 font-extrabold text-xs sm:text-sm flex items-center gap-1 mt-1.5 hover:underline">
                  +233 (0) 244 837 581
                </a>
              </div>

              {/* Eastern Region Extension */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">CSIR Animal Division</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">Veterinary Research Inst.</span>
                <a href="tel:+233302500181" className="text-emerald-700 hover:text-emerald-600 font-extrabold text-xs sm:text-sm flex items-center gap-1 mt-1.5 hover:underline">
                  +233 (0) 302 500 181
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 bg-slate-50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-3xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Note regarding vaccine supplies</span>
            <span className="text-xs text-slate-600 block mt-1.5 leading-relaxed">
              Lasota and Gumboro doses are supplied primarily by your district's Agricultural Extension service centers.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
