export interface FlockBatch {
  id: string;
  name: string;
  breed: string;
  purpose: "Layers" | "Broilers" | "Dual-Purpose";
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageWeeksAtArrival: number;
  ageAtArrivalUnit?: "days" | "weeks";
  ageAtArrivalValue?: number;
  status: "Active" | "Sold" | "Closed";
  notes?: string;
}

export interface DailyRecord {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  feedConsumption: number; // in kg
  waterConsumption: number; // in Liters
  mortality: number; // number of dead birds
  eggCollected?: number; // relevant for layers/dual-purpose
  crackedEggs?: number; // relevant for layers/dual-purpose
  avgTemperature?: number; // in °C
  avgHumidity?: number; // in %
  notes?: string;
  symptoms: string[]; // symptoms observed on this day
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Feed" | "Medication" | "Vaccine" | "Disinfectant" | "Equipment" | "Other";
  quantity: number;
  unit: string;
  reorderPoint: number;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  itemId: string;
  type: "Add" | "Remove";
  quantity: number;
  date: string; // YYYY-MM-DD
  reason: string;
}

export type ActiveTab = "dashboard" | "batches" | "logging" | "analytics" | "chatbot" | "inventory";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "vaccine" | "medical";
  timestamp: string;
  read: boolean;
  batchId?: string;
}

