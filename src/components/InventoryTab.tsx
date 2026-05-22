import React, { useState } from "react";
import { InventoryItem, InventoryAdjustment } from "../types";
import { getLocalYYYYMMDD } from "../utils/poultryHelpers";
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  Archive, 
  Search, 
  Filter, 
  History, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  MinusCircle, 
  PlusCircle, 
  FileText, 
  FolderPlus, 
  TrendingDown, 
  AlertCircle,
  X,
  Sparkles
} from "lucide-react";

interface InventoryTabProps {
  items: InventoryItem[];
  adjustments: InventoryAdjustment[];
  onAddItem: (item: Omit<InventoryItem, "id">) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddAdjustment: (adj: Omit<InventoryAdjustment, "id">) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  adjustments,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddAdjustment
}) => {
  // Tabs for Inventory Sub-Views
  const [subTab, setSubTab] = useState<"items" | "history">("items");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // State for Add Item Form Modal/drawer
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Feed" as InventoryItem["category"],
    quantity: 0,
    unit: "kg",
    reorderPoint: 50,
    notes: ""
  });

  // State for Adjustment Drawer/Modal
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustData, setAdjustData] = useState({
    type: "Remove" as "Add" | "Remove",
    quantity: 0,
    reason: ""
  });

  // State for Editing Item Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reorder point alert filters
  const alertItems = items.filter(item => item.quantity <= item.reorderPoint);

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    onAddItem({
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      unit: newItem.unit || "units",
      reorderPoint: Number(newItem.reorderPoint),
      notes: newItem.notes
    });

    // Reset Form
    setNewItem({
      name: "",
      category: "Feed",
      quantity: 0,
      unit: "kg",
      reorderPoint: 50,
      notes: ""
    });
    setShowAddForm(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || adjustData.quantity <= 0) return;

    onAddAdjustment({
      itemId: adjustingItem.id,
      type: adjustData.type,
      quantity: Number(adjustData.quantity),
      date: getLocalYYYYMMDD(),
      reason: adjustData.reason || (adjustData.type === "Add" ? "Manual Restock" : "Standard Consumption")
    });

    setAdjustingItem(null);
    setAdjustData({
      type: "Remove",
      quantity: 0,
      reason: ""
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  // Helper: category pill style classes
  const getCategoryTheme = (cat: InventoryItem["category"]) => {
    switch(cat) {
      case "Feed": return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Medication": return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Vaccine": return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "Disinfectant": return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Equipment": return "bg-purple-50 text-purple-700 border-purple-200/60";
      default: return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  // Helper: Status label classes based on current amount vs threshold
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { 
        label: "Out of Stock", 
        badge: "bg-rose-100 text-rose-700 border-rose-200", 
        color: "text-rose-600",
        bg: "bg-rose-500"
      };
    }
    if (item.quantity <= item.reorderPoint) {
      return { 
        label: "Low Stock", 
        badge: "bg-amber-100 text-amber-700 border-amber-200", 
        color: "text-amber-600",
        bg: "bg-amber-500"
      };
    }
    return { 
      label: "Healthy", 
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200", 
      color: "text-emerald-700",
      bg: "bg-emerald-500"
    };
  };

  return (
    <div id="inventory-tab-view" className="space-y-6">
      
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Inventory & Supply Chain Manager
          </h2>
          <p className="text-sm text-slate-500">Track feeds, medical vaccines, and house disinfectants to prevent supply stockouts in real time.</p>
        </div>

        {/* Action Toggle Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSubTab(subTab === "items" ? "history" : "items");
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold duration-150 shadow-xs"
          >
            {subTab === "items" ? (
              <>
                <History className="w-4 h-4" />
                Audits & Log Timeline
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                View Stock Ledger
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-xs text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl transition-all font-bold shadow-xs cursor-pointer duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Stock Item
          </button>
        </div>
      </div>

      {/* Critical Reorder Alerts Panel */}
      {alertItems.length > 0 && subTab === "items" && (
        <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 min-h-[20px]">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Critical Inventory Alerts ({alertItems.length})</h4>
              <p className="text-[11px] text-rose-900/80">These items have fallen below safety thresholds. Restock immediately to maintain poultry nutrition and house biosecurity.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {alertItems.map(item => (
              <div key={item.id} className="bg-white/90 border border-rose-200/70 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block truncate max-w-[130px]">{item.name}</span>
                  <span className="text-[10px] text-rose-600 font-bold">Qty: {item.quantity} {item.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Min req</span>
                  <span className="font-mono text-xs font-semibold text-slate-600">{item.reorderPoint} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tabs Toggle Controller */}
      {subTab === "items" ? (
        <div className="space-y-5">
          
          {/* Filtering Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xs border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search supplies by name, usage, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Category:
              </span>
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 select-none">
                {["All", "Feed", "Medication", "Vaccine", "Disinfectant", "Equipment", "Other"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Stocks Ledger Grid */}
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl">
              <Archive className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h4 className="font-bold text-slate-700 mt-3">No stock items match filter criteria</h4>
              <p className="text-slate-500 text-xs px-4 mt-1">Try resetting your search query or directory filter to find items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                // Compute visual stock bar percentage (scaled relative to reorder point safety multiplier e.g. 5x)
                const upperLimit = Math.max(item.reorderPoint * 4, 100);
                const progressPercent = Math.min(Math.round((item.quantity / upperLimit) * 100), 100);

                return (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all duration-150"
                  >
                    
                    {/* Upper segment */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryTheme(item.category)}`}>
                          {item.category}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-2">
                        <h4 className="font-extrabold text-slate-900 text-sm font-sans truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 min-h-[32px] leading-relaxed">
                          {item.notes || "No extra descriptions or supplier logs documented."}
                        </p>
                      </div>

                      {/* Visual Progress percentage */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">STOCK LEVEL STATUS</span>
                          <span className={status.color}>{progressPercent}% relative limit</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${status.bg}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Quantum count block */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50 text-xs">
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Available In Pen</span>
                          <span className="font-mono text-sm font-extrabold text-slate-800">
                            {item.quantity.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Min Safety Alert</span>
                          <span className="font-mono text-sm font-semibold text-slate-600">
                            {item.reorderPoint.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">{item.unit}</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Footer Actions buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                      
                      {/* Adjust Stock Trigger */}
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustData({
                            type: "Remove",
                            quantity: 0,
                            reason: ""
                          });
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] text-emerald-700 hover:bg-emerald-50 border border-emerald-200/70 p-2 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        Log Usage / Refill
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => setEditingItem(item)}
                        title="Edit Item Details"
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer hover:text-slate-900"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="Delete supply ledger item"
                        className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* Adjustments Logs Sub-view */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-secondary bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm font-sans flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                Supply Audit Timeline & Logs
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Chronological record of stock entries, manual overrides, and feed scale reductions.</p>
            </div>
          </div>

          {adjustments.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-xs mt-2">No adjustment entries on file. Adjust any stock item to build logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="px-5 py-3.5">Log Date</th>
                    <th className="px-5 py-3.5">Stock Item Name</th>
                    <th className="px-5 py-3.5">Action Status</th>
                    <th className="px-5 py-3.5 text-right">Qty Delta</th>
                    <th className="px-5 py-3.5">Adjustment Purpose / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustments.slice().reverse().map((adj) => {
                    const matchedItem = items.find(item => item.id === adj.itemId);
                    const isAdd = adj.type === "Add";
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/50 transition-all font-medium">
                        <td className="px-5 py-3 font-mono text-slate-500">{adj.date}</td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {matchedItem ? matchedItem.name : "Unregistered Item"}
                          </span>
                          <span className="text-[10px] text-slate-400">{matchedItem?.category}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isAdd 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {isAdd ? "Restock / Add" : "Deduction / Use"}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-right font-mono font-bold text-xs ${isAdd ? "text-emerald-600" : "text-rose-600"}`}>
                          {isAdd ? "+" : "-"}{adj.quantity} {matchedItem?.unit || ""}
                        </td>
                        <td className="px-5 py-3 text-slate-500 italic max-w-sm truncate" title={adj.reason}>
                          {adj.reason || "Manual override or systemic ration audit."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD SUPPLY ITEM */}
      {showAddForm && (
        <div id="add-inventory-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Register Stock Supply</h3>
            </div>
            <p className="text-slate-500 text-xs mt-1">Specify initial counts and safe buffer volumes for newly procured supply items.</p>

            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Supply Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grower Mash Premium, Amprolium Powder"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1 cursor-pointer"
                  >
                    <option value="Feed">Feed</option>
                    <option value="Medication">Medication</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Disinfectant">Disinfectant</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kg, vials, bags, L"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Starting Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="250"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Reorder Alert Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={newItem.reorderPoint}
                    onChange={(e) => setNewItem({ ...newItem, reorderPoint: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Supply Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional supplier details, dosage formulas, storage instructions..."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  Save Stock Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK / USAGE REGISTRATION */}
      {adjustingItem && (
        <div id="adjust-stock-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setAdjustingItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold bg-slate-100 border text-slate-600 rounded-sm px-2 py-0.5 uppercase tracking-wider">
                {adjustingItem.category}
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-1.5 font-sans">
                Adjust Stock Level: <span className="text-emerald-700">{adjustingItem.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Current local count: <strong className="font-mono text-slate-800">{adjustingItem.quantity} {adjustingItem.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-1">
              
              {/* Type Switch Button grid */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Adjustment ActionType</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: "Remove" })}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustData.type === "Remove"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-500"
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    Log Usage / Consumption
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustData({ ...adjustData, type: "Add" })}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      adjustData.type === "Add"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-500"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Supply Restock
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Amount ({adjustingItem.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50"
                  value={adjustData.quantity || ""}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Detailed Reason / Comments *
                </label>
                <input
                  type="text"
                  required
                  placeholder={adjustData.type === "Remove" ? "e.g. Ration for layer pen 2" : "e.g. Procured from extension office"}
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustData.quantity <= 0}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center"
                >
                  Approve Adjustment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STOCK ITEM DETAILS */}
      {editingItem && (
        <div id="edit-inventory-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Edit supply Record</h3>
            </div>
            <p className="text-slate-500 text-xs mt-1">Modify registered parameters, thresholds, and annotations.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Supply Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Category *</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1 cursor-pointer"
                  >
                    <option value="Feed">Feed</option>
                    <option value="Medication">Medication</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Disinfectant">Disinfectant</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">In-Stock Quantity </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Reorder threshold </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.reorderPoint}
                    onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Supply Notes</label>
                <textarea
                  rows={2}
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white mt-1 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
