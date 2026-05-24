import React, { useState, useEffect, useRef } from "react";
import { FlockBatch, DailyRecord, ChatMessage, ActiveTab, InventoryItem, InventoryAdjustment, NotificationItem } from "./types";
import { initialBatches, generateInitialRecords, initialInventoryItems, initialInventoryAdjustments } from "./initialData";
import { calculateAgeDetails, getLocalYYYYMMDD } from "./utils/poultryHelpers";
import { DashboardTab } from "./components/DashboardTab";
import { FlockIntelLogo } from "./components/FlockIntelLogo";
import { BatchesTab } from "./components/BatchesTab";
import { LoggingTab } from "./components/LoggingTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ChatbotTab } from "./components/ChatbotTab";
import { InventoryTab } from "./components/InventoryTab";
import { 
  Plus, 
  Activity, 
  Layers, 
  ClipboardCheck, 
  BarChart3, 
  HeartPulse, 
  AlertTriangle, 
  Menu, 
  X, 
  Sparkles,
  RefreshCw,
  Clock,
  Egg,
  Package,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Play,
  Bell,
  BellRing,
  Check,
  Sun,
  Moon
} from "lucide-react";

export default function App() {
  // Onboarding & Guided Tour state
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() => {
    const cached = localStorage.getItem("poultry_has_onboarded_v4");
    return cached ? JSON.parse(cached) : false;
  });
  const [tourStep, setTourStep] = useState<number>(0);
  const [showTourOnly, setShowTourOnly] = useState<boolean>(false);
  const [prefMode, setPrefMode] = useState<"demo" | "clean">("demo");

  // Demo Mode active state flag
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("poultry_is_demo_mode") === "true";
  });

  // State: Load from localstorage or use initial
  const [batches, setBatches] = useState<FlockBatch[]>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_batches" : "poultry_batches");
    const onboarded = localStorage.getItem("poultry_has_onboarded_v4");
    if (onboarded && JSON.parse(onboarded)) {
      return cached ? JSON.parse(cached) : [];
    }
    return cached ? JSON.parse(cached) : (isDemo ? initialBatches : []);
  });

  const [records, setRecords] = useState<DailyRecord[]>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_records" : "poultry_records");
    const onboarded = localStorage.getItem("poultry_has_onboarded_v4");
    if (onboarded && JSON.parse(onboarded)) {
      return cached ? JSON.parse(cached) : [];
    }
    return cached ? JSON.parse(cached) : (isDemo ? generateInitialRecords() : []);
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_chat" : "poultry_chat");
    return cached ? JSON.parse(cached) : [];
  });

  const [siloLevel, setSiloLevel] = useState<number>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_silo" : "poultry_silo");
    if (cached) return parseFloat(cached);
    return isDemo ? 3750 : 5000;
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_inventory_items" : "poultry_inventory_items");
    return cached ? JSON.parse(cached) : (isDemo ? initialInventoryItems : []);
  });

  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>(() => {
    const isDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isDemo ? "poultry_demo_inventory_adjustments" : "poultry_inventory_adjustments");
    return cached ? JSON.parse(cached) : (isDemo ? initialInventoryAdjustments : []);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [prefilledChatText, setPrefilledChatText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const cached = localStorage.getItem("poultry_dark_mode");
    return cached ? JSON.parse(cached) : false;
  });

  useEffect(() => {
    localStorage.setItem("poultry_dark_mode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Notifications State & Sync
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState<boolean>(true);
  const [pendingDeleteNotifId, setPendingDeleteNotifId] = useState<string | null>(null);
  const [showClearAllNotifsConfirm, setShowClearAllNotifsConfirm] = useState<boolean>(false);
  const [showResetAppConfirm, setShowResetAppConfirm] = useState<boolean>(false);

  // Close notification dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const isReadyDemo = localStorage.getItem("poultry_is_demo_mode") === "true";
    const cached = localStorage.getItem(isReadyDemo ? "poultry_demo_notifications" : "poultry_notifications");
    if (cached) return JSON.parse(cached);
    if (isReadyDemo) {
      return [
        {
          id: "notif-demo-welcome",
          title: "🚀 Welcome to FlockIntel Demo Sandbox",
          message: "You are currently exploring in Sandbox Demo Mode with simulation data. Feel free to log test variables or query the AI assistant.",
          type: "success" as const,
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: "notif-demo-safety",
          title: "⚠️ High Temperature Advisory (Demo Mode)",
          message: "Sensors in Pen 2 logged 31.4°C. Maintain standard fan ventilation and cool water line flushes.",
          type: "warning" as const,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        }
      ];
    }
    return [
      {
        id: "notif-welcome",
        title: "👋 Welcome to FlockIntel",
        message: "Your state-of-the-art poultry automation hub. Create batches with customized day-count settings to receive customized veterinary guidelines.",
        type: "success" as const,
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  });

  // Auto-dismiss the sound notification prompt after 30 seconds count-down when notifications are open
  useEffect(() => {
    if (showNotifications && showSoundPrompt) {
      const timer = setTimeout(() => {
        setShowSoundPrompt(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [showNotifications, showSoundPrompt]);

  // Auto-sync state to localStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_batches", JSON.stringify(batches));
    } else {
      localStorage.setItem("poultry_batches", JSON.stringify(batches));
    }
  }, [batches, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_notifications", JSON.stringify(notifications));
    } else {
      localStorage.setItem("poultry_notifications", JSON.stringify(notifications));
    }
  }, [notifications, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_records", JSON.stringify(records));
    } else {
      localStorage.setItem("poultry_records", JSON.stringify(records));
    }
  }, [records, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_chat", JSON.stringify(chatMessages));
    } else {
      localStorage.setItem("poultry_chat", JSON.stringify(chatMessages));
    }
  }, [chatMessages, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_silo", siloLevel.toString());
    } else {
      localStorage.setItem("poultry_silo", siloLevel.toString());
    }
  }, [siloLevel, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_inventory_items", JSON.stringify(inventoryItems));
    } else {
      localStorage.setItem("poultry_inventory_items", JSON.stringify(inventoryItems));
    }
  }, [inventoryItems, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem("poultry_demo_inventory_adjustments", JSON.stringify(inventoryAdjustments));
    } else {
      localStorage.setItem("poultry_inventory_adjustments", JSON.stringify(inventoryAdjustments));
    }
  }, [inventoryAdjustments, isDemoMode]);

  // Restart session as a brand new user
  // Restart session as a brand new user
  const handleResetAsNewUser = () => {
    localStorage.removeItem("poultry_has_onboarded_v4");
    localStorage.removeItem("poultry_is_demo_mode");
    localStorage.removeItem("poultry_batches");
    localStorage.removeItem("poultry_records");
    localStorage.removeItem("poultry_chat");
    localStorage.removeItem("poultry_silo");
    localStorage.removeItem("poultry_inventory_items");
    localStorage.removeItem("poultry_inventory_adjustments");
    localStorage.removeItem("poultry_demo_batches");
    localStorage.removeItem("poultry_demo_records");
    localStorage.removeItem("poultry_demo_chat");
    localStorage.removeItem("poultry_demo_silo");
    localStorage.removeItem("poultry_demo_inventory_items");
    localStorage.removeItem("poultry_demo_inventory_adjustments");
    localStorage.removeItem("poultry_notifications");
    
    setIsDemoMode(false);
    setHasSeenWelcome(false);
    setTourStep(0);
    setShowTourOnly(false);
    setActiveTab("dashboard");
    setBatches([]);
    setRecords([]);
    setChatMessages([]);
    setSiloLevel(5000);
    setInventoryItems([]);
    setInventoryAdjustments([]);
    setNotifications([]);
    
    pushNotification(
      "🔄 Session Reset & Restarted",
      "We have successfully restarted the application as a brand-new user with a pristine workspace.",
      "info"
    );
  };

  // Force first-time load reset for the reviewer so they see the onboarding immediately
  useEffect(() => {
    const hasBeenResetForReviewer = localStorage.getItem("poultry_force_reset_reviewer_v7");
    if (!hasBeenResetForReviewer) {
      localStorage.setItem("poultry_force_reset_reviewer_v7", "true");
      // Execute a silent reset
      localStorage.removeItem("poultry_has_onboarded_v4");
      localStorage.removeItem("poultry_is_demo_mode");
      localStorage.removeItem("poultry_batches");
      localStorage.removeItem("poultry_records");
      localStorage.removeItem("poultry_chat");
      localStorage.removeItem("poultry_silo");
      localStorage.removeItem("poultry_inventory_items");
      localStorage.removeItem("poultry_inventory_adjustments");
      localStorage.removeItem("poultry_demo_batches");
      localStorage.removeItem("poultry_demo_records");
      localStorage.removeItem("poultry_demo_chat");
      localStorage.removeItem("poultry_demo_silo");
      localStorage.removeItem("poultry_demo_inventory_items");
      localStorage.removeItem("poultry_demo_inventory_adjustments");
      localStorage.removeItem("poultry_notifications");
      
      setIsDemoMode(false);
      setHasSeenWelcome(false);
      setTourStep(0);
      setShowTourOnly(false);
      setActiveTab("dashboard");
      setBatches([]);
      setRecords([]);
      setChatMessages([]);
      setSiloLevel(5000);
      setInventoryItems([]);
      setInventoryAdjustments([]);
      setNotifications([]);
    }
  }, []);

  // Complete Onboarding & Choose Mode
  const handleCompleteOnboarding = (mode: "demo" | "clean") => {
    if (mode === "clean") {
      setIsDemoMode(false);
      localStorage.setItem("poultry_is_demo_mode", "false");
      setBatches([]);
      setRecords([]);
      setChatMessages([]);
      setSiloLevel(5000);
      setInventoryItems([]);
      setInventoryAdjustments([]);
      const mainWelcome: NotificationItem[] = [
        {
          id: "notif-welcome",
          title: "👋 Welcome to FlockIntel",
          message: "Your state-of-the-art poultry automation hub. Create batches with customized day-count settings to receive customized veterinary guidelines.",
          type: "success" as const,
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      setNotifications(mainWelcome);

      localStorage.setItem("poultry_batches", JSON.stringify([]));
      localStorage.setItem("poultry_records", JSON.stringify([]));
      localStorage.setItem("poultry_chat", JSON.stringify([]));
      localStorage.setItem("poultry_silo", "5000");
      localStorage.setItem("poultry_inventory_items", JSON.stringify([]));
      localStorage.setItem("poultry_inventory_adjustments", JSON.stringify([]));
      localStorage.setItem("poultry_notifications", JSON.stringify(mainWelcome));
    } else {
      setIsDemoMode(true);
      localStorage.setItem("poultry_is_demo_mode", "true");
      setBatches(initialBatches);
      setRecords(generateInitialRecords());
      setChatMessages([]);
      setSiloLevel(3750);
      setInventoryItems(initialInventoryItems);
      setInventoryAdjustments(initialInventoryAdjustments);
      const demoWelcome: NotificationItem[] = [
        {
          id: "notif-demo-welcome",
          title: "🚀 Welcome to FlockIntel Demo Sandbox",
          message: "You are currently exploring in Sandbox Demo Mode with simulation data. Feel free to log test variables or query the AI assistant.",
          type: "success" as const,
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: "notif-demo-safety",
          title: "⚠️ High Temperature Advisory (Demo Mode)",
          message: "Sensors in Pen 2 logged 31.4°C. Maintain standard fan circulation to mitigate heat stress.",
          type: "warning" as const,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        }
      ];
      setNotifications(demoWelcome);

      localStorage.setItem("poultry_demo_batches", JSON.stringify(initialBatches));
      localStorage.setItem("poultry_demo_records", JSON.stringify(generateInitialRecords()));
      localStorage.setItem("poultry_demo_chat", JSON.stringify([]));
      localStorage.setItem("poultry_demo_silo", "3750");
      localStorage.setItem("poultry_demo_inventory_items", JSON.stringify(initialInventoryItems));
      localStorage.setItem("poultry_demo_inventory_adjustments", JSON.stringify(initialInventoryAdjustments));
      localStorage.setItem("poultry_demo_notifications", JSON.stringify(demoWelcome));

      // Leave main account clean/empty so switching to it starts fresh
      localStorage.setItem("poultry_batches", JSON.stringify([]));
      localStorage.setItem("poultry_records", JSON.stringify([]));
      localStorage.setItem("poultry_chat", JSON.stringify([]));
      localStorage.setItem("poultry_silo", "5000");
      localStorage.setItem("poultry_inventory_items", JSON.stringify([]));
      localStorage.setItem("poultry_inventory_adjustments", JSON.stringify([]));
      localStorage.setItem("poultry_notifications", JSON.stringify([]));
    }
    localStorage.setItem("poultry_has_onboarded_v4", "true");
    setHasSeenWelcome(true);
  };

  const handleSwitchToDemoMode = () => {
    // 1. Save current active as main account values
    localStorage.setItem("poultry_batches", JSON.stringify(batches));
    localStorage.setItem("poultry_records", JSON.stringify(records));
    localStorage.setItem("poultry_chat", JSON.stringify(chatMessages));
    localStorage.setItem("poultry_silo", siloLevel.toString());
    localStorage.setItem("poultry_inventory_items", JSON.stringify(inventoryItems));
    localStorage.setItem("poultry_inventory_adjustments", JSON.stringify(inventoryAdjustments));
    localStorage.setItem("poultry_notifications", JSON.stringify(notifications));

    // 2. Read existing sandbox values or defaults
    const cachedDemoBatches = localStorage.getItem("poultry_demo_batches") || JSON.stringify(initialBatches);
    const cachedDemoRecords = localStorage.getItem("poultry_demo_records") || JSON.stringify(generateInitialRecords());
    const cachedDemoChat = localStorage.getItem("poultry_demo_chat") || "[]";
    const cachedDemoSilo = localStorage.getItem("poultry_demo_silo") || "3750";
    const cachedDemoInvItems = localStorage.getItem("poultry_demo_inventory_items") || JSON.stringify(initialInventoryItems);
    const cachedDemoInvAdjs = localStorage.getItem("poultry_demo_inventory_adjustments") || JSON.stringify(initialInventoryAdjustments);
    const cachedDemoNotifs = localStorage.getItem("poultry_demo_notifications");

    const parsedDemoNotifs = cachedDemoNotifs ? JSON.parse(cachedDemoNotifs) : [
      {
        id: "notif-demo-welcome",
        title: "🚀 Welcome to FlockIntel Demo Sandbox",
        message: "You are currently exploring in Sandbox Demo Mode with simulation data. Feel free to log test variables or query the AI assistant.",
        type: "success" as const,
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: "notif-demo-safety",
        title: "⚠️ High Temperature Advisory (Demo Mode)",
        message: "Sensors in Pen 2 logged 31.4°C. Maintain standard fan circulation to mitigate heat stress.",
        type: "warning" as const,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ];

    // 3. Set standard react state
    setBatches(JSON.parse(cachedDemoBatches));
    setRecords(JSON.parse(cachedDemoRecords));
    setChatMessages(JSON.parse(cachedDemoChat));
    setSiloLevel(parseFloat(cachedDemoSilo));
    setInventoryItems(JSON.parse(cachedDemoInvItems));
    setInventoryAdjustments(JSON.parse(cachedDemoInvAdjs));

    // 4. Flip demo active states
    setIsDemoMode(true);
    localStorage.setItem("poultry_is_demo_mode", "true");

    const newDemoNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "💻 Switched to Demo Sandbox",
      message: "You are inside the Simulated Demo. Any data entries here are isolated from your live production metrics.",
      type: "info" as const,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updatedNotifs = [newDemoNotif, ...parsedDemoNotifs];
    setNotifications(updatedNotifs);
    localStorage.setItem("poultry_demo_notifications", JSON.stringify(updatedNotifs));
  };

  const handleSwitchToMainAccount = () => {
    // 1. Save current active sandbox state
    localStorage.setItem("poultry_demo_batches", JSON.stringify(batches));
    localStorage.setItem("poultry_demo_records", JSON.stringify(records));
    localStorage.setItem("poultry_demo_chat", JSON.stringify(chatMessages));
    localStorage.setItem("poultry_demo_silo", siloLevel.toString());
    localStorage.setItem("poultry_demo_inventory_items", JSON.stringify(inventoryItems));
    localStorage.setItem("poultry_demo_inventory_adjustments", JSON.stringify(inventoryAdjustments));
    localStorage.setItem("poultry_demo_notifications", JSON.stringify(notifications));

    // 2. Read live account data
    const cachedMainBatches = localStorage.getItem("poultry_batches") || "[]";
    const cachedMainRecords = localStorage.getItem("poultry_records") || "[]";
    const cachedMainChat = localStorage.getItem("poultry_chat") || "[]";
    const cachedMainSilo = localStorage.getItem("poultry_silo") || "5000";
    const cachedMainInvItems = localStorage.getItem("poultry_inventory_items") || "[]";
    const cachedMainInvAdjs = localStorage.getItem("poultry_inventory_adjustments") || "[]";
    const cachedMainNotifs = localStorage.getItem("poultry_notifications");

    const parsedMainNotifs = cachedMainNotifs ? JSON.parse(cachedMainNotifs) : [
      {
        id: "notif-welcome",
        title: "👋 Welcome to FlockIntel",
        message: "Your state-of-the-art poultry automation hub. Create batches with customized day-count settings to receive customized veterinary guidelines.",
        type: "success" as const,
        timestamp: new Date().toISOString(),
        read: false
      }
    ];

    // 3. Update react state
    setBatches(JSON.parse(cachedMainBatches));
    setRecords(JSON.parse(cachedMainRecords));
    setChatMessages(JSON.parse(cachedMainChat));
    setSiloLevel(parseFloat(cachedMainSilo));
    setInventoryItems(JSON.parse(cachedMainInvItems));
    setInventoryAdjustments(JSON.parse(cachedMainInvAdjs));

    // 4. Flip demo state flag off
    setIsDemoMode(false);
    localStorage.setItem("poultry_is_demo_mode", "false");

    const newMainNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "🏢 Returned to Main Account",
      message: "Your real-time bio-security telemetry has been fully restored.",
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updatedNotifs = [newMainNotif, ...parsedMainNotifs];
    setNotifications(updatedNotifs);
    localStorage.setItem("poultry_notifications", JSON.stringify(updatedNotifs));
  };

  const handleLoadDemoData = () => {
    // Save current active state before resetting demo data
    localStorage.setItem("poultry_batches", JSON.stringify(batches));
    localStorage.setItem("poultry_records", JSON.stringify(records));
    localStorage.setItem("poultry_chat", JSON.stringify(chatMessages));
    localStorage.setItem("poultry_silo", siloLevel.toString());
    localStorage.setItem("poultry_inventory_items", JSON.stringify(inventoryItems));
    localStorage.setItem("poultry_inventory_adjustments", JSON.stringify(inventoryAdjustments));
    localStorage.setItem("poultry_notifications", JSON.stringify(notifications));

    // Reset demo state variables to the pristine initial mock telemetry
    setBatches(initialBatches);
    setRecords(generateInitialRecords());
    setChatMessages([]);
    setSiloLevel(3750);
    setInventoryItems(initialInventoryItems);
    setInventoryAdjustments(initialInventoryAdjustments);

    const freshDemoNotifs: NotificationItem[] = [
      {
        id: "notif-demo-welcome",
        title: "🚀 Welcome to FlockIntel Demo Sandbox",
        message: "You are currently exploring in Sandbox Demo Mode with simulation data. Feel free to log test variables or query the AI assistant.",
        type: "success" as const,
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: "notif-demo-safety",
        title: "⚠️ High Temperature Advisory (Demo Mode)",
        message: "Sensors in Pen 2 logged 31.4°C. Maintain standard fan circulation to mitigate heat stress.",
        type: "warning" as const,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: "notif-demo-loaded",
        title: "Demo Data Loaded Successfully",
        message: "We pre-loaded operational layer and broiler batches, 15 days of daily records, active supply inventory and vaccination telemetry.",
        type: "success" as const,
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
    setNotifications(freshDemoNotifs);

    localStorage.setItem("poultry_demo_batches", JSON.stringify(initialBatches));
    localStorage.setItem("poultry_demo_records", JSON.stringify(generateInitialRecords()));
    localStorage.setItem("poultry_demo_chat", JSON.stringify([]));
    localStorage.setItem("poultry_demo_silo", "3750");
    localStorage.setItem("poultry_demo_inventory_items", JSON.stringify(initialInventoryItems));
    localStorage.setItem("poultry_demo_inventory_adjustments", JSON.stringify(initialInventoryAdjustments));
    localStorage.setItem("poultry_demo_notifications", JSON.stringify(freshDemoNotifs));

    setIsDemoMode(true);
    localStorage.setItem("poultry_is_demo_mode", "true");
    
    // Switch view automatically to dashboard
    setActiveTab("dashboard");
    // Auto close tour overlay
    setShowTourOnly(false);
    setTourStep(0);
  };

  // Feed stock deduction calculator
  // Calculated automatically: Whenever a record consumption value changes, we deduct from our 5T storage.
  // For interaction, have a quick button to "Refill" the feed stock to 5,000 kg (5.0 Tons)
  const handleRefillFeed = () => {
    setSiloLevel(5000);
  };

  // Trigger system notification on user browser/device + append internal notifications
  const pushNotification = (title: string, message: string, type: "info" | "warning" | "success" | "vaccine" | "medical", batchId?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      batchId
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Send direct browser push if granted
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body: message });
        } catch (err) {
          console.warn("Device Notification display blocked:", err);
        }
      }
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          pushNotification("🔔 Alerts Enabled Successfully", "You will now receive automatic vaccine and flock-health recommendations on this device.", "success");
        }
      });
    }
  };

  // Automatic Daily Routine & Medical check
  useEffect(() => {
    if (batches.length === 0) return;

    // We run through each active batch
    const activeFlocks = batches.filter(b => b.status === "Active");

    activeFlocks.forEach(b => {
      const ageInfo = calculateAgeDetails(b);
      const totalDays = ageInfo.totalDays;

      // Determine vaccine or de-beaking milestones
      let alertTitle = "";
      let alertMsg = "";
      let alertType: NotificationItem["type"] = "info";

      if (totalDays === 1) {
        alertTitle = `🍼 Daily Care for ${b.name} (Day 1)`;
        alertMsg = "Add multivitamin stress packs and glucose directly to their drinking water to offset transport exhaustion.";
        alertType = "medical";
      } else if (totalDays === 8) {
        alertTitle = `💉 1st Gumboro (IBD) Vaccine Due for ${b.name}`;
        alertMsg = `Batch is exactly 8 days old today. Ready the vaccine dose in cool, chlorine-free water. Withdraw drinking water for 1.5 hours before serving.`;
        alertType = "vaccine";
      } else if (totalDays === 14) {
        alertTitle = `💉 1st Newcastle Vaccine Due for ${b.name}`;
        alertMsg = `Batch is exactly 14 days old today. Administer ND Lasota strain in cold water with skimmed milk stabilizer immediately.`;
        alertType = "vaccine";
      } else if (totalDays === 21) {
        alertTitle = `💉 Gumboro Booster Vaccine Due for ${b.name}`;
        alertMsg = `Batch is 21 days old. High Gumboro threat window active - administer the booster strain via waterers to preserve survival rates.`;
        alertType = "vaccine";
      } else if (totalDays === 28) {
        alertTitle = `💉 Newcastle Booster Vaccine Due for ${b.name}`;
        alertMsg = `Batch is 28 days old. Administer Lasota/Newcastle booster booster dose today.`;
        alertType = "vaccine";
      } else if (totalDays >= 63 && totalDays <= 70) {
        alertTitle = `✂️ Debeaking Window Open for ${b.name} (Day ${totalDays})`;
        alertMsg = `Beak trimming is optimal at weeks 9-10 (current day: ${totalDays}). Prevent future cannibalism carefully. Administer Vitamin K with electrolytes starting today!`;
        alertType = "warning";
      } else if ((b.purpose === "Layers" || b.purpose === "Dual-Purpose") && ageInfo.weeks === 16 && ageInfo.extraDays === 0) {
        alertTitle = `🥚 Point of Lay Approaching for ${b.name} (16 Weeks)`;
        alertMsg = `Your layer flock is 16 weeks old today! This is the transition window. Introduce Pre-Laying feed mash and prepare feed-energy adjustments for layer transition.`;
        alertType = "warning";
      } else if ((b.purpose === "Layers" || b.purpose === "Dual-Purpose") && ageInfo.weeks === 18 && ageInfo.extraDays === 0) {
        alertTitle = `🚪 Nest Boxes & Calcium Support for ${b.name} (18 Weeks)`;
        alertMsg = `Laying starts soon (under 2 weeks). Ensure nesting boxes are washed, placed, and filled with clean woodshavings. Start high-calcium oyster shell supplements.`;
        alertType = "warning";
      } else if ((b.purpose === "Layers" || b.purpose === "Dual-Purpose") && ageInfo.weeks === 19 && ageInfo.extraDays === 0) {
        alertTitle = `🔆 Light Stimulation & Imminent Lay for ${b.name} (19 Weeks)`;
        alertMsg = `Laying is extremely near! Begin light stimulation routine today (advance daylight to 14-16 hours slowly). Avoid sudden loud noises or stresses near the pens.`;
        alertType = "medical";
      } else if (b.purpose === "Layers" && ageInfo.weeks === 20 && ageInfo.extraDays === 0) {
        alertTitle = `🥚 Laying Initiation Detected for ${b.name}`;
        alertMsg = `Batch is exactly 20 weeks old today. Shift feed structures to Layer Mash (high calcium) to support dynamic laying shell formations.`;
        alertType = "success";
      }

      // If a milestone alert was formulated, check if we already registered it
      if (alertTitle) {
        const alreadyFired = notifications.some(n => 
          n.title === alertTitle && n.batchId === b.id
        );

        if (!alreadyFired) {
          pushNotification(alertTitle, alertMsg, alertType, b.id);
        }
      }
    });
  }, [batches]);

  // Add a new batch
  const handleAddBatch = (newB: Omit<FlockBatch, "id" | "currentCount" | "status">) => {
    const batch: FlockBatch = {
      ...newB,
      id: `batch-${Date.now()}`,
      currentCount: newB.initialCount,
      status: "Active",
    };
    
    // Calculate display age for notification
    const startAge = newB.ageAtArrivalUnit === "days"
      ? `${newB.ageAtArrivalValue} days`
      : `${newB.ageWeeksAtArrival} weeks`;

    setBatches([...batches, batch]);

    pushNotification(
      `🐣 Batch registered: ${newB.name}`,
      `Successfully initialized ${newB.initialCount} birds (${newB.breed}) at starting age of ${startAge}. Dynamic day-count telemetry active!`,
      "success",
      batch.id
    );
  };

  // Update batch (e.g. edit records, change counts or toggle archive)
  const handleUpdateBatch = (updatedB: FlockBatch) => {
    setBatches(batches.map((b) => (b.id === updatedB.id ? updatedB : b)));
  };

  // Delete batch
  const handleDeleteBatch = (id: string) => {
    setBatches(batches.filter((b) => b.id !== id));
  };

  // Add daily record
  const handleAddRecord = (newRec: Omit<DailyRecord, "id">) => {
    const record: DailyRecord = {
      ...newRec,
      id: `rec-${Date.now()}`,
    };

    // Auto-update batch active count if deaths occurred in this daily record
    if (newRec.mortality > 0) {
      setBatches(currentBatches => 
        currentBatches.map(b => {
          if (b.id === newRec.batchId) {
            const nextCount = Math.max(0, b.currentCount - newRec.mortality);
            return {
              ...b,
              currentCount: nextCount
            };
          }
          return b;
        })
      );
    }

    // Deduct feed matching the input
    setSiloLevel(prev => Math.max(0, prev - newRec.feedConsumption));

    // Auto-deduct matching feed item in inventory
    const matchedBatch = batches.find(b => b.id === newRec.batchId);
    let matchedFeedItem: InventoryItem | undefined;
    if (matchedBatch) {
      if (matchedBatch.purpose === "Layers") {
        matchedFeedItem = inventoryItems.find(item => item.id === "inv-feed-01");
      } else if (matchedBatch.purpose === "Broilers") {
        matchedFeedItem = inventoryItems.find(item => item.id === "inv-feed-02");
      }
    }
    // If we didn't match specially, fallback to first Feed category item
    if (!matchedFeedItem) {
      matchedFeedItem = inventoryItems.find(item => item.category === "Feed");
    }

    if (matchedFeedItem && newRec.feedConsumption > 0) {
      const feedId = matchedFeedItem.id;
      setInventoryItems(current => 
        current.map(item => 
          item.id === feedId 
            ? { ...item, quantity: Math.max(0, item.quantity - newRec.feedConsumption) }
            : item
        )
      );

      // Create an automatic adjustment entry
      const autoAdj: InventoryAdjustment = {
        id: `adj-auto-${Date.now()}`,
        itemId: feedId,
        type: "Remove",
        quantity: newRec.feedConsumption,
        date: newRec.date,
        reason: `Automated: ${matchedBatch?.name || "Flock"} Feed Consumption Log`
      };
      setInventoryAdjustments(prev => [...prev, autoAdj]);
    }

    // Append record (if a log for the exact date already exists, remove it first to avoid duplicates)
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.batchId === newRec.batchId && r.date === newRec.date));
      return [...filtered, record];
    });
  };

  // Delete daily record
  const handleDeleteRecord = (id: string) => {
    const toDelete = records.find(r => r.id === id);
    if (!toDelete) return;

    // Return feed to Silo of deleted amount
    setSiloLevel(prev => Math.min(5000, prev + toDelete.feedConsumption));
    
    // Attempt to undo matching automated adjustment if exists
    setInventoryAdjustments(prev => {
      const matches = prev.filter(adj => adj.date === toDelete.date && adj.quantity === toDelete.feedConsumption && adj.reason.includes("Automated:"));
      if (matches.length > 0) {
        const removedId = matches[0].id;
        const itemId = matches[0].itemId;
        // Return quantity to stock
        setInventoryItems(current => 
          current.map(item => 
            item.id === itemId 
              ? { ...item, quantity: item.quantity + toDelete.feedConsumption }
              : item
          )
        );
        return prev.filter(adj => adj.id !== removedId);
      }
      return prev;
    });

    setRecords(records.filter((r) => r.id !== id));
  };

  // Inventory handlers
  const handleAddItem = (newItemData: Omit<InventoryItem, "id">) => {
    const item: InventoryItem = {
      ...newItemData,
      id: `inv-${Date.now()}`
    };
    setInventoryItems(prev => [...prev, item]);

    // Add starting quantity adjustment Log
    if (item.quantity > 0) {
      const adj: InventoryAdjustment = {
        id: `adj-init-${Date.now()}`,
        itemId: item.id,
        type: "Add",
        quantity: item.quantity,
        date: getLocalYYYYMMDD(),
        reason: `Initial stock registration: ${item.name}`
      };
      setInventoryAdjustments(prev => [...prev, adj]);
    }
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventoryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    setInventoryAdjustments(prev => prev.filter(adj => adj.itemId !== id));
  };

  const handleAddAdjustment = (adjData: Omit<InventoryAdjustment, "id">) => {
    const adj: InventoryAdjustment = {
      ...adjData,
      id: `adj-${Date.now()}`
    };

    setInventoryAdjustments(prev => [...prev, adj]);

    // Update the item quantity
    setInventoryItems(current =>
      current.map(item => {
        if (item.id === adjData.itemId) {
          const delta = adjData.type === "Add" ? adjData.quantity : -adjData.quantity;
          return {
            ...item,
            quantity: Math.max(0, item.quantity + delta)
          };
        }
        return item;
      })
    );
  };

  // AI chat API triggering
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // slice recent chat history to pass to server side Gemini proxy
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        let errorMsg = "Clinical assistant timed out or failed to parse request.";
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-m`,
        role: "model",
        content: data.reply || "Empty response from diagnosis client. Try reiterating your clinical sign.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("AI request error:", err);
      const userFriendlyError = err.message || "Connection timed out.";
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-m`,
        role: "model",
        content: `⚠️ **Clinical Assistant Diagnostic Issue:** ${userFriendlyError}\n\n**Immediate Biosecurity Actions for Symptoms:**\n1. Feed anticoccidial electrolytes (Amprolium class) representing coccidiosis.\n2. Quarantine all lethargic, gasping, or ruffling birds adjacent to Pen 2 / 5 immediately.\n3. Disinfect footbaths recursively at all entrance lines.\n\nContact the National Poultry Research center at **+233 (0) 244 837 581** for field backup.`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearHistory = () => {
    setChatMessages([]);
  };

  // Fast diagnostic click helper
  const handleQuickAiSymptom = (symptomString: string) => {
    setPrefilledChatText(symptomString);
    setActiveTab("chatbot");
  };

  // Global feed capacity stats
  const siloPercent = Math.round((siloLevel / 5000) * 100);

  // Scan recent records for high mortality anomalies to show in alert top banner
  const recentLosses = records
    .filter((r) => {
      const d = new Date(r.date);
      const diffTime = Math.abs(new Date().getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5 && r.mortality >= 3;
    });

  const alertItemsCount = inventoryItems.filter(item => item.quantity <= item.reorderPoint).length;

  const tourSteps = [
    {
      title: "1. Register Flock Batches",
      description: "Manage multiple bird batches in the 'Flock Batches' tab. Track customized arrival dates, current counts, breed details (e.g. Cobb 500, Isa Brown), and automated flock metrics dynamically.",
      icon: <Layers className="w-8 h-8 text-emerald-600 animate-bounce" />
    },
    {
      title: "2. Log Daily Activities",
      description: "Write your feed consumption (kg), water served (Liters), egg collections (good & cracked count), mortality, temperature/humidity, and check symptoms on daily log entries.",
      icon: <ClipboardCheck className="w-8 h-8 text-emerald-600" />
    },
    {
      title: "3. Predict & Analyze Trends",
      description: "In the 'Analytics' tab, inspect live charts comparing feed weight vs egg laying efficiency curves, temperature fluctuations, and protect your poultry stock proactively.",
      icon: <BarChart3 className="w-8 h-8 text-emerald-600" />
    },
    {
      title: "4. Google Gemini Diagnosis Vet",
      description: "State any clinical indicators or unusual behaviors. Google Gemini will instantly suggest diagnostic clues, direct biosecurity interventions, and reference extension support lines.",
      icon: <HeartPulse className="w-8 h-8 text-emerald-600 animate-pulse" />
    },
    {
      title: "5. Smart Warehouse & Feed Stock Alarms",
      description: "Tracks feed storage capacities dynamically on daily consumption logs. Receives automated low stock alarms when vaccine, medication and disinfectant quantities drop.",
      icon: <Package className="w-8 h-8 text-emerald-600" />
    }
  ];

  if (!hasSeenWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto">
        {/* Soft atmospheric radial gradient glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/30 dark:bg-emerald-950/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-100/30 dark:bg-teal-950/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-800/80 w-full max-w-xl p-8 sm:p-10 relative z-10 animate-fadeIn">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100/55 dark:border-emerald-900/30">
              <FlockIntelLogo size="lg" showText={false} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-slate-900 dark:text-slate-50 tracking-tight">
                Welcome to FlockIntel
              </h2>
              <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                A simple biosecurity manager & predictive health tracker. Choose how you would like to initialize your workspace today.
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3.5 mb-8">
            <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-sans">
              Setup Workspace Mode
            </span>
            
            <div className="space-y-3">
              {/* Option: Sandbox Demo */}
              <button
                id="onboarding-pref-demo"
                onClick={() => setPrefMode("demo")}
                type="button"
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 cursor-pointer select-none ${
                  prefMode === "demo"
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/5 ring-1 ring-emerald-500/20"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  prefMode === "demo" 
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white" 
                    : "border-slate-300 dark:border-slate-700"
                }`}>
                  {prefMode === "demo" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    📊 Sandbox Demo
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                      Recommended
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Instantly populates 15 days of active layer and broiler batches, silo feed logs, medical inventory records, and charts to let you explore FlockIntel features.
                  </p>
                </div>
              </button>

              {/* Option: Clean Slate */}
              <button
                id="onboarding-pref-clean"
                onClick={() => setPrefMode("clean")}
                type="button"
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 cursor-pointer select-none ${
                  prefMode === "clean"
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/5 ring-1 ring-emerald-500/20"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  prefMode === "clean" 
                    ? "border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white" 
                    : "border-slate-300 dark:border-slate-700"
                }`}>
                  {prefMode === "clean" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    ✨ Clean Slate
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Clears all active templates. Starts with pristine, empty charts ready to record your actual bird batches, bio-security measures, and supply logs.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col items-center gap-3.5 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <button
              id="onboarding-launch-btn"
              onClick={() => handleCompleteOnboarding(prefMode)}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] uppercase tracking-wider cursor-pointer select-none"
            >
              Get Started with FlockIntel
              <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-100" />
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans text-center">
              You can toggle between Sandbox and Clean accounts at any point inside the dashboard.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden leading-snug">
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 transition-opacity cursor-pointer"
          title="Click to close menu"
        />
      )}
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 flex flex-col justify-between transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        <div>
          {/* Logo Brand Bar */}
          <div className="p-6 flex items-center justify-between border-b border-slate-150 dark:border-slate-850">
            <FlockIntelLogo size="md" showText={true} textLight={darkMode} />

            {/* Mobile close menu */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-250/20 dark:border-slate-700 text-slate-600 dark:text-slate-200 rounded-lg cursor-pointer transition-all duration-150"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-6 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Dashboard Core</span>
            </button>

            <button
              onClick={() => { setActiveTab("batches"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "batches"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Flock Batches</span>
            </button>

            <button
              onClick={() => { setActiveTab("logging"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "logging"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Daily Logging</span>
            </button>

            <button
              onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "analytics"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Analytics & Trends</span>
            </button>

            <button
              onClick={() => { setActiveTab("inventory"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "inventory"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Package className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="flex-1 flex items-center justify-between">
                <span>Inventory & Supplies</span>
                {alertItemsCount > 0 && (
                  <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full leading-none animate-pulse">
                    {alertItemsCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => { setActiveTab("chatbot"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all duration-150 cursor-pointer text-left ${
                activeTab === "chatbot"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border-r-4 border-emerald-600 dark:border-emerald-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/60 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <HeartPulse className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="flex-1 flex items-center justify-between">
                <span>AI Health Vet</span>
                <span className="bg-emerald-600 text-slate-900 font-extrabold text-[8px] px-1.5 py-0.5 rounded leading-none">GEMINI</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Feed Capacity Storage Bottom Widget */}
        <div id="feed-capacity-sidebar-widget" className="p-4 border-t border-slate-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/30">
          <div className="bg-white dark:bg-slate-850/80 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Feed Capacity</p>
              <button 
                onClick={handleRefillFeed}
                title="Refill 5.0 Tons Feed"
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                Refill Feed
              </button>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-750 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  siloPercent < 25 ? "bg-rose-500" : siloPercent < 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${siloPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-slate-900 dark:text-white font-bold">{siloPercent}% filled</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{(siloLevel / 1000).toFixed(2)} Tons Left</p>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden font-sans">

        {/* Global Sandbox / Production Mode Banner Indicator */}
        {isDemoMode && (
          <div id="demo-sandbox-global-banner" className="bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 text-white py-2 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner border-b border-teal-555/5 z-30 select-none animate-fadeIn shrink-0">
            <div className="flex items-center gap-2 text-xs font-sans">
              <Sparkles className="w-3.5 h-3.5 text-emerald-250 animate-pulse shrink-0" />
              <span>
                You are currently navigating the <strong>Demo Sandbox</strong> with simulated medical records and livestock metrics.
              </span>
            </div>
            <button
              onClick={handleSwitchToMainAccount}
              className="bg-white hover:bg-slate-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all tracking-wider uppercase active:scale-[0.98] cursor-pointer"
            >
              Return to Main Account
            </button>
          </div>
        )}
        
        {/* HEADER BAR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center space-x-3">
            {/* Hamburger menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-150 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile-only brand logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <FlockIntelLogo size="md" showText={true} />
            </div>

            {/* Desktop-only Active View Title */}
            <h1 className="hidden lg:block text-sm font-bold text-slate-800 dark:text-white font-display uppercase tracking-wider">
              {activeTab === "dashboard" ? "Performance Dashboard" :
               activeTab === "batches" ? "Flock Batches" :
               activeTab === "logging" ? "Medical Logs & Records" :
               activeTab === "analytics" ? "Analytics & Insights" :
               "FlockIntel Advisor Chat"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Bio Alert Flag */}
            {recentLosses.length > 0 && (
              <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 dark:border-rose-900/30 animate-pulse">
                <span className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full"></span>
                <span>Critical: High Mortality</span>
              </div>
            )}

            {/* Quick Tour Launcher */}
            <button
              onClick={() => { setShowTourOnly(true); setTourStep(0); }}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none shrink-0"
              title="Launch systems walk-through guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline">Launch Tour</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-100 dark:hover:bg-slate-150 border-slate-200 dark:border-slate-150 text-slate-700 dark:text-slate-300"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Notifications Bell Dropdown */}
            <div id="notifications-bell-wrapper" className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                  showNotifications 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
                title="Flock Status & Medical Alarms"
              >
                {notifications.some(n => !n.read) ? (
                  <>
                    <BellRing className="w-4 h-4 text-emerald-700 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  </>
                ) : (
                  <Bell className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {/* Dropdown Header */}
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Critical Alerts</h4>
                      <h3 className="text-sm font-bold mt-0.5">Advisories & Alarms</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({...n, read: true})));
                        }}
                        className="text-[10px] bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer font-bold"
                      >
                        Mark All Read
                      </button>
                    </div>
                  </div>

                   {/* Device Notification Access Prompter */}
                  {("Notification" in window) && Notification.permission !== "granted" && showSoundPrompt && (
                    <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-3">
                      <p className="text-[10px] text-slate-700 font-sans leading-relaxed">
                        Enable native OS alarms for active vaccine warnings?
                      </p>
                      <button
                        onClick={() => {
                          requestNotificationPermission();
                          setShowSoundPrompt(false);
                        }}
                        className="text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        Allow Device Sounds
                      </button>
                    </div>
                  )}

                  {/* Notification List Container */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Bell className="w-8 h-8 mx-auto stroke-1" />
                        <p className="text-xs font-sans">No live advisories or alarms available right now.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 transition-colors flex gap-2.5 items-start ${
                            notif.read ? "bg-white" : "bg-emerald-50/20"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            notif.type === "vaccine" ? "bg-violet-500" :
                            notif.type === "medical" ? "bg-rose-500" :
                            notif.type === "warning" ? "bg-amber-500" :
                            notif.type === "success" ? "bg-emerald-500" :
                            "bg-blue-500"
                          }`} />

                          <div className="flex-1 space-y-0.5 min-w-0 font-sans">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-xs font-bold leading-tight ${notif.read ? "text-slate-800" : "text-slate-950"}`}>
                                {notif.title}
                              </h5>
                              <span className="text-[9px] text-slate-400 whitespace-nowrap font-medium">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal break-words">
                              {notif.message}
                            </p>
                            <div className="flex gap-2 pt-1.5 items-center">
                              {!notif.read && (
                                <button
                                  onClick={() => {
                                    setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n));
                                  }}
                                  className="text-[9px] text-emerald-700 hover:underline font-bold transition-all"
                                >
                                  Mark Read
                                </button>
                              )}
                              {pendingDeleteNotifId === notif.id ? (
                                <div className="flex items-center gap-1.5 ml-auto animate-fadeIn bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">
                                  <span className="text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase leading-none">Delete?</span>
                                  <button
                                    onClick={() => {
                                      setNotifications(notifications.filter(n => n.id !== notif.id));
                                      setPendingDeleteNotifId(null);
                                    }}
                                    className="text-[8px] text-white bg-rose-600 hover:bg-rose-700 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setPendingDeleteNotifId(null)}
                                    className="text-[8px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setPendingDeleteNotifId(notif.id)}
                                  className="text-[9px] text-slate-400 hover:text-rose-500 font-bold ml-auto transition-all duration-75"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 text-center min-h-[40px] flex items-center justify-center">
                    {showClearAllNotifsConfirm ? (
                      <div className="flex items-center justify-center gap-2 animate-fadeIn">
                        <span className="text-[9px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Are you sure you want to clear all?</span>
                        <button
                          onClick={() => {
                            setNotifications([]);
                            setShowClearAllNotifsConfirm(false);
                          }}
                          className="text-[9px] text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded font-black transition-all cursor-pointer"
                        >
                          Yes, Clear All
                        </button>
                        <button
                          onClick={() => setShowClearAllNotifsConfirm(false)}
                          className="text-[9px] text-slate-700 dark:text-slate-300 bg-slate-250 dark:bg-slate-800 hover:bg-slate-350 px-2.5 py-1 rounded font-black transition-all cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearAllNotifsConfirm(true)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Clear Alarm History ({notifications.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Indicator / Account Switcher */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 bg-transparent select-none shrink-0">
              {showResetAppConfirm ? (
                <div className="hidden sm:flex items-center gap-1.5 animate-fadeIn bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                  <span className="text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase leading-none">Reset workspace?</span>
                  <button
                    onClick={() => {
                      handleResetAsNewUser();
                      setShowResetAppConfirm(false);
                    }}
                    className="text-[9px] text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowResetAppConfirm(false)}
                    className="text-[9px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetAppConfirm(true)}
                  className="hidden sm:flex items-center gap-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-150 dark:hover:bg-rose-950/30 text-slate-500 border border-slate-200 dark:border-slate-150 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  title="Restart application as a new user with onboarding wizard"
                >
                  <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                  Reset App State
                </button>
              )}

              {isDemoMode ? (
                <button
                  onClick={handleSwitchToMainAccount}
                  className="hidden md:flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/55 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  title="Switch back to your live account data"
                >
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  Active Demo
                </button>
              ) : (
                <button
                  onClick={handleSwitchToDemoMode}
                  className="hidden md:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-100 dark:hover:bg-slate-150 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-150 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  title="Load the simulated sandbox data"
                >
                  <Sparkles className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  Try Demo
                </button>
              )}
              
              <div className="flex items-center gap-2">
                <div 
                  id="user-avatar-initials"
                  className={`w-8 h-8 rounded-full font-sans font-bold text-xs flex items-center justify-center border shadow-inner ${
                    isDemoMode 
                      ? "bg-amber-100 text-amber-950 border-amber-300 demo-avatar" 
                      : "bg-emerald-100 text-emerald-950 border-emerald-300"
                  }`}
                >
                  {isDemoMode ? "DS" : "FL"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">
                    {isDemoMode ? "Demo Sandbox" : "FlockIntel Manager"}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                    {isDemoMode ? "Simulated Mode" : "Real Livestock Account"}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </header>

        {/* SUB VIEW SCROLLER GRID */}
        <div className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-0 flex flex-col ${activeTab === "chatbot" ? "overflow-hidden h-full" : "overflow-y-auto"}`}>
          
          {/* Active Tab Dispatcher */}
          {activeTab === "dashboard" && (
            <DashboardTab
              batches={batches}
              records={records}
              onNavigateTo={(tab) => setActiveTab(tab)}
              onQuickAiSymptom={handleQuickAiSymptom}
            />
          )}

          {activeTab === "batches" && (
            <BatchesTab
              batches={batches}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              onDeleteBatch={handleDeleteBatch}
            />
          )}

          {activeTab === "logging" && (
            <LoggingTab
              batches={batches}
              records={records}
              onAddRecord={handleAddRecord}
              onDeleteRecord={handleDeleteRecord}
              onNavigateToChat={handleQuickAiSymptom}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab
              batches={batches}
              records={records}
            />
          )}

          {activeTab === "chatbot" && (
            <ChatbotTab
              batches={batches}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              isLoading={isChatLoading}
              prefilledMessage={prefilledChatText}
              setPrefilledMessage={setPrefilledChatText}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              items={inventoryItems}
              adjustments={inventoryAdjustments}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onAddAdjustment={handleAddAdjustment}
            />
          )}

        </div>

      </main>

      {/* Reusable Systems Guided Tour Overlay */}
      {showTourOnly && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTourOnly(false);
              setTourStep(0);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800/80 w-full max-w-lg overflow-hidden p-8 animate-fadeIn relative cursor-default">
            <button 
              onClick={() => { setShowTourOnly(false); setTourStep(0); }}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
              title="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-lg font-display font-medium text-slate-900 dark:text-slate-105 leading-none">FlockIntel System Tour</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold tracking-widest block">Core Modules</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-150 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">Step {tourStep + 1} of {tourSteps.length}</span>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850/60 flex flex-col items-center text-center space-y-4 shadow-inner">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800">
                    {tourSteps[tourStep].icon}
                  </div>
                  <h4 className="text-xs font-black text-slate-950 dark:text-slate-200 uppercase tracking-wider">{tourSteps[tourStep].title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans max-w-sm">
                    {tourSteps[tourStep].description}
                  </p>
                </div>
              </div>

              {/* Developer Sandbox helper */}
              <div id="tour-demo-loader-banner" className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-150/60 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-450 uppercase tracking-widest block font-sans">Sandbox Simulator</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                    Instantly populate dashboard charts with 15 days of telemetry history.
                  </p>
                </div>
                <button
                  id="btn-load-demo-data-tour"
                  onClick={() => {
                    handleLoadDemoData();
                  }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-700/15 active:scale-[0.98] text-white text-[11px] font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer select-none shrink-0 flex items-center justify-center gap-1.5 uppercase tracking-wider font-sans shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 pointer-events-none" />
                  Load Demo Data
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={tourStep === 0}
                  onClick={() => setTourStep(prev => prev - 1)}
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                    tourStep === 0 ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "text-slate-600 hover:text-slate-950 dark:text-slate-450 dark:hover:text-white cursor-pointer"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {tourStep < tourSteps.length - 1 ? (
                  <button
                    onClick={() => setTourStep(prev => prev + 1)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 text-emerald-400 darK:text-emerald-300" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowTourOnly(false); setTourStep(0); }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer select-none"
                  >
                    End Tour Guidance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Floating AI Vet Button */}
      {activeTab !== "chatbot" && (
        <button
          id="global-floating-chat-bubble"
          onClick={() => {
            setPrefilledChatText("");
            setActiveTab("chatbot");
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white rounded-full shadow-2xl transition-all duration-350 hover:scale-105 active:scale-95 cursor-pointer"
          title="Consult FlockIntel AI Vet"
        >
          {/* Pulsating Light Effect */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none"></span>
          
          <HeartPulse className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider whitespace-nowrap text-white font-sans">
            Ask AI Vet
          </span>
        </button>
      )}

    </div>
  );
}
