import React, { useState } from "react";
import { FlockBatch, DailyRecord } from "../types";
import { 
  TrendingUp, 
  Egg, 
  Flame, 
  Droplet, 
  Thermometer, 
  ChevronRight, 
  BarChart3, 
  Activity, 
  Calendar,
  Layers,
  AlertTriangle,
  Info
} from "lucide-react";

interface AnalyticsTabProps {
  batches: FlockBatch[];
  records: DailyRecord[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ batches, records }) => {
  const activeBatches = batches.filter((b) => b.status === "Active");
  const [selectedBatchId, setSelectedBatchId] = useState(
    activeBatches.length > 0 ? activeBatches[0].id : batches.length > 0 ? batches[0].id : ""
  );

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  // Filter records for the selected batch
  const batchRecords = records
    .filter((r) => r.batchId === selectedBatchId)
    // sort chronologically
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Crop to latest 14 entries for clear visualization
  const chartRecords = batchRecords.slice(-14);

  // Compute stats
  const totalFeed = chartRecords.reduce((acc, r) => acc + r.feedConsumption, 0);
  const totalWater = chartRecords.reduce((acc, r) => acc + r.waterConsumption, 0);
  const totalEggs = chartRecords.reduce((acc, r) => acc + (r.eggCollected || 0), 0);
  const totalMortality = chartRecords.reduce((acc, r) => acc + r.mortality, 0);
  const avgTemp = chartRecords.length
    ? (chartRecords.reduce((acc, r) => acc + (r.avgTemperature || 0), 0) / chartRecords.length).toFixed(1)
    : "0";
  const avgHum = chartRecords.length
    ? Math.round(chartRecords.reduce((acc, r) => acc + (r.avgHumidity || 0), 0) / chartRecords.length)
    : 0;

  // Water to Feed ratio calculation
  const totalWaterFeedRatio = totalFeed > 0 ? (totalWater / totalFeed).toFixed(2) : "0.00";

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Helper: Get X coordinate for index in chartRecords
  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (total - 1)) * plotWidth;
  };

  // Helper: Egg production values
  const maxEgg = chartRecords.length 
    ? Math.max(...chartRecords.map((r) => r.eggCollected || 0), 100) 
    : 100;
  const minEgg = chartRecords.length
    ? Math.min(...chartRecords.map((r) => r.eggCollected || 0), 0)
    : 0;

  const getEggY = (val: number) => {
    const range = maxEgg - minEgg || 1;
    return paddingTop + plotHeight - ((val - minEgg) / range) * plotHeight;
  };

  // Helper: Feed values
  const maxFeed = chartRecords.length 
    ? Math.max(...chartRecords.map((r) => r.feedConsumption), 10) 
    : 10;
  const getFeedY = (val: number) => {
    return paddingTop + plotHeight - (val / maxFeed) * plotHeight;
  };

  // Helper: Temperature/Humidity values
  // Temperatures are typically in 20-40 range in Ghana structure
  const maxTemp = 40;
  const minTemp = 15;
  const getTempY = (val: number) => {
    return paddingTop + plotHeight - ((val - minTemp) / (maxTemp - minTemp)) * plotHeight;
  };

  // Check for ratio alarms (Water:Feed ratio standard is 2.0 to 2.5)
  const ratioFloat = parseFloat(totalWaterFeedRatio);
  const ratioAnomaly = ratioFloat > 0 && (ratioFloat < 1.8 || ratioFloat > 2.8);

  return (
    <div id="analytics-tab-container" className="space-y-6 animate-fadeIn">
      
      {/* Target Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight">Interactive Data Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Compare bird intake stats, laying percentages, and environmental curves.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 block shrink-0">Selected Flock:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs cursor-pointer select-none"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.purpose})
              </option>
            ))}
          </select>
        </div>
      </div>

      {chartRecords.length === 0 ? (
        <div className="py-16 bg-white border border-slate-200 rounded-3xl text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h4 className="font-display font-medium text-slate-700 mt-3 tracking-tight">Insufficient analytics history</h4>
          <p className="text-slate-500 text-xs px-4 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Please log daily feed and egg counts for "{selectedBatch?.name || "this flock"}" in the "Logging" tab to unlock these automated visual graphics.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Performance Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Feed Eaten (14d)</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1 font-sans">{totalFeed.toLocaleString()} kg</span>
              <span className="text-xs text-slate-500 block mt-1">
                {(totalFeed / chartRecords.length).toFixed(1)} kg Daily Avg
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Water Intake (14d)</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1 font-sans">{totalWater.toLocaleString()} L</span>
              <span className="text-xs text-slate-500 block mt-1">
                Water : Feed = <strong>{totalWaterFeedRatio}</strong>
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Mortality Sum (14d)</span>
              <span className={`text-xl font-extrabold block mt-1 font-sans ${totalMortality > 4 ? "text-rose-600" : "text-slate-800"}`}>
                {totalMortality} birds
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                {((totalMortality / (selectedBatch?.currentCount || 1)) * 100).toFixed(2)}% loss percent
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Egg Harvest (14d)</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1 font-sans">
                {selectedBatch?.purpose !== "Broilers" ? `${totalEggs.toLocaleString()} pcs` : "N/A"}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                {selectedBatch?.purpose !== "Broilers" 
                  ? `${Math.round(totalEggs / chartRecords.length)} eggs/day` 
                  : "Meat batch focus"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Climate Medians</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1 font-sans">{avgTemp}°C</span>
              <span className="text-xs text-slate-500 block mt-1">
                {avgHum}% Avg Humidity
              </span>
            </div>

          </div>

          {/* Warning banner if water consumption ratio is skewed */}
          {ratioAnomaly && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Intake Ratio Fluctuation Detected</h5>
                <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                  The computed Water-to-Feed ratio for this 14-day sequence is <strong>{totalWaterFeedRatio}</strong> (target is ~2.00 to 2.40). Severe drops indicate chilly weather, clogged nipple-drinkers, or early onset respiratory challenges. Immediate pen diagnostics is recommended.
                </p>
              </div>
            </div>
          )}

          {/* Graphics Split Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Panel 1: Feed Consumption Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Feed Consumption (kg/day)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">14-Day Timeline</span>
              </div>

              {/* Native SVG Line Chart */}
              <div className="w-full flex-1 min-h-[180px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingTop + plotHeight * ratio;
                    const gridVal = Math.round(maxFeed * (1 - ratio));
                    return (
                      <g key={index}>
                        <line 
                          x1={paddingLeft} 
                          y1={y} 
                          x2={width - paddingRight} 
                          y2={y} 
                          stroke="#e2e8f0" 
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text 
                          x={paddingLeft - 8} 
                          y={y + 4} 
                          fill="#94a3b8" 
                          fontSize="9" 
                          textAnchor="end"
                          className="font-mono font-medium"
                        >
                          {gridVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {chartRecords.length > 1 && (
                    <polygon
                      points={`
                        ${getX(0, chartRecords.length)},${paddingTop + plotHeight}
                        ${chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getFeedY(r.feedConsumption)}`).join(" ")}
                        ${getX(chartRecords.length - 1, chartRecords.length)},${paddingTop + plotHeight}
                      `}
                      fill="url(#feedGradient)"
                      opacity="0.15"
                    />
                  )}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="feedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Polyline line */}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    points={chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getFeedY(r.feedConsumption)}`).join(" ")}
                  />

                  {/* Data Node Points */}
                  {chartRecords.map((r, idx) => (
                    <circle
                      key={idx}
                      cx={getX(idx, chartRecords.length)}
                      cy={getFeedY(r.feedConsumption)}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#059669"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Horizontal Dates Label Axis */}
                  {chartRecords.map((r, idx) => {
                    if (idx % 2 !== 0 && idx !== chartRecords.length - 1) return null;
                    const dateObj = new Date(r.date);
                    const label = `${dateObj.getDate()} ${dateObj.toLocaleString("en-US", { month: "short" })}`;
                    return (
                      <text
                        key={idx}
                        x={getX(idx, chartRecords.length)}
                        y={height - 6}
                        fill="#94a3b8"
                        fontSize="8"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Panel 2: Egg Collection Curve */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Egg className="w-4 h-4 text-amber-500" />
                  Egg Production Yield (daily count)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Laying Efficiency</span>
              </div>

              <div className="w-full flex-1 min-h-[180px]">
                {selectedBatch?.purpose === "Broilers" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-dashed border border-slate-100 rounded-xl bg-slate-50/50">
                    <Layers className="w-8 h-8 text-slate-350 stroke-1" />
                    <p className="text-xs text-slate-500 mt-2">
                       This flock is registered as <strong>Broilers</strong> (meat production focus), so laying metrics are omitted.
                    </p>
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = paddingTop + plotHeight * ratio;
                      const gridVal = Math.round(minEgg + (maxEgg - minEgg) * (1 - ratio));
                      return (
                        <g key={index}>
                          <line 
                            x1={paddingLeft} 
                            y1={y} 
                            x2={width - paddingRight} 
                            y2={y} 
                            stroke="#e2e8f0" 
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text 
                            x={paddingLeft - 8} 
                            y={y + 4} 
                            fill="#94a3b8" 
                            fontSize="9" 
                            textAnchor="end"
                            className="font-mono font-medium"
                          >
                            {gridVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    {chartRecords.length > 1 && (
                      <polygon
                        points={`
                          ${getX(0, chartRecords.length)},${paddingTop + plotHeight}
                          ${chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getEggY(r.eggCollected || 0)}`).join(" ")}
                          ${getX(chartRecords.length - 1, chartRecords.length)},${paddingTop + plotHeight}
                        `}
                        fill="url(#eggGradient)"
                        opacity="0.1"
                      />
                    )}

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="eggGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Polyline line */}
                    <polyline
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      points={chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getEggY(r.eggCollected || 0)}`).join(" ")}
                    />

                    {/* Node points */}
                    {chartRecords.map((r, idx) => (
                      <circle
                        key={idx}
                        cx={getX(idx, chartRecords.length)}
                        cy={getEggY(r.eggCollected || 0)}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                    ))}

                    {/* Horizontal dates */}
                    {chartRecords.map((r, idx) => {
                      if (idx % 2 !== 0 && idx !== chartRecords.length - 1) return null;
                      const dateObj = new Date(r.date);
                      const label = `${dateObj.getDate()} ${dateObj.toLocaleString("en-US", { month: "short" })}`;
                      return (
                        <text
                          key={idx}
                          x={getX(idx, chartRecords.length)}
                          y={height - 6}
                          fill="#94a3b8"
                          fontSize="8"
                          fontWeight="semibold"
                          textAnchor="middle"
                        >
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Panel 3: Temperature Curves and Climate */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  House Climate Curve (°C)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Heat Distress Overlays</span>
              </div>

              <div className="w-full flex-1 min-h-[180px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                  {/* Danger bounds at 32 degrees */}
                  <line 
                    x1={paddingLeft} 
                    y1={getTempY(32)} 
                    x2={width - paddingRight} 
                    y2={getTempY(32)} 
                    stroke="#f43f5e" 
                    strokeDasharray="4 2"
                    strokeWidth="1.5"
                  />
                  <text 
                    x={width - paddingRight - 10} 
                    y={getTempY(32) - 5} 
                    fill="#be123c" 
                    fontSize="7" 
                    fontWeight="bold" 
                    textAnchor="end"
                  >
                    🔥 HEAT STRESS THRESHOLD (32°C)
                  </text>

                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingTop + plotHeight * ratio;
                    const gridVal = Math.round(minTemp + (maxTemp - minTemp) * (1 - ratio));
                    return (
                      <g key={index}>
                        <text 
                          x={paddingLeft - 8} 
                          y={y + 4} 
                          fill="#94a3b8" 
                          fontSize="9" 
                          textAnchor="end"
                          className="font-mono font-medium"
                        >
                          {gridVal}°Cc
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {chartRecords.length > 1 && (
                    <polygon
                      points={`
                        ${getX(0, chartRecords.length)},${paddingTop + plotHeight}
                        ${chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getTempY(r.avgTemperature || 28)}`).join(" ")}
                        ${getX(chartRecords.length - 1, chartRecords.length)},${paddingTop + plotHeight}
                      `}
                      fill="url(#tempGradient)"
                      opacity="0.12"
                    />
                  )}

                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Polyline line */}
                  <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    points={chartRecords.map((r, idx) => `${getX(idx, chartRecords.length)},${getTempY(r.avgTemperature || 28)}`).join(" ")}
                  />

                  {/* Node points */}
                  {chartRecords.map((r, idx) => (
                    <circle
                      key={idx}
                      cx={getX(idx, chartRecords.length)}
                      cy={getTempY(r.avgTemperature || 28)}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#dc2626"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Horizontal dates */}
                  {chartRecords.map((r, idx) => {
                    if (idx % 2 !== 0 && idx !== chartRecords.length - 1) return null;
                    const dateObj = new Date(r.date);
                    const label = `${dateObj.getDate()} ${dateObj.toLocaleString("en-US", { month: "short" })}`;
                    return (
                      <text
                        key={idx}
                        x={getX(idx, chartRecords.length)}
                        y={height - 6}
                        fill="#94a3b8"
                        fontSize="8"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Panel 4: Mortality & Losses (Biosecurity view) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Daily Losses / Mortality Count (birds)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Mortality Check</span>
              </div>

              {/* Bar plot for daily loss count */}
              <div className="w-full flex-1 min-h-[180px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                  {/* Grid lines */}
                  {[0, 2, 4, 6].map((num, idx) => {
                    // map y proportional to 6 max
                    const y = paddingTop + plotHeight - (num / 6) * plotHeight;
                    return (
                      <g key={idx}>
                        <line 
                          x1={paddingLeft} 
                          y1={y} 
                          x2={width - paddingRight} 
                          y2={y} 
                          stroke="#f1f5f9" 
                          strokeWidth="1.5"
                        />
                        <text 
                          x={paddingLeft - 8} 
                          y={y + 3} 
                          fill="#94a3b8" 
                          fontSize="9" 
                          textAnchor="end"
                          className="font-mono"
                        >
                          {num}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render thin elegant bars */}
                  {chartRecords.map((r, idx) => {
                    const barWidth = 14;
                    const val = r.mortality || 0;
                    const x = getX(idx, chartRecords.length) - barWidth / 2;
                    // scale bar height up to max of 6
                    const barH = (Math.min(val, 6) / 6) * plotHeight;
                    const y = paddingTop + plotHeight - barH;

                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(barH, 1)} // minimal lines for 0 is skipped or is small point
                          rx="4"
                          fill={val > 2 ? "#e11d48" : val > 0 ? "#fda4af" : "#f1f5f9"}
                        />
                        {val > 0 && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 4}
                            fontSize="8"
                            fontWeight="bold"
                            fill={val > 2 ? "#be123c" : "#9f1239"}
                            textAnchor="middle"
                          >
                            {val}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Horizontal dates */}
                  {chartRecords.map((r, idx) => {
                    if (idx % 2 !== 0 && idx !== chartRecords.length - 1) return null;
                    const dateObj = new Date(r.date);
                    const label = `${dateObj.getDate()} ${dateObj.toLocaleString("en-US", { month: "short" })}`;
                    return (
                      <text
                        key={idx}
                        x={getX(idx, chartRecords.length)}
                        y={height - 6}
                        fill="#94a3b8"
                        fontSize="8"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
