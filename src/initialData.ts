import { FlockBatch, DailyRecord, InventoryItem, InventoryAdjustment } from "./types";

export const initialBatches: FlockBatch[] = [
  {
    id: "batch-layer-01",
    name: "Isa Brown Layers - Pen 2",
    breed: "Isa Brown",
    purpose: "Layers",
    initialCount: 1000,
    currentCount: 982,
    arrivalDate: "2026-01-10",
    ageWeeksAtArrival: 18, // came as point-of-lay pullets
    status: "Active",
    notes: "High-grade layers doing well. Premium feeds applied.",
  },
  {
    id: "batch-broiler-02",
    name: "Cobb 500 Broilers - Pen 5",
    breed: "Cobb 500",
    purpose: "Broilers",
    initialCount: 500,
    currentCount: 494,
    arrivalDate: "2026-04-15",
    ageWeeksAtArrival: 0, // day-old chicks
    status: "Active",
    notes: "Rapid growth target, feed conversion ratio optimization.",
  },
];

// Generate 15 days of historical data for Layers (May 7th to May 21st, 2026)
// Generate 15 days of historical data for Broilers (May 7th to May 21st, 2026)
export const generateInitialRecords = (): DailyRecord[] => {
  const records: DailyRecord[] = [];
  const layerBatchId = "batch-layer-01";
  const broilerBatchId = "batch-broiler-02";

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    // Layers Record
    // Typically, 982 layers eat about 110-120kg layer mash daily.
    // Water ratio is about 2-2.5x feed.
    // Egg production is around 82-87% (800-850 eggs).
    const lFeed = Math.round(112 + Math.sin(i * 0.5) * 4);
    const lWater = Math.round(230 + Math.cos(i * 0.5) * 10);
    const lEggs = Math.round(810 + Math.sin(i * 0.7) * 30);
    const lCracked = Math.round(8 + Math.cos(i * 0.4) * 4);
    // Add 1-2 mortality events, or 0. On Day -6, let's create a mild heat distress spike (mortality = 4)
    let lMortality = 0;
    let lSymptoms: string[] = [];
    let lNotes = "Normal activity.";

    if (i === 6) {
      lMortality = 4;
      lSymptoms = ["Ruffled feathers", "Gasping for breath", "Lethargy"];
      lNotes = "High noon temperatures. Installed additional fans and served vitamin C electrolytes.";
    } else if (i % 5 === 0) {
      lMortality = 1;
    }

    records.push({
      id: `rec-l-${dateStr}`,
      batchId: layerBatchId,
      date: dateStr,
      feedConsumption: lFeed,
      waterConsumption: lWater,
      mortality: lMortality,
      eggCollected: lEggs,
      crackedEggs: lCracked,
      avgTemperature: Math.round(28 + Math.sin(i * 0.3) * 3),
      avgHumidity: Math.round(65 + Math.cos(i * 0.3) * 8),
      notes: lNotes,
      symptoms: lSymptoms,
    });

    // Broilers Record
    // Broilers (494 birds, week 3 to week 5) eat about 60-90kg starter/finisher.
    const bFeed = Math.round(62 + (14 - i) * 2.5 + Math.sin(i * 0.5) * 3);
    const bWater = Math.round(bFeed * 2.1);
    let bMortality = 0;
    let bSymptoms: string[] = [];
    let bNotes = "Fast growth observed.";

    if (i === 11) {
      bMortality = 3;
      bSymptoms = ["Watery diarrhea"];
      bNotes = "Slight wet litter. Cleaned Pen 5 and changed wood shavings.";
    } else if (i === 2) {
      bSymptoms = ["Coughing or sneezing"];
      bNotes = "Slight dust from feed, sprayed minimal water mist.";
    }

    records.push({
      id: `rec-b-${dateStr}`,
      batchId: broilerBatchId,
      date: dateStr,
      feedConsumption: bFeed,
      waterConsumption: bWater,
      mortality: bMortality,
      avgTemperature: Math.round(31 - (14 - i) * 0.2 + Math.sin(i * 0.4) * 1),
      avgHumidity: Math.round(60 + Math.sin(i * 0.5) * 4),
      notes: bNotes,
      symptoms: bSymptoms,
    });
  }

  return records;
};

export const initialInventoryItems: InventoryItem[] = [
  {
    id: "inv-feed-01",
    name: "Premium Layer Mash",
    category: "Feed",
    quantity: 1850,
    unit: "kg",
    reorderPoint: 500,
    notes: "High-protein formulated mash for Point-of-Lay birds.",
  },
  {
    id: "inv-feed-02",
    name: "Broiler Starter Crumble",
    category: "Feed",
    quantity: 1200,
    unit: "kg",
    reorderPoint: 400,
    notes: "Fast growth booster feed for Cobb 500/Ross 308 chicks.",
  },
  {
    id: "inv-med-01",
    name: "Amprolium 20% Soluble Powder",
    category: "Medication",
    quantity: 12,
    unit: "vials",
    reorderPoint: 15,
    notes: "Anticoccidial medication for wet litter symptom treatment.",
  },
  {
    id: "inv-vac-01",
    name: "Newcastle Lasota Vaccine",
    category: "Vaccine",
    quantity: 4,
    unit: "vials",
    reorderPoint: 5,
    notes: "Store at 2-8°C. One vial handles up to 1,000 birds.",
  },
  {
    id: "inv-dis-01",
    name: "Virkon-S Biosecurity Sanitizer",
    category: "Disinfectant",
    quantity: 35,
    unit: "liters",
    reorderPoint: 10,
    notes: "For boot dips and sprayer pumps overall sanitation.",
  },
  {
    id: "inv-bed-01",
    name: "Wood Shavings / Soft Bedding",
    category: "Other",
    quantity: 45,
    unit: "bags",
    reorderPoint: 20,
    notes: "Dry bedding maintenance to minimize Gumboro and ammonia buildup.",
  }
];

export const initialInventoryAdjustments: InventoryAdjustment[] = [
  {
    id: "adj-01",
    itemId: "inv-feed-01",
    type: "Add",
    quantity: 2000,
    date: "2026-05-10",
    reason: "Bulk supplier replenish from Tema Mill"
  },
  {
    id: "adj-02",
    itemId: "inv-feed-01",
    type: "Remove",
    quantity: 150,
    date: "2026-05-18",
    reason: "Standard weekly ration deduction"
  }
];
