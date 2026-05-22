import { FlockBatch } from "../types";

export interface AgeDetails {
  totalDays: number;
  weeks: number;
  extraDays: number;
  formatted: string;
}

/**
 * Returns today's date formatted as local YYYY-MM-DD
 */
export const getLocalYYYYMMDD = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface Advisory {
  type: "Clear Water" | "Vitamin" | "Vaccine" | "Debeaking" | "Dewormer";
  title: string;
  instructions: string;
  details: string;
  badgeColor: string;
}

/**
 * Calculates total age in days, weeks and d format
 */
export const calculateAgeDetails = (b: FlockBatch): AgeDetails => {
  const today = new Date();
  const todayStr = getLocalYYYYMMDD(today);
  
  let diffDays = 0;
  if (b.arrivalDate !== todayStr) {
    // Calculate difference in days using UTC components of local dates to completely eliminate DST shifts or timezone rounding errors.
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    
    const parts = b.arrivalDate.split("-");
    const arrivalUTC = Date.UTC(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    
    const diffTime = todayUTC - arrivalUTC;
    diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }
  
  const unit = b.ageAtArrivalUnit || "weeks";
  const val = b.ageAtArrivalValue !== undefined ? b.ageAtArrivalValue : b.ageWeeksAtArrival;
  
  const baseDays = unit === "days" ? val : val * 7;
  const totalDays = baseDays + diffDays;
  
  const weeks = Math.floor(totalDays / 7);
  const extraDays = totalDays % 7;
  
  // Consistently format age in weeks and days to perfectly match the composite "Age at Arrival" input fields.
  const formatted = `${weeks} wk${weeks !== 1 ? "s" : ""}${extraDays > 0 ? ` ${extraDays} d` : " 0 d"}`;
  
  return {
    totalDays,
    weeks,
    extraDays,
    formatted
  };
};

/**
 * Returns dynamic veterinary, water/vaccination, and debeaking advice depending on flock day age
 */
export const getPoultryAdvisory = (purpose: "Layers" | "Broilers" | "Dual-Purpose", totalDays: number): Advisory => {
  const isBroiler = purpose === "Broilers";

  // 1. Debeaking Special Windows (Usually Day 63-70 / Weeks 9-10 for future egg layers/dual-purpose)
  if (!isBroiler && totalDays >= 63 && totalDays <= 70) {
    return {
      type: "Debeaking",
      title: "✂️ Debeaking (Beak Trimming) Window",
      instructions: "Debeak pullets to prevent future feather pecking, cannibalism, and egg eating.",
      details: "CRITICAL: Administer Vitamin K with electrolytes in their water 2 days before and 2 days after trimming to reduce bleeding risk and ease flock stress.",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }

  // 2. Initial Day Anti-Stress
  if (totalDays === 1) {
    return {
      type: "Vitamin",
      title: "💧 Arrival Anti-Stress Hydration",
      instructions: "Add recovery multivitamins and Glucose (sugar) to room-temperature water.",
      details: "Transit drains energy. Rehydration with energy-rich sugars triggers gut pathways and stimulates immediate feed hunting.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 3. Early Brooding Support (Day 2-5)
  if (totalDays >= 2 && totalDays <= 5) {
    return {
      type: "Vitamin",
      title: "💊 Vitality Starter Vitamins",
      instructions: "Supplement morning waterers with standard Chick Starter Multivitamins.",
      details: "Accelerates cell division, bone structure extension, and yolk sac absorption. Clean waterers twice daily.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 4. Washout Phase (Day 6-7)
  if (totalDays === 6 || totalDays === 7) {
    return {
      type: "Clear Water",
      title: "🌊 Pure Clear Washout Water",
      instructions: "Serve zero-additive, fresh clear drinking water.",
      details: "Cleanses liver and kidneys of starter vitamin loads, priming the immune system for tomorrow's vaccine receipt.",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200"
    };
  }

  // 5. Day 8 Vaccine (IBD / Gumboro)
  if (totalDays === 8) {
    return {
      type: "Vaccine",
      title: "💉 1st Gumboro (IBD) Vaccine",
      instructions: "Administer 1st Gumboro Vaccine via clean drinking water.",
      details: "Mix vaccine in cool, chlorine-free water. Withdraw normal water for 1.5 hours beforehand so birds drink rapidly within 2 hours.",
      badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
    };
  }

  // 6. Day 9-10 Anti-Stress Support
  if (totalDays === 9 || totalDays === 10) {
    return {
      type: "Vitamin",
      title: "💊 Post-Vaccination Recovery Vitamins",
      instructions: "Supplement water with multivitamins for 48 hours.",
      details: "Counteracts vaccine-related stress and improves the bird's antibody generation index.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 7. Days 11-13 Clear Water
  if (totalDays >= 11 && totalDays <= 13) {
    return {
      type: "Clear Water",
      title: "🌊 Clean Hydration",
      instructions: "Serve clear, unsupplemented, cool drinking water.",
      details: "Encourates active gut microbes and maintains natural temperature homeostasis dynamically.",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200"
    };
  }

  // 8. Day 14 ND Vaccine (Newcastle Disease Lasota)
  if (totalDays === 14) {
    return {
      type: "Vaccine",
      title: "💉 1st Newcastle (ND Lasota) Vaccine",
      instructions: "Serve ND Lasota Vaccine in cool, chlorine-free water.",
      details: "Deteriorates in warmth. Stir vaccine in iced water or use skimmed milk powder as a stabilizer. Protect from light.",
      badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
    };
  }

  // 9. Day 15-16 Post Vaccine Support
  if (totalDays === 15 || totalDays === 16) {
    return {
      type: "Vitamin",
      title: "💊 Post-Newcastle Stress Support",
      instructions: "Provide active water vitamins to boost Newcastle antibody conversion.",
      details: "Maintains high systemic stamina as the birds convert vaccine compounds into full respiratory immunity.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // Broiler-specific high-growth schedule (Short lifecycle)
  if (isBroiler) {
    if (totalDays === 21) {
      return {
        type: "Vaccine",
        title: "💉 2nd Gumboro Vaccine (Booster)",
        instructions: "Serve Broiler Gumboro booster in fresh drinking water.",
        details: "Shields rapid muscular growth from high mortality bursal outbreak patterns.",
        badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
      };
    }
    if (totalDays === 22 || totalDays === 23) {
      return {
        type: "Vitamin",
        title: "💊 Metabo-Growth Vitamins",
        instructions: "Serve concentrated vitamins with high calcium/phosphorus support.",
        details: "Assists heavy broiler frames in holding rapid muscle gains and avoids early leg weakness.",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
      };
    }
    if (totalDays === 28) {
      return {
        type: "Vaccine",
        title: "💉 Newcastle Booster Dose",
        instructions: "Administer the final Newcastle booster strain.",
        details: "Critical defense for shipping weights during harvest season variables.",
        badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
      };
    }
    if (totalDays >= 35) {
      return {
        type: "Clear Water",
        title: "🌊 Pre-Harvest Clearance Water",
        instructions: "Serve absolutely pure clear water with zero chemicals or drugs.",
        details: "Withdraw all veterinary additives to assure clean, residue-free meat for marketing channels.",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
      };
    }
  } else {
    // Layer/Dual Purpose specific timelines (Long lifecycle)
    if (totalDays === 21) {
      return {
        type: "Vaccine",
        title: "💉 Gumboro (2nd Booster)",
        instructions: "Provide secondary Gumboro booster protection.",
        details: "Ensures complete structural immunity block in long-lived pullets.",
        badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
      };
    }
    if (totalDays === 22 || totalDays === 23) {
      return {
        type: "Vitamin",
        title: "💊 Pullet Skeletal Vitamins",
        instructions: "Serve multivitamin preparations high in Vitamin D3.",
        details: "Skeletal length determines future egg shell storage capacity. Ensure strong bone framework.",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
      };
    }
    if (totalDays === 28) {
      return {
        type: "Vaccine",
        title: "💉 Newcastle Booster ND Lasota",
        instructions: "Administer Newcastle Booster in morning drinking cups.",
        details: "Restores strong circulating antibodies as the immune system matures.",
        badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
      };
    }
    if (totalDays >= 35 && totalDays <= 42) {
      return {
        type: "Dewormer",
        title: "🐛 Coccidiosis Preventive Care",
        instructions: "Administer de-wormers or anti-coccidials in feed or water.",
        details: "Keeps intestinal lining pristine to absorb optimal calcium reserves prior to layout.",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-200"
      };
    }
    if (totalDays === 112) {
      return {
        type: "Dewormer",
        title: "🐛 Point-of-Lay Dewormer Boost",
        instructions: "Serve safe Piperazine or Levamisole dewormers prior to egg initiation.",
        details: "Clearing internal worms prevents early egg size deficiencies. Avoid deworming during core lay cycles.",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-200"
      };
    }
    if (totalDays === 126) {
      return {
        type: "Vaccine",
        title: "💉 Newcastle + EDS Combined Injection",
        instructions: "Deliver intramuscular Newcastle + Egg Drop Syndrome (EDS) oil injection.",
        details: "Protects flock for 12 months from sudden drops in laying efficiency.",
        badgeColor: "bg-violet-100 text-violet-800 border-violet-200"
      };
    }
    if (totalDays >= 140) {
      return {
        type: "Clear Water",
        title: "🥚 Active Laying Clear Water",
        instructions: "Serve clear, unmedicated water. Ensure high-calcium grit availability in feed.",
        details: "Egg whites are 90% water. Continuous, fresh water flow supports peak laying performance. Add electrolytes dynamically if ambient temperature climbs higher.",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
      };
    }
  }

  // 10. Fallback cyclical routine for general active weeks
  const cycleDay = totalDays % 7;
  if (cycleDay === 0 || cycleDay === 3 || cycleDay === 5) {
    return {
      type: "Clear Water",
      title: "🌊 Fresh Clear Water",
      instructions: "Refresh drinker lines with clean, unmedicated cooling water.",
      details: "Restores natural pH in the bird's craw, flushing sediment from pipe lines.",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200"
    };
  } else {
    return {
      type: "Vitamin",
      title: "💊 Maintenance Multivitamins",
      instructions: "Serve supportive water vitamins.",
      details: "Protects birds against ambient temperature swings or feed conversion strain.",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }
};
