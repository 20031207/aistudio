import { useState, useEffect, useRef, FormEvent, useMemo } from "react";
import { jsPDF } from "jspdf";
import { 
  Building2, 
  Layers, 
  Users, 
  Utensils, 
  ClipboardList, 
  Package, 
  LineChart as LucideLineChart, 
  Smartphone, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Plus, 
  QrCode, 
  ShoppingBag, 
  Trash2, 
  Coffee, 
  ChefHat, 
  CreditCard, 
  Search, 
  Clock, 
  Info, 
  Sliders, 
  Compass, 
  User, 
  MapPin, 
  Settings, 
  HelpCircle, 
  RefreshCw,
  X,
  PlusCircle,
  Bell,
  Bed,
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Hotel, Table, MenuItem, Order, StockItem, Employee, Room, ServiceCall } from "./types";
import { TableQRCode } from "./components/TableQRCode";
import { OrderHistory } from "./components/OrderHistory";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  // NAVIGATION & ROLE MANAGERS
  const [activeRole, setActiveRole] = useState<"SuperAdmin" | "HotelAdmin" | "Kitchen" | "WaiterCashier" | "Guest">(() => {
    const saved = localStorage.getItem("activeRole");
    return (saved as any) || "Guest";
  });
  const notificationTimeoutRef = useRef<any>(null);
  const [currentHotelId, setCurrentHotelId] = useState<string>(() => {
    return localStorage.getItem("currentHotelId") || "h-yak-yeti";
  });
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    return localStorage.getItem("currentBranchId") || "b-ktm";
  });
  const [activeGuestTableId, setActiveGuestTableId] = useState<string>(() => {
    return localStorage.getItem("activeGuestTableId") || "t-2";
  }); // default simulated table scan
  
  // LOGIN STATE FOR HOTELS
  const [loggedInHotelId, setLoggedInHotelId] = useState<string | null>(() => {
    return localStorage.getItem("loggedInHotelId") || null;
  });
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // SYSTEM DATA STATES (Synchronized with Server API)
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);

  // FRONTEND SPECIFIC INTERACTION STATES
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>("Synchronized");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number; notes: string }[]>([]);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [customerOrderNotes, setCustomerOrderNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"eSewa" | "Khalti" | "Fonepay" | "Stripe" | "Cash">("eSewa");
  
  // AI INTERFACES
  const [guestAiQuery, setGuestAiQuery] = useState<string>("");
  const [guestAiHistory, setGuestAiHistory] = useState<{ sender: "user" | "butler"; text: string; suggestedItemIds?: string[] }[]>([
    {
      sender: "butler",
      text: "Namaste. I am your Swiss-trained Himalayan AI Butler. How may I elevate your culinary experience today? I can assist with recommendations based on dietary constraints, budget limits, spicy preferences, or ideal local pairings."
    }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [biInsights, setBiInsights] = useState<string>("");
  const [biLoading, setBiLoading] = useState<boolean>(false);
  const [restockPrediction, setRestockPrediction] = useState<string>("");
  const [restockLoading, setRestockLoading] = useState<boolean>(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [tableFilterStatus, setTableFilterStatus] = useState<string>("All");
  const [reservingTable, setReservingTable] = useState<Table | null>(null);
  const [reservationName, setReservationName] = useState<string>("");
  const [reservationTime, setReservationTime] = useState<string>("");

  // STAFF WORKSPACE & NOTIFICATIONS STATE
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(() => {
    return localStorage.getItem("selectedStaffId") || null;
  });
  const [staffNotifications, setStaffNotifications] = useState<any[]>([]);
  const [isStaffNotificationOpen, setIsStaffNotificationOpen] = useState<boolean>(false);

  // SELECTION & SUB-PANEL TAB NAVIGATION
  const [adminActiveTab, setAdminActiveTab] = useState<"analytics" | "menu" | "tables" | "staff" | "inventory" | "rooms" | "branches">(() => {
    const saved = localStorage.getItem("adminActiveTab");
    return (saved as any) || "analytics";
  });
  const [guestRightTab, setGuestRightTab] = useState<"cart" | "orders" | "history">("cart");

  // Synchronize navigation & role states to localStorage
  useEffect(() => {
    localStorage.setItem("activeRole", activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem("currentHotelId", currentHotelId);
  }, [currentHotelId]);

  useEffect(() => {
    localStorage.setItem("currentBranchId", currentBranchId);
  }, [currentBranchId]);

  useEffect(() => {
    localStorage.setItem("activeGuestTableId", activeGuestTableId);
  }, [activeGuestTableId]);

  useEffect(() => {
    if (loggedInHotelId) {
      localStorage.setItem("loggedInHotelId", loggedInHotelId);
    } else {
      localStorage.removeItem("loggedInHotelId");
    }
  }, [loggedInHotelId]);

  useEffect(() => {
    if (selectedStaffId) {
      localStorage.setItem("selectedStaffId", selectedStaffId);
    } else {
      localStorage.removeItem("selectedStaffId");
    }
  }, [selectedStaffId]);

  useEffect(() => {
    localStorage.setItem("adminActiveTab", adminActiveTab);
  }, [adminActiveTab]);

  // BRANCH MANAGEMENT STATE
  const [newBranchForm, setNewBranchForm] = useState({ 
    name: "", 
    location: "", 
    contactPhone: "", 
    operatingHours: "09:00 - 22:00", 
    autoCreateTables: 0 
  });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchForm, setEditBranchForm] = useState({ 
    name: "", 
    location: "", 
    contactPhone: "", 
    operatingHours: "09:00 - 22:00" 
  });

  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "Kitchen Staff" as Employee["role"],
    schedule: "09:00 - 18:00",
    attendance: "Present" as Employee["attendance"]
  });

  // LOAD BALANCER CLIENT STATE
  const [loadBalancerAlgorithm, setLoadBalancerAlgorithm] = useState<string>("RoundRobin");
  const [loadBalancerAutoEnabled, setLoadBalancerAutoEnabled] = useState<boolean>(true);
  const [loadBalancerLogs, setLoadBalancerLogs] = useState<string[]>([]);

  // CREATION FORMS
  const [newHotelForm, setNewHotelForm] = useState({
    name: "",
    tagline: "",
    plan: "Basic" as "Basic" | "Professional" | "Enterprise",
    primaryColor: "#C96A4A",
    secondaryColor: "#EEDC82",
    username: "",
    password: ""
  });
  
  const [newTableForm, setNewTableForm] = useState({
    number: "",
    seatingCapacity: 4
  });

  const [newMenuForm, setNewMenuForm] = useState({
    name: "",
    category: "Momo & Dumplings",
    price: 300,
    description: "",
    prepTime: "15 min",
    ingredients: "",
    allergens: ""
  });

  const [superAdminSelectedHotelId, setSuperAdminSelectedHotelId] = useState<string>("");
  const [superAdminMenuForm, setSuperAdminMenuForm] = useState({
    name: "",
    category: "Momo & Dumplings",
    price: 300,
    description: "",
    prepTime: "15 min",
    ingredients: "",
    allergens: ""
  });

  // TENANT CUSTOM BRAND BRANDING STATE
  const [customizerHotelId, setCustomizerHotelId] = useState<string>("");
  const [customizerName, setCustomizerName] = useState<string>("");
  const [customizerTagline, setCustomizerTagline] = useState<string>("");
  const [customizerPrimary, setCustomizerPrimary] = useState<string>("#C96A4A");
  const [customizerSecondary, setCustomizerSecondary] = useState<string>("#EEDC82");
  const [customizerFont, setCustomizerFont] = useState<string>("Inter");
  const [customizerUsername, setCustomizerUsername] = useState<string>("");
  const [customizerPassword, setCustomizerPassword] = useState<string>("");

  // SUPER ADMIN PORTAL TABS
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState<"tenants" | "branding" | "menu" | "analytics" | "branches">("tenants");
  const [superAdminMultiBranchHotelId, setSuperAdminMultiBranchHotelId] = useState<string>("");

  // SUPER ADMIN BRANCH PROVISIONING STATE
  const [superAdminNewBranchHotelId, setSuperAdminNewBranchHotelId] = useState<string>("");
  const [superAdminNewBranchName, setSuperAdminNewBranchName] = useState<string>("");
  const [superAdminNewBranchLocation, setSuperAdminNewBranchLocation] = useState<string>("");
  const [superAdminNewBranchContact, setSuperAdminNewBranchContact] = useState<string>("");
  const [superAdminNewBranchHours, setSuperAdminNewBranchHours] = useState<string>("09:00 - 22:00");
  const [superAdminNewBranchTables, setSuperAdminNewBranchTables] = useState<number>(0);

  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; itemId: string; itemName: string } | null>(null);

  const [showNotification, setShowNotification] = useState<string | null>(null);

  // FETCH ALL DATA WITH OPTIMIZED RETRY AND FALLBACK
  const fetchWithFallbackAndRetry = async <T,>(url: string, fallback: T, retries = 10, delay = 300): Promise<T> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return await response.json() as T;
      } catch (err) {
        console.warn(`Attempt ${attempt} failed to fetch "${url}":`, err);
        if (attempt === retries) {
          console.warn(`All ${retries} attempts failed for "${url}". Falling back to default.`);
          return fallback;
        }
        // Exponential backoff capped at 2000ms
        const sleepTime = Math.min(delay * Math.pow(2, attempt - 1), 2000);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
      }
    }
    return fallback;
  };

  const fetchData = async () => {
    try {
      setSyncStatus("Syncing...");
      const [resHotels, resTables, resMenu, resOrders, resStock, resEmployees, resRooms, resCalls, resLbConfig] = await Promise.all([
        fetchWithFallbackAndRetry<any[]>("/api/hotels", []),
        fetchWithFallbackAndRetry<any[]>("/api/tables", []),
        fetchWithFallbackAndRetry<any[]>("/api/menu", []),
        fetchWithFallbackAndRetry<any[]>("/api/orders", []),
        fetchWithFallbackAndRetry<any[]>("/api/inventory", []),
        fetchWithFallbackAndRetry<any[]>("/api/employees", []),
        fetchWithFallbackAndRetry<any[]>("/api/rooms", []),
        fetchWithFallbackAndRetry<any[]>("/api/service-calls", []),
        fetchWithFallbackAndRetry<any>("/api/load-balancer/config", { activeBalancingAlgorithm: "RoundRobin", autoBalancingEnabled: true })
      ]);

      setHotels(resHotels);
      setTables(resTables);
      setMenuItems(resMenu);
      setOrders(resOrders);
      setStockItems(resStock);
      setEmployees(resEmployees);
      setRooms(resRooms);
      setServiceCalls(resCalls);
      if (resLbConfig) {
        setLoadBalancerAlgorithm(resLbConfig.activeBalancingAlgorithm || "RoundRobin");
        setLoadBalancerAutoEnabled(resLbConfig.autoBalancingEnabled !== false);
      }
      
      setSyncStatus("Synchronized");
      setLoading(false);
      
      // Fetch staff notifications if an employee is active
      if (selectedStaffId) {
        await fetchStaffNotifications(selectedStaffId);
      }
    } catch (err) {
      console.error("Error synchronizing system data:", err);
      setSyncStatus("Failed to Sync");
      setLoading(false);
    }
  };

  const fetchStaffNotifications = async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff-notifications?employeeId=${staffId}`);
      if (response.ok) {
        const notifs = await response.json();
        setStaffNotifications(notifs);
      }
    } catch (err) {
      console.error("Error fetching staff notifications:", err);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/staff-notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      });
      if (response.ok) {
        if (selectedStaffId) {
          await fetchStaffNotifications(selectedStaffId);
        }
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!selectedStaffId) return;
    try {
      const response = await fetch("/api/staff-notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedStaffId })
      });
      if (response.ok) {
        await fetchStaffNotifications(selectedStaffId);
        triggerNotification("All staff alerts acknowledged.");
      }
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto sync every 5 seconds to simulate Supabase Realtime & ensure immediate auto-sync
    const interval = setInterval(fetchData, 5000);

    // Parse URL Search Parameters for Table QR scans
    const params = new URLSearchParams(window.location.search);
    const hId = params.get("hotelId");
    const bId = params.get("branchId");
    const tId = params.get("tableId");
    const qrRole = params.get("role");

    if (hId) {
      setCurrentHotelId(hId);
    }
    if (bId) {
      setCurrentBranchId(bId);
    }
    if (tId) {
      setActiveGuestTableId(tId);
      setActiveRole("Guest");
      setTimeout(() => {
        triggerNotification(`Table QR Code scanned successfully. Welcome to Guest Table View!`);
      }, 500);
    } else if (qrRole === "Guest") {
      setActiveRole("Guest");
    }

    return () => {
      clearInterval(interval);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Update tick every second for real-time countdown tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      fetchStaffNotifications(selectedStaffId);
    } else {
      setStaffNotifications([]);
    }
  }, [selectedStaffId]);

  // Dynamic custom brand identity injection for the active hotel tenant
  useEffect(() => {
    const resolvedActiveHotel = hotels.find(h => h.id === currentHotelId) || hotels[0];
    if (!resolvedActiveHotel || activeRole === "SuperAdmin") {
      // Clean up styles if in SuperAdmin role
      const el = document.getElementById("tenant-dynamic-styles");
      if (el) el.remove();
      return;
    }
    
    let styleEl = document.getElementById("tenant-dynamic-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "tenant-dynamic-styles";
      document.head.appendChild(styleEl);
    }
    
    const primary = resolvedActiveHotel.primaryColor || "#C96A4A";
    const secondary = resolvedActiveHotel.secondaryColor || "#EEDC82";
    const font = resolvedActiveHotel.font || "Inter";
    
    let fontStack = "sans-serif";
    if (font === "Space Grotesk") fontStack = '"Space Grotesk", sans-serif';
    else if (font === "Outfit") fontStack = '"Outfit", sans-serif';
    else if (font === "Playfair Display") fontStack = '"Playfair Display", serif';
    else if (font === "Instrument Serif") fontStack = '"Instrument Serif", serif';
    else if (font === "JetBrains Mono") fontStack = '"JetBrains Mono", monospace';
    else fontStack = '"Inter", sans-serif';

    styleEl.innerHTML = `
      :root {
        --tenant-primary: ${primary};
        --tenant-secondary: ${secondary};
        --tenant-font: ${fontStack};
      }
      
      /* Dynamic theme class overrides */
      body, button, select, input, textarea, div, p, span, h1, h2, h3, h4, h5, h6 {
        font-family: var(--tenant-font), "Inter", sans-serif !important;
      }
      
      .text-terracotta {
        color: var(--tenant-primary) !important;
      }
      .bg-terracotta {
        background-color: var(--tenant-primary) !important;
      }
      .border-terracotta {
        border-color: var(--tenant-primary) !important;
      }
      .hover\\:bg-terracotta:hover {
        background-color: var(--tenant-primary) !important;
      }
      .hover\\:text-terracotta:hover {
        color: var(--tenant-primary) !important;
      }
      .hover\\:border-terracotta:hover {
        border-color: var(--tenant-primary) !important;
      }
      .bg-sand {
        background-color: var(--tenant-secondary) !important;
      }
      .text-sand {
        color: var(--tenant-secondary) !important;
      }
      .border-sand {
        border-color: var(--tenant-secondary) !important;
      }
      .bg-sand-light {
        background-color: color-mix(in srgb, var(--tenant-secondary) 15%, #ffffff) !important;
      }
    `;
    
    return () => {
      const el = document.getElementById("tenant-dynamic-styles");
      if (el) el.remove();
    };
  }, [hotels, currentHotelId, activeRole]);

  // Load selected hotel details into customizer when the dropdown selection changes
  useEffect(() => {
    const targetId = customizerHotelId || (hotels.length ? hotels[0].id : "");
    if (!targetId) return;
    const hotel = hotels.find(h => h.id === targetId);
    if (hotel) {
      setCustomizerName(hotel.name);
      setCustomizerTagline(hotel.tagline || "");
      setCustomizerPrimary(hotel.primaryColor || "#C96A4A");
      setCustomizerSecondary(hotel.secondaryColor || "#EEDC82");
      setCustomizerFont(hotel.font || "Inter");
      setCustomizerUsername(hotel.username || "");
      setCustomizerPassword(hotel.password || "");
    }
  }, [customizerHotelId, hotels]);

  // NOTIFICATION UTILITY
  const triggerNotification = (msg: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setShowNotification(msg);
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(null);
      notificationTimeoutRef.current = null;
    }, 4000);
  };

  // HANDLERS
  const handleHotelLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await fetch("/api/hotels/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const hotel = data.hotel;
        setLoggedInHotelId(hotel.id);
        setCurrentHotelId(hotel.id);
        if (hotel.branches && hotel.branches.length > 0) {
          setCurrentBranchId(hotel.branches[0].id);
        }
        triggerNotification(`Logged in successfully to ${hotel.name}!`);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        setLoginError(data.error || "Login failed. Please verify credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Connection error while logging in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleHotelLogout = () => {
    setLoggedInHotelId(null);
    triggerNotification("Logged out of hotel session.");
  };

  const handleOnboardHotel = async (e: FormEvent) => {
    e.preventDefault();
    if (!newHotelForm.name) return;
    try {
      setSyncStatus("Onboarding...");
      const response = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHotelForm)
      });
      if (response.ok) {
        triggerNotification(`Hotel "${newHotelForm.name}" has been successfully onboarded and default systems provisioned.`);
        setNewHotelForm({
          name: "",
          tagline: "",
          plan: "Basic",
          primaryColor: "#C96A4A",
          secondaryColor: "#EEDC82",
          username: "",
          password: ""
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuperAdminProvisionBranch = async (e: FormEvent) => {
    e.preventDefault();
    const targetHotelId = superAdminNewBranchHotelId || (hotels.length ? hotels[0].id : "");
    if (!targetHotelId) {
      triggerNotification("Please select a target hotel tenant first.");
      return;
    }
    if (!superAdminNewBranchName.trim()) {
      triggerNotification("Branch name is required.");
      return;
    }
    try {
      setSyncStatus("Syncing...");
      const response = await fetch(`/api/hotels/${targetHotelId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: superAdminNewBranchName,
          location: superAdminNewBranchLocation,
          contactPhone: superAdminNewBranchContact,
          operatingHours: superAdminNewBranchHours,
          autoCreateTables: superAdminNewBranchTables,
          status: "Approved"
        })
      });
      if (response.ok) {
        triggerNotification(`Branch "${superAdminNewBranchName}" has been directly provisioned and activated.`);
        setSuperAdminNewBranchName("");
        setSuperAdminNewBranchLocation("");
        setSuperAdminNewBranchContact("");
        setSuperAdminNewBranchHours("09:00 - 22:00");
        setSuperAdminNewBranchTables(0);
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to provision branch.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error provisioning branch.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleApproveBranch = async (hotelId: string, branchId: string, branchName: string) => {
    try {
      setSyncStatus("Approving...");
      const response = await fetch(`/api/hotels/${hotelId}/branches/${branchId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        triggerNotification(`Branch "${branchName}" has been officially approved and activated.`);
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to approve branch.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error approving branch.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleRejectBranch = async (hotelId: string, branchId: string, branchName: string) => {
    try {
      setSyncStatus("Rejecting...");
      const response = await fetch(`/api/hotels/${hotelId}/branches/${branchId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerNotification(`Branch request for "${branchName}" has been rejected and deleted.`);
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to reject branch request.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error rejecting branch request.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleAddTable = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTableForm.number) return;
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: currentHotelId,
          branchId: currentBranchId,
          number: newTableForm.number,
          seatingCapacity: newTableForm.seatingCapacity
        })
      });
      if (response.ok) {
        triggerNotification(`Table ${newTableForm.number} added and unique QR code configured.`);
        setNewTableForm({ number: "", seatingCapacity: 4 });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMenuItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMenuForm.name || !newMenuForm.price) return;
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: currentHotelId,
          name: newMenuForm.name,
          category: newMenuForm.category,
          price: newMenuForm.price,
          description: newMenuForm.description,
          prepTime: newMenuForm.prepTime,
          ingredients: newMenuForm.ingredients.split(",").map(i => i.trim()),
          allergens: newMenuForm.allergens.split(",").map(i => i.trim()),
        })
      });
      if (response.ok) {
        triggerNotification(`Menu Item "${newMenuForm.name}" has been added to the dynamic catalog.`);
        setNewMenuForm({
          name: "",
          category: "Momo & Dumplings",
          price: 300,
          description: "",
          prepTime: "15 min",
          ingredients: "",
          allergens: ""
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMenuItem = (itemId: string, itemName: string) => {
    setDeleteConfirmState({ isOpen: true, itemId, itemName });
  };

  const executeDeleteMenuItem = async (itemId: string, itemName: string) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerNotification(`Menu Item "${itemName}" has been successfully deleted.`);
        await fetchData();
      } else {
        triggerNotification(`Failed to delete menu item.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`Error deleting menu item.`);
    } finally {
      setDeleteConfirmState(null);
    }
  };

  const handleToggleBranchMenuAvailability = async (itemId: string, branchId: string) => {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    const allBranches = activeHotel?.branches.map(b => b.id) || [];
    const currentAvailability = item.branchAvailability || allBranches;
    
    let newAvailability: string[];
    if (currentAvailability.includes(branchId)) {
      newAvailability = currentAvailability.filter(id => id !== branchId);
    } else {
      newAvailability = [...currentAvailability, branchId];
    }

    try {
      setSyncStatus("Updating branch availability...");
      const response = await fetch(`/api/menu/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchAvailability: newAvailability })
      });
      if (response.ok) {
        triggerNotification(`Branch menu mapping updated successfully.`);
        await fetchData();
      } else {
        triggerNotification(`Failed to update menu configuration.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleSaveCustomBranding = async (e: FormEvent) => {
    e.preventDefault();
    const targetId = customizerHotelId || (hotels.length ? hotels[0].id : "");
    if (!targetId) {
      triggerNotification("Please select a hotel tenant first.");
      return;
    }
    
    try {
      setSyncStatus("Persisting branding...");
      const response = await fetch(`/api/hotels/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customizerName,
          tagline: customizerTagline,
          primaryColor: customizerPrimary,
          secondaryColor: customizerSecondary,
          font: customizerFont,
          username: customizerUsername,
          password: customizerPassword
        })
      });
      
      if (response.ok) {
        triggerNotification(`Corporate details and branding for "${customizerName}" successfully updated, auto-synced, and persisted.`);
        await fetchData();
      } else {
        triggerNotification("Failed to save customization details.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error persisting customization details.");
    }
  };

  const handleSuperAdminAddMenuItem = async (e: FormEvent) => {
    e.preventDefault();
    const targetHotelId = superAdminSelectedHotelId || (hotels.length ? hotels[0].id : "");
    if (!targetHotelId) {
      triggerNotification("No hotel selected or available to add menu items to.");
      return;
    }
    if (!superAdminMenuForm.name || !superAdminMenuForm.price) return;
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: targetHotelId,
          name: superAdminMenuForm.name,
          category: superAdminMenuForm.category,
          price: superAdminMenuForm.price,
          description: superAdminMenuForm.description,
          prepTime: superAdminMenuForm.prepTime,
          ingredients: superAdminMenuForm.ingredients.split(",").map(i => i.trim()),
          allergens: superAdminMenuForm.allergens.split(",").map(i => i.trim()),
        })
      });
      if (response.ok) {
        triggerNotification(`Menu Item "${superAdminMenuForm.name}" has been added to the catalog for tenant ${targetHotelId}.`);
        setSuperAdminMenuForm({
          name: "",
          category: "Momo & Dumplings",
          price: 300,
          description: "",
          prepTime: "15 min",
          ingredients: "",
          allergens: ""
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        triggerNotification(`Order #${orderId} state updated to: ${status}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderPayment = async (orderId: string, paymentStatus: string, paymentMethod?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus, paymentMethod })
      });
      if (response.ok) {
        triggerNotification(`Order #${orderId} marked as ${paymentStatus}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, status: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        triggerNotification(`Room ${roomId} housekeeping status: ${status}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStockQuantity = async (stockId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${stockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      if (response.ok) {
        triggerNotification("Inventory stock adjustments recorded.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleServiceCall = async (type: "Call Waiter" | "Request Bill" | "Water Refill") => {
    const activeTable = tables.find(t => t.id === activeGuestTableId);
    if (!activeTable) return;
    try {
      const response = await fetch("/api/service-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: currentHotelId,
          branchId: currentBranchId,
          tableId: activeGuestTableId,
          tableNumber: activeTable.number,
          type
        })
      });
      if (response.ok) {
        triggerNotification(`Service Alert dispatched: "${type}" for Table ${activeTable.number}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveServiceCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/service-calls/${callId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" })
      });
      if (response.ok) {
        triggerNotification("Service request resolved and logged.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // GUEST GOURMET CART FUNCTIONS
  const handleAddToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menuItem.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItem: item, quantity: 1, notes: "" }]);
    }
    triggerNotification(`Added ${item.name} to order.`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.menuItem.id !== itemId));
  };

  const handleCheckoutCart = async () => {
    if (!cart.length) return;
    const activeTable = tables.find(t => t.id === activeGuestTableId);
    if (!activeTable) return;

    try {
      const items = cart.map(c => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        quantity: c.quantity,
        price: c.menuItem.price,
        notes: c.notes
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: currentHotelId,
          branchId: currentBranchId,
          tableId: activeGuestTableId,
          tableNumber: activeTable.number,
          items,
          customerNotes: customerOrderNotes,
          paymentMethod
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        setPlacedOrderId(orderData.id);
        setCart([]);
        setCustomerOrderNotes("");
        triggerNotification(`Order Placed! ID: ${orderData.id}. Send to Kitchen instantly.`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI BUTLER GENERATIONS
  const handleAiRecommend = async (queryText?: string) => {
    const searchVal = queryText || guestAiQuery;
    if (!searchVal.trim()) return;

    // Clear input
    setGuestAiQuery("");

    // Append user query to chat history
    const updatedHistory = [
      ...guestAiHistory,
      { sender: "user" as const, text: searchVal }
    ];
    setGuestAiHistory(updatedHistory);
    setAiLoading(true);

    try {
      // Map history for the payload, ensuring we only send the relevant turns
      const chatHistoryPayload = updatedHistory
        .slice(1) // exclude the initial butler welcome message to keep payload focused
        .map(h => ({
          sender: h.sender,
          text: h.text
        }));

      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchVal,
          hotelId: currentHotelId,
          chatHistory: chatHistoryPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGuestAiHistory(prev => [
          ...prev,
          {
            sender: "butler" as const,
            text: data.recommendation,
            suggestedItemIds: data.suggestedItemIds || []
          }
        ]);
      } else {
        throw new Error("Failed to consult AI Butler.");
      }
    } catch (err) {
      console.error(err);
      setGuestAiHistory(prev => [
        ...prev,
        {
          sender: "butler" as const,
          text: "My apologies, guest. The digital terminal is experiencing minor connectivity issues. Please try again or ask our staff directly."
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFetchBiInsights = async () => {
    setBiLoading(true);
    setBiInsights("");
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: currentHotelId })
      });
      const data = await response.json();
      setBiInsights(data.insights);
    } catch (err) {
      console.error(err);
      setBiInsights("Failed to compile real-time AI metrics.");
    } finally {
      setBiLoading(false);
    }
  };

  const handleFetchRestockPrediction = async () => {
    setRestockLoading(true);
    setRestockPrediction("");
    try {
      const response = await fetch("/api/ai/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: currentHotelId })
      });
      const data = await response.json();
      setRestockPrediction(data.prediction);
    } catch (err) {
      console.error(err);
    } finally {
      setRestockLoading(false);
    }
  };

  // LOAD BALANCER EVENT HANDLERS
  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name) return;
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: currentHotelId,
          name: newStaffForm.name,
          role: newStaffForm.role,
          branchId: currentBranchId,
          attendance: newStaffForm.attendance,
          schedule: newStaffForm.schedule
        })
      });
      if (response.ok) {
        triggerNotification(`Employee "${newStaffForm.name}" successfully added to staff registry.`);
        setNewStaffForm({
          name: "",
          role: "Kitchen Staff",
          schedule: "09:00 - 18:00",
          attendance: "Present"
        });
        await fetchData();
      } else {
        triggerNotification(`Failed to add employee.`);
      }
    } catch (err) {
      console.error("Error adding employee:", err);
      triggerNotification(`Error registering employee.`);
    }
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    try {
      const response = await fetch(`/api/employees/${empId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerNotification(`Employee "${empName}" successfully removed from staff registry.`);
        await fetchData();
      } else {
        triggerNotification(`Failed to remove employee.`);
      }
    } catch (err) {
      console.error("Error removing employee:", err);
      triggerNotification(`Error removing employee.`);
    }
  };

  const handleUpdateEmployeeAttendance = async (employeeId: string, attendance: "Present" | "Absent" | "On Leave") => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance })
      });
      if (response.ok) {
        triggerNotification(`Staff status updated successfully.`);
        await fetchData();
      }
    } catch (err) {
      console.error("Error updating employee status:", err);
    }
  };

  const getShiftHours = (shiftStr?: string): number => {
    if (!shiftStr) return 0;
    const s = shiftStr.toLowerCase();
    if (s.includes("off")) return 0;
    
    const match = s.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
    if (match) {
      const h1 = parseInt(match[1]);
      const h2 = parseInt(match[3]);
      if (!isNaN(h1) && !isNaN(h2)) {
        let diff = h2 - h1;
        if (diff < 0) diff += 24;
        return diff;
      }
    }
    
    if (s.includes("morning")) return 8;
    if (s.includes("day")) return 9;
    if (s.includes("evening")) return 8;
    if (s.includes("night")) return 8;
    
    return 8; // Default scheduled hours
  };

  const handleUpdateEmployeeShift = async (employeeId: string, day: string, shift: string) => {
    try {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return;
      const updatedShifts = {
        ...(emp.weeklyShifts || {}),
        [day]: shift
      };
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyShifts: updatedShifts })
      });
      if (response.ok) {
        triggerNotification(`Shift assigned for ${emp.name} on ${day}.`);
        await fetchData();
      }
    } catch (err) {
      console.error("Error updating employee shift:", err);
      triggerNotification("Failed to update shift schedule.");
    }
  };

  const handleUpdateEmployeeRate = async (employeeId: string, hourlyRate: number) => {
    try {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return;
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate })
      });
      if (response.ok) {
        triggerNotification(`Hourly rate updated for ${emp.name} to ${activeHotel?.currency || "NPR"} ${hourlyRate}.`);
        await fetchData();
      }
    } catch (err) {
      console.error("Error updating employee rate:", err);
      triggerNotification("Failed to update hourly rate.");
    }
  };

  const handleAssignWaiterToTable = async (tableId: string, waiterId: string) => {
    try {
      const waiter = employees.find(e => e.id === waiterId);
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedWaiterId: waiterId || null,
          assignedWaiterName: waiter ? waiter.name : null
        })
      });
      if (response.ok) {
        triggerNotification(waiter ? `Assigned Table to waiter: ${waiter.name}.` : "Cleared waiter table assignment.");
        await fetchData();
      }
    } catch (err) {
      console.error("Error assigning waiter to table:", err);
      triggerNotification("Failed to assign waiter to table.");
    }
  };

  const handleReassignWaiterForServiceCall = async (callId: string, waiterId: string) => {
    try {
      const waiter = employees.find(e => e.id === waiterId);
      const response = await fetch(`/api/service-calls/${callId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedWaiterId: waiterId || null,
          assignedWaiterName: waiter ? waiter.name : null
        })
      });
      if (response.ok) {
        triggerNotification(waiter ? `Alert routed to waiter: ${waiter.name}.` : "Cleared service alert assignment.");
        await fetchData();
      }
    } catch (err) {
      console.error("Error reassigning service call waiter:", err);
      triggerNotification("Failed to route service call.");
    }
  };

  const handleAutoOptimizeWaiterAssignments = async () => {
    try {
      const activeWaiters = employees.filter(e => 
        e.hotelId === currentHotelId && 
        e.branchId === currentBranchId && 
        e.role === "Waiter" && 
        e.attendance === "Present"
      );
      if (activeWaiters.length === 0) {
        triggerNotification("Optimization Error: No on-duty, Present waiters found for this branch to optimize.");
        return;
      }
      const currentBranchTables = tables.filter(t => t.hotelId === currentHotelId && t.branchId === currentBranchId);
      if (currentBranchTables.length === 0) {
        triggerNotification("Optimization Error: No tables found in the active branch.");
        return;
      }

      // Greedy Capacity Load-Balancing Optimization Heuristic
      // 1. Sort tables in descending order of seating capacity
      const sortedTables = [...currentBranchTables].sort((a, b) => b.seatingCapacity - a.seatingCapacity);
      
      // 2. Track assigned capacity weight per waiter
      const waiterAssignments: { [waiterId: string]: { capacity: number; tables: string[] } } = {};
      activeWaiters.forEach(w => {
        waiterAssignments[w.id] = { capacity: 0, tables: [] };
      });

      // 3. Greedy distribution to minimize capacity variance
      for (const table of sortedTables) {
        let selectedWaiterId = activeWaiters[0].id;
        let minCap = Infinity;
        for (const waiter of activeWaiters) {
          const cap = waiterAssignments[waiter.id].capacity;
          if (cap < minCap) {
            minCap = cap;
            selectedWaiterId = waiter.id;
          }
        }
        waiterAssignments[selectedWaiterId].capacity += table.seatingCapacity;
        waiterAssignments[selectedWaiterId].tables.push(table.id);
      }

      // 4. Dispatch batch requests
      const updatePromises = [];
      for (const waiterId of Object.keys(waiterAssignments)) {
        const waiter = activeWaiters.find(w => w.id === waiterId)!;
        for (const tableId of waiterAssignments[waiterId].tables) {
          updatePromises.push(
            fetch(`/api/tables/${tableId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assignedWaiterId: waiterId,
                assignedWaiterName: waiter.name
              })
            })
          );
        }
      }

      await Promise.all(updatePromises);
      triggerNotification("Optimization Successful: Tables balanced across on-duty waiters.");
      await fetchData();
    } catch (err) {
      console.error("Error auto-optimizing waiter assignments:", err);
      triggerNotification("Failed to run waiter assignment optimization.");
    }
  };

  const handleUpdateLoadBalancerConfig = async (algorithm: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/load-balancer/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm, enabled })
      });
      if (response.ok) {
        const data = await response.json();
        setLoadBalancerAlgorithm(data.activeBalancingAlgorithm);
        setLoadBalancerAutoEnabled(data.autoBalancingEnabled);
        triggerNotification(`Load balancer mode updated to: ${data.activeBalancingAlgorithm}`);
        await fetchData();
      }
    } catch (err) {
      console.error("Error updating load balancer config:", err);
    }
  };

  const handleTriggerRebalance = async () => {
    try {
      const response = await fetch("/api/load-balancer/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: currentHotelId, branchId: currentBranchId })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          setLoadBalancerLogs(data.logs);
        }
        triggerNotification(data.message || "Active workload re-allocated successfully!");
        await fetchData();
      } else {
        const err = await response.json();
        triggerNotification(err.error || "Failed to trigger workload re-balancing.");
      }
    } catch (err) {
      console.error("Error triggering workload rebalance:", err);
    }
  };

  const handleAssignOrderStaff = async (orderId: string, staffId: string, staffName: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: staffId, assignedStaffName: staffName })
      });
      if (response.ok) {
        triggerNotification(`Order #${orderId} assigned to ${staffName}`);
        await fetchData();
      }
    } catch (err) {
      console.error("Error assigning order staff:", err);
    }
  };

  const handleConfirmReservation = async (tableId: string, guestName: string, time: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Reserved",
          reservedName: guestName,
          reservedTime: time
        })
      });
      if (response.ok) {
        triggerNotification(`Table reservation confirmed for ${guestName} at ${time}.`);
        setReservingTable(null);
        setReservationName("");
        setReservationTime("");
        await fetchData();
      } else {
        triggerNotification("Failed to update table reservation.");
      }
    } catch (err) {
      console.error("Error reserving table:", err);
      triggerNotification("Error reserving table.");
    }
  };

  // UTILITIES
  interface BiInsightData {
    executiveSummary: string;
    insights: {
      title: string;
      category: string;
      metric: string;
      description: string;
      action: string;
    }[];
  }

  interface RestockReportData {
    reportTitle: string;
    predictions: {
      itemName: string;
      currentQuantity: string;
      depletionRisk: "HIGH" | "MEDIUM" | "LOW";
      recommendedOrder: string;
      supplier: string;
    }[];
  }

  const parseBiInsights = (raw: string): BiInsightData | null => {
    try {
      return JSON.parse(raw) as BiInsightData;
    } catch {
      return null;
    }
  };

  const parseRestockPrediction = (raw: string): RestockReportData | null => {
    try {
      return JSON.parse(raw) as RestockReportData;
    } catch {
      return null;
    }
  };

  const activeHotel = useMemo(() => hotels.find(h => h.id === currentHotelId) || hotels[0], [hotels, currentHotelId]);
  const activeBranch = useMemo(() => activeHotel?.branches.find(b => b.id === currentBranchId) || activeHotel?.branches[0], [activeHotel, currentBranchId]);
  const hotelTables = useMemo(() => tables.filter(t => t.hotelId === currentHotelId), [tables, currentHotelId]);
  const hotelMenu = useMemo(() => {
    return menuItems.filter(m => {
      if (m.hotelId !== currentHotelId) return false;
      if (activeRole === "Guest" || activeRole === "WaiterCashier" || activeRole === "Kitchen") {
        if (m.branchAvailability && m.branchAvailability.length > 0) {
          const activeBranchId = currentBranchId || (activeHotel?.branches[0]?.id);
          if (activeBranchId) {
            return m.branchAvailability.includes(activeBranchId);
          }
        }
      }
      return true;
    });
  }, [menuItems, currentHotelId, activeRole, currentBranchId, activeHotel]);
  const hotelOrders = useMemo(() => orders.filter(o => o.hotelId === currentHotelId), [orders, currentHotelId]);
  const activeGuestTable = useMemo(() => tables.find(t => t.id === activeGuestTableId), [tables, activeGuestTableId]);

  // PLAN ENABLERS FOR MODULAR SAAS CAPABILITIES
  const planModules = {
    Basic: ["QR Ordering", "Billing", "Reports"],
    Professional: ["QR Ordering", "Billing", "Reports", "Kitchen Display", "Inventory", "Analytics", "AI Assistant"],
    Enterprise: ["QR Ordering", "Billing", "Reports", "Kitchen Display", "Inventory", "Analytics", "AI Assistant", "CRM", "Hotel Rooms", "Housekeeping", "Multi Branch"]
  };

  const currentPlan = activeHotel?.plan || "Basic";
  const enabledModules = useMemo(() => planModules[currentPlan], [currentPlan]);

  const hasModule = (moduleName: string) => {
    return enabledModules.includes(moduleName);
  };

  const filteredMenu = useMemo(() => {
    return hotelMenu.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [hotelMenu, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(hotelMenu.map(item => item.category)))];
  }, [hotelMenu]);

  // METRICS FOR DASHBOARD
  const metrics = useMemo(() => {
    const completedOrders = hotelOrders.filter(o => o.paymentStatus === "Paid");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalVolume = hotelOrders.length;
    const avgOrder = totalVolume ? Math.round(totalRevenue / (completedOrders.length || 1)) : 0;
    return { totalRevenue, totalVolume, avgOrder };
  }, [hotelOrders]);

  const revenueTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); // e.g. "Jul 3"
      
      const dayRevenue = hotelOrders
        .filter(o => {
          if (o.paymentStatus !== "Paid") return false;
          const orderDateStr = o.timestamp ? o.timestamp.split("T")[0] : "";
          return orderDateStr === dateStr;
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);

      data.push({
        date: dateStr,
        label,
        revenue: dayRevenue
      });
    }
    return data;
  }, [hotelOrders]);

  const staffAttendanceData = useMemo(() => {
    return employees
      .filter(e => e.hotelId === currentHotelId)
      .map(emp => {
        const idSum = emp.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        let baseHours = 160;
        if (emp.role === "Manager") baseHours = 176;
        else if (emp.role === "Kitchen Staff" || emp.role === "Kitchen Staff" as any) baseHours = 168;
        else if (emp.role === "Waiter") baseHours = 144;
        else if (emp.role === "Cashier") baseHours = 160;

        const randomAddition = idSum % 24;
        const hoursWorked = baseHours + randomAddition - (emp.attendance === "Absent" ? 16 : emp.attendance === "On Leave" ? 8 : 0);
        
        const totalDays = 30;
        const offDays = 4;
        let absentDays = idSum % 3;
        let leaveDays = idSum % 2;
        if (emp.attendance === "Absent") absentDays += 2;
        if (emp.attendance === "On Leave") leaveDays += 3;
        const presentDays = Math.max(0, totalDays - offDays - absentDays - leaveDays);

        return {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          hours: hoursWorked,
          present: presentDays,
          absent: absentDays,
          leave: leaveDays,
          off: offDays,
          attendanceRate: Math.round((presentDays / (totalDays - offDays)) * 100)
        };
      });
  }, [employees, currentHotelId]);

  // Get preparation time limit in minutes for an order (maximum of items' prep times)
  const getOrderPrepTimeMinutes = (order: Order) => {
    let maxMinutes = 10; // Default to 10 minutes if no matching item found or no prepTime set
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      const rawPrep = menuItem?.prepTime || "10 min";
      const matched = rawPrep.match(/\d+/);
      if (matched) {
        const mins = parseInt(matched[0], 10);
        if (mins > maxMinutes) {
          maxMinutes = mins;
        }
      }
    });
    return maxMinutes;
  };

  // Get countdown string and exceeded status
  const getOrderRemainingTime = (order: Order) => {
    const prepMinutes = getOrderPrepTimeMinutes(order);
    const orderTime = new Date(order.timestamp).getTime();
    const elapsedMs = nowTick - orderTime;
    const totalPrepMs = prepMinutes * 60 * 1000;
    const remainingMs = totalPrepMs - elapsedMs;
    const isExceeded = remainingMs < 0;
    
    const absoluteMs = Math.abs(remainingMs);
    const minutes = Math.floor(absoluteMs / 60000);
    const seconds = Math.floor((absoluteMs % 60000) / 1000);
    
    const formattedStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return {
      formatted: isExceeded ? `-${formattedStr}` : formattedStr,
      isExceeded,
      percentage: Math.max(0, Math.min(100, (remainingMs / totalPrepMs) * 100))
    };
  };

  // Get last used payment method in the order system history
  const getLastUsedPaymentMethod = () => {
    const paidOrders = hotelOrders
      .filter(o => o.paymentStatus === "Paid" && o.paymentMethod)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return paidOrders.length > 0 ? paidOrders[0].paymentMethod : "Cash";
  };

  // Export current order revenue and metrics as a CSV file
  const handleExportCSV = () => {
    try {
      const headers = ["Order ID", "Table Number", "Timestamp", "Status", "Payment Status", "Payment Method", "Total Amount"];
      const rows = hotelOrders.map(o => [
        `"${o.id}"`,
        `"${o.tableNumber}"`,
        `"${o.timestamp}"`,
        `"${o.status}"`,
        `"${o.paymentStatus}"`,
        `"${o.paymentMethod || "N/A"}"`,
        o.totalAmount
      ]);

      const csvContent = [
        ["--- DASHBOARD REVENUE & METRICS SUMMARY ---"],
        ["Total Sales (Completed)", `NPR ${metrics.totalRevenue}`],
        ["Orders Volume", `${metrics.totalVolume} Placed`],
        ["Average Order Value", `NPR ${metrics.avgOrder}`],
        [],
        ["--- DETAILED AUDITED ORDER LIST ---"],
        headers,
        ...rows
      ].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `revenue_report_${currentHotelId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification("Corporate CSV statement exported successfully.");
    } catch (err) {
      console.error(err);
      triggerNotification("Error exporting revenue statement.");
    }
  };

  // Top Performing Dishes calculation
  const topDishes = useMemo(() => {
    const completedOrders = hotelOrders.filter(o => o.paymentStatus === "Paid");
    const dishCounts: { [name: string]: { quantity: number; revenue: number; category: string } } = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const name = item.name;
        if (!dishCounts[name]) {
          const mItem = menuItems.find(m => m.id === item.menuItemId || m.name === name);
          dishCounts[name] = { 
            quantity: 0, 
            revenue: 0, 
            category: mItem?.category || "Other" 
          };
        }
        dishCounts[name].quantity += item.quantity;
        dishCounts[name].revenue += item.quantity * item.price;
      });
    });
    
    return Object.entries(dishCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [hotelOrders, menuItems]);

  // Export current order revenue, volume, and top-performing dishes as a beautiful Swiss-Minimalist PDF report
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 15;

      // 1. Top Decorative Bar in Slate/Charcoal
      doc.setFillColor(34, 34, 34);
      doc.rect(15, y, 180, 8, "F");
      y += 18;

      // 2. Title & Branding Block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      // Use active hotel color if available, default to Swiss terracotta Red
      doc.setTextColor(140, 45, 45); 
      const hotelTitle = (activeHotel?.name || "Himalayan Operations Hub").toUpperCase();
      doc.text(hotelTitle, 15, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(activeHotel?.tagline || "Dynamic Operations & Culinary Ledger Statement", 15, y);
      y += 10;

      // Double line separator
      doc.setLineWidth(1);
      doc.setDrawColor(34, 34, 34);
      doc.line(15, y, 195, y);
      y += 2;
      doc.setLineWidth(0.2);
      doc.line(15, y, 195, y);
      y += 10;

      // 3. Metadata Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(34, 34, 34);
      doc.text("REPORT METADATA & PARAMETERS", 15, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const todayStr = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = new Date().toLocaleTimeString("en-US");
      doc.text(`Statement Period: Today (${todayStr})`, 15, y);
      doc.text(`Time Generated: ${timeStr}`, 15, y + 5);
      doc.text(`SaaS Tenant Domain: ${currentHotelId}.hospitalityos.net`, 15, y + 10);
      doc.text(`Currency Ledger: ${activeHotel?.currency || "NPR"}`, 15, y + 15);
      y += 24;

      // 4. Highlight Cards (Revenue, Volume, Average Order Value)
      const colWidth = 56;
      const cardHeight = 24;

      // Total Revenue Box
      doc.setFillColor(245, 245, 245);
      doc.rect(15, y, colWidth, cardHeight, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(15, y, colWidth, cardHeight, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(140, 45, 45); // Terracotta Accent
      doc.text("TOTAL REVENUE (PAID)", 15 + 4, y + 6);
      doc.setFontSize(13);
      doc.setTextColor(34, 34, 34);
      doc.text(`${activeHotel?.currency || "NPR"} ${metrics.totalRevenue.toLocaleString()}`, 15 + 4, y + 16);

      // Order Volume Box
      doc.setFillColor(245, 245, 245);
      doc.rect(15 + colWidth + 6, y, colWidth, cardHeight, "F");
      doc.rect(15 + colWidth + 6, y, colWidth, cardHeight, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("TOTAL ORDER VOLUME", 15 + colWidth + 6 + 4, y + 6);
      doc.setFontSize(13);
      doc.setTextColor(34, 34, 34);
      doc.text(`${metrics.totalVolume} Placed`, 15 + colWidth + 6 + 4, y + 16);

      // Avg Order Value Box
      doc.setFillColor(245, 245, 245);
      doc.rect(15 + (colWidth * 2) + 12, y, colWidth, cardHeight, "F");
      doc.rect(15 + (colWidth * 2) + 12, y, colWidth, cardHeight, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("AVG ORDER VALUE", 15 + (colWidth * 2) + 12 + 4, y + 6);
      doc.setFontSize(13);
      doc.setTextColor(34, 34, 34);
      doc.text(`${activeHotel?.currency || "NPR"} ${metrics.avgOrder.toLocaleString()}`, 15 + (colWidth * 2) + 12 + 4, y + 16);

      y += cardHeight + 14;

      // 5. Top-Performing Dishes Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(34, 34, 34);
      doc.text("TOP-PERFORMING DISHES (BY QUANTITY SOLD)", 15, y);
      y += 6;

      // Table Header
      doc.setFillColor(34, 34, 34);
      doc.rect(15, y, 180, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Dish/Item Name", 18, y + 5);
      doc.text("Category", 85, y + 5);
      doc.text("Quantity Sold", 135, y + 5);
      doc.text("Revenue Generated", 165, y + 5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      if (topDishes.length === 0) {
        doc.text("No transactions processed yet during this shift.", 18, y + 6);
        y += 10;
      } else {
        topDishes.forEach((dish, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, y, 180, 7, "F");
          }
          doc.setTextColor(34, 34, 34);
          doc.text(dish.name, 18, y + 5);
          doc.setTextColor(100, 100, 100);
          doc.text(dish.category, 85, y + 5);
          doc.setTextColor(34, 34, 34);
          doc.text(dish.quantity.toString(), 135, y + 5);
          doc.text(`${activeHotel?.currency || "NPR"} ${dish.revenue.toLocaleString()}`, 165, y + 5);
          y += 7;
        });
      }
      y += 12;

      // 6. Audited Order Ledger (Condensed list)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(34, 34, 34);
      doc.text("RECENT TRANSACTIONS LEDGER", 15, y);
      y += 6;

      doc.setFillColor(140, 45, 45); // Terracotta Accent
      doc.rect(15, y, 180, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Order ID", 18, y + 5);
      doc.text("Table", 50, y + 5);
      doc.text("Payment Status", 75, y + 5);
      doc.text("Method", 115, y + 5);
      doc.text("Total", 145, y + 5);
      doc.text("Kitchen Status", 170, y + 5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const recentOrders = hotelOrders.slice(0, 8); // Show up to 8 recent orders to fit comfortably on 1 page
      if (recentOrders.length === 0) {
        doc.text("No transactions available.", 18, y + 6);
        y += 10;
      } else {
        recentOrders.forEach((o, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, y, 180, 7, "F");
          }
          doc.setTextColor(34, 34, 34);
          doc.text(o.id.substring(0, 12), 18, y + 5);
          doc.setTextColor(80, 80, 80);
          doc.text(`Table ${o.tableNumber}`, 50, y + 5);
          
          doc.setTextColor(o.paymentStatus === "Paid" ? 30 : 180, o.paymentStatus === "Paid" ? 120 : 50, o.paymentStatus === "Paid" ? 30 : 50);
          doc.text(o.paymentStatus, 75, y + 5);
          
          doc.setTextColor(80, 80, 80);
          doc.text(o.paymentMethod || "Cash", 115, y + 5);
          
          doc.setTextColor(34, 34, 34);
          doc.text(`${activeHotel?.currency || "NPR"} ${o.totalAmount.toLocaleString()}`, 145, y + 5);
          
          doc.setTextColor(100, 100, 100);
          doc.text(o.status, 170, y + 5);
          y += 7;
        });
      }

      // 7. Footer Block with Swiss Precision Mark
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 275, 195, 275);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("CONFIDENTIAL - AUTOMATED LEDGER SYSTEM STATEMENT", 15, 282);
      doc.text(`Page 1 of 1 • Generated via SaaS Operational Core`, 132, 282);

      // Save document
      const docName = `operational_summary_${currentHotelId}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(docName);
      triggerNotification(`Corporate PDF report exported successfully as ${docName}.`);
    } catch (err) {
      console.error(err);
      triggerNotification("System error generating jsPDF operational statement.");
    }
  };

  // --- Branch Management Handlers ---
  const handleAddBranch = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      triggerNotification("Branch name is required.");
      return;
    }
    try {
      setSyncStatus("Syncing...");
      const response = await fetch(`/api/hotels/${currentHotelId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranchForm)
      });
      if (response.ok) {
        const result = await response.json();
        triggerNotification(`Branch "${newBranchForm.name}" has been created successfully.`);
        setNewBranchForm({ 
          name: "", 
          location: "", 
          contactPhone: "", 
          operatingHours: "09:00 - 22:00", 
          autoCreateTables: 0 
        });
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to add new branch.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error adding branch.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleUpdateBranch = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBranchId) return;
    if (!editBranchForm.name.trim()) {
      triggerNotification("Branch name is required.");
      return;
    }
    try {
      setSyncStatus("Syncing...");
      const response = await fetch(`/api/hotels/${currentHotelId}/branches/${editingBranchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBranchForm)
      });
      if (response.ok) {
        triggerNotification("Branch details updated successfully.");
        setEditingBranchId(null);
        setEditBranchForm({ 
          name: "", 
          location: "", 
          contactPhone: "", 
          operatingHours: "09:00 - 22:00" 
        });
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to update branch.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error updating branch.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    // If the hotel only has 1 branch left, prevent deletion to avoid empty state issues
    if (activeHotel && activeHotel.branches.length <= 1) {
      triggerNotification("At least one branch must remain active in the system.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to permanently delete this branch and all its routing maps?")) {
      return;
    }

    try {
      setSyncStatus("Syncing...");
      const response = await fetch(`/api/hotels/${currentHotelId}/branches/${branchId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerNotification("Branch permanently decommissioned.");
        // If the current active branch is the one we deleted, shift to the remaining first branch
        if (currentBranchId === branchId && activeHotel) {
          const remaining = activeHotel.branches.filter(b => b.id !== branchId);
          if (remaining.length > 0) {
            setCurrentBranchId(remaining[0].id);
          }
        }
        await fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.error || "Failed to delete branch.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error deleting branch.");
    } finally {
      setSyncStatus("Synchronized");
    }
  };

  return (
    <div className="min-h-screen bg-swiss-light text-swiss-dark selection:bg-terracotta selection:text-white antialiased flex flex-col font-sans">
      
      {/* SYSTEM META STATUS HEADER */}
      {activeRole === "SuperAdmin" && (
        <div className="bg-swiss-dark text-swiss-light py-2 px-4 text-xs font-mono flex flex-wrap justify-between items-center gap-2 border-b-4 border-terracotta">
          <div className="flex items-center gap-3">
            <span className="font-bold uppercase tracking-wider text-sand">HospitalityOS v4.1</span>
            <span className="text-swiss-gray/60">|</span>
            <span>Tenant Domain: {activeHotel ? `${activeHotel.id}.hospitalityos.net` : "resolving..."}</span>
            <span className="text-swiss-gray/60">|</span>
            <span>SaaS Service: Cloud Run Active</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${syncStatus.includes("Sync") ? "bg-amber-400" : "bg-emerald-500"}`}></span>
              {syncStatus}
            </span>
            <button 
              onClick={fetchData} 
              className="hover:text-sand flex items-center gap-1 cursor-pointer transition-colors"
              title="Force synchronization with server storage"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
          </div>
        </div>
      )}

      {/* SWISS BRAND BAR */}
      <header className="border-b-4 border-swiss-dark bg-white px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {activeRole === "SuperAdmin" ? (
          <div>
            <div className="text-xs uppercase tracking-widest font-mono text-terracotta font-bold">
              SWISS DESIGN SYSTEM • MULTI-TENANT HOSPITALITY ARCHITECTURE
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight swiss-header mt-1 text-swiss-dark flex items-center gap-2">
              HospitalityOS <span className="text-xs bg-swiss-dark text-sand px-2 py-1 font-mono tracking-normal normal-case">Enterprise SaaS</span>
            </h1>
            <p className="text-sm font-mono text-swiss-dark/70 mt-1 max-w-xl">
              Sustaining 10,000+ businesses with absolute tenant data isolation, secure role-based access, and client-side simulated localized payment integrations.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-swiss-dark flex items-center gap-2 font-mono">
              HospitalityOS <span className="text-xs bg-terracotta text-white px-2.5 py-0.5 font-bold uppercase tracking-wider border border-swiss-dark">{activeRole} View</span>
            </h1>
          </div>
        )}

        {/* ACTIVE PORTAL SELECTOR */}
        <div className="bg-swiss-gray p-1 border-2 border-swiss-dark flex flex-wrap gap-1">
          <button 
            onClick={() => setActiveRole("SuperAdmin")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold transition-all ${
              activeRole === "SuperAdmin" ? "bg-terracotta text-white" : "hover:bg-swiss-light text-swiss-dark"
            }`}
          >
            Super Admin
          </button>
          <button 
            onClick={() => setActiveRole("HotelAdmin")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold transition-all ${
              activeRole === "HotelAdmin" ? "bg-terracotta text-white" : "hover:bg-swiss-light text-swiss-dark"
            }`}
          >
            Hotel Admin
          </button>
          <button 
            onClick={() => setActiveRole("Kitchen")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold transition-all ${
              activeRole === "Kitchen" ? "bg-terracotta text-white" : "hover:bg-swiss-light text-swiss-dark"
            }`}
          >
            Kitchen KDS
          </button>
          <button 
            onClick={() => setActiveRole("WaiterCashier")}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold transition-all ${
              activeRole === "WaiterCashier" ? "bg-terracotta text-white" : "hover:bg-swiss-light text-swiss-dark"
            }`}
          >
            Waiter/Cashier
          </button>
          <button 
            onClick={() => {
              setActiveRole("Guest");
              // Find first available table if current isn't valid
              if (hotelTables.length && !hotelTables.find(t => t.id === activeGuestTableId)) {
                setActiveGuestTableId(hotelTables[0].id);
              }
            }}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold transition-all ${
              activeRole === "Guest" ? "bg-terracotta text-white" : "hover:bg-swiss-light text-swiss-dark"
            }`}
          >
            Guest Table View
          </button>
        </div>
      </header>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmState && deleteConfirmState.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white border-2 border-swiss-dark max-w-md w-full p-6 font-mono text-xs shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-rose-100 border border-rose-800 text-rose-800 p-2.5 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-rose-800 tracking-tight mb-1">
                    Accidental Loss Prevention
                  </h4>
                  <p className="text-swiss-dark/60 uppercase text-[9px] font-bold">
                    Action Required: Confirm Removal
                  </p>
                </div>
              </div>
              
              <p className="text-swiss-dark text-xs mb-6 leading-relaxed">
                Are you absolutely sure you want to remove <span className="font-bold text-swiss-dark underline decoration-terracotta underline-offset-2">"{deleteConfirmState.itemName}"</span> from the active database menu catalog? This action will permanently delete the item and cannot be undone.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteConfirmState(null)}
                  className="bg-swiss-light hover:bg-swiss-gray text-swiss-dark py-2.5 border border-swiss-dark font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeDeleteMenuItem(deleteConfirmState.itemId, deleteConfirmState.itemName)}
                  className="bg-rose-800 hover:bg-rose-950 text-white py-2.5 border border-rose-950 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer text-center"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION NOTIFICATION */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-swiss-dark text-swiss-light border-l-8 border-terracotta p-4 max-w-md shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 font-mono text-xs">
          <Info className="text-sand shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <p className="font-bold uppercase text-sand mb-1">System Event Log</p>
            <p className="text-swiss-gray">{showNotification}</p>
          </div>
          <button onClick={() => setShowNotification(null)} className="text-swiss-gray hover:text-white cursor-pointer ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">

        {/* TENANT ROUTING HEADER & AUTH RULES (For roles other than SuperAdmin or Guest) */}
        {activeRole !== "SuperAdmin" && activeRole !== "Guest" && (
          loggedInHotelId === null ? (
            /* HOTEL OPERATOR LOGIN PANEL */
            <div className="max-w-md mx-auto my-12 bg-white border-2 border-swiss-dark p-8 shadow-md animate-fadeIn">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-terracotta text-white rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                  H
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-swiss-dark">Hotel Operator Login</h2>
                <p className="text-xs font-mono text-swiss-dark/60 mt-1">
                  Enter credentials provided by the Super Admin to access your dashboard.
                </p>
              </div>

              <form onSubmit={handleHotelLogin} className="space-y-4 font-mono text-xs">
                {loginError && (
                  <div className="bg-rose-50 border border-rose-600 text-rose-800 p-3 font-bold uppercase text-[10px]">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1 uppercase text-swiss-dark">Username</label>
                  <input 
                    type="text" 
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. yeti"
                    className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta font-bold text-sm"
                    disabled={loginLoading}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase text-swiss-dark">Password</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="e.g. yeti123"
                    className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta font-bold text-sm"
                    disabled={loginLoading}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-terracotta hover:bg-swiss-dark text-white p-3 font-bold uppercase transition-all tracking-wider cursor-pointer border-none flex items-center justify-center gap-2"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Authenticating..." : "Login to Property"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-dashed border-swiss-gray text-[10px] font-mono text-swiss-dark/50">
                <p className="font-bold uppercase mb-1">💡 Quick-Test Demo Credentials:</p>
                <p className="mb-1">Credentials can be dynamically configured in Super Admin dashboard.</p>
                <ul className="space-y-1">
                  <li>• Yak & Yeti: <span className="text-swiss-dark font-bold bg-swiss-gray px-1">yeti</span> / <span className="text-swiss-dark font-bold bg-swiss-gray px-1">yeti123</span></li>
                  <li>• Himalayan Java: <span className="text-swiss-dark font-bold bg-swiss-gray px-1">java</span> / <span className="text-swiss-dark font-bold bg-swiss-gray px-1">java123</span></li>
                </ul>
              </div>
            </div>
          ) : (
            /* TENANT ROUTING HEADER (ONLY SHOW WHEN AUTHENTICATED) */
            <div className="bg-sand-light border-2 border-swiss-dark p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-terracotta block font-bold">Active Subscriber Hotel</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold font-mono text-swiss-dark bg-white border border-swiss-dark px-3 py-1">
                      🏨 {activeHotel?.name}
                    </span>
                    <button 
                      onClick={handleHotelLogout}
                      className="text-[10px] text-rose-800 bg-rose-50 border border-rose-300 px-2 py-1 hover:bg-rose-100 hover:text-rose-950 font-mono font-bold uppercase cursor-pointer transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Branch selection: only multi-branch hotel admin can select branch */}
                {activeHotel && activeHotel.branches.length > 1 && activeRole === "HotelAdmin" ? (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-terracotta block font-bold">Branch</span>
                    <select 
                      value={currentBranchId} 
                      onChange={(e) => setCurrentBranchId(e.target.value)}
                      className="bg-white border border-swiss-dark text-sm font-mono p-1 mt-0.5 font-bold cursor-pointer"
                    >
                      {activeHotel.branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}{b.status === "PendingApproval" ? " ⏳ (Pending Approval)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-terracotta block font-bold">Branch</span>
                    <span className="text-sm font-bold font-mono text-swiss-dark bg-white border border-swiss-dark px-3 py-1 inline-block mt-0.5">
                      📍 {activeBranch?.name || "Main Branch"}
                    </span>
                  </div>
                )}

                <div className="bg-white px-3 py-1 border border-swiss-dark mt-0.5">
                  <span className="text-[9px] font-mono uppercase text-swiss-dark/60 block">SaaS Package Level</span>
                  <span className="text-xs font-bold font-mono text-terracotta uppercase">{currentPlan} Plan</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-swiss-dark/70">Modules active:</span>
                <div className="flex flex-wrap gap-1">
                  {enabledModules?.map(mod => (
                    <span key={mod} className="text-[10px] font-mono bg-swiss-dark text-sand px-2 py-0.5">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* LOAD CONTEXT WARNING */}
        {loading ? (
          <div className="py-20 text-center font-mono text-swiss-dark">
            <RefreshCw className="animate-spin w-8 h-8 mx-auto mb-4 text-terracotta" />
            <p>Constructing full-stack SaaS isolation layers...</p>
          </div>
        ) : (
          <>
            {/* 1. PORTAL: SUPER ADMIN */}
            {activeRole === "SuperAdmin" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b-2 border-swiss-dark pb-2">
                  <h2 className="text-2xl font-black uppercase swiss-header text-terracotta">Super Admin Control Engine</h2>
                  <p className="text-sm font-mono text-swiss-dark/70">Platform governance, subscription billing, and hotel onboarding automation.</p>
                </div>

                {/* SUPER ADMIN PORTAL TABS */}
                <div className="flex flex-wrap gap-2 border-b border-swiss-dark/20 pb-4 mb-6">
                  <button
                    onClick={() => setSuperAdminActiveTab("tenants")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 text-xs font-mono ${
                      superAdminActiveTab === "tenants" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    👥 Tenants Onboarding
                  </button>
                  <button
                    onClick={() => setSuperAdminActiveTab("branding")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 text-xs font-mono ${
                      superAdminActiveTab === "branding" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    🎨 Brand Customization
                  </button>
                  <button
                    onClick={() => setSuperAdminActiveTab("menu")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 text-xs font-mono ${
                      superAdminActiveTab === "menu" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    🍽️ Menu Catalogue
                  </button>
                  <button
                    onClick={() => setSuperAdminActiveTab("analytics")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 text-xs font-mono ${
                      superAdminActiveTab === "analytics" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <LucideLineChart className="w-3.5 h-3.5" />
                    📊 Multi-Branch Analytics
                  </button>
                  <button
                    onClick={() => setSuperAdminActiveTab("branches")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 text-xs font-mono ${
                      superAdminActiveTab === "branches" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    🏢 Branch Governance
                  </button>
                </div>

                {superAdminActiveTab === "tenants" && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* BOARDING ENGINE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white border-2 border-swiss-dark p-6">
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">Onboard New Subscriber</h3>
                    
                    <form onSubmit={handleOnboardHotel} className="space-y-4 font-mono text-xs">
                      <div>
                        <label className="block font-bold mb-1 uppercase">Hotel / Restaurant Name</label>
                        <input 
                          type="text" 
                          required
                          value={newHotelForm.name}
                          onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
                          placeholder="e.g. Kathmandu Heritage Inn"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Slogan / Tagline</label>
                        <input 
                          type="text" 
                          value={newHotelForm.tagline}
                          onChange={(e) => setNewHotelForm({ ...newHotelForm, tagline: e.target.value })}
                          placeholder="e.g. Authentic hospitality experience"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Subscription Plan Level</label>
                        <select 
                          value={newHotelForm.plan}
                          onChange={(e) => setNewHotelForm({ ...newHotelForm, plan: e.target.value as any })}
                          className="w-full bg-white border border-swiss-dark p-2"
                        >
                          <option value="Basic">Basic Plan (QR Ordering, Billing, Reports)</option>
                          <option value="Professional">Professional Plan (Basic + Kitchen Display + Inventory + AI)</option>
                          <option value="Enterprise">Enterprise Plan (All Features + Multi Branch + CRM + Rooms)</option>
                        </select>
                        <p className="text-[10px] text-swiss-dark/60 mt-1">
                          Enabling higher subscription tier automatically activates associated system controllers.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1 uppercase">Login Username</label>
                          <input 
                            type="text" 
                            required
                            value={newHotelForm.username}
                            onChange={(e) => setNewHotelForm({ ...newHotelForm, username: e.target.value })}
                            placeholder="e.g. durbar_inn"
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1 uppercase">Login Password</label>
                          <input 
                            type="text" 
                            required
                            value={newHotelForm.password}
                            onChange={(e) => setNewHotelForm({ ...newHotelForm, password: e.target.value })}
                            placeholder="e.g. secret123"
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1 uppercase">Primary Theme</label>
                          <input 
                            type="color" 
                            value={newHotelForm.primaryColor}
                            onChange={(e) => setNewHotelForm({ ...newHotelForm, primaryColor: e.target.value })}
                            className="w-full h-8 bg-transparent cursor-pointer border border-swiss-dark"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1 uppercase">Secondary Theme</label>
                          <input 
                            type="color" 
                            value={newHotelForm.secondaryColor}
                            onChange={(e) => setNewHotelForm({ ...newHotelForm, secondaryColor: e.target.value })}
                            className="w-full h-8 bg-transparent cursor-pointer border border-swiss-dark"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-terracotta hover:bg-swiss-dark text-white p-3 font-bold uppercase transition-all tracking-wider cursor-pointer border-none"
                      >
                        Automate Onboarding Provision
                      </button>
                    </form>
                  </div>

                  {/* ACTIVE SUBSCRIBERS TABLE */}
                  <div className="lg:col-span-2 bg-white border-2 border-swiss-dark p-6">
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">Active Client Tenancy List</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-swiss-gray border-b border-swiss-dark">
                            <th className="p-3">Tenant Details</th>
                            <th className="p-3">Plan Level</th>
                            <th className="p-3">Data Status</th>
                            <th className="p-3">Branches</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hotels.map(h => (
                            <tr key={h.id} className="border-b border-swiss-gray hover:bg-swiss-light">
                              <td className="p-3 font-sans">
                                <div className="font-bold text-swiss-dark text-sm">{h.name}</div>
                                <div className="text-xs text-swiss-dark/60 font-mono">{h.tagline}</div>
                                <div className="text-[10px] text-terracotta font-mono mt-1">Tenant ID: {h.id}</div>
                                <div className="text-[10px] font-mono mt-1.5 p-1 bg-neutral-100 border border-neutral-200 inline-block">
                                  <span className="font-bold text-swiss-dark">User:</span> <span className="text-blue-700 font-semibold">{h.username || "N/A"}</span>
                                  <span className="mx-2 text-neutral-300">|</span>
                                  <span className="font-bold text-swiss-dark">Pass:</span> <span className="text-blue-700 font-semibold">{h.password || "N/A"}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  h.plan === "Enterprise" ? "bg-amber-100 text-amber-800" : h.plan === "Professional" ? "bg-blue-100 text-blue-800" : "bg-neutral-100 text-neutral-800"
                                }`}>
                                  {h.plan}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 font-bold ${h.status === "Active" ? "text-emerald-600" : "text-rose-600"}`}>
                                  <span className={`w-2 h-2 rounded-full ${h.status === "Active" ? "bg-emerald-600" : "bg-rose-600"}`}></span>
                                  {h.status}
                                </span>
                              </td>
                              <td className="p-3 text-swiss-dark/70">
                                {h.branches.length} Branch(es)
                              </td>
                              <td className="p-3 text-right space-x-1">
                                {h.status === "Active" ? (
                                  <button 
                                    onClick={async () => {
                                      await fetch(`/api/hotels/${h.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "Suspended" })
                                      });
                                      fetchData();
                                    }}
                                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold uppercase tracking-wider cursor-pointer text-[10px]"
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button 
                                    onClick={async () => {
                                      await fetch(`/api/hotels/${h.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "Active" })
                                      });
                                      fetchData();
                                    }}
                                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold uppercase tracking-wider cursor-pointer text-[10px]"
                                  >
                                    Activate
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* SYSTEM ANALYTICS OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
                  <div className="bg-swiss-gray p-4 border border-swiss-dark">
                    <span className="text-xs uppercase text-swiss-dark/60 block">Total SaaS Revenue</span>
                    <span className="text-2xl font-bold text-swiss-dark">NPR {hotels.length * 12500}/mo</span>
                    <span className="text-[10px] block mt-1 text-emerald-600 font-bold">100% On-Time Billing</span>
                  </div>
                  <div className="bg-swiss-gray p-4 border border-swiss-dark">
                    <span className="text-xs uppercase text-swiss-dark/60 block">Global Active Nodes</span>
                    <span className="text-2xl font-bold text-swiss-dark">{hotels.reduce((acc, h) => acc + h.branches.length, 0)} Branches</span>
                    <span className="text-[10px] block mt-1 text-swiss-dark/60">Distributed Multi-Region</span>
                  </div>
                  <div className="bg-swiss-gray p-4 border border-swiss-dark">
                    <span className="text-xs uppercase text-swiss-dark/60 block">Server Health Status</span>
                    <span className="text-2xl font-bold text-swiss-dark">99.98%</span>
                    <span className="text-[10px] block mt-1 text-emerald-600 font-bold">Active API Gateways</span>
                  </div>
                  <div className="bg-swiss-gray p-4 border border-swiss-dark">
                    <span className="text-xs uppercase text-swiss-dark/60 block">Global Active Tables</span>
                    <span className="text-2xl font-bold text-swiss-dark">{tables.length} Connected QR</span>
                    <span className="text-[10px] block mt-1 text-swiss-dark/60">Autonomous QR Provisioning</span>
                  </div>
                </div>
              </div>
            )}

              {superAdminActiveTab === "branding" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* TENANT BRAND CUSTOMIZATION & COLOR SYSTEM HUB */}
                  <div className="bg-white border-2 border-swiss-dark p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight">Tenant Brand Customization Control</h3>
                    <p className="text-xs text-swiss-dark/70 font-mono">Assign and persist custom primaryColor, secondaryColor, and corporate typography font settings for individual hotel properties.</p>
                  </div>

                  <form onSubmit={handleSaveCustomBranding} className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
                    {/* LEFT COLUMN: TENANT & DETAILS */}
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold mb-1 uppercase text-terracotta">Select Client Tenant</label>
                        <select
                          value={customizerHotelId || (hotels.length ? hotels[0].id : "")}
                          onChange={(e) => setCustomizerHotelId(e.target.value)}
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark font-bold cursor-pointer"
                        >
                          <option value="">-- Choose Hotel Tenant --</option>
                          {hotels.map(h => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 uppercase">Corporate Brand Name</label>
                        <input
                          type="text"
                          required
                          value={customizerName}
                          onChange={(e) => setCustomizerName(e.target.value)}
                          placeholder="e.g. Kathmandu Heritage Inn"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 uppercase">Slogan / Brand Subtitle</label>
                        <input
                          type="text"
                          value={customizerTagline}
                          onChange={(e) => setCustomizerTagline(e.target.value)}
                          placeholder="e.g. Traditional Nepali Fine Gastronomy"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-swiss-dark/20">
                        <div>
                          <label className="block font-bold mb-1 uppercase text-[10px] text-terracotta">Portal Username</label>
                          <input
                            type="text"
                            required
                            value={customizerUsername}
                            onChange={(e) => setCustomizerUsername(e.target.value)}
                            placeholder="username"
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1 uppercase text-[10px] text-terracotta">Portal Password</label>
                          <input
                            type="text"
                            required
                            value={customizerPassword}
                            onChange={(e) => setCustomizerPassword(e.target.value)}
                            placeholder="password"
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta font-bold text-blue-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE COLUMN: STYLE CONFIGURATION */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold mb-1 uppercase">Primary Brand Accent</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={customizerPrimary}
                              onChange={(e) => setCustomizerPrimary(e.target.value)}
                              className="w-12 h-9 bg-transparent cursor-pointer border border-swiss-dark"
                            />
                            <input
                              type="text"
                              value={customizerPrimary}
                              onChange={(e) => setCustomizerPrimary(e.target.value)}
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-center uppercase text-[10px] font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold mb-1 uppercase">Secondary Highlight</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={customizerSecondary}
                              onChange={(e) => setCustomizerSecondary(e.target.value)}
                              className="w-12 h-9 bg-transparent cursor-pointer border border-swiss-dark"
                            />
                            <input
                              type="text"
                              value={customizerSecondary}
                              onChange={(e) => setCustomizerSecondary(e.target.value)}
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-center uppercase text-[10px] font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 uppercase text-terracotta">Selected Typography Suite</label>
                        <select
                          value={customizerFont}
                          onChange={(e) => setCustomizerFont(e.target.value)}
                          className="w-full bg-white border border-swiss-dark p-2 font-mono text-[11px]"
                        >
                          <option value="Inter">Inter (Swiss Minimalist Sans-Serif)</option>
                          <option value="Space Grotesk">Space Grotesk (Tech Modernist)</option>
                          <option value="Outfit">Outfit (Clean Geometric Sans)</option>
                          <option value="Playfair Display">Playfair Display (High-End Serif)</option>
                          <option value="Instrument Serif">Instrument Serif (Elegant Fine Dining Classic)</option>
                          <option value="JetBrains Mono">JetBrains Mono (Technical Brutalist)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-swiss-dark hover:bg-terracotta text-white hover:text-white p-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-none mt-2"
                      >
                        Persist Brand Configuration
                      </button>
                    </div>

                    {/* RIGHT COLUMN: BRAND PREVIEW */}
                    <div className="border border-swiss-dark p-4 bg-swiss-light flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-swiss-dark/50 block mb-2">Live Corporate Identity Preview</span>
                        
                        <div 
                          className="border border-swiss-dark p-4 bg-white shadow-sm space-y-3"
                          style={{ fontFamily: `${customizerFont}, sans-serif` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm" style={{ color: customizerPrimary }}>
                                {customizerName || "Brand Name"}
                              </h4>
                              <p className="text-[9px] text-swiss-dark/60 italic">
                                {customizerTagline || "Brand Slogan Tagline"}
                              </p>
                            </div>
                            <span 
                              className="text-[8px] font-bold px-1.5 py-0.5 uppercase"
                              style={{ backgroundColor: customizerSecondary, color: "#1E1A17" }}
                            >
                              Enterprise
                            </span>
                          </div>

                          <div className="border-t border-dashed border-swiss-gray pt-2 flex gap-2">
                            <button 
                              type="button"
                              className="text-[9px] font-bold uppercase px-2 py-1 text-white"
                              style={{ backgroundColor: customizerPrimary }}
                            >
                              Action One
                            </button>
                            <button 
                              type="button"
                              className="text-[9px] font-bold uppercase px-2 py-1 border text-swiss-dark"
                              style={{ borderColor: customizerPrimary }}
                            >
                              Action Two
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-swiss-dark/50 mt-4 leading-relaxed font-sans">
                        Applying settings immediately updates this tenant's client views (Guest menus, QR orders, and staff dashboards) to match their corporate color theme and typeface selection.
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {superAdminActiveTab === "menu" && (
              <div className="space-y-8 animate-fadeIn">
                {/* PLATFORM MENU GOVERNANCE HUB */}
                <div className="bg-white border-2 border-swiss-dark p-6 space-y-6">
                  <div className="border-b border-swiss-dark pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tight">Platform Menu Catalogue Governance</h3>
                      <p className="text-xs text-swiss-dark/70 font-mono">Select a hotel client to manage, add, or remove items from their menu catalogue.</p>
                    </div>
                    <div className="font-mono text-xs w-full sm:w-auto">
                      <label className="block font-bold mb-1 uppercase text-terracotta">Select Hotel Client</label>
                      <select
                        value={superAdminSelectedHotelId || (hotels.length ? hotels[0].id : "")}
                        onChange={(e) => setSuperAdminSelectedHotelId(e.target.value)}
                        className="bg-swiss-light border border-swiss-dark p-2 text-swiss-dark font-bold w-full sm:w-64 cursor-pointer"
                      >
                        {hotels.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* FORM AND LISTING GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
                    {/* Add Dish Form */}
                    <div className="border border-swiss-dark p-4 bg-swiss-light/30">
                      <h4 className="text-sm font-bold uppercase tracking-tight mb-4 pb-1 border-b border-swiss-dark text-swiss-dark">
                        Add New Dish for Tenant
                      </h4>
                      <form onSubmit={handleSuperAdminAddMenuItem} className="space-y-3 font-mono text-[11px]">
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Dish Name</label>
                          <input 
                            type="text" 
                            required
                            value={superAdminMenuForm.name}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, name: e.target.value })}
                            placeholder="e.g. Kathmandu Thali Set"
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Category</label>
                          <select 
                            value={superAdminMenuForm.category}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, category: e.target.value })}
                            className="w-full bg-white border border-swiss-dark p-2"
                          >
                            <option value="Momo & Dumplings">Momo & Dumplings</option>
                            <option value="Traditional Meals">Traditional Meals</option>
                            <option value="Starters">Starters</option>
                            <option value="Beverages">Beverages</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Price (NPR)</label>
                          <input 
                            type="number" 
                            required
                            value={superAdminMenuForm.price}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, price: Number(e.target.value) })}
                            placeholder="e.g. 450"
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Prep Time</label>
                          <input 
                            type="text" 
                            value={superAdminMenuForm.prepTime}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, prepTime: e.target.value })}
                            placeholder="e.g. 20 min"
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Description</label>
                          <textarea 
                            value={superAdminMenuForm.description}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, description: e.target.value })}
                            placeholder="Full flavor profile..."
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none h-16 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Ingredients (comma sep)</label>
                          <input 
                            type="text" 
                            value={superAdminMenuForm.ingredients}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, ingredients: e.target.value })}
                            placeholder="Rice, Lentils, Ghee"
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-0.5 uppercase">Allergens (comma sep)</label>
                          <input 
                            type="text" 
                            value={superAdminMenuForm.allergens}
                            onChange={(e) => setSuperAdminMenuForm({ ...superAdminMenuForm, allergens: e.target.value })}
                            placeholder="Dairy"
                            className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-terracotta hover:bg-swiss-dark text-white p-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-none text-[10px]"
                        >
                          Provision Dish
                        </button>
                      </form>
                    </div>

                    {/* Catalogue List */}
                    <div className="lg:col-span-2 border border-swiss-dark p-4 bg-swiss-light">
                      <h4 className="text-sm font-bold uppercase tracking-tight mb-4 pb-1 border-b border-swiss-dark">
                        Live Catalogue: {hotels.find(h => h.id === (superAdminSelectedHotelId || (hotels.length ? hotels[0].id : "")))?.name || "Selected Tenant"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                        {menuItems.filter(m => m.hotelId === (superAdminSelectedHotelId || (hotels.length ? hotels[0].id : ""))).map(item => (
                          <div key={item.id} className="bg-white border border-swiss-dark p-3 font-mono text-[11px] flex flex-col justify-between hover:shadow-sm">
                            <div>
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold text-swiss-dark leading-tight">{item.name}</span>
                                <span className="text-[10px] text-terracotta font-bold whitespace-nowrap shrink-0">
                                  NPR {item.price}
                                </span>
                              </div>
                              <span className="text-[9px] bg-swiss-gray text-swiss-dark px-1 py-0.25 uppercase font-bold tracking-wider inline-block mt-0.5">
                                {item.category}
                              </span>
                              {item.description && (
                                <p className="text-swiss-dark/70 text-[10px] mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <div className="text-[9px] text-swiss-dark/50 mt-1.5 flex gap-2">
                                <span>⏱️ {item.prepTime}</span>
                                <span>• ID: {item.id}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-1.5 border-t border-swiss-gray flex justify-end">
                              <button
                                onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                className="bg-rose-50 hover:bg-rose-800 hover:text-white text-rose-800 font-bold uppercase text-[9px] px-2 py-1 flex items-center gap-1 transition-colors border border-rose-800 cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                Remove Dish
                              </button>
                            </div>
                          </div>
                        ))}
                        {menuItems.filter(m => m.hotelId === (superAdminSelectedHotelId || (hotels.length ? hotels[0].id : ""))).length === 0 && (
                          <div className="col-span-full border border-dashed border-swiss-dark p-6 text-center text-swiss-dark/50">
                            No dishes configured for this hotel client yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {superAdminActiveTab === "analytics" && (
              <div className="space-y-6 animate-fadeIn">
                {/* HOTEL SELECTOR */}
                <div className="bg-white border-2 border-swiss-dark p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tight">Multi-Branch Performance Analytics</h3>
                      <p className="text-xs text-swiss-dark/70 font-mono mt-1">Select a subscribed hotel property to view branch distribution, real-time workload balancing, and comparative sales.</p>
                    </div>
                    <div className="font-mono text-xs w-full md:w-auto">
                      <label className="block font-bold mb-1 uppercase text-terracotta">Analyze Subscribed Hotel</label>
                      <select
                        value={superAdminMultiBranchHotelId || (hotels.length ? hotels[0].id : "")}
                        onChange={(e) => setSuperAdminMultiBranchHotelId(e.target.value)}
                        className="bg-swiss-light border border-swiss-dark p-2 text-swiss-dark font-bold w-full md:w-72 cursor-pointer text-xs"
                      >
                        <option value="">-- Select Property to Analyze --</option>
                        {hotels.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.branches.length} Branches, {h.plan} Plan)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {(() => {
                  const selectedId = superAdminMultiBranchHotelId || (hotels.length ? hotels[0].id : "");
                  const selectedHotel = hotels.find(h => h.id === selectedId);
                  if (!selectedHotel) {
                    return (
                      <div className="border border-dashed border-swiss-dark p-12 text-center text-swiss-dark/50 italic font-mono text-xs bg-white">
                        Please select a hotel tenant from the dropdown above to boot branch analytics.
                      </div>
                    );
                  }

                  // Gather hotel data
                  const hotelBranches = selectedHotel.branches || [];
                  const hotelTables = tables.filter(t => t.hotelId === selectedId);
                  const hotelEmployees = employees.filter(e => e.hotelId === selectedId);
                  const hotelOrdersList = orders.filter(o => o.hotelId === selectedId);
                  const hotelServiceCalls = serviceCalls.filter(s => s.hotelId === selectedId);

                  // Overall stats
                  const completedOrders = hotelOrdersList.filter(o => o.status === "Served" || o.status === "Completed" || o.paymentStatus === "Paid");
                  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                  const pendingOrdersCount = hotelOrdersList.filter(o => ["Received", "Accepted", "Preparing", "Ready"].includes(o.status)).length;
                  const activeCallsCount = hotelServiceCalls.filter(c => c.status === "Pending").length;

                  // Branch comparative data for Recharts
                  const branchData = hotelBranches.map(branch => {
                    const branchOrders = hotelOrdersList.filter(o => o.branchId === branch.id);
                    const completedBranchOrders = branchOrders.filter(o => o.status === "Served" || o.status === "Completed" || o.paymentStatus === "Paid");
                    const revenue = completedBranchOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const branchTables = hotelTables.filter(t => t.branchId === branch.id).length;
                    const branchStaff = hotelEmployees.filter(e => e.branchId === branch.id).length;
                    const pendingOrders = branchOrders.filter(o => ["Received", "Accepted", "Preparing", "Ready"].includes(o.status)).length;
                    const unresolvedCalls = hotelServiceCalls.filter(c => c.branchId === branch.id && c.status === "Pending").length;

                    return {
                      name: branch.name,
                      revenue,
                      ordersCount: branchOrders.length,
                      pendingOrders,
                      unresolvedCalls,
                      tables: branchTables,
                      staffCount: branchStaff
                    };
                  });

                  return (
                    <div className="space-y-6">
                      {/* KPI GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
                        <div className="bg-white p-4 border-2 border-swiss-dark shadow-sm">
                          <span className="text-swiss-dark/60 block uppercase font-bold text-[10px]">Consolidated Sales</span>
                          <span className="text-xl font-bold text-swiss-dark block mt-1">NPR {totalRevenue.toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">From {completedOrders.length} Completed Orders</span>
                        </div>
                        <div className="bg-white p-4 border-2 border-swiss-dark shadow-sm">
                          <span className="text-swiss-dark/60 block uppercase font-bold text-[10px]">Active Infrastructure</span>
                          <span className="text-xl font-bold text-swiss-dark block mt-1">{hotelBranches.length} Branches</span>
                          <span className="text-[10px] text-swiss-dark/60 block mt-1">{hotelTables.length} QR Code Terminals</span>
                        </div>
                        <div className="bg-white p-4 border-2 border-swiss-dark shadow-sm">
                          <span className="text-swiss-dark/60 block uppercase font-bold text-[10px]">Combined Staff Force</span>
                          <span className="text-xl font-bold text-swiss-dark block mt-1">{hotelEmployees.length} Personnel</span>
                          <span className="text-[10px] text-swiss-dark/60 block mt-1">Multi-branch roster enabled</span>
                        </div>
                        <div className="bg-white p-4 border-2 border-swiss-dark shadow-sm">
                          <span className="text-swiss-dark/60 block uppercase font-bold text-[10px]">Active Backlog</span>
                          <span className="text-xl font-bold text-terracotta block mt-1">
                            {pendingOrdersCount} Orders / {activeCallsCount} Calls
                          </span>
                          <span className="text-[10px] text-swiss-dark/60 block mt-1">Live queue workload</span>
                        </div>
                      </div>

                      {/* COMPARATIVE CHARTS */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CHART 1: BRANCH REVENUE */}
                        <div className="bg-white border-2 border-swiss-dark p-6 shadow-sm">
                          <div className="border-b border-swiss-dark pb-2 mb-4">
                            <h4 className="text-sm font-bold uppercase tracking-tight font-mono text-swiss-dark">
                              Branch Revenue Comparative (NPR)
                            </h4>
                          </div>
                          <div className="h-64">
                            {branchData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="name" stroke="#1E1A17" fontSize={10} fontFamily="JetBrains Mono" />
                                  <YAxis stroke="#1E1A17" fontSize={10} fontFamily="JetBrains Mono" />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#1E1A17", fontFamily: "JetBrains Mono", fontSize: 11 }}
                                    formatter={(value: any) => [`NPR ${value}`, "Revenue"]}
                                  />
                                  <Bar dataKey="revenue" fill="#C96A4A" radius={[2, 2, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-swiss-dark/50 font-mono text-xs">
                                No branch data available for chart.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CHART 2: STAFF & TABLES DISTRIBUTION */}
                        <div className="bg-white border-2 border-swiss-dark p-6 shadow-sm">
                          <div className="border-b border-swiss-dark pb-2 mb-4">
                            <h4 className="text-sm font-bold uppercase tracking-tight font-mono text-swiss-dark">
                              Operational Footprint (Personnel & QR Tables)
                            </h4>
                          </div>
                          <div className="h-64">
                            {branchData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="name" stroke="#1E1A17" fontSize={10} fontFamily="JetBrains Mono" />
                                  <YAxis stroke="#1E1A17" fontSize={10} fontFamily="JetBrains Mono" />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#1E1A17", fontFamily: "JetBrains Mono", fontSize: 11 }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                  <Bar dataKey="staffCount" name="Personnel Profiles" fill="#1E1A17" radius={[2, 2, 0, 0]} />
                                  <Bar dataKey="tables" name="QR Tables" fill="#EEDC82" radius={[2, 2, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-swiss-dark/50 font-mono text-xs">
                                No branch data available for chart.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* REGIONAL BRANCH REGISTRY GRID */}
                      <div className="bg-white border-2 border-swiss-dark p-6 shadow-sm">
                        <div className="border-b border-swiss-dark pb-2 mb-4">
                          <h4 className="text-sm font-bold uppercase tracking-tight font-mono text-swiss-dark">
                            Live Branch Operational Backlog & Density Registry
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full font-mono text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="bg-swiss-gray border-b border-swiss-dark">
                                <th className="p-3">Branch / Location</th>
                                <th className="p-3">Table Count</th>
                                <th className="p-3">Staff Strength</th>
                                <th className="p-3">Total Orders (Lifetime)</th>
                                <th className="p-3">Live Queues</th>
                                <th className="p-3">Branch Sales (NPR)</th>
                                <th className="p-3 text-right">Operational Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branchData.map((b, i) => {
                                const actualBranchObj = hotelBranches[i];
                                return (
                                  <tr key={b.name} className="border-b border-swiss-gray hover:bg-swiss-light">
                                    <td className="p-3 font-sans">
                                      <div className="font-bold text-swiss-dark text-sm">{b.name}</div>
                                      <div className="text-[10px] text-swiss-dark/60 font-mono mt-0.5">📍 {actualBranchObj?.location || "Main Venue"}</div>
                                      <div className="text-[8px] bg-swiss-dark text-sand px-1 py-0.25 font-mono inline-block mt-1">ID: {actualBranchObj?.id}</div>
                                    </td>
                                    <td className="p-3 font-mono">{b.tables} QR Terminals</td>
                                    <td className="p-3 font-mono">{b.staffCount} Staff</td>
                                    <td className="p-3 font-mono">{b.ordersCount} Received</td>
                                    <td className="p-3 font-mono">
                                      <span className={`font-bold ${b.pendingOrders > 0 ? "text-terracotta" : "text-swiss-dark/50"}`}>
                                        {b.pendingOrders} Orders
                                      </span>
                                      <span className="text-swiss-dark/40 mx-1.5">|</span>
                                      <span className={`font-bold ${b.unresolvedCalls > 0 ? "text-blue-600" : "text-swiss-dark/50"}`}>
                                        {b.unresolvedCalls} Calls
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold font-mono">NPR {b.revenue.toLocaleString()}</td>
                                    <td className="p-3 text-right">
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 px-2 py-0.5 font-bold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                        Operational
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {branchData.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="p-6 text-center text-swiss-dark/50 italic">
                                    No branches are currently provisioned for this tenant. Add branches in Hotel Admin portal under "Branches & Venues" to enable multi-branch telemetry.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* REAL-TIME OPERATIONS MONITOR MAP */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
                        {/* Left Side: Consolidated Orders List */}
                        <div className="bg-white border-2 border-swiss-dark p-6 shadow-sm">
                          <div className="border-b border-swiss-dark pb-2 mb-4 flex justify-between items-center">
                            <h4 className="text-sm font-bold uppercase tracking-tight text-swiss-dark">
                              Real-Time Combined Order Log
                            </h4>
                            <span className="bg-swiss-light border border-swiss-dark px-2 py-0.5 text-[10px]">
                              {hotelOrdersList.length} total orders
                            </span>
                          </div>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {hotelOrdersList.slice().reverse().map(o => {
                              const branchName = hotelBranches.find(b => b.id === o.branchId)?.name || "Main";
                              return (
                                <div key={o.id} className="p-3 bg-swiss-light/40 border border-swiss-dark/20 hover:border-swiss-dark/50 transition-all">
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-swiss-dark">Order #{o.id.slice(-4).toUpperCase()}</span>
                                        <span className="bg-swiss-dark text-sand text-[8px] font-bold px-1.5 uppercase">
                                          🏢 {branchName}
                                        </span>
                                        <span className="text-swiss-dark/60 text-[9px]">Table {o.tableNumber}</span>
                                      </div>
                                      <p className="text-[10px] text-swiss-dark/70 mt-1 leading-normal">
                                        {o.items.map(it => `${it.quantity}x ${it.name}`).join(", ")}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-swiss-dark block">NPR {o.totalAmount}</span>
                                      <span className={`text-[9px] font-black uppercase inline-block mt-1 px-1.5 py-0.25 ${
                                        o.status === "Served" || o.status === "Completed"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : o.status === "Cancelled"
                                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                                          : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                      }`}>
                                        {o.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {hotelOrdersList.length === 0 && (
                              <div className="text-center italic text-swiss-dark/40 py-12">
                                No live orders have been recorded across hotel branches.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Consolidated Service Calls Log */}
                        <div className="bg-white border-2 border-swiss-dark p-6 shadow-sm">
                          <div className="border-b border-swiss-dark pb-2 mb-4 flex justify-between items-center">
                            <h4 className="text-sm font-bold uppercase tracking-tight text-swiss-dark">
                              Real-Time Service Desk Dispatch
                            </h4>
                            <span className="bg-swiss-light border border-swiss-dark px-2 py-0.5 text-[10px]">
                              {hotelServiceCalls.length} calls logged
                            </span>
                          </div>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {hotelServiceCalls.slice().reverse().map(c => {
                              const branchName = hotelBranches.find(b => b.id === c.branchId)?.name || "Main";
                              return (
                                <div key={c.id} className="p-3 bg-swiss-light/40 border border-swiss-dark/20 hover:border-swiss-dark/50 transition-all">
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-swiss-dark">🔔 {c.type}</span>
                                        <span className="bg-swiss-dark text-sand text-[8px] font-bold px-1.5 uppercase">
                                          🏢 {branchName}
                                        </span>
                                        <span className="text-swiss-dark/60 text-[9px]">Table {c.tableNumber}</span>
                                      </div>
                                      <p className="text-[10px] text-swiss-dark/50 mt-1">
                                        Created: {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.25 ${
                                        c.status === "Resolved"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                      }`}>
                                        {c.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {hotelServiceCalls.length === 0 && (
                              <div className="text-center italic text-swiss-dark/40 py-12">
                                No service calls logged across hotel branches.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {superAdminActiveTab === "branches" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT PANEL: PROVISION NEW BRANCH DIRECTLY */}
                  <div className="bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                    <h3 className="text-base font-bold uppercase tracking-tight text-terracotta mb-2 pb-1 border-b border-swiss-dark">
                      Directly Provision Branch
                    </h3>
                    <p className="text-[10px] text-swiss-dark/70 mb-4 leading-normal">
                      Bypasses standard tenant approval queues. Directly allocates, authorizes, and activates new branches for any onboarded subscriber immediately.
                    </p>
                    
                    <form onSubmit={handleSuperAdminProvisionBranch} className="space-y-4">
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px]">Target Hotel Tenant</label>
                        <select
                          value={superAdminNewBranchHotelId}
                          onChange={(e) => setSuperAdminNewBranchHotelId(e.target.value)}
                          className="w-full bg-white border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta cursor-pointer font-bold"
                          required
                        >
                          <option value="">-- Choose SaaS Subscriber --</option>
                          {hotels.map((h) => (
                            <option key={h.id} value={h.id}>
                              🏢 {h.name} ({h.branches?.length || 0} active branches)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px]">Branch Name</label>
                        <input 
                          type="text" 
                          required
                          value={superAdminNewBranchName}
                          onChange={(e) => setSuperAdminNewBranchName(e.target.value)}
                          placeholder="e.g. Pokhara Central"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px]">Location Address</label>
                        <input 
                          type="text" 
                          value={superAdminNewBranchLocation}
                          onChange={(e) => setSuperAdminNewBranchLocation(e.target.value)}
                          placeholder="e.g. Pokhara Lake Side"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px]">Contact Phone</label>
                        <input 
                          type="text" 
                          value={superAdminNewBranchContact}
                          onChange={(e) => setSuperAdminNewBranchContact(e.target.value)}
                          placeholder="e.g. +977-61-460000"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px]">Operating Hours</label>
                        <input 
                          type="text" 
                          value={superAdminNewBranchHours}
                          onChange={(e) => setSuperAdminNewBranchHours(e.target.value)}
                          placeholder="e.g. 09:00 - 22:00"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase text-[10px] text-terracotta">⚡ QR Table Template Quick-Start</label>
                        <select
                          value={superAdminNewBranchTables}
                          onChange={(e) => setSuperAdminNewBranchTables(Number(e.target.value))}
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none cursor-pointer font-bold"
                        >
                          <option value={0}>❌ No initial tables (Create manually)</option>
                          <option value={4}>🆕 Auto-generate 4 Standard Tables</option>
                          <option value={8}>🆕 Auto-generate 8 Standard Tables</option>
                          <option value={12}>🆕 Auto-generate 12 Standard Tables</option>
                          <option value={16}>🆕 Auto-generate 16 Standard Tables</option>
                        </select>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-terracotta hover:bg-swiss-dark text-white p-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-none text-[10px]"
                      >
                        Directly Provision & Activate
                      </button>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: BRANCH APPROVAL REQUEST QUEUE */}
                  <div className="lg:col-span-2 space-y-4 font-mono text-xs">
                    <div className="bg-white border-2 border-swiss-dark p-6">
                      <h3 className="text-base font-bold uppercase tracking-tight text-swiss-dark mb-2 pb-1 border-b border-swiss-dark">
                        SaaS Tenant Branch Approval Queue
                      </h3>
                      <p className="text-[10px] text-swiss-dark/70 mb-4 leading-normal">
                        Active listing of newly requested branches added by tenant owners (Hotel/Restaurant Admins). Platform verification is required before operational databases and menus map online.
                      </p>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {(() => {
                          const pendingList: { hotel: any; branch: any }[] = [];
                          hotels.forEach((h) => {
                            if (h.branches) {
                              h.branches.forEach((b) => {
                                if (b.status === "PendingApproval") {
                                  pendingList.push({ hotel: h, branch: b });
                                }
                              });
                            }
                          });

                          if (pendingList.length === 0) {
                            return (
                              <div className="border border-dashed border-swiss-dark p-12 text-center text-swiss-dark/50 italic bg-swiss-light/20">
                                🎉 No pending branch approval requests currently in queue! All SaaS venues are fully synchronized.
                              </div>
                            );
                          }

                          return pendingList.map(({ hotel, branch }) => (
                            <div 
                              key={`${hotel.id}-${branch.id}`} 
                              className="p-4 border-2 border-amber-500 bg-amber-50/20 hover:bg-amber-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                                    Pending Approval
                                  </span>
                                  <span className="font-bold text-swiss-dark/80 text-xs">
                                    🏢 {hotel.name}
                                  </span>
                                </div>
                                <h4 className="text-sm font-black text-swiss-dark font-sans uppercase pt-1">
                                  📍 {branch.name}
                                </h4>
                                <div className="text-[10px] text-swiss-dark/70 space-y-0.5 font-mono">
                                  <div>Address: <strong className="text-swiss-dark">{branch.location || "N/A"}</strong></div>
                                  <div>Contact: <strong className="text-swiss-dark">{branch.contactPhone || "N/A"}</strong> | Hours: <strong className="text-swiss-dark">{branch.operatingHours || "N/A"}</strong></div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                                <button
                                  onClick={() => handleApproveBranch(hotel.id, branch.id, branch.name)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-950 text-white font-bold text-[10px] uppercase cursor-pointer border-none shadow-sm flex items-center gap-1 transition-colors animate-pulse"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve & Activate
                                </button>
                                <button
                                  onClick={() => handleRejectBranch(hotel.id, branch.id, branch.name)}
                                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-950 text-white font-bold text-[10px] uppercase cursor-pointer border-none shadow-sm flex items-center gap-1 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject Request
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

            {/* 2. PORTAL: HOTEL ADMIN (OWNER/MANAGER) */}
            {activeRole === "HotelAdmin" && loggedInHotelId !== null && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b-2 border-swiss-dark pb-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                  <div>
                    <h2 className="text-2xl font-black uppercase swiss-header text-terracotta">Hotel Operations Hub</h2>
                    <p className="text-sm font-mono text-swiss-dark/70">Secure dashboard to manage branches, menus, QR tables, analytics, and check AI business metrics.</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 text-left sm:text-right">
                    <div className="text-xs font-mono text-swiss-dark/60">
                      SaaS Host ID: <span className="font-bold text-swiss-dark">{currentHotelId}</span>
                    </div>
                    {hasModule("Reports") && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={handleExportCSV}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-950 text-white font-mono font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer border border-emerald-950 shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          Export Revenue CSV
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-terracotta hover:bg-swiss-dark text-white font-mono font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer border border-swiss-dark shadow-sm"
                        >
                          <FileText className="w-3 h-3" />
                          Export PDF Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🧭 HOTEL ADMIN PORTAL NAVIGATION BAR */}
                <div className="bg-swiss-gray p-1 border-2 border-swiss-dark flex flex-wrap gap-1 font-mono text-xs mb-6">
                  <button
                    onClick={() => setAdminActiveTab("analytics")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      adminActiveTab === "analytics" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <LucideLineChart className="w-3.5 h-3.5" />
                    📊 Analytics & AI
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("menu")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      adminActiveTab === "menu" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    🍽️ Menu Catalog
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("tables")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      adminActiveTab === "tables" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    📋 QR Tables Map
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("staff")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      adminActiveTab === "staff" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    🧑‍🍳 Staffing & Routing
                  </button>
                  <button
                    onClick={() => {
                      if (hasModule("Inventory")) {
                        setAdminActiveTab("inventory");
                      } else {
                        triggerNotification("Raw Material Inventory module requires Professional or Enterprise plan.");
                      }
                    }}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      !hasModule("Inventory") ? "opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400 border border-neutral-300" :
                      adminActiveTab === "inventory" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    📦 Inventory & AI Restock {!hasModule("Inventory") && "🔒"}
                  </button>
                  <button
                    onClick={() => {
                      if (hasModule("Hotel Rooms")) {
                        setAdminActiveTab("rooms");
                      } else {
                        triggerNotification("Hotel Rooms Operations module requires Enterprise plan.");
                      }
                    }}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      !hasModule("Hotel Rooms") ? "opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400 border border-neutral-300" :
                      adminActiveTab === "rooms" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    🏨 Rooms & Cleaning {!hasModule("Hotel Rooms") && "🔒"}
                  </button>
                  <button
                    onClick={() => setAdminActiveTab("branches")}
                    className={`px-3 py-2 uppercase tracking-tight font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      adminActiveTab === "branches" ? "bg-swiss-dark text-white" : "bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark/20"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    🏢 Branches & Venues
                  </button>
                </div>

                {/* SWISS GRID ANALYTICS */}
                {adminActiveTab === "analytics" && (
                  <div className="space-y-6 animate-fadeIn">
                    {hasModule("Reports") && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
                    <div className="bg-white border-2 border-swiss-dark p-5">
                      <span className="text-xs text-swiss-dark/60 block uppercase font-bold">Total Sales (Completed)</span>
                      <span className="text-3xl font-black text-terracotta">NPR {metrics.totalRevenue}</span>
                      <span className="text-[10px] text-swiss-dark/50 block mt-1">Real-time isolation active</span>
                    </div>
                    <div className="bg-white border-2 border-swiss-dark p-5">
                      <span className="text-xs text-swiss-dark/60 block uppercase font-bold">Orders Volume</span>
                      <span className="text-3xl font-black text-swiss-dark">{metrics.totalVolume} Placed</span>
                      <span className="text-[10px] text-swiss-dark/50 block mt-1">Live from tables and cashier</span>
                    </div>
                    <div className="bg-white border-2 border-swiss-dark p-5">
                      <span className="text-xs text-swiss-dark/60 block uppercase font-bold">Average Order Value</span>
                      <span className="text-3xl font-black text-swiss-dark">NPR {metrics.avgOrder}</span>
                      <span className="text-[10px] text-swiss-dark/50 block mt-1">Consistent upselling analytics</span>
                    </div>
                  </div>
                )}

                {/* REVENUE TREND VISUALIZATION (RECHARTS) */}
                {hasModule("Reports") && (
                  <div className="bg-white border-2 border-swiss-dark p-6 font-mono">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                      <h3 className="text-sm font-bold uppercase text-swiss-dark flex items-center gap-2">
                        <LucideLineChart className="w-4 h-4 text-terracotta" />
                        7-Day Revenue Trend Analysis
                      </h3>
                      <span className="text-[10px] bg-swiss-light border border-swiss-dark px-2 py-0.5 text-swiss-dark font-bold">
                        LIVE REVENUE ANALYTICS
                      </span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueTrendData}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C96A4A" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#C96A4A" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey="label"
                            stroke="#1E1E1E"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#1E1E1E"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `NPR ${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FDFBF7",
                              border: "2px solid #1E1E1E",
                              borderRadius: "0px",
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                            formatter={(value) => [`NPR ${value}`, "Revenue"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#C96A4A"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#revenueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-[10px] text-swiss-dark/60 text-right">
                      Hover over data points to review daily transactions and gross earnings.
                    </div>
                  </div>
                )}

                {/* TOP DISHES & POPULAR PRODUCTS ANALYTICS */}
                {hasModule("Reports") && (
                  <div className="bg-white border-2 border-swiss-dark p-6 font-mono">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                      <h3 className="text-sm font-bold uppercase text-swiss-dark flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-terracotta" />
                        Today's Top-Performing Dishes
                      </h3>
                      <span className="text-[10px] bg-swiss-light border border-swiss-dark px-2 py-0.5 text-swiss-dark font-bold">
                        SALES LEADERBOARD
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left side: List / Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-swiss-dark text-white uppercase text-[10px] font-mono">
                              <th className="p-2">Rank</th>
                              <th className="p-2">Dish / Item</th>
                              <th className="p-2">Category</th>
                              <th className="p-2 text-center">Qty Sold</th>
                              <th className="p-2 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topDishes.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-swiss-dark/50 italic">
                                  No orders processed yet today.
                                </td>
                              </tr>
                            ) : (
                              topDishes.map((dish, idx) => (
                                <tr key={dish.name} className="border-b border-swiss-dark/10 hover:bg-swiss-light transition-colors">
                                  <td className="p-2 font-bold text-terracotta">#{idx + 1}</td>
                                  <td className="p-2 font-bold text-swiss-dark">{dish.name}</td>
                                  <td className="p-2 text-swiss-dark/70">{dish.category}</td>
                                  <td className="p-2 text-center font-bold">{dish.quantity}</td>
                                  <td className="p-2 text-right font-bold text-emerald-800">
                                    {activeHotel?.currency || "NPR"} {dish.revenue.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Right side: Explanatory / Mini-Insights box */}
                      <div className="bg-sand-light p-4 border border-swiss-dark flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-swiss-dark/50 uppercase block mb-1">Culinary Insights</span>
                          <h4 className="font-bold text-sm text-swiss-dark mb-2">Demand Peak Performance</h4>
                          <p className="text-xs text-swiss-dark/80 leading-relaxed mb-4">
                            These dishes reflect completed, fully paid orders across all active tables and digital guest checkouts. Keep menus balanced and ensure correct prep times are set in the system to maintain optimal high-density kitchen routing.
                          </p>
                        </div>
                        <button
                          onClick={handleExportPDF}
                          className="w-full bg-swiss-dark hover:bg-terracotta text-white font-bold uppercase text-[11px] py-2 transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Download PDF Summary Report
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXECUTIVE AI BUSINESS INTELLIGENCE (PROFESSIONAL/ENTERPRISE ONLY) */}
                {hasModule("AI Assistant") && (
                  <div className="bg-sand-light border-2 border-swiss-dark p-6 font-mono">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                      <h4 className="text-sm font-bold uppercase text-terracotta flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-terracotta" />
                        AI Executive Business Analyst
                      </h4>
                      <button 
                        onClick={handleFetchBiInsights}
                        disabled={biLoading}
                        className="px-3 py-1.5 bg-swiss-dark hover:bg-terracotta text-white font-bold uppercase text-xs cursor-pointer disabled:opacity-50 transition-colors border border-swiss-dark shadow-sm"
                      >
                        {biLoading ? "Analyzing..." : "Analyze Performance & Trends"}
                      </button>
                    </div>

                    {biInsights ? (
                      (() => {
                        const parsed = parseBiInsights(biInsights);
                        if (parsed) {
                          return (
                            <div className="space-y-4">
                              <div className="bg-white border border-swiss-dark p-3.5">
                                <span className="text-[10px] text-terracotta font-bold uppercase tracking-wider block mb-1">Executive Summary:</span>
                                <p className="text-xs text-swiss-dark leading-relaxed">{parsed.executiveSummary}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {parsed.insights.map((ins, idx) => (
                                  <div key={idx} className="bg-white border border-swiss-dark p-4 flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start gap-1.5 mb-2">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border border-swiss-dark uppercase ${
                                          ins.category === "REVENUE" ? "bg-emerald-50 text-emerald-800" :
                                          ins.category === "INVENTORY" ? "bg-rose-50 text-rose-800" :
                                          ins.category === "CUSTOMER" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800"
                                        }`}>
                                          {ins.category}
                                        </span>
                                        <span className="text-[10px] text-swiss-dark/70 font-bold">{ins.metric}</span>
                                      </div>
                                      <h5 className="text-xs font-black uppercase text-swiss-dark mb-1">{ins.title}</h5>
                                      <p className="text-[11px] text-swiss-dark/80 leading-relaxed mb-3">{ins.description}</p>
                                    </div>
                                    <div className="bg-swiss-light border-t border-swiss-dark -mx-4 -mb-4 p-3 mt-auto">
                                      <span className="text-[9px] font-black uppercase text-terracotta block mb-0.5">Swiss Recommendation:</span>
                                      <p className="text-[10px] text-swiss-dark font-medium leading-relaxed">{ins.action}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs leading-relaxed text-swiss-dark space-y-2 whitespace-pre-line">
                            {biInsights}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-swiss-dark/60">
                        Click analyze to dynamically evaluate order volumes, peak hours, inventory levels, and customer ratings using the server-side Gemini intelligence engine.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* QR CODE GENERATOR & ACTIVE TABLES */}
            {adminActiveTab === "tables" && (
              <div className="bg-white border-2 border-swiss-dark p-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                      <h3 className="text-lg font-bold uppercase tracking-tight">QR Code Table System</h3>
                      <span className="text-xs bg-swiss-light px-2 py-0.5 font-mono border border-swiss-dark">{hotelTables.length} Tables Registered</span>
                    </div>

                    <form onSubmit={handleAddTable} className="grid grid-cols-3 gap-2 mb-6 font-mono text-xs">
                      <div>
                        <label className="block font-bold mb-1 uppercase">Table Number</label>
                        <input 
                          type="text" 
                          required
                          value={newTableForm.number}
                          onChange={(e) => setNewTableForm({ ...newTableForm, number: e.target.value })}
                          placeholder="e.g. 12"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Capacity</label>
                        <input 
                          type="number" 
                          required
                          value={newTableForm.seatingCapacity}
                          onChange={(e) => setNewTableForm({ ...newTableForm, seatingCapacity: Number(e.target.value) })}
                          placeholder="e.g. 4"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit"
                          className="w-full bg-terracotta hover:bg-swiss-dark text-white p-2 font-bold uppercase cursor-pointer"
                        >
                          Generate QR
                        </button>
                      </div>
                    </form>

                    {/* QR CODES LIST */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {hotelTables.map(t => (
                        <TableQRCode 
                          key={t.id}
                          table={t}
                          onScanSimulate={(tableId) => {
                            setActiveGuestTableId(tableId);
                            setActiveRole("Guest");
                            triggerNotification(`Table ${t.number} scanned. Connecting guest session...`);
                          }}
                          triggerNotification={triggerNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* PRODUCTS CATALOG & INVENTORY */}
                {adminActiveTab === "inventory" && hasModule("Inventory") && (
                  <div className="bg-white border-2 border-swiss-dark p-6 animate-fadeIn">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                        <h3 className="text-lg font-bold uppercase tracking-tight">Kitchen Raw Material Inventory</h3>
                        <button 
                          onClick={handleFetchRestockPrediction}
                          className="text-xs bg-swiss-dark hover:bg-terracotta text-white px-2 py-1 uppercase font-mono cursor-pointer"
                        >
                          AI Restock Predictor
                        </button>
                      </div>

                      {restockPrediction && (
                        (() => {
                          const parsed = parseRestockPrediction(restockPrediction);
                          if (parsed) {
                            return (
                              <div className="bg-sand-light border border-swiss-dark p-4 mb-4 font-mono text-[10px] text-swiss-dark">
                                <span className="font-bold text-terracotta uppercase block mb-2 tracking-wider">
                                  📊 {parsed.reportTitle || "AI Logistics Prediction Report"}
                                </span>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse border border-swiss-dark bg-white">
                                    <thead>
                                      <tr className="bg-swiss-dark text-white uppercase text-[9px] tracking-wider">
                                        <th className="border border-swiss-dark p-1.5 text-left">Item</th>
                                        <th className="border border-swiss-dark p-1.5 text-center">Stock</th>
                                        <th className="border border-swiss-dark p-1.5 text-center">Risk</th>
                                        <th className="border border-swiss-dark p-1.5 text-center">Reorder</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {parsed.predictions.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-swiss-light transition-colors text-[9px]">
                                          <td className="border border-swiss-dark p-1.5 font-bold">{p.itemName}</td>
                                          <td className="border border-swiss-dark p-1.5 text-center text-swiss-dark/70">{p.currentQuantity}</td>
                                          <td className="border border-swiss-dark p-1.5 text-center">
                                            <span className={`px-1.5 py-0.5 border text-[8px] font-bold ${
                                              p.depletionRisk === "HIGH" ? "bg-rose-100 text-rose-800 border-rose-800" :
                                              p.depletionRisk === "MEDIUM" ? "bg-amber-100 text-amber-800 border-amber-800" :
                                              "bg-emerald-100 text-emerald-800 border-emerald-800"
                                            }`}>
                                              {p.depletionRisk}
                                            </span>
                                          </td>
                                          <td className="border border-swiss-dark p-1.5 text-center font-bold text-terracotta">{p.recommendedOrder}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="bg-sand-light border border-swiss-dark p-3 mb-4 font-mono text-[10px] text-swiss-dark leading-relaxed">
                              <span className="font-bold text-terracotta uppercase block mb-1">AI Logistics Prediction Report:</span>
                              {restockPrediction}
                            </div>
                          );
                        })()
                      )}

                      <div className="space-y-3 font-mono text-xs max-h-96 overflow-y-auto pr-1">
                        {stockItems.filter(s => s.hotelId === currentHotelId).map(s => {
                          const isLow = s.quantity <= s.minLevel;
                          return (
                            <div key={s.id} className="border border-swiss-dark p-3 flex justify-between items-center bg-swiss-light">
                              <div>
                                <div className="font-bold flex items-center gap-1.5">
                                  {s.name}
                                  {isLow && <span className="bg-rose-100 text-rose-800 text-[8px] px-1 font-bold border border-rose-800">LOW STOCK</span>}
                                </div>
                                <div className="text-[10px] text-swiss-dark/60 mt-1">Supplier: {s.supplier}</div>
                                <div className="text-[10px] text-swiss-dark/60">Expiry: {s.expiryDate}</div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-sm block">{s.quantity} {s.unit}</span>
                                <div className="flex gap-1 mt-1 justify-end">
                                  <button 
                                    onClick={() => handleUpdateStockQuantity(s.id, s.quantity + 5)}
                                    className="px-1.5 py-0.5 bg-swiss-dark text-white text-[10px] cursor-pointer"
                                  >
                                    +5
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStockQuantity(s.id, Math.max(0, s.quantity - 5))}
                                    className="px-1.5 py-0.5 bg-swiss-dark text-white text-[10px] cursor-pointer"
                                  >
                                    -5
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                )}

                {/* HOTEL ROOMS & RESERVATIONS (ENTERPRISE PLAN ONLY) */}
                {adminActiveTab === "rooms" && hasModule("Hotel Rooms") && (
                  <div className="bg-white border-2 border-swiss-dark p-6 animate-fadeIn">
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">
                      Rooms & Housekeeping Operations (Enterprise Module)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      {rooms.filter(r => r.hotelId === currentHotelId).map(room => (
                        <div key={room.id} className="border border-swiss-dark p-4 bg-swiss-light">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">Room {room.number}</span>
                            <span className="text-[10px] bg-swiss-dark text-sand px-1.5 py-0.5">{room.type}</span>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between">
                              <span className="text-swiss-dark/60">Rate:</span>
                              <span className="font-bold">NPR {room.price}/night</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-swiss-dark/60">Status:</span>
                              <span className={`font-bold ${
                                room.status === "Available" ? "text-emerald-600" :
                                room.status === "Occupied" ? "text-blue-600" :
                                room.status === "Cleaning" ? "text-amber-600" : "text-rose-600"
                              }`}>{room.status}</span>
                            </div>
                            {room.guestName && (
                              <div className="border-t border-swiss-gray pt-1 mt-1">
                                <span className="text-swiss-dark/60 block text-[9px] uppercase font-bold">Registered Guest</span>
                                <span className="font-bold block text-[10px] text-swiss-dark">{room.guestName}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-swiss-dark">
                            <button 
                              onClick={() => handleUpdateRoomStatus(room.id, "Available")}
                              className="px-1 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-bold uppercase cursor-pointer text-center"
                            >
                              Ready
                            </button>
                            <button 
                              onClick={() => handleUpdateRoomStatus(room.id, "Cleaning")}
                              className="px-1 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-bold uppercase cursor-pointer text-center"
                            >
                              Clean
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADD MENU ITEMS FORM */}
                {adminActiveTab === "menu" && (
                  <>
                    <div className="bg-white border-2 border-swiss-dark p-6">
                  <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">Add New Dish to Menu Catalog</h3>
                  <form onSubmit={handleAddMenuItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
                    <div>
                      <label className="block font-bold mb-1 uppercase">Dish Name</label>
                      <input 
                        type="text" 
                        required
                        value={newMenuForm.name}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                        placeholder="e.g. Steam Pork Momo"
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase">Category</label>
                      <select 
                        value={newMenuForm.category}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, category: e.target.value })}
                        className="w-full bg-white border border-swiss-dark p-2"
                      >
                        <option value="Momo & Dumplings">Momo & Dumplings</option>
                        <option value="Traditional Meals">Traditional Meals</option>
                        <option value="Starters">Starters</option>
                        <option value="Beverages">Beverages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase">Price (NPR)</label>
                      <input 
                        type="number" 
                        required
                        value={newMenuForm.price}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, price: Number(e.target.value) })}
                        placeholder="e.g. 350"
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase">Prep Time</label>
                      <input 
                        type="text" 
                        value={newMenuForm.prepTime}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, prepTime: e.target.value })}
                        placeholder="e.g. 15 min"
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-bold mb-1 uppercase">Description</label>
                      <input 
                        type="text" 
                        value={newMenuForm.description}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, description: e.target.value })}
                        placeholder="Detailed flavor profile, spicy level, serving description..."
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase">Ingredients (comma sep)</label>
                      <input 
                        type="text" 
                        value={newMenuForm.ingredients}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, ingredients: e.target.value })}
                        placeholder="Pork, Flour, Garlic, Herbs"
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 uppercase">Allergens (comma sep)</label>
                      <input 
                        type="text" 
                        value={newMenuForm.allergens}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, allergens: e.target.value })}
                        placeholder="Gluten, Dairy"
                        className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 pt-2">
                      <button 
                        type="submit"
                        className="w-full bg-terracotta hover:bg-swiss-dark text-white p-3 font-bold uppercase cursor-pointer"
                      >
                        Publish Dish to Menu Catalog
                      </button>
                    </div>
                  </form>
                </div>

                {/* MENU CATALOG LIST & REMOVALS */}
                <div className="bg-white border-2 border-swiss-dark p-6">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-dark">
                    <h3 className="text-lg font-bold uppercase tracking-tight">Active Menu Catalog</h3>
                    <span className="text-xs bg-swiss-light px-2 py-0.5 font-mono border border-swiss-dark">
                      {hotelMenu.length} Dishes Published
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotelMenu.map(item => (
                      <div key={item.id} className="border border-swiss-dark bg-swiss-light font-mono text-xs flex flex-col justify-between p-3 hover:shadow-sm transition-shadow">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-swiss-dark text-sm leading-tight">{item.name}</span>
                            <span className="bg-white px-2 py-0.5 border border-swiss-dark text-[9px] font-bold uppercase shrink-0">
                              NPR {item.price}
                            </span>
                          </div>
                          <div className="text-[10px] text-terracotta uppercase font-bold mb-2">
                            {item.category}
                          </div>
                          {item.description && (
                            <p className="text-swiss-dark/70 text-[11px] mb-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-swiss-dark/60 mt-2">
                            <span>⏱️ {item.prepTime}</span>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">🥕 {item.ingredients.join(", ")}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-2 border-t border-swiss-gray flex justify-end">
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="bg-rose-100 hover:bg-rose-800 hover:text-white text-rose-800 text-[10px] font-bold uppercase px-3 py-1.5 transition-colors flex items-center gap-1 cursor-pointer border border-rose-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Dish
                          </button>
                        </div>
                      </div>
                    ))}
                    {hotelMenu.length === 0 && (
                      <div className="col-span-full border border-dashed border-swiss-dark p-6 text-center text-swiss-dark/60">
                        No dishes configured in catalog yet. Publish your first dish above!
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 4. STAFFING & DYNAMIC LOAD BALANCING TAB */}
            {adminActiveTab === "staff" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* REGISTER NEW STAFF MEMBER */}
                  <div className="bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                    <h3 className="text-base font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">
                      Register New Staff Member
                    </h3>
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                      <div>
                        <label className="block font-bold mb-1 uppercase">Employee Name</label>
                        <input 
                          type="text" 
                          required
                          value={newStaffForm.name}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                          placeholder="e.g. Milan Shrestha"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Role / Responsibility</label>
                        <select 
                          value={newStaffForm.role}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                          className="w-full bg-white border border-swiss-dark p-2"
                        >
                          <option value="Kitchen Staff">🧑‍🍳 Kitchen Staff</option>
                          <option value="Waiter">🏃 Waiter / Server</option>
                          <option value="Cashier">💵 Cashier / Accountant</option>
                          <option value="Manager">👔 Operations Manager</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Duty Schedule</label>
                        <input 
                          type="text" 
                          required
                          value={newStaffForm.schedule}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, schedule: e.target.value })}
                          placeholder="e.g. 09:00 - 18:00"
                          className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 uppercase">Initial Attendance</label>
                        <select 
                          value={newStaffForm.attendance}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, attendance: e.target.value as any })}
                          className="w-full bg-white border border-swiss-dark p-2"
                        >
                          <option value="Present">🟢 Present & Available</option>
                          <option value="Absent">🔴 Absent</option>
                          <option value="On Leave">🟡 On Leave</option>
                        </select>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-terracotta hover:bg-swiss-dark text-white p-3 font-bold uppercase cursor-pointer text-[10px]"
                      >
                        Add Staff Member
                      </button>
                    </form>
                  </div>

                  {/* ACTIVE STAFF REGISTRY DATABASE TABLE */}
                  <div className="lg:col-span-2 bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                    <h3 className="text-base font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">
                      Active Staff Operations Ledger
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-swiss-dark bg-white text-[11px]">
                        <thead>
                          <tr className="bg-swiss-dark text-white uppercase text-[9px] tracking-wider">
                            <th className="border border-swiss-dark p-2 text-left">Staff Name</th>
                            <th className="border border-swiss-dark p-2 text-left">Role</th>
                            <th className="border border-swiss-dark p-2 text-center">Schedule</th>
                            <th className="border border-swiss-dark p-2 text-center">Attendance Status</th>
                            <th className="border border-swiss-dark p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees
                            .filter(e => e.hotelId === currentHotelId)
                            .map((emp) => (
                              <tr key={emp.id} className="hover:bg-swiss-light transition-colors">
                                <td className="border border-swiss-dark p-2 font-bold text-swiss-dark">{emp.name}</td>
                                <td className="border border-swiss-dark p-2 font-medium text-swiss-dark/70">{emp.role}</td>
                                <td className="border border-swiss-dark p-2 text-center text-swiss-dark/60">{emp.schedule || "10:00 - 22:00"}</td>
                                <td className="border border-swiss-dark p-2 text-center">
                                  <select
                                    value={emp.attendance}
                                    onChange={(e) => handleUpdateEmployeeAttendance(emp.id, e.target.value as any)}
                                    className={`text-[10px] font-bold border p-1 focus:outline-none cursor-pointer mx-auto ${
                                      emp.attendance === "Present" 
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-400" 
                                        : emp.attendance === "Absent"
                                        ? "bg-rose-50 text-rose-800 border-rose-300"
                                        : "bg-amber-50 text-amber-800 border-amber-400"
                                    }`}
                                  >
                                    <option value="Present">🟢 Present</option>
                                    <option value="Absent">🔴 Absent</option>
                                    <option value="On Leave">🟡 On Leave</option>
                                  </select>
                                </td>
                                <td className="border border-swiss-dark p-2 text-center">
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                    className="bg-rose-50 hover:bg-rose-800 hover:text-white text-rose-800 border border-rose-800 px-2 py-1 text-[9px] font-bold uppercase cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {employees.filter(e => e.hotelId === currentHotelId).length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-swiss-dark/50 italic bg-swiss-light">
                                No staff currently registered for this hotel.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* 📅 BRANCH WEEKLY SHIFT PLANNER & COST TRACKER */}
                <div id="weekly-scheduler-section" className="bg-white border-2 border-swiss-dark p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-swiss-dark">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-terracotta" />
                        <h3 className="text-base font-black uppercase tracking-tight">Hotel Branch Weekly Scheduler & Shift Planner</h3>
                      </div>
                      <p className="text-xs font-mono text-swiss-dark/70 mt-1">
                        Assign weekly shifts (Monday - Sunday) for staff members, configure hourly rates, and track dynamic labor expenditure ratios.
                      </p>
                    </div>
                    {/* Branch switcher dropdown/tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-swiss-dark/60 uppercase">Select Active Branch:</span>
                      <div className="flex gap-1 border border-swiss-dark p-1 bg-swiss-light">
                        {(activeHotel?.branches || []).map(branch => (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => setCurrentBranchId(branch.id)}
                            className={`px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              currentBranchId === branch.id 
                                ? "bg-swiss-dark text-white" 
                                : "hover:bg-swiss-gray text-swiss-dark"
                            }`}
                          >
                            {branch.name.split(' ')[0]} {/* short name */}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Visual Scheduling Table */}
                  <div className="overflow-x-auto border border-swiss-dark font-mono text-[11px]">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-swiss-dark text-white uppercase text-[9px] tracking-wider">
                          <th className="border border-swiss-dark p-2.5 text-left min-w-[160px]">Staff Member & Role</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Monday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Tuesday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Wednesday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Thursday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Friday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Saturday</th>
                          <th className="border border-swiss-dark p-2 text-center min-w-[120px]">Sunday</th>
                          <th className="border border-swiss-dark p-2 text-center">Weekly Hours</th>
                          <th className="border border-swiss-dark p-2 text-right">Proj. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees
                          .filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId)
                          .map((emp) => {
                            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                            let totalEmpHours = 0;
                            days.forEach(day => {
                              const shift = emp.weeklyShifts?.[day] || (day !== "Saturday" && day !== "Sunday" ? emp.schedule : "Off");
                              totalEmpHours += getShiftHours(shift);
                            });
                            const totalEmpCost = totalEmpHours * (emp.hourlyRate || 200);

                            return (
                              <tr key={emp.id} className="hover:bg-swiss-light transition-colors">
                                <td className="border border-swiss-dark p-2.5">
                                  <div className="font-bold text-swiss-dark text-xs">{emp.name}</div>
                                  <div className="text-[10px] text-terracotta uppercase font-bold">{emp.role}</div>
                                  {/* Rate edit inline input with elegant UX */}
                                  <div className="flex items-center gap-1 mt-1.5 bg-neutral-100 p-1 border border-swiss-gray max-w-[140px]">
                                    <span className="text-[8px] text-neutral-400 uppercase font-black">RATE ({activeHotel?.currency || "NPR"}):</span>
                                    <input
                                      type="number"
                                      defaultValue={emp.hourlyRate || 200}
                                      onBlur={(e) => handleUpdateEmployeeRate(emp.id, Number(e.target.value))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUpdateEmployeeRate(emp.id, Number(e.currentTarget.value));
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      className="w-12 bg-white border border-swiss-gray px-1 text-center font-bold text-[10px] focus:outline-none"
                                      title="Type and press Enter or tab out to update"
                                    />
                                  </div>
                                </td>
                                {days.map((day) => {
                                  const currentShift = emp.weeklyShifts?.[day] || (day !== "Saturday" && day !== "Sunday" ? emp.schedule : "Off");
                                  
                                  // Find matched standard values or treat as custom
                                  let selectValue = "Off";
                                  if (currentShift.toLowerCase().includes("off")) selectValue = "Off";
                                  else if (currentShift.toLowerCase().includes("morning")) selectValue = "Morning";
                                  else if (currentShift.toLowerCase().includes("evening")) selectValue = "Evening";
                                  else if (currentShift.toLowerCase().includes("night")) selectValue = "Night";
                                  else if (currentShift.toLowerCase().includes("day") || currentShift === "09:00 - 18:00") selectValue = "Day";
                                  else selectValue = "Custom";

                                  return (
                                    <td key={day} className="border border-swiss-dark p-2 text-center">
                                      <select
                                        value={selectValue}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          let finalShiftStr = "Off";
                                          if (val === "Morning") finalShiftStr = "Morning (07:00 - 15:00)";
                                          else if (val === "Day") finalShiftStr = "Day (09:00 - 18:00)";
                                          else if (val === "Evening") finalShiftStr = "Evening (15:00 - 23:00)";
                                          else if (val === "Night") finalShiftStr = "Night (23:00 - 07:00)";
                                          else if (val === "Off") finalShiftStr = "Off";
                                          else finalShiftStr = "Day (09:00 - 18:00)"; // Fallback

                                          handleUpdateEmployeeShift(emp.id, day, finalShiftStr);
                                        }}
                                        className={`w-full text-[10px] font-bold p-1 cursor-pointer focus:outline-none border ${
                                          selectValue === "Off" 
                                            ? "bg-neutral-50 text-neutral-400 border-neutral-300" 
                                            : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        }`}
                                      >
                                        <option value="Off">💤 Off</option>
                                        <option value="Morning">🌅 Morning (8h)</option>
                                        <option value="Day">☀️ Day (9h)</option>
                                        <option value="Evening">🌇 Evening (8h)</option>
                                        <option value="Night">🌌 Night (8h)</option>
                                        {selectValue === "Custom" && <option value="Custom">⚙️ {currentShift.split(' ')[0]}</option>}
                                      </select>
                                      <div className="text-[8px] text-neutral-400 mt-1 uppercase font-bold">
                                        {selectValue !== "Off" && selectValue !== "Custom" ? `${getShiftHours(currentShift)} hrs` : selectValue === "Custom" ? `${getShiftHours(currentShift)} hrs` : "Rest"}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="border border-swiss-dark p-2 text-center font-bold text-swiss-dark">
                                  {totalEmpHours} hrs
                                </td>
                                <td className="border border-swiss-dark p-2 text-right font-black text-emerald-700">
                                  {activeHotel?.currency || "NPR"} {totalEmpCost.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        {employees.filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId).length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-swiss-dark/50 italic bg-swiss-light">
                              No employees assigned to the active branch ({activeBranch?.name || "None"}). Assign staff to this branch to start planning weekly schedules.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 📊 Cost Analyzer and Charts Panel */}
                  {(() => {
                    // Generate branch metrics data for Recharts
                    const branchMetricsData = (activeHotel?.branches || []).map(br => {
                      // Sum branch employee costs
                      const branchEmps = employees.filter(e => e.hotelId === currentHotelId && e.branchId === br.id);
                      let branchWeeklyCost = 0;
                      branchEmps.forEach(emp => {
                        let totalEmpHours = 0;
                        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                        days.forEach(day => {
                          const shift = emp.weeklyShifts?.[day] || (day !== "Saturday" && day !== "Sunday" ? emp.schedule : "Off");
                          totalEmpHours += getShiftHours(shift);
                        });
                        branchWeeklyCost += totalEmpHours * (emp.hourlyRate || 200);
                      });

                      // Sum completed/paid revenue for this branch
                      const branchRevenue = hotelOrders
                        .filter(o => o.branchId === br.id && o.paymentStatus === "Paid")
                        .reduce((sum, o) => sum + o.totalAmount, 0);

                      return {
                        name: br.name.replace("Branch", "").trim(),
                        revenue: branchRevenue,
                        laborCost: branchWeeklyCost,
                        ratio: branchRevenue > 0 ? Math.round((branchWeeklyCost / branchRevenue) * 100) : 0,
                        rawBranch: br
                      };
                    });

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-swiss-dark">
                        {/* CHART COLUMN */}
                        <div className="lg:col-span-2 bg-swiss-light border border-swiss-dark p-4 space-y-3 font-mono text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-swiss-gray">
                            <span className="font-bold uppercase text-[10px] tracking-wider text-swiss-dark">
                              📊 Projected Labor Expenditures vs. Branch Revenue
                            </span>
                            <span className="text-[9px] bg-white border border-swiss-dark px-2 py-0.5 text-neutral-500 font-bold">
                              WEEKLY COMPARATIVE METRICS ({activeHotel?.currency || "NPR"})
                            </span>
                          </div>

                          <div className="h-[240px] w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={branchMetricsData}
                                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fill: "#333", fontSize: 10, fontFamily: "monospace" }} 
                                  stroke="#333" 
                                />
                                <YAxis 
                                  tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }} 
                                  stroke="#333" 
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: "#fff", border: "2px solid #333", fontFamily: "monospace", fontSize: "11px" }}
                                />
                                <Legend 
                                  wrapperStyle={{ fontFamily: "monospace", fontSize: "10px" }}
                                />
                                <Bar 
                                  name="Branch Revenue (Paid)" 
                                  dataKey="revenue" 
                                  fill="#10b981" 
                                  stroke="#064e3b"
                                  strokeWidth={1.5}
                                />
                                <Bar 
                                  name="Projected Labor Cost" 
                                  dataKey="laborCost" 
                                  fill="#f97316" 
                                  stroke="#7c2d12"
                                  strokeWidth={1.5}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* STATS & METRIC EXPLANATION PANEL */}
                        <div className="bg-white border border-swiss-dark p-4 font-mono text-xs space-y-4">
                          <h4 className="font-bold uppercase tracking-tight text-[10px] pb-2 border-b border-swiss-dark text-swiss-dark">
                            Labor Force Efficiency Audit
                          </h4>

                          <div className="space-y-3.5 divide-y divide-neutral-100">
                            {branchMetricsData.map((data, idx) => {
                              const ratio = data.ratio;
                              
                              let statusText = "";
                              let statusClass = "";
                              let icon = "✅";

                              if (data.revenue === 0) {
                                statusText = "No Revenue Logged: Awaiting completed bookings or checkouts to calculate precise ratios.";
                                statusClass = "text-neutral-500 bg-neutral-50 border-neutral-200";
                                icon = "ℹ️";
                              } else if (ratio > 40) {
                                statusText = `Excessive Labor Ratio (${ratio}%): Expenses exceed recommended 40% threshold. Streamline schedule densities or cross-train waiters.`;
                                statusClass = "text-amber-800 bg-amber-50 border-amber-200";
                                icon = "⚠️";
                              } else if (ratio < 15) {
                                statusText = `Lean Labor Ratio (${ratio}%): Labor is highly optimized but may trigger service latency. Audit guest satisfaction rates.`;
                                statusClass = "text-cyan-800 bg-cyan-50 border-cyan-200";
                                icon = "📈";
                              } else {
                                statusText = `Optimal Swiss Ratio (${ratio}%): Personnel budget matches financial benchmarks. Excellent personnel resource density alignment.`;
                                statusClass = "text-emerald-800 bg-emerald-50 border-emerald-200";
                                icon = "✅";
                              }

                              return (
                                <div key={idx} className={`pt-3 first:pt-0`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-swiss-dark text-[11px] uppercase">
                                      🏢 {data.rawBranch.name}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-[10px] text-swiss-dark/70 my-1.5">
                                    <div>Weekly Rev: <strong className="text-emerald-600">{activeHotel?.currency || "NPR"} {data.revenue.toLocaleString()}</strong></div>
                                    <div>Labor Cost: <strong className="text-orange-600">{activeHotel?.currency || "NPR"} {data.laborCost.toLocaleString()}</strong></div>
                                  </div>
                                  <div className={`p-2 border text-[10px] leading-relaxed ${statusClass}`}>
                                    <span className="mr-1">{icon}</span> {statusText}
                                  </div>
                                </div>
                              );
                            })}
                            {(activeHotel?.branches || []).length === 0 && (
                              <div className="text-center italic text-neutral-400 py-6">
                                No branches configured for this hotel.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* DYNAMIC ORDER LOAD BALANCING CENTER */}
                <div className="bg-white border-2 border-swiss-dark p-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-swiss-dark">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-terracotta" />
                        <h3 className="text-base font-black uppercase tracking-tight">Order Load Balancing Control Center</h3>
                      </div>
                      <p className="text-xs font-mono text-swiss-dark/70 mt-1">
                        Configure dynamic routing algorithms, monitor real-time kitchen staff workloads, and optimize culinary throughput.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-swiss-light px-3 py-2 border border-swiss-dark text-xs font-mono font-bold select-none">
                        <input
                          type="checkbox"
                          checked={loadBalancerAutoEnabled}
                          onChange={(e) => handleUpdateLoadBalancerConfig(loadBalancerAlgorithm, e.target.checked)}
                          className="accent-terracotta cursor-pointer"
                        />
                        <span>AUTO ROUTING ENGINE</span>
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${loadBalancerAutoEnabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`}></span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT PANEL: CONFIG & ACTIONS */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-swiss-dark/60 block tracking-wider">Dynamic Balancing Mode</span>
                      <div className="space-y-2 font-mono text-xs">
                        {[
                          { id: "RoundRobin", title: "🔄 Round Robin", desc: "Allocates incoming orders sequentially across present staff." },
                          { id: "LeastWorkload", title: "⚖️ Least Workload", desc: "Directs orders to staff with lowest count of active orders." },
                          { id: "QueueDepth", title: "⏱️ Queue Depth (Min Prep)", desc: "Directs orders to staff with least combined preparation time queue." },
                          { id: "Manual", title: "✍️ Manual Overrides", desc: "No auto-allocation; relies entirely on manual staff assignment." }
                        ].map((algo) => (
                          <div
                            key={algo.id}
                            onClick={() => handleUpdateLoadBalancerConfig(algo.id, loadBalancerAutoEnabled)}
                            className={`p-3 border-2 cursor-pointer transition-all ${
                              loadBalancerAlgorithm === algo.id 
                                ? "border-swiss-dark bg-sand-light" 
                                : "border-swiss-gray bg-swiss-light hover:border-swiss-dark/50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{algo.title}</span>
                              {loadBalancerAlgorithm === algo.id && <Check className="w-4 h-4 text-terracotta" />}
                            </div>
                            <p className="text-[10px] text-swiss-dark/60 mt-1 leading-normal">{algo.desc}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleTriggerRebalance}
                          className="w-full bg-swiss-dark hover:bg-terracotta text-white font-bold uppercase p-3 text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2 border border-swiss-dark transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          ⚡ Force Queue Re-Balance
                        </button>
                      </div>
                    </div>

                    {/* STAFF WORKLOAD HUD */}
                    <div className="lg:col-span-2 space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-swiss-dark/60 block tracking-wider">Real-time Staff Workloads (Present Only)</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employees
                          .filter(e => e.hotelId === currentHotelId && (e.role === "Kitchen Staff" || e.role === "Waiter") && e.attendance === "Present")
                          .map(emp => {
                            const activeEmpOrders = hotelOrders.filter(
                              o => o.assignedStaffId === emp.id && 
                                   o.status !== "Completed" && 
                                   o.status !== "Cancelled"
                            );
                            const activeCount = activeEmpOrders.length;
                            
                            let totalQueueMinutes = 0;
                            activeEmpOrders.forEach(o => {
                              let maxPrep = 10;
                              o.items.forEach(item => {
                                const menuItem = menuItems.find(m => m.id === item.menuItemId);
                                const rawPrep = menuItem?.prepTime || "10 min";
                                const matched = rawPrep.match(/\d+/);
                                if (matched) {
                                  const mins = parseInt(matched[0], 10);
                                  if (mins > maxPrep) maxPrep = mins;
                                }
                              });
                              totalQueueMinutes += maxPrep;
                            });

                            let loadText = "Idle / Available";
                            let loadBg = "bg-emerald-100 text-emerald-800 border-emerald-300";
                            let barColor = "bg-emerald-500";
                            let loadPercent = Math.min((activeCount / 4) * 100, 100);

                            if (activeCount === 1) {
                              loadText = "Optimal";
                              loadBg = "bg-blue-100 text-blue-800 border-blue-300";
                              barColor = "bg-blue-500";
                            } else if (activeCount === 2) {
                              loadText = "Moderate Busy";
                              loadBg = "bg-amber-100 text-amber-800 border-amber-300";
                              barColor = "bg-amber-500";
                            } else if (activeCount >= 3) {
                              loadText = "🔥 Overloaded";
                              loadBg = "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
                              barColor = "bg-rose-500";
                            }

                            return (
                              <div key={emp.id} className="border border-swiss-dark p-4 bg-swiss-light font-mono text-xs flex flex-col justify-between space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-sm block leading-tight">{emp.name}</span>
                                    <span className="text-[10px] text-swiss-dark/60">{emp.role} • {emp.schedule || "11:00 - 22:00"}</span>
                                  </div>
                                  <span className="bg-emerald-600 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 font-bold">PRESENT</span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold">Active Load: {activeCount} Orders</span>
                                    <span className="font-bold">{totalQueueMinutes} min queue</span>
                                  </div>
                                  
                                  <div className="w-full bg-swiss-gray h-2.5 border border-swiss-dark overflow-hidden">
                                    <div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${loadPercent || 5}%` }}></div>
                                  </div>

                                  <div className="flex justify-between items-center pt-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase ${loadBg}`}>
                                      {loadText}
                                    </span>
                                    <span className="text-[9px] text-swiss-dark/50">Capacity: 4 max</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {employees.filter(e => e.hotelId === currentHotelId && (e.role === "Kitchen Staff" || e.role === "Waiter") && e.attendance === "Present").length === 0 && (
                          <div className="col-span-full py-12 text-center border border-dashed border-swiss-dark/30 text-swiss-dark/50 bg-neutral-50 font-mono text-xs italic">
                            No employees are currently marked Present. Route operations are halted.
                          </div>
                        )}
                      </div>

                      {/* Dynamic balancing logs panel */}
                      {loadBalancerLogs.length > 0 && (
                        <div className="border border-swiss-dark bg-swiss-dark text-emerald-400 p-3 font-mono text-[10px] h-32 overflow-y-auto space-y-1 rounded-sm animate-fadeIn">
                          <div className="flex justify-between border-b border-emerald-900 pb-1 mb-1 text-emerald-500 font-bold uppercase font-mono">
                            <span>🤖 ROUTING DECISION SYSTEM AUDIT LOG</span>
                            <span onClick={() => setLoadBalancerLogs([])} className="cursor-pointer hover:text-white">CLEAR</span>
                          </div>
                          {loadBalancerLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed font-mono">
                              &gt; {log}
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* STAFF ATTENDANCE LEDGER COMPONENT */}
                <div className="bg-white border-2 border-swiss-dark p-6 space-y-6 mt-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-swiss-dark">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-terracotta" />
                        <h3 className="text-base font-black uppercase tracking-tight">Staff Attendance & Hours Ledger</h3>
                      </div>
                      <p className="text-xs font-mono text-swiss-dark/70 mt-1">
                        Trailing 30-day timecards, hours worked ledger, and dynamic attendance audits for present staff members.
                      </p>
                    </div>
                    <div className="bg-swiss-light border border-swiss-dark px-3 py-1.5 font-mono text-[10px] text-swiss-dark font-bold">
                      SYSTEM METRICS: {staffAttendanceData.length} ACTIVE PROFILES
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: VISUALIZATION */}
                    <div className="lg:col-span-2 space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-swiss-dark/60 block tracking-wider">
                        Aggregate Working Hours per Employee
                      </span>
                      <div className="border border-swiss-dark bg-swiss-light/40 p-4 rounded-sm">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={staffAttendanceData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#dcdbdb" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#1a1a1a" 
                              tick={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }} 
                            />
                            <YAxis 
                              stroke="#1a1a1a" 
                              tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                              label={{ value: 'Hours Worked', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }, offset: 10 }} 
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#1a1a1a', fontSize: 11, fontFamily: 'monospace' }} 
                            />
                            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                            <Bar 
                              dataKey="hours" 
                              name="Total Hours Worked (30d)" 
                              fill="#c34a36" 
                              stroke="#1a1a1a"
                              strokeWidth={1.5}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: ATTENDANCE STATS LEDGER */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-swiss-dark/60 block tracking-wider">
                        Employee Audit Directory
                      </span>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {staffAttendanceData.map((emp) => (
                          <div key={emp.id} className="p-3 border border-swiss-dark bg-white font-mono text-[11px] space-y-2">
                            <div className="flex justify-between items-start border-b border-swiss-gray pb-1.5">
                              <div>
                                <span className="font-bold text-swiss-dark block leading-tight">{emp.name}</span>
                                <span className="text-[9px] text-swiss-dark/60">{emp.role}</span>
                              </div>
                              <span className="bg-swiss-dark text-white px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                Rate: {emp.attendanceRate}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-swiss-dark/50 block font-bold uppercase text-[8px]">Present Days</span>
                                <span className="font-bold text-emerald-700">{emp.present} / 30</span>
                              </div>
                              <div>
                                <span className="text-swiss-dark/50 block font-bold uppercase text-[8px]">Absent / On Leave</span>
                                <span className="font-bold text-amber-700">{emp.absent + emp.leave} Days</span>
                              </div>
                              <div className="col-span-2 pt-1.5 border-t border-dashed border-swiss-gray/50 flex justify-between">
                                <span className="text-swiss-dark/60">Hours Authenticated:</span>
                                <span className="font-black text-terracotta">{emp.hours} hrs</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary insights box */}
                      <div className="border border-swiss-dark bg-sand-light p-3.5 font-mono text-[10px] text-swiss-dark/80 leading-relaxed space-y-1.5">
                        <span className="font-bold uppercase text-swiss-dark block text-[9px] border-b border-swiss-dark/20 pb-1">Ledger Insights</span>
                        <p>
                          Staff target is 160 hours per month. Under-performing profiles are automatically flagged for manager review.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 🏢 PORTAL TAB: BRANCHES & VENUES MANAGEMENT */}
            {adminActiveTab === "branches" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT COLUMN: BRANCH PROVISIONING OR EDITING FORM */}
                  <div className="bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                    {editingBranchId ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-swiss-dark mb-4">
                          <h3 className="text-base font-bold uppercase tracking-tight text-terracotta">
                            Edit Branch Details
                          </h3>
                          <button
                            onClick={() => {
                              setEditingBranchId(null);
                              setEditBranchForm({ name: "", location: "", contactPhone: "", operatingHours: "09:00 - 22:00" });
                            }}
                            className="text-[10px] uppercase font-bold text-swiss-dark/60 hover:text-swiss-dark cursor-pointer underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <form onSubmit={handleUpdateBranch} className="space-y-4">
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Branch Name</label>
                            <input 
                              type="text" 
                              required
                              value={editBranchForm.name}
                              onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                              placeholder="e.g. Lalitpur Hub"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Location Address</label>
                            <input 
                              type="text" 
                              value={editBranchForm.location}
                              onChange={(e) => setEditBranchForm({ ...editBranchForm, location: e.target.value })}
                              placeholder="e.g. Jhamsikhel, Lalitpur"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Contact Phone</label>
                            <input 
                              type="text" 
                              value={editBranchForm.contactPhone}
                              onChange={(e) => setEditBranchForm({ ...editBranchForm, contactPhone: e.target.value })}
                              placeholder="e.g. +977-1-4220000"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Operating Hours</label>
                            <input 
                              type="text" 
                              value={editBranchForm.operatingHours}
                              onChange={(e) => setEditBranchForm({ ...editBranchForm, operatingHours: e.target.value })}
                              placeholder="e.g. 08:00 - 22:00"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full bg-swiss-dark hover:bg-terracotta text-white p-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-none text-[10px]"
                          >
                            Save Branch Changes
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold uppercase tracking-tight text-swiss-dark mb-4 pb-2 border-b border-swiss-dark">
                          Provision New Branch
                        </h3>
                        <form onSubmit={handleAddBranch} className="space-y-4">
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Branch Name</label>
                            <input 
                              type="text" 
                              required
                              value={newBranchForm.name}
                              onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                              placeholder="e.g. Pokhara Lakeside"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Location Address</label>
                            <input 
                              type="text" 
                              value={newBranchForm.location}
                              onChange={(e) => setNewBranchForm({ ...newBranchForm, location: e.target.value })}
                              placeholder="e.g. Lakeside Rd, Pokhara"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Contact Phone</label>
                            <input 
                              type="text" 
                              value={newBranchForm.contactPhone}
                              onChange={(e) => setNewBranchForm({ ...newBranchForm, contactPhone: e.target.value })}
                              placeholder="e.g. +977-61-530000"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px]">Operating Hours</label>
                            <input 
                              type="text" 
                              value={newBranchForm.operatingHours}
                              onChange={(e) => setNewBranchForm({ ...newBranchForm, operatingHours: e.target.value })}
                              placeholder="e.g. 09:00 - 23:00"
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 uppercase text-[10px] text-terracotta">⚡ QR Table Template Quick-Start</label>
                            <select
                              value={newBranchForm.autoCreateTables}
                              onChange={(e) => setNewBranchForm({ ...newBranchForm, autoCreateTables: Number(e.target.value) })}
                              className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none cursor-pointer font-bold"
                            >
                              <option value={0}>❌ No initial tables (Create manually)</option>
                              <option value={4}>🆕 Auto-generate 4 Standard Tables</option>
                              <option value={8}>🆕 Auto-generate 8 Standard Tables</option>
                              <option value={12}>🆕 Auto-generate 12 Standard Tables</option>
                              <option value={16}>🆕 Auto-generate 16 Standard Tables</option>
                            </select>
                            <p className="text-[9px] text-swiss-dark/60 mt-1 leading-tight">
                              Choosing a template auto-provisions table records with ready-to-use digital QR codes immediately.
                            </p>
                          </div>
                          <button 
                            type="submit"
                            className="w-full bg-terracotta hover:bg-swiss-dark text-white p-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-none text-[10px]"
                          >
                            Add Branch Node
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-dashed border-swiss-dark/20 text-[10px] text-swiss-dark/70 space-y-2 leading-relaxed">
                      <p className="font-bold uppercase text-swiss-dark text-[10px]">Operational Guidelines:</p>
                      <p>
                        Adding branches expands your SaaS infrastructure footprint dynamically. Each branch holds its own specific menu mappings, QR tables, and shift rosters.
                      </p>
                      <p>
                        To decommission a branch, ensure there is at least one active branch remaining. Decommissioning removes its venue listing instantly.
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: BRANCHES DIRECTORY MAP */}
                  <div className="lg:col-span-2 space-y-4 font-mono text-xs">
                    <div className="bg-white border-2 border-swiss-dark p-6">
                      <div className="flex justify-between items-center pb-2 border-b border-swiss-dark mb-4">
                        <h3 className="text-base font-bold uppercase tracking-tight">
                          Active Venues Directory
                        </h3>
                        <span className="text-[10px] font-bold bg-swiss-light border border-swiss-dark px-2 py-0.5">
                          {activeHotel?.branches?.length || 0} VENUES ACTIVE
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {(activeHotel?.branches || []).map((branch) => {
                          const branchTablesCount = tables.filter(t => t.hotelId === currentHotelId && t.branchId === branch.id).length;
                          const branchEmployeesCount = employees.filter(e => e.hotelId === currentHotelId && e.branchId === branch.id).length;

                          return (
                            <div 
                              key={branch.id} 
                              className={`p-4 border-2 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                                currentBranchId === branch.id 
                                  ? "border-swiss-dark bg-sand-light" 
                                  : branch.status === "PendingApproval"
                                    ? "border-amber-300 bg-amber-50/20 hover:border-amber-500"
                                    : "border-swiss-gray bg-white hover:border-swiss-dark/50"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-swiss-dark uppercase">
                                    🏢 {branch.name}
                                  </span>
                                  {currentBranchId === branch.id && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1.5 py-0.25 tracking-wider border border-emerald-300">
                                      Active Selection
                                    </span>
                                  )}
                                  {branch.status === "PendingApproval" && (
                                    <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.25 tracking-wider border border-amber-300 animate-pulse">
                                      ⏳ Pending Approval
                                    </span>
                                  )}
                                  <span className="text-[9px] bg-swiss-gray text-swiss-dark/60 px-1 font-mono">
                                    ID: {branch.id}
                                  </span>
                                </div>
                                <div className="text-[10px] text-swiss-dark/70 flex flex-col gap-1">
                                  <span className="flex items-center gap-1">📍 {branch.location || "No Address Saved"}</span>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                                    <span className="flex items-center gap-1 text-[9px] text-swiss-dark/60">📞 Contact: {branch.contactPhone || "Not Configured"}</span>
                                    <span className="flex items-center gap-1 text-[9px] text-swiss-dark/60">⏰ Hours: {branch.operatingHours || "09:00 - 22:00"}</span>
                                  </div>
                                </div>
                                <div className="flex gap-4 mt-2 pt-1">
                                  <div className="text-[10px]">
                                    Tables: <strong className="text-swiss-dark">{branchTablesCount} QR Maps</strong>
                                  </div>
                                  <div className="text-[10px]">
                                    Staff Assigned: <strong className="text-swiss-dark">{branchEmployeesCount} Profiles</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                {currentBranchId !== branch.id && (
                                  <button
                                    onClick={() => setCurrentBranchId(branch.id)}
                                    className="px-2 py-1 bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark font-bold text-[9px] uppercase cursor-pointer"
                                  >
                                    Switch To
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingBranchId(branch.id);
                                    setEditBranchForm({
                                      name: branch.name,
                                      location: branch.location || "",
                                      contactPhone: branch.contactPhone || "",
                                      operatingHours: branch.operatingHours || "09:00 - 22:00"
                                    });
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-swiss-light text-swiss-dark border border-swiss-dark font-bold text-[9px] uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteBranch(branch.id)}
                                  disabled={(activeHotel?.branches || []).length <= 1}
                                  className={`px-2 py-1 font-bold text-[9px] uppercase cursor-pointer transition-colors ${
                                    (activeHotel?.branches || []).length <= 1 
                                      ? "opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400 border border-neutral-300"
                                      : "bg-rose-50 hover:bg-rose-800 hover:text-white text-rose-800 border border-rose-800"
                                  }`}
                                >
                                  Decommission
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {(activeHotel?.branches || []).length === 0 && (
                          <div className="border border-dashed border-swiss-dark p-8 text-center text-swiss-dark/50 italic">
                            No branches configured for this SaaS profile.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* VENUES COMPARISON & PERFORMANCE ANALYTICS GRID */}
                <div className="bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                  <div className="pb-2 border-b border-swiss-dark mb-4">
                    <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-1.5 text-swiss-dark">
                      📊 Master Venue Comparison Matrix & Performance Hub
                    </h3>
                    <p className="text-[10px] text-swiss-dark/60 mt-0.5">
                      Real-time cross-branch performance metric comparison. Analyze revenue generation, table utilisation, active order volume, and staff coverage.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-swiss-dark text-white uppercase text-[9px] tracking-wider">
                          <th className="p-2.5 border border-swiss-dark">🏢 Venue / Branch</th>
                          <th className="p-2.5 border border-swiss-dark">📞 Contact Info</th>
                          <th className="p-2.5 border border-swiss-dark">⏰ Hours</th>
                          <th className="p-2.5 border border-swiss-dark text-center">🏃 Staff Count</th>
                          <th className="p-2.5 border border-swiss-dark text-center">🍽️ Menu Count</th>
                          <th className="p-2.5 border border-swiss-dark text-center">🪑 Occupancy Rate</th>
                          <th className="p-2.5 border border-swiss-dark text-center">🔥 Active Orders</th>
                          <th className="p-2.5 border border-swiss-dark text-right">💵 Completed Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeHotel?.branches || []).map((branch) => {
                          const branchStaff = employees.filter(e => e.hotelId === currentHotelId && e.branchId === branch.id);
                          const branchTables = tables.filter(t => t.hotelId === currentHotelId && t.branchId === branch.id);
                          const activeBranchTables = branchTables.filter(t => t.status !== "Vacant").length;
                          const occupancyPct = branchTables.length > 0 ? Math.round((activeBranchTables / branchTables.length) * 100) : 0;
                          
                          const branchMenuCount = hotelMenu.filter(item => 
                            !item.branchAvailability || 
                            item.branchAvailability.length === 0 || 
                            item.branchAvailability.includes(branch.id)
                          ).length;

                          const branchActiveOrders = orders.filter(o => 
                            o.hotelId === currentHotelId && 
                            o.branchId === branch.id && 
                            o.status !== "Completed" && 
                            o.status !== "Cancelled"
                          ).length;

                          const branchCompletedRevenue = orders.filter(o => 
                            o.hotelId === currentHotelId && 
                            o.branchId === branch.id && 
                            o.status === "Completed"
                          ).reduce((acc, curr) => acc + curr.totalAmount, 0);

                          return (
                            <tr key={branch.id} className="hover:bg-swiss-light transition-colors text-[10px]">
                              <td className="p-2.5 border border-swiss-dark/20 font-bold text-swiss-dark">
                                {branch.name} {currentBranchId === branch.id && <span className="text-[8px] bg-terracotta text-white font-black uppercase px-1 ml-1">Current</span>}
                              </td>
                              <td className="p-2.5 border border-swiss-dark/20 text-swiss-dark/70">{branch.contactPhone || "Not configured"}</td>
                              <td className="p-2.5 border border-swiss-dark/20 text-swiss-dark/70">{branch.operatingHours || "09:00 - 22:00"}</td>
                              <td className="p-2.5 border border-swiss-dark/20 text-center font-bold">{branchStaff.length} Employees</td>
                              <td className="p-2.5 border border-swiss-dark/20 text-center font-bold text-emerald-700">{branchMenuCount} dishes active</td>
                              <td className="p-2.5 border border-swiss-dark/20 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-12 bg-neutral-200 h-2 border border-swiss-dark">
                                    <div className="bg-terracotta h-full" style={{ width: `${occupancyPct}%` }}></div>
                                  </div>
                                  <span className="font-bold">{occupancyPct}%</span>
                                </div>
                              </td>
                              <td className="p-2.5 border border-swiss-dark/20 text-center">
                                <span className={`px-1.5 py-0.5 font-bold ${branchActiveOrders > 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-neutral-100 text-neutral-500"}`}>
                                  {branchActiveOrders} active
                                </span>
                              </td>
                              <td className="p-2.5 border border-swiss-dark/20 text-right font-black text-swiss-dark">
                                {activeHotel?.currency} {branchCompletedRevenue.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BRANCH MENU SELECTION CUSTOMIZER */}
                <div className="bg-white border-2 border-swiss-dark p-6 font-mono text-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-swiss-dark mb-4 gap-2">
                    <div>
                      <h3 className="text-base font-bold uppercase tracking-tight text-swiss-dark flex items-center gap-1.5">
                        🍽️ Branch-Specific Menu Customizer & Availability Matrix
                      </h3>
                      <p className="text-[10px] text-swiss-dark/60">
                        Map and toggle dish availability specifically for a branch. Toggle an item off to instantly disable it from that branch's digital QR ordering page.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[10px] uppercase text-swiss-dark">Configure Menu For:</span>
                      <select
                        value={currentBranchId || ""}
                        onChange={(e) => setCurrentBranchId(e.target.value)}
                        className="bg-swiss-light border-2 border-swiss-dark p-1.5 text-[10px] font-bold text-swiss-dark focus:outline-none cursor-pointer"
                      >
                        {(activeHotel?.branches || []).map(b => (
                          <option key={b.id} value={b.id}>🏢 {b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {activeBranch ? (
                    <div className="space-y-4">
                      <div className="bg-sand-light border border-swiss-dark/30 p-3 flex justify-between items-center text-[10px]">
                        <div>
                          Showing menu settings for <strong className="uppercase text-terracotta">{activeBranch.name}</strong>. Items with <span className="text-emerald-700 font-bold">Enabled</span> are visible on the customer's QR ordering menu for this branch.
                        </div>
                        <div className="font-bold">
                          {hotelMenu.filter(item => 
                            !item.branchAvailability || 
                            item.branchAvailability.length === 0 || 
                            item.branchAvailability.includes(activeBranch.id)
                          ).length} / {hotelMenu.length} ACTIVE ITEMS
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                        {hotelMenu.map((item) => {
                          const isCurrentlyServed = !item.branchAvailability || 
                                                     item.branchAvailability.length === 0 || 
                                                     item.branchAvailability.includes(activeBranch.id);
                          return (
                            <div 
                              key={item.id} 
                              className={`p-3 border-2 transition-all flex justify-between items-center ${
                                isCurrentlyServed 
                                  ? "border-swiss-dark bg-white" 
                                  : "border-swiss-gray bg-neutral-50 opacity-75"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-xs text-swiss-dark">{item.name}</div>
                                <div className="text-[9px] text-swiss-dark/60 uppercase font-black">{item.category} • {activeHotel?.currency}{item.price}</div>
                                <p className="text-[9px] text-swiss-dark/50 line-clamp-1">{item.description}</p>
                              </div>

                              <button
                                onClick={() => handleToggleBranchMenuAvailability(item.id, activeBranch.id)}
                                className={`px-3 py-1 font-bold text-[9px] uppercase cursor-pointer transition-all border ${
                                  isCurrentlyServed
                                    ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-400"
                                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-500 border-neutral-300"
                                }`}
                              >
                                {isCurrentlyServed ? "🟢 Served" : "🔴 Disabled"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-swiss-dark p-6 text-center text-swiss-dark/50 italic">
                      Please select or provision a branch first.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

            {/* 3. PORTAL: KITCHEN STAFF (KDS) */}
            {activeRole === "Kitchen" && loggedInHotelId !== null && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b-2 border-swiss-dark pb-2 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase swiss-header text-terracotta">Kitchen Display System (KDS)</h2>
                    <p className="text-sm font-mono text-swiss-dark/70">Real-time incoming orders, preparation statuses, and quick table table creation access.</p>
                  </div>
                  <div className="text-xs font-mono bg-swiss-gray px-3 py-1 border border-swiss-dark">
                    Active Orders: <span className="font-bold text-swiss-dark">{hotelOrders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").length}</span>
                  </div>
                </div>

                {/* STAFF WORKSPACE SELECTION & NOTIFICATION HUD */}
                <div className="bg-white border-2 border-swiss-dark p-6 space-y-4 font-mono text-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-swiss-dark flex items-center gap-1.5">
                        <User className="w-4 h-4 text-terracotta" />
                        Staff Duty & Alert Terminal
                      </h3>
                      <p className="text-[10px] text-swiss-dark/70">
                        Select your profile to check shift schedules, toggle attendance status, and receive direct dining room assignments.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <select
                        value={selectedStaffId || ""}
                        onChange={(e) => setSelectedStaffId(e.target.value || null)}
                        className="w-full md:w-64 bg-swiss-light border-2 border-swiss-dark p-2 text-xs font-bold text-swiss-dark focus:outline-none cursor-pointer"
                      >
                        <option value="">👤 Select Your Staff Profile...</option>
                        {employees
                          .filter(emp => emp.hotelId === currentHotelId)
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.role === "Waiter" ? "🏃" : emp.role === "Kitchen Staff" ? "🧑‍🍳" : emp.role === "Cashier" ? "💵" : "👔"} {emp.name} ({emp.role})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* IF STAFF IS SELECTED */}
                  {selectedStaffId && (() => {
                    const activeStaff = employees.find(emp => emp.id === selectedStaffId);
                    if (!activeStaff) return null;
                    
                    const unreadCount = staffNotifications.filter(n => !n.read).length;
                    
                    // Find assigned tables (for Waiter role)
                    const assignedTables = tables.filter(t => t.hotelId === currentHotelId && t.assignedWaiterId === selectedStaffId);
                    // Find assigned orders (for active waiter / kitchen staff)
                    const assignedOrders = orders.filter(o => o.hotelId === currentHotelId && o.assignedStaffId === selectedStaffId && o.status !== "Completed" && o.status !== "Cancelled");
                    
                    return (
                      <div className="mt-4 pt-4 border-t-2 border-swiss-dark space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          
                          {/* PROFILE INFO & SCHEDULE */}
                          <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-swiss-light p-3 border border-swiss-dark">
                            <div className="p-2 bg-swiss-dark text-white font-bold rounded-sm text-center min-w-[50px]">
                              {activeStaff.role === "Waiter" ? "🏃" : activeStaff.role === "Kitchen Staff" ? "🧑‍🍳" : "👔"}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-swiss-dark">{activeStaff.name}</div>
                              <div className="text-[10px] text-swiss-dark/70 uppercase font-black">{activeStaff.role} • {activeHotel?.branches.find(b => b.id === activeStaff.branchId)?.name || activeStaff.branchId}</div>
                              <div className="text-[10px] text-terracotta mt-0.5 font-bold">⏰ Shift: {activeStaff.schedule || "09:00 - 18:00"}</div>
                            </div>
                          </div>

                          {/* ATTENDANCE TOGGLE (CLOCK IN/OUT) */}
                          <div className="flex flex-col justify-center bg-swiss-light p-3 border border-swiss-dark">
                            <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block mb-1">Attendance Status</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-[10px] font-black border uppercase ${
                                activeStaff.attendance === "Present" 
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-500 animate-pulse" 
                                  : "bg-rose-100 text-rose-800 border-rose-400"
                              }`}>
                                {activeStaff.attendance === "Present" ? "🟢 Present (On Duty)" : "🔴 Absent (Off Duty)"}
                              </span>
                              <button
                                onClick={async () => {
                                  const targetAttendance = activeStaff.attendance === "Present" ? "Absent" : "Present";
                                  await handleUpdateEmployeeAttendance(activeStaff.id, targetAttendance);
                                  // Refresh specific staff notifications after status change
                                  setTimeout(() => fetchStaffNotifications(activeStaff.id), 300);
                                }}
                                className={`px-3 py-1 text-[10px] uppercase font-bold border-2 border-swiss-dark cursor-pointer transition-all ${
                                  activeStaff.attendance === "Present" 
                                    ? "bg-neutral-200 hover:bg-neutral-300 text-swiss-dark" 
                                    : "bg-terracotta hover:bg-swiss-dark text-white"
                                }`}
                              >
                                {activeStaff.attendance === "Present" ? "Clock Out" : "Clock In"}
                              </button>
                            </div>
                          </div>

                          {/* NOTIFICATION CENTER BADGE */}
                          <div className="relative bg-swiss-light p-3 border border-swiss-dark flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block mb-0.5">Staff Alerts</span>
                              <button
                                onClick={() => setIsStaffNotificationOpen(!isStaffNotificationOpen)}
                                className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-swiss-dark hover:bg-neutral-50 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                              >
                                <Bell className={`w-4 h-4 text-terracotta ${unreadCount > 0 ? "animate-bounce" : ""}`} />
                                {unreadCount > 0 ? `${unreadCount} Alerts` : "No Alerts"}
                              </button>
                            </div>
                            {unreadCount > 0 && (
                              <span className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white border-2 border-swiss-dark w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* NOTIFICATIONS EXPANDED DROPDOWN LIST */}
                        {isStaffNotificationOpen && (
                          <div className="bg-white border-2 border-swiss-dark p-4 space-y-3 animate-fadeIn">
                            <div className="flex justify-between items-center pb-2 border-b border-swiss-dark">
                              <span className="font-bold text-swiss-dark text-[11px] uppercase tracking-wider">Duty Alerts Ledger</span>
                              <div className="flex gap-2">
                                {unreadCount > 0 && (
                                  <button
                                    onClick={handleMarkAllNotificationsRead}
                                    className="text-[9px] font-bold uppercase text-terracotta border border-terracotta px-2 py-0.5 hover:bg-terracotta hover:text-white cursor-pointer"
                                  >
                                    Acknowledge All
                                  </button>
                                )}
                                <button
                                  onClick={() => setIsStaffNotificationOpen(false)}
                                  className="text-[9px] font-bold uppercase text-swiss-dark/60 border border-swiss-dark/30 px-2 py-0.5 hover:bg-swiss-light cursor-pointer"
                                >
                                  Close [X]
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {staffNotifications.length === 0 ? (
                                <div className="p-4 text-center text-swiss-dark/40 italic font-mono text-[10px]">
                                  No notifications recorded. Start shift or receive assigned tables to trigger alerts.
                                </div>
                              ) : (
                                [...staffNotifications].reverse().map((n) => (
                                  <div 
                                    key={n.id} 
                                    className={`border p-3 transition-all ${
                                      n.read 
                                        ? "bg-swiss-light/40 border-swiss-dark/10 opacity-60" 
                                        : "bg-amber-50 border-amber-300 shadow-sm"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex gap-2 items-start">
                                        <span className="text-base mt-0.5">
                                          {n.type === "shift_start" ? "⏱️" : n.type === "table_assignment" ? "📌" : "🛎️"}
                                        </span>
                                        <div>
                                          <p className={`text-[11px] font-semibold text-swiss-dark ${n.read ? "line-through text-swiss-dark/55" : ""}`}>
                                            {n.message}
                                          </p>
                                          <span className="text-[9px] text-swiss-dark/50 block mt-1">
                                            {new Date(n.timestamp).toLocaleTimeString()} • {new Date(n.timestamp).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      {!n.read && (
                                        <button
                                          onClick={() => handleMarkNotificationRead(n.id)}
                                          className="bg-swiss-dark hover:bg-terracotta text-white px-2 py-0.5 text-[9px] font-bold uppercase cursor-pointer"
                                        >
                                          Acknowledge
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* ASSIGNED TABLES AND ACTIVE ORDERS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* MY ASSIGNED TABLES */}
                          <div className="border border-swiss-dark bg-swiss-light/30 p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-swiss-dark/60 block mb-3 border-b border-swiss-dark/20 pb-1">
                              📌 My Assigned Dining Tables ({assignedTables.length})
                            </span>
                            {assignedTables.length === 0 ? (
                              <div className="p-4 text-center text-swiss-dark/50 italic text-[10px]">
                                No specific tables assigned to you. Instruct corporate manager to set assignments in the Tables layout.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {assignedTables.map(t => (
                                  <div key={t.id} className="bg-white border border-swiss-dark p-2.5 font-mono text-[10px] space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-black text-xs bg-swiss-dark text-white px-1.5 py-0.5">Table {t.number}</span>
                                      <span className={`px-1.5 py-0.5 font-bold uppercase border text-[8px] ${
                                        t.status === "Occupied" 
                                          ? "bg-rose-50 text-rose-800 border-rose-300" 
                                          : t.status === "Reserved"
                                          ? "bg-amber-50 text-amber-800 border-amber-300"
                                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      }`}>
                                        {t.status}
                                      </span>
                                    </div>
                                    <p className="text-swiss-dark/70">Seats: <span className="font-bold">{t.seatingCapacity}</span></p>
                                    {t.reservedName && <p className="text-swiss-dark/80 font-semibold truncate">Guest: {t.reservedName}</p>}
                                    {t.reservedTime && <p className="text-swiss-dark/80 font-semibold text-[9px]">Time: {t.reservedTime}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* MY ACTIVE ORDERS */}
                          <div className="border border-swiss-dark bg-swiss-light/30 p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-swiss-dark/60 block mb-3 border-b border-swiss-dark/20 pb-1">
                              🛎️ My Active Orders Queue ({assignedOrders.length})
                            </span>
                            {assignedOrders.length === 0 ? (
                              <div className="p-4 text-center text-swiss-dark/50 italic text-[10px]">
                                You have no active orders queued. Orders auto-assigned by the dynamic rebalancer will appear here.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {assignedOrders.map(o => (
                                  <div key={o.id} className="bg-white border border-swiss-dark p-3.5 font-mono text-[10px] space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-terracotta text-xs">Order #{o.id}</span>
                                      <span className="px-1.5 py-0.5 bg-swiss-dark text-white text-[8px] font-bold uppercase">
                                        Table {o.tableNumber} • {o.status}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-swiss-dark/70 border-b border-dashed border-swiss-dark/20 pb-1">
                                      {o.items.map((it, idx) => (
                                        <span key={idx} className="inline-block mr-2 font-semibold text-swiss-dark">
                                          {it.quantity}x {it.name}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-swiss-dark">Total: NPR {o.totalAmount}</span>
                                      <span className="text-[8px] text-swiss-dark/50">{new Date(o.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* QUICK ADD NEW QR TABLE & QR GENERATOR FOR KITCHEN STAFF */}
                <div className="bg-sand-light border-2 border-swiss-dark p-4 font-mono text-xs">
                  <span className="font-bold text-terracotta uppercase block mb-2">Kitchen Rapid QR / Table Setup</span>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block font-bold mb-1">New Table Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. T-15"
                        id="kitchen-table-num"
                        className="bg-white border border-swiss-dark p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Seating Size</label>
                      <input 
                        type="number" 
                        placeholder="4"
                        id="kitchen-table-cap"
                        className="bg-white border border-swiss-dark p-2 text-xs focus:outline-none w-20"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        const numEl = document.getElementById("kitchen-table-num") as HTMLInputElement;
                        const capEl = document.getElementById("kitchen-table-cap") as HTMLInputElement;
                        if (!numEl?.value) return;
                        
                        try {
                          const response = await fetch("/api/tables", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              hotelId: currentHotelId,
                              branchId: currentBranchId,
                              number: numEl.value,
                              seatingCapacity: Number(capEl?.value) || 4
                            })
                          });
                          if (response.ok) {
                            triggerNotification(`Kitchen staff registered new table ${numEl.value} successfully.`);
                            numEl.value = "";
                            if (capEl) capEl.value = "";
                            await fetchData();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="bg-swiss-dark hover:bg-terracotta text-white font-bold p-2 uppercase cursor-pointer"
                    >
                      Provision Dynamic QR
                    </button>
                    <span className="text-[10px] text-swiss-dark/70 max-w-xs self-center">
                      New table added directly generates a unique target identifier for immediate dining room service.
                    </span>
                  </div>
                </div>

                {/* INCOMING KITCHEN BOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotelOrders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").map(o => {
                    const timerInfo = getOrderRemainingTime(o);
                    const prepLimit = getOrderPrepTimeMinutes(o);
                    const borderClass = timerInfo.isExceeded 
                      ? "border-rose-600 border-4 bg-rose-50/15" 
                      : "border-2 border-swiss-dark bg-white";

                    return (
                      <div key={o.id} className={`${borderClass} flex flex-col font-mono text-xs transition-all duration-300`}>
                        
                        {/* HEADER */}
                        <div className={`${timerInfo.isExceeded ? "bg-rose-800" : "bg-swiss-dark"} text-swiss-light p-3 flex justify-between items-center`}>
                          <div>
                            <span className="text-sand font-bold block text-sm">Order #{o.id}</span>
                            <span className="text-[10px] text-swiss-gray">Table: {o.tableNumber} | Branch: {o.branchId}</span>
                          </div>
                          <span className={`${timerInfo.isExceeded ? "bg-white text-rose-800" : "bg-terracotta text-white"} px-2 py-0.5 text-[10px] uppercase font-bold`}>
                            {o.status}
                          </span>
                        </div>

                        {/* COUNTDOWN TIMER HUD */}
                        <div className="bg-swiss-light px-3 py-2 border-b border-swiss-dark flex justify-between items-center text-[10px] font-bold">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${timerInfo.isExceeded ? "text-rose-600 animate-pulse" : "text-swiss-dark/70"}`} />
                            <span className={timerInfo.isExceeded ? "text-rose-700" : "text-swiss-dark/70"}>
                              {timerInfo.isExceeded ? "LIMIT EXCEEDED" : "TIME REMAINING"} ({prepLimit}M LIMIT)
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-[11px] font-black border ${
                            timerInfo.isExceeded 
                              ? "bg-rose-100 text-rose-800 border-rose-600 animate-pulse" 
                              : "bg-swiss-dark text-white border-swiss-dark"
                          }`}>
                            {timerInfo.formatted}
                          </span>
                        </div>

                        {/* STAFF ASSIGNMENT HUD ROW */}
                        <div className="px-3 py-2 border-b border-swiss-dark bg-white text-[10px] font-mono flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold uppercase text-swiss-dark/60">Assigned:</span>
                            <span className={`px-1.5 py-0.5 font-bold border ${
                              o.assignedStaffName 
                                ? "bg-sand-light text-swiss-dark border-swiss-dark/30" 
                                : "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                            }`}>
                              {o.assignedStaffName ? `🧑‍🍳 ${o.assignedStaffName}` : "⚠️ UNASSIGNED"}
                            </span>
                          </div>
                          <select
                            value={o.assignedStaffId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const matchedEmp = employees.find(emp => emp.id === val);
                                if (matchedEmp) {
                                  handleAssignOrderStaff(o.id, matchedEmp.id, matchedEmp.name);
                                }
                              } else {
                                handleAssignOrderStaff(o.id, "", "");
                              }
                            }}
                            className="bg-swiss-light border border-swiss-dark text-[9px] p-0.5 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Assign --</option>
                            {employees
                              .filter(emp => emp.hotelId === currentHotelId && emp.attendance === "Present" && (emp.role === "Kitchen Staff" || emp.role === "Waiter"))
                              .map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                          </select>
                        </div>

                      {/* ITEMS */}
                      <div className="p-4 flex-1 space-y-3">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="pb-2 border-b border-swiss-gray flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm text-swiss-dark">{item.quantity}x {item.name}</div>
                              {item.notes && (
                                <div className="text-[10px] text-terracotta bg-amber-50 p-1 border-l-2 border-terracotta mt-1">
                                  Notes: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {o.customerNotes && (
                          <div className="bg-swiss-light p-2 border border-swiss-dark text-[10px] mt-2">
                            <span className="font-bold block uppercase text-swiss-dark">Guest Request Note:</span>
                            {o.customerNotes}
                          </div>
                        )}
                      </div>

                      {/* FOOTER CONTROLS */}
                      <div className="bg-swiss-light p-3 border-t border-swiss-dark grid grid-cols-3 gap-1">
                        <button 
                          onClick={() => handleUpdateOrderStatus(o.id, "Accepted")}
                          className="px-2 py-1.5 bg-neutral-200 hover:bg-neutral-300 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(o.id, "Preparing")}
                          className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Prepare
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(o.id, "Ready")}
                          className="px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Ready
                        </button>
                      </div>
                    </div>
                  )})}

                  {hotelOrders.filter(o => o.status !== "Completed" && o.status !== "Cancelled").length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-swiss-dark/30 bg-swiss-light font-mono text-swiss-dark/60">
                      No orders currently in the active kitchen queue.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. PORTAL: WAITER & CASHIER DASHBOARD */}
            {activeRole === "WaiterCashier" && loggedInHotelId !== null && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b-2 border-swiss-dark pb-2 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase swiss-header text-terracotta">Dining Room & Billing Operations</h2>
                    <p className="text-sm font-mono text-swiss-dark/70">Resolve table calls, manage order delivery, checkout clients, split bills, and execute daily closing.</p>
                  </div>
                </div>

                {/* STAFF WORKSPACE SELECTION & NOTIFICATION HUD */}
                <div className="bg-white border-2 border-swiss-dark p-6 space-y-4 font-mono text-xs">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-swiss-dark flex items-center gap-1.5">
                        <User className="w-4 h-4 text-terracotta" />
                        Staff Duty & Alert Terminal
                      </h3>
                      <p className="text-[10px] text-swiss-dark/70">
                        Select your profile to check shift schedules, toggle attendance status, and receive direct dining room assignments.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <select
                        value={selectedStaffId || ""}
                        onChange={(e) => setSelectedStaffId(e.target.value || null)}
                        className="w-full md:w-64 bg-swiss-light border-2 border-swiss-dark p-2 text-xs font-bold text-swiss-dark focus:outline-none cursor-pointer"
                      >
                        <option value="">👤 Select Your Staff Profile...</option>
                        {employees
                          .filter(emp => emp.hotelId === currentHotelId)
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.role === "Waiter" ? "🏃" : emp.role === "Kitchen Staff" ? "🧑‍🍳" : emp.role === "Cashier" ? "💵" : "👔"} {emp.name} ({emp.role})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* IF STAFF IS SELECTED */}
                  {selectedStaffId && (() => {
                    const activeStaff = employees.find(emp => emp.id === selectedStaffId);
                    if (!activeStaff) return null;
                    
                    const unreadCount = staffNotifications.filter(n => !n.read).length;
                    
                    // Find assigned tables (for Waiter role)
                    const assignedTables = tables.filter(t => t.hotelId === currentHotelId && t.assignedWaiterId === selectedStaffId);
                    // Find assigned orders (for active waiter / kitchen staff)
                    const assignedOrders = orders.filter(o => o.hotelId === currentHotelId && o.assignedStaffId === selectedStaffId && o.status !== "Completed" && o.status !== "Cancelled");
                    
                    return (
                      <div className="mt-4 pt-4 border-t-2 border-swiss-dark space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          
                          {/* PROFILE INFO & SCHEDULE */}
                          <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-swiss-light p-3 border border-swiss-dark">
                            <div className="p-2 bg-swiss-dark text-white font-bold rounded-sm text-center min-w-[50px]">
                              {activeStaff.role === "Waiter" ? "🏃" : activeStaff.role === "Kitchen Staff" ? "🧑‍🍳" : "👔"}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-swiss-dark">{activeStaff.name}</div>
                              <div className="text-[10px] text-swiss-dark/70 uppercase font-black">{activeStaff.role} • {activeHotel?.branches.find(b => b.id === activeStaff.branchId)?.name || activeStaff.branchId}</div>
                              <div className="text-[10px] text-terracotta mt-0.5 font-bold">⏰ Shift: {activeStaff.schedule || "09:00 - 18:00"}</div>
                            </div>
                          </div>

                          {/* ATTENDANCE TOGGLE (CLOCK IN/OUT) */}
                          <div className="flex flex-col justify-center bg-swiss-light p-3 border border-swiss-dark">
                            <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block mb-1">Attendance Status</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-[10px] font-black border uppercase ${
                                activeStaff.attendance === "Present" 
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-500 animate-pulse" 
                                  : "bg-rose-100 text-rose-800 border-rose-400"
                              }`}>
                                {activeStaff.attendance === "Present" ? "🟢 Present (On Duty)" : "🔴 Absent (Off Duty)"}
                              </span>
                              <button
                                onClick={async () => {
                                  const targetAttendance = activeStaff.attendance === "Present" ? "Absent" : "Present";
                                  await handleUpdateEmployeeAttendance(activeStaff.id, targetAttendance);
                                  // Refresh specific staff notifications after status change
                                  setTimeout(() => fetchStaffNotifications(activeStaff.id), 300);
                                }}
                                className={`px-3 py-1 text-[10px] uppercase font-bold border-2 border-swiss-dark cursor-pointer transition-all ${
                                  activeStaff.attendance === "Present" 
                                    ? "bg-neutral-200 hover:bg-neutral-300 text-swiss-dark" 
                                    : "bg-terracotta hover:bg-swiss-dark text-white"
                                }`}
                              >
                                {activeStaff.attendance === "Present" ? "Clock Out" : "Clock In"}
                              </button>
                            </div>
                          </div>

                          {/* NOTIFICATION CENTER BADGE */}
                          <div className="relative bg-swiss-light p-3 border border-swiss-dark flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block mb-0.5">Staff Alerts</span>
                              <button
                                onClick={() => setIsStaffNotificationOpen(!isStaffNotificationOpen)}
                                className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-swiss-dark hover:bg-neutral-50 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                              >
                                <Bell className={`w-4 h-4 text-terracotta ${unreadCount > 0 ? "animate-bounce" : ""}`} />
                                {unreadCount > 0 ? `${unreadCount} Alerts` : "No Alerts"}
                              </button>
                            </div>
                            {unreadCount > 0 && (
                              <span className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white border-2 border-swiss-dark w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* NOTIFICATIONS EXPANDED DROPDOWN LIST */}
                        {isStaffNotificationOpen && (
                          <div className="bg-white border-2 border-swiss-dark p-4 space-y-3 animate-fadeIn">
                            <div className="flex justify-between items-center pb-2 border-b border-swiss-dark">
                              <span className="font-bold text-swiss-dark text-[11px] uppercase tracking-wider">Duty Alerts Ledger</span>
                              <div className="flex gap-2">
                                {unreadCount > 0 && (
                                  <button
                                    onClick={handleMarkAllNotificationsRead}
                                    className="text-[9px] font-bold uppercase text-terracotta border border-terracotta px-2 py-0.5 hover:bg-terracotta hover:text-white cursor-pointer"
                                  >
                                    Acknowledge All
                                  </button>
                                )}
                                <button
                                  onClick={() => setIsStaffNotificationOpen(false)}
                                  className="text-[9px] font-bold uppercase text-swiss-dark/60 border border-swiss-dark/30 px-2 py-0.5 hover:bg-swiss-light cursor-pointer"
                                >
                                  Close [X]
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {staffNotifications.length === 0 ? (
                                <div className="p-4 text-center text-swiss-dark/40 italic font-mono text-[10px]">
                                  No notifications recorded. Start shift or receive assigned tables to trigger alerts.
                                </div>
                              ) : (
                                [...staffNotifications].reverse().map((n) => (
                                  <div 
                                    key={n.id} 
                                    className={`border p-3 transition-all ${
                                      n.read 
                                        ? "bg-swiss-light/40 border-swiss-dark/10 opacity-60" 
                                        : "bg-amber-50 border-amber-300 shadow-sm"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex gap-2 items-start">
                                        <span className="text-base mt-0.5">
                                          {n.type === "shift_start" ? "⏱️" : n.type === "table_assignment" ? "📌" : "🛎️"}
                                        </span>
                                        <div>
                                          <p className={`text-[11px] font-semibold text-swiss-dark ${n.read ? "line-through text-swiss-dark/55" : ""}`}>
                                            {n.message}
                                          </p>
                                          <span className="text-[9px] text-swiss-dark/50 block mt-1">
                                            {new Date(n.timestamp).toLocaleTimeString()} • {new Date(n.timestamp).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      {!n.read && (
                                        <button
                                          onClick={() => handleMarkNotificationRead(n.id)}
                                          className="bg-swiss-dark hover:bg-terracotta text-white px-2 py-0.5 text-[9px] font-bold uppercase cursor-pointer"
                                        >
                                          Acknowledge
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* ASSIGNED TABLES AND ACTIVE ORDERS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* MY ASSIGNED TABLES */}
                          <div className="border border-swiss-dark bg-swiss-light/30 p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-swiss-dark/60 block mb-3 border-b border-swiss-dark/20 pb-1">
                              📌 My Assigned Dining Tables ({assignedTables.length})
                            </span>
                            {assignedTables.length === 0 ? (
                              <div className="p-4 text-center text-swiss-dark/50 italic text-[10px]">
                                No specific tables assigned to you. Instruct corporate manager to set assignments in the Tables layout.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {assignedTables.map(t => (
                                  <div key={t.id} className="bg-white border border-swiss-dark p-2.5 font-mono text-[10px] space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-black text-xs bg-swiss-dark text-white px-1.5 py-0.5">Table {t.number}</span>
                                      <span className={`px-1.5 py-0.5 font-bold uppercase border text-[8px] ${
                                        t.status === "Occupied" 
                                          ? "bg-rose-50 text-rose-800 border-rose-300" 
                                          : t.status === "Reserved"
                                          ? "bg-amber-50 text-amber-800 border-amber-300"
                                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      }`}>
                                        {t.status}
                                      </span>
                                    </div>
                                    <p className="text-swiss-dark/70">Seats: <span className="font-bold">{t.seatingCapacity}</span></p>
                                    {t.reservedName && <p className="text-swiss-dark/80 font-semibold truncate">Guest: {t.reservedName}</p>}
                                    {t.reservedTime && <p className="text-swiss-dark/80 font-semibold text-[9px]">Time: {t.reservedTime}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* MY ACTIVE ORDERS */}
                          <div className="border border-swiss-dark bg-swiss-light/30 p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-swiss-dark/60 block mb-3 border-b border-swiss-dark/20 pb-1">
                              🛎️ My Active Orders Queue ({assignedOrders.length})
                            </span>
                            {assignedOrders.length === 0 ? (
                              <div className="p-4 text-center text-swiss-dark/50 italic text-[10px]">
                                You have no active orders queued. Orders auto-assigned by the dynamic rebalancer will appear here.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {assignedOrders.map(o => (
                                  <div key={o.id} className="bg-white border border-swiss-dark p-3.5 font-mono text-[10px] space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-terracotta text-xs">Order #{o.id}</span>
                                      <span className="px-1.5 py-0.5 bg-swiss-dark text-white text-[8px] font-bold uppercase">
                                        Table {o.tableNumber} • {o.status}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-swiss-dark/70 border-b border-dashed border-swiss-dark/20 pb-1">
                                      {o.items.map((it, idx) => (
                                        <span key={idx} className="inline-block mr-2 font-semibold text-swiss-dark">
                                          {it.quantity}x {it.name}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-swiss-dark">Total: NPR {o.totalAmount}</span>
                                      <span className="text-[8px] text-swiss-dark/50">{new Date(o.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ACTIVE SERVICE CALL ALERTS */}
                <div className="bg-white border-2 border-swiss-dark p-6">
                  <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark flex items-center gap-2">
                    <Bell className="w-5 h-5 text-terracotta animate-pulse" />
                    Incoming Guest Dining Room Alerts
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {serviceCalls.filter(sc => sc.hotelId === currentHotelId && sc.status === "Pending").map(sc => (
                      <div key={sc.id} className="border border-swiss-dark p-4 bg-sand-light flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm bg-swiss-dark text-white px-2 py-0.5">Table {sc.tableNumber}</span>
                            <span className="text-[10px] text-swiss-dark/60">{new Date(sc.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm font-bold text-terracotta uppercase">{sc.type}</p>
                          
                          <div className="mt-2.5 pt-2 border-t border-dashed border-swiss-dark/20 text-left">
                            <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block">Assigned Waiter:</span>
                            <select
                              value={sc.assignedWaiterId || ""}
                              onChange={(e) => handleReassignWaiterForServiceCall(sc.id, e.target.value)}
                              className="w-full bg-white border border-swiss-dark text-[9px] font-mono font-semibold p-1 mt-1 focus:outline-none cursor-pointer"
                            >
                              <option value="">⚡ Auto-balanced Workload</option>
                              {employees
                                .filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId && e.role === "Waiter" && e.attendance === "Present")
                                .map(waiter => (
                                  <option key={waiter.id} value={waiter.id}>
                                    🏃 {waiter.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleResolveServiceCall(sc.id)}
                          className="mt-3.5 w-full bg-swiss-dark hover:bg-terracotta text-white py-1.5 font-bold uppercase text-[10px] cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      </div>
                    ))}

                    {serviceCalls.filter(sc => sc.hotelId === currentHotelId && sc.status === "Pending").length === 0 && (
                      <div className="col-span-full py-6 text-center bg-swiss-light text-swiss-dark/60 font-mono">
                        No pending guest alerts from tables.
                      </div>
                    )}
                  </div>
                </div>

                {/* 🏃 WAITER WORKLOAD & PLACEMENT OPTIMIZER */}
                <div id="waiter-workload-optimizer" className="bg-white border-2 border-swiss-dark p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-swiss-dark">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-terracotta" />
                        <h3 className="text-base font-black uppercase tracking-tight">Waiter Assignment & Workload Optimizer</h3>
                      </div>
                      <p className="text-xs font-mono text-swiss-dark/70 mt-1">
                        Monitor active dining room workloads, balance table sections, and trigger automated personnel load-balancing.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAutoOptimizeWaiterAssignments}
                      className="flex items-center gap-2 bg-swiss-dark hover:bg-terracotta text-white px-4 py-2 text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer border border-swiss-dark"
                    >
                      ⚡ Auto-Optimize Table Sections
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                    {/* Active Staff List with visual workload metrics */}
                    <div className="md:col-span-2 space-y-3">
                      <span className="text-[10px] font-black uppercase text-swiss-dark/60 tracking-wider">Active Wait Staff Status & Workload</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {employees
                          .filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId && e.role === "Waiter" && e.attendance === "Present")
                          .map(waiter => {
                            const assignedTables = tables.filter(t => t.hotelId === currentHotelId && t.branchId === currentBranchId && t.assignedWaiterId === waiter.id);
                            const pendingCalls = serviceCalls.filter(sc => sc.status === "Pending" && sc.assignedWaiterId === waiter.id);
                            const totalCap = assignedTables.reduce((sum, t) => sum + t.seatingCapacity, 0);

                            return (
                              <div key={waiter.id} className="border border-swiss-dark p-3 bg-swiss-light relative">
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="text-[8px] font-bold text-emerald-700 uppercase">On Duty</span>
                                </div>
                                <div className="font-bold text-swiss-dark text-sm mb-1">{waiter.name}</div>
                                <div className="text-[9px] uppercase font-bold text-terracotta">Section Weight: {totalCap} Seats</div>

                                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-dashed border-swiss-dark/20 text-[10px]">
                                  <div>
                                    <span className="text-[8px] text-neutral-400 block uppercase font-bold">Assigned Tables</span>
                                    <strong className="text-swiss-dark text-xs">
                                      {assignedTables.length > 0 
                                        ? assignedTables.map(t => `#${t.number}`).join(", ") 
                                        : "None"
                                      }
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-neutral-400 block uppercase font-bold">Active Alerts</span>
                                    <strong className={`text-xs ${pendingCalls.length > 0 ? "text-terracotta animate-pulse" : "text-emerald-700"}`}>
                                      {pendingCalls.length} Pending
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                        {employees.filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId && e.role === "Waiter" && e.attendance === "Present").length === 0 && (
                          <div className="col-span-full p-6 text-center border border-dashed border-swiss-dark/30 text-swiss-dark/50 italic bg-white">
                            No waiters are currently marked as "Present" in attendance. Mark waiters present in the Staff Registry to activate workload monitoring.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Explanation of the Optimization Engine */}
                    <div className="bg-sand-light border border-swiss-dark p-4 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold uppercase tracking-wider text-[10px] text-swiss-dark mb-2">Mathematical Section Balancer</h4>
                        <p className="text-[10px] leading-relaxed text-swiss-dark/80">
                          The optimizer utilizes a greedy multi-way partition algorithm to minimize personnel variance. It sorts physical tables by size and maps them sequentially to active servers to balance the total aggregate seating capacity of assigned dining zones.
                        </p>
                        <div className="mt-3 p-2 bg-white border border-swiss-gray text-[9px] leading-relaxed text-terracotta">
                          <strong>⚡ Workload-Aware Routing:</strong> Guest service alerts are automatically dispatched directly to the table's assigned waiter, or load-balanced to the waiter with the lowest concurrent alert queue.
                        </div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-swiss-dark/20 text-[10px] font-black text-swiss-dark/60 uppercase">
                        Active Branch: {activeBranch?.name || "None"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLES & BILLING MANAGERS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* TABLES MAP AND BILL STATES */}
                  <div className="lg:col-span-2 bg-white border-2 border-swiss-dark p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-2 border-b border-swiss-dark">
                      <h3 className="text-lg font-bold uppercase tracking-tight">
                        Table Floor Map
                      </h3>
                      <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase text-swiss-dark/60 whitespace-nowrap">Filter Seating:</span>
                        <select
                          value={tableFilterStatus}
                          onChange={(e) => setTableFilterStatus(e.target.value)}
                          className="bg-swiss-light border border-swiss-dark px-2.5 py-1 text-[11px] font-bold focus:outline-none focus:border-terracotta cursor-pointer w-full sm:w-auto"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Available">Available</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Occupied">Occupied</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-center">
                      {hotelTables
                        .filter(t => tableFilterStatus === "All" || 
                                     (tableFilterStatus === "Available" && (t.status === "Vacant" || t.status === "Available")) || 
                                     t.status === tableFilterStatus)
                        .map(t => {
                          const tableOrders = hotelOrders.filter(o => o.tableId === t.id && o.status !== "Completed" && o.status !== "Cancelled");
                          const activeOrder = tableOrders[0];

                          return (
                            <div key={t.id} className={`border border-swiss-dark p-4 flex flex-col justify-between ${
                              t.status === "Occupied" ? "bg-amber-50" : t.status === "Reserved" ? "bg-neutral-100" : "bg-white"
                            }`}>
                              <div>
                                <span className="font-bold text-sm block">Table {t.number}</span>
                                <span className="text-[10px] text-swiss-dark/60">Seats: {t.seatingCapacity}</span>
                                <span className={`block font-bold text-[10px] mt-1 uppercase ${
                                  t.status === "Occupied" ? "text-amber-800" : "text-swiss-dark/60"
                                }`}>
                                  {t.status === "Vacant" ? "Available" : t.status}
                                </span>
                                {t.status === "Reserved" && t.reservedName && (
                                  <div className="text-[9px] text-swiss-dark/60 mt-1.5 border-t border-dashed border-swiss-dark/20 pt-1.5">
                                    <span className="block font-bold">Guest: {t.reservedName}</span>
                                    {t.reservedTime && <span className="block font-semibold">Time: {t.reservedTime}</span>}
                                  </div>
                                )}

                                <div className="mt-2.5 pt-2 border-t border-dashed border-swiss-dark/20 text-left">
                                  <span className="text-[9px] font-bold text-swiss-dark/60 uppercase block">Assigned Waiter:</span>
                                  <select
                                    value={t.assignedWaiterId || ""}
                                    onChange={(e) => handleAssignWaiterToTable(t.id, e.target.value)}
                                    className="w-full bg-white border border-swiss-dark text-[10px] font-mono font-semibold p-1 mt-1 focus:outline-none cursor-pointer"
                                  >
                                    <option value="">⚠️ Unassigned</option>
                                    {employees
                                      .filter(e => e.hotelId === currentHotelId && e.branchId === currentBranchId && e.role === "Waiter" && e.attendance === "Present")
                                      .map(waiter => (
                                        <option key={waiter.id} value={waiter.id}>
                                          🏃 {waiter.name}
                                        </option>
                                      ))
                                    }
                                  </select>
                                </div>
                              </div>

                              {activeOrder && (
                                <div className="border-t border-swiss-gray mt-2 pt-2 text-[10px]">
                                  <span className="font-bold block text-terracotta">Order Total:</span>
                                  <span className="font-bold block">NPR {activeOrder.totalAmount}</span>
                                  <span className="text-[9px] block text-swiss-dark/60 uppercase">{activeOrder.status}</span>
                                </div>
                              )}

                              {t.status === "Occupied" && activeOrder && (
                                <div className="mt-3 space-y-1">
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(activeOrder.id, "Completed")}
                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-1 uppercase text-[9px] cursor-pointer"
                                  >
                                    Complete Table
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateOrderPayment(activeOrder.id, "Paid", "Cash")}
                                    className="w-full bg-swiss-dark text-white py-1 uppercase text-[9px] cursor-pointer"
                                  >
                                    Collect Cash
                                  </button>
                                </div>
                              )}

                              {(t.status === "Vacant" || t.status === "Available") && (
                                <button
                                  onClick={() => setReservingTable(t)}
                                  className="mt-3 w-full bg-swiss-dark hover:bg-terracotta text-white py-1 uppercase text-[9px] font-bold cursor-pointer transition-colors"
                                >
                                  Reserve
                                </button>
                              )}

                              {t.status === "Reserved" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/tables/${t.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          status: "Vacant",
                                          reservedName: "",
                                          reservedTime: ""
                                        })
                                      });
                                      if (response.ok) {
                                        triggerNotification(`Reservation cleared for Table ${t.number}.`);
                                        await fetchData();
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white py-1 uppercase text-[9px] font-bold cursor-pointer transition-colors"
                                >
                                  Clear Res
                                </button>
                              )}
                            </div>
                          );
                        })}

                      {hotelTables.filter(t => tableFilterStatus === "All" || 
                                               (tableFilterStatus === "Available" && (t.status === "Vacant" || t.status === "Available")) || 
                                               t.status === tableFilterStatus).length === 0 && (
                        <div className="col-span-full py-12 text-center bg-swiss-light text-swiss-dark/60 font-mono italic">
                          No tables match the selected seating filter status.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE ORDERS AND BILLING LIST */}
                  <div className="bg-white border-2 border-swiss-dark p-6">
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-dark">
                      Pending Billing Transactions
                    </h3>

                    <div className="space-y-4 font-mono text-xs max-h-96 overflow-y-auto pr-1">
                      {hotelOrders.filter(o => o.paymentStatus === "Pending").map(o => (
                        <div key={o.id} className="border border-swiss-dark p-3 bg-swiss-light">
                          <div className="flex justify-between items-center pb-2 border-b border-swiss-gray">
                            <span className="font-bold text-terracotta">Bill #{o.id}</span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 font-bold">UNPAID</span>
                          </div>
                          
                          <div className="my-2 space-y-1">
                            <div className="flex justify-between">
                              <span>Table {o.tableNumber} Total:</span>
                              <span className="font-bold">NPR {o.totalAmount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-bold uppercase text-[10px]">{o.status}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-swiss-gray">
                            <button 
                              onClick={() => handleUpdateOrderPayment(o.id, "Paid", "eSewa")}
                              className="px-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-bold uppercase cursor-pointer transition-colors text-center"
                            >
                              eSewa/Khalti
                            </button>
                            <button 
                              onClick={() => handleUpdateOrderPayment(o.id, "Paid", "Cash")}
                              className="px-1 py-1.5 bg-swiss-dark hover:bg-terracotta text-white text-[9px] font-bold uppercase cursor-pointer transition-colors text-center"
                            >
                              Cash Paid
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              const lastMethod = getLastUsedPaymentMethod();
                              handleUpdateOrderPayment(o.id, "Paid", lastMethod);
                              triggerNotification(`Quick paid Bill #${o.id} using last active method: ${lastMethod}`);
                            }}
                            className="mt-1.5 w-full bg-amber-500 hover:bg-amber-600 text-swiss-dark text-[9px] font-bold uppercase py-1.5 tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-amber-600"
                          >
                            ⚡ Quick Pay ({getLastUsedPaymentMethod()})
                          </button>
                        </div>
                      ))}

                      {hotelOrders.filter(o => o.paymentStatus === "Pending").length === 0 && (
                        <p className="text-xs text-swiss-dark/60 text-center py-6">
                          All table order transactions successfully paid.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* HISTORICAL ORDER TRACKING AUDIT LEDGER */}
                <OrderHistory orders={hotelOrders} />

                {/* RESERVATION MODAL */}
                {reservingTable && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-mono text-xs">
                    <div className="bg-white border-4 border-swiss-dark p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-fadeIn">
                      <div className="flex justify-between items-center border-b-2 border-swiss-dark pb-2">
                        <h4 className="font-bold text-sm uppercase text-swiss-dark">
                          Reserve Table {reservingTable.number}
                        </h4>
                        <button
                          onClick={() => setReservingTable(null)}
                          className="text-swiss-dark hover:text-rose-600 font-bold uppercase text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block font-bold mb-1 uppercase text-[10px]">Guest Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Roshan Bhandari"
                            value={reservationName}
                            onChange={(e) => setReservationName(e.target.value)}
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold mb-1 uppercase text-[10px]">Reservation Time</label>
                          <input
                            type="time"
                            required
                            value={reservationTime}
                            onChange={(e) => setReservationTime(e.target.value)}
                            className="w-full bg-swiss-light border border-swiss-dark p-2 text-swiss-dark focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-swiss-dark">
                        <button
                          onClick={() => setReservingTable(null)}
                          className="bg-swiss-light hover:bg-neutral-200 text-swiss-dark p-2 uppercase font-bold text-center border border-swiss-dark cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!reservationName) {
                              triggerNotification("Please enter guest name.");
                              return;
                            }
                            if (!reservationTime) {
                              triggerNotification("Please select a reservation time.");
                              return;
                            }
                            handleConfirmReservation(reservingTable.id, reservationName, reservationTime);
                          }}
                          className="bg-swiss-dark hover:bg-terracotta text-white p-2 uppercase font-bold text-center cursor-pointer transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. PORTAL: GUEST TABLE VIEW (QR SCAN INSTANT ENTRY) */}
            {activeRole === "Guest" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* GUEST HERO SELECTION FOR MOCK QR SECTIONS */}
                <div className="bg-swiss-dark text-swiss-light p-6 border-b-4 border-terracotta">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs uppercase text-sand font-mono font-bold tracking-wider">
                        Dining Experience Isolated Session
                      </span>
                      <h2 className="text-3xl font-black uppercase text-white mt-1">
                        Welcome to {activeHotel?.name || "Gourmet Diner"}
                      </h2>
                      <p className="text-sm text-swiss-gray mt-1 font-mono">
                        {activeHotel?.tagline || "Fresh high-quality gastronomy"}
                      </p>
                    </div>

                    <div className="bg-swiss-light text-swiss-dark p-3 border-2 border-sand font-mono text-xs flex flex-col gap-1">
                      <div>
                        <span className="font-bold text-terracotta uppercase block">Scanned Table Location:</span>
                        <span className="text-sm font-bold bg-swiss-dark text-white px-2 py-1 mt-1 inline-block border border-swiss-dark">
                          Table {activeGuestTable?.number || "Resolving..."} ({activeGuestTable?.seatingCapacity || 4} seats)
                        </span>
                      </div>
                      <div className="text-[10px] text-swiss-dark/70 mt-1">
                        Fixed QR-scanned location session.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ALERTS AND WAITER CALL TRiggers */}
                <div className="bg-white border border-swiss-dark p-4 flex flex-wrap gap-2 items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Dynamic Table Service active for Table {activeGuestTable?.number}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleServiceCall("Call Waiter")}
                      className="px-3 py-1.5 bg-swiss-dark hover:bg-terracotta text-white font-bold uppercase cursor-pointer"
                    >
                      Call Waiter
                    </button>
                    <button 
                      onClick={() => handleServiceCall("Request Bill")}
                      className="px-3 py-1.5 bg-swiss-dark hover:bg-terracotta text-white font-bold uppercase cursor-pointer"
                    >
                      Request Bill
                    </button>
                  </div>
                </div>

                {/* AI BUTLER CULINARY ASSISTANT */}
                {hasModule("AI Assistant") && (
                  <div className="bg-sand-light border-2 border-swiss-dark p-6">
                    <h3 className="text-lg font-bold uppercase tracking-tight text-terracotta mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-terracotta" />
                      Himalayan AI Butler Service
                    </h3>
                    <p className="text-xs font-mono text-swiss-dark/70 mb-4">
                      Engage with your Swiss-trained AI Butler in a continuous, interactive dialogue. No emojis.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* PRE-CHOSEN PROMPTS */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase text-swiss-dark/60 block font-bold">Suggested Inquiries</span>
                        <button 
                          onClick={() => handleAiRecommend("I want something spicy.")}
                          className="w-full text-left bg-white hover:bg-swiss-gray p-2 border border-swiss-dark font-mono text-[10px] block cursor-pointer"
                        >
                          "I want something spicy."
                        </button>
                        <button 
                          onClick={() => handleAiRecommend("I have a peanut allergy.")}
                          className="w-full text-left bg-white hover:bg-swiss-gray p-2 border border-swiss-dark font-mono text-[10px] block cursor-pointer"
                        >
                          "I have a peanut allergy."
                        </button>
                        <button 
                          onClick={() => handleAiRecommend("I have NPR 800 budget.")}
                          className="w-full text-left bg-white hover:bg-swiss-gray p-2 border border-swiss-dark font-mono text-[10px] block cursor-pointer"
                        >
                          "I have NPR 800 budget."
                        </button>
                        <button 
                          onClick={() => handleAiRecommend("Recommend some local traditional specialities.")}
                          className="w-full text-left bg-white hover:bg-swiss-gray p-2 border border-swiss-dark font-mono text-[10px] block cursor-pointer"
                        >
                          "Recommend local dishes."
                        </button>
                        
                        <button
                          onClick={() => setGuestAiHistory([{
                            sender: "butler",
                            text: "Namaste. I am your Swiss-trained Himalayan AI Butler. How may I elevate your culinary experience today? I can assist with recommendations based on dietary constraints, budget limits, spicy preferences, or ideal local pairings."
                          }])}
                          className="w-full text-center hover:bg-terracotta hover:text-white text-swiss-dark/70 p-1 border border-dashed border-swiss-dark/40 font-mono text-[9px] block cursor-pointer mt-4"
                        >
                          Clear Chat History
                        </button>
                      </div>

                      {/* CONVERSATIONAL CHAT SCREEN */}
                      <div className="md:col-span-3 flex flex-col h-full min-h-[300px] justify-between">
                        <div className="max-h-[350px] overflow-y-auto space-y-3 p-3 bg-white border-2 border-swiss-dark mb-3">
                          {guestAiHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] p-3 font-mono text-xs leading-relaxed ${
                                msg.sender === "user" 
                                  ? "bg-swiss-dark text-white rounded-br-none" 
                                  : "bg-sand-light text-swiss-dark border border-swiss-dark rounded-bl-none"
                              }`}>
                                <span className={`font-bold text-[10px] uppercase block mb-1 tracking-wider ${
                                  msg.sender === "user" ? "text-swiss-gray" : "text-terracotta"
                                }`}>
                                  {msg.sender === "user" ? "Guest Inquiry" : "Himalayan AI Butler"}
                                </span>
                                <div className="whitespace-pre-line">{msg.text}</div>

                                {/* Curated Items click-to-add action buttons */}
                                {msg.suggestedItemIds && msg.suggestedItemIds.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-swiss-dark/20 space-y-2">
                                    <span className="font-bold text-[9px] uppercase tracking-wider text-swiss-dark block">Butler Curated Items:</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {msg.suggestedItemIds.map(itemId => {
                                        const item = menuItems.find(m => m.id === itemId && m.hotelId === currentHotelId);
                                        if (!item) return null;
                                        return (
                                          <div key={item.id} className="bg-white border border-swiss-dark p-2 flex flex-col justify-between">
                                            <div className="flex gap-2">
                                              {item.image && (
                                                <img 
                                                  src={item.image} 
                                                  alt={item.name} 
                                                  className="w-10 h-10 object-cover border border-swiss-dark" 
                                                  referrerPolicy="no-referrer" 
                                                />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[10px] truncate">{item.name}</h4>
                                                <span className="text-[9px] font-bold text-terracotta block">NPR {item.price}</span>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                const existing = cart.find(c => c.menuItem.id === item.id);
                                                if (existing) {
                                                  setCart(cart.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
                                                } else {
                                                  setCart([...cart, { menuItem: item, quantity: 1, notes: "Butler recommended pairing" }]);
                                                }
                                              }}
                                              className="w-full mt-2 bg-swiss-dark hover:bg-terracotta text-white font-bold text-[9px] uppercase py-1 border-none cursor-pointer flex items-center justify-center gap-1"
                                            >
                                              <Plus className="w-3 h-3" /> Add to Order
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* INPUT BOX */}
                        <div className="flex gap-2 font-mono">
                          <input 
                            type="text" 
                            value={guestAiQuery}
                            onChange={(e) => setGuestAiQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAiRecommend();
                              }
                            }}
                            placeholder="Type naturally e.g. What vegetarian high-protein options do you suggest?..."
                            className="flex-1 bg-white border-2 border-swiss-dark p-2 text-xs focus:outline-none focus:border-terracotta"
                          />
                          <button 
                            onClick={() => handleAiRecommend()}
                            disabled={aiLoading}
                            className="bg-terracotta hover:bg-swiss-dark text-white font-bold px-4 text-xs uppercase cursor-pointer border-none disabled:opacity-50"
                          >
                            {aiLoading ? "Consulting..." : "Consult Butler"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GUEST ORDER TRACKER IF ORDER PLACED */}
                {placedOrderId && (
                  <div className="bg-emerald-50 border-2 border-emerald-600 p-5 font-mono text-xs text-emerald-800">
                    <h4 className="font-bold uppercase text-emerald-900 text-sm mb-1">Live Order Tracker Active</h4>
                    <p className="mb-3">Your order #{placedOrderId} is being synchronized live to the kitchen staff.</p>
                    
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className="bg-emerald-600 text-white p-1">Received</div>
                      <div className="bg-neutral-200 text-neutral-600 p-1">Preparing</div>
                      <div className="bg-neutral-200 text-neutral-600 p-1">Ready</div>
                      <div className="bg-neutral-200 text-neutral-600 p-1">Served</div>
                    </div>

                    <button 
                      onClick={() => setPlacedOrderId(null)}
                      className="mt-4 px-3 py-1 bg-neutral-800 text-white text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Dismiss Tracker
                    </button>
                  </div>
                )}

                {/* MENU BROWSER AND CART */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* MAIN MENU ITEMS */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="border-b border-swiss-dark pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono">
                      <div className="flex flex-wrap gap-1">
                        {categories.map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 text-xs uppercase cursor-pointer ${
                              selectedCategory === cat ? "bg-terracotta text-white" : "bg-swiss-gray hover:bg-swiss-light text-swiss-dark"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 text-swiss-dark absolute left-2 top-2.5" />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search menu..."
                          className="w-full bg-white border border-swiss-dark pl-7 pr-2 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* MENU GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredMenu.map(item => (
                        <div key={item.id} className="bg-white border-2 border-swiss-dark flex flex-col hover:border-terracotta transition-colors">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-44 object-cover border-b-2 border-swiss-dark"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-base text-swiss-dark">{item.name}</h4>
                                <span className="font-mono text-terracotta font-bold text-sm">NPR {item.price}</span>
                              </div>
                              <p className="text-xs text-swiss-dark/70 font-mono line-clamp-2 mb-2">
                                {item.description}
                              </p>

                              <div className="flex flex-wrap gap-1 mb-3">
                                {item.allergens.map(a => (
                                  <span key={a} className="bg-rose-50 border border-rose-200 text-rose-800 text-[9px] font-mono px-1">
                                    Allergen: {a}
                                  </span>
                                ))}
                                <span className="bg-swiss-light border border-swiss-gray text-swiss-dark/70 text-[9px] font-mono px-1 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.prepTime}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleAddToCart(item)}
                              className="w-full bg-swiss-dark hover:bg-terracotta text-white py-2 font-mono font-bold uppercase text-xs cursor-pointer tracking-wider"
                            >
                              Add to Table Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTIVE SHOPPING BAG & ORDER PLACER OR ACTIVE TABLE ORDERS LEDGER */}
                  <div className="bg-white border-2 border-swiss-dark p-6 flex flex-col justify-between font-mono text-xs h-fit">
                    <div>
                      {/* SIDE PANEL TAB SELECTOR */}
                      <div className="flex border-b-2 border-swiss-dark mb-4 text-center">
                        <button
                          onClick={() => setGuestRightTab("cart")}
                          className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all border-r border-swiss-dark cursor-pointer ${
                            guestRightTab === "cart" 
                              ? "bg-swiss-dark text-white font-black" 
                              : "bg-swiss-light hover:bg-swiss-gray text-swiss-dark"
                          }`}
                        >
                          🛒 Bag ({cart.reduce((sum, c) => sum + c.quantity, 0)})
                        </button>
                        <button
                          onClick={() => setGuestRightTab("orders")}
                          className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all border-r border-swiss-dark cursor-pointer ${
                            guestRightTab === "orders" 
                              ? "bg-swiss-dark text-white font-black" 
                              : "bg-swiss-light hover:bg-swiss-gray text-swiss-dark"
                          }`}
                        >
                          📋 Table ({hotelOrders.filter(o => o.tableNumber === activeGuestTable?.number).length})
                        </button>
                        <button
                          onClick={() => setGuestRightTab("history")}
                          className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                            guestRightTab === "history" 
                              ? "bg-swiss-dark text-white font-black" 
                              : "bg-swiss-light hover:bg-swiss-gray text-swiss-dark"
                          }`}
                        >
                          🕒 History ({hotelOrders.filter(o => o.tableId === activeGuestTableId).length})
                        </button>
                      </div>

                      {guestRightTab === "cart" ? (
                        <>
                          <h3 className="text-sm font-bold uppercase tracking-tight mb-4 pb-2 border-b border-swiss-gray flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-terracotta" />
                            Gourmet Dining Bag
                          </h3>

                          <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pr-1">
                            {cart.map((cartItem, idx) => (
                              <div key={idx} className="pb-3 border-b border-swiss-gray flex justify-between items-start">
                                <div className="flex-1 pr-2">
                                  <span className="font-bold text-swiss-dark">{cartItem.menuItem.name}</span>
                                  <div className="text-[10px] text-swiss-dark/60 mt-0.5">
                                    NPR {cartItem.menuItem.price} each
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Specific food requests..."
                                    value={cartItem.notes}
                                    onChange={(e) => {
                                      const updated = [...cart];
                                      updated[idx].notes = e.target.value;
                                      setCart(updated);
                                    }}
                                    className="bg-swiss-light border border-swiss-dark text-[10px] p-1 mt-1 w-full focus:outline-none"
                                  />
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-bold block">NPR {cartItem.menuItem.price * cartItem.quantity}</span>
                                  <div className="flex gap-1 items-center justify-end mt-1">
                                    <button 
                                      onClick={() => {
                                        const updated = [...cart];
                                        updated[idx].quantity = Math.max(1, updated[idx].quantity - 1);
                                        setCart(updated);
                                      }}
                                      className="px-1 py-0.5 bg-swiss-gray text-swiss-dark font-bold cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="font-bold px-1">{cartItem.quantity}</span>
                                    <button 
                                      onClick={() => {
                                        const updated = [...cart];
                                        updated[idx].quantity += 1;
                                        setCart(updated);
                                      }}
                                      className="px-1 py-0.5 bg-swiss-gray text-swiss-dark font-bold cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveFromCart(cartItem.menuItem.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {cart.length === 0 && (
                              <p className="text-swiss-dark/50 text-center py-10">
                                Your dining bag is currently empty. Scan menu items to add.
                              </p>
                            )}
                          </div>

                          {cart.length > 0 && (
                            <div className="border-t border-swiss-dark pt-4 mt-auto">
                              <div className="flex justify-between font-bold text-sm mb-3">
                                <span>Subtotal Amount:</span>
                                <span className="text-terracotta">NPR {cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0)}</span>
                              </div>

                              {/* TRANSACTION DETAILS */}
                              <div className="space-y-3 mb-4">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-swiss-dark/60 mb-1">
                                    Kitchen Chef Cooking Note
                                  </label>
                                  <input 
                                    type="text" 
                                    value={customerOrderNotes}
                                    onChange={(e) => setCustomerOrderNotes(e.target.value)}
                                    placeholder="e.g. Allergy info or seasoning requests..."
                                    className="w-full bg-swiss-light border border-swiss-dark p-2 text-xs focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-swiss-dark/60 mb-1">
                                    Secure Local Payment Gateways
                                  </label>
                                  <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full bg-white border border-swiss-dark p-2 text-xs"
                                  >
                                    <option value="eSewa">eSewa Mobile Wallet</option>
                                    <option value="Khalti">Khalti digital</option>
                                    <option value="Fonepay">Fonepay Quick Merchant</option>
                                    <option value="Stripe">Stripe International Credit</option>
                                    <option value="Cash">Cash on checkout</option>
                                  </select>
                                </div>
                              </div>

                              <button 
                                onClick={handleCheckoutCart}
                                className="w-full bg-terracotta hover:bg-swiss-dark text-white py-3 font-bold uppercase cursor-pointer text-xs tracking-wider border-none"
                              >
                                Submit Order to Kitchen
                              </button>
                            </div>
                          )}
                        </>
                      ) : guestRightTab === "orders" ? (
                        <>
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-gray">
                            <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                              <FileText className="w-4 h-4 text-terracotta" />
                              Table orders ledger
                            </h3>
                            <span className="text-[10px] font-mono bg-swiss-dark text-white px-1.5 py-0.5">
                              Table {activeGuestTable?.number}
                            </span>
                          </div>

                          <div className="space-y-4 max-h-[450px] overflow-y-auto mb-4 pr-1">
                            {hotelOrders
                              .filter(o => o.tableNumber === activeGuestTable?.number)
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map((order) => {
                                const unpaid = order.paymentStatus === "Pending";
                                return (
                                  <div key={order.id} className="p-3 border border-swiss-dark bg-swiss-light space-y-2 font-mono text-[11px]">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-swiss-dark">#{order.id.slice(-6)}</span>
                                      <span className="text-[9px] text-swiss-dark/50">
                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-1 text-swiss-dark/80 text-[10px]">
                                      {order.items.map((it, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span>{it.quantity}x {it.name}</span>
                                          <span>NPR {it.price * it.quantity}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Order note if exists */}
                                    {order.customerNotes && (
                                      <p className="text-[9px] text-swiss-dark/60 bg-white p-1 border border-swiss-gray/50 italic leading-snug">
                                        Note: {order.customerNotes}
                                      </p>
                                    )}

                                    {/* Bottom metrics and statuses */}
                                    <div className="flex justify-between items-center pt-2 border-t border-swiss-gray/30 text-[10px]">
                                      <div>
                                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                                          order.status === "Completed" || order.status === "Served"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : order.status === "Cancelled"
                                            ? "bg-rose-50 text-rose-800 border-rose-300"
                                            : "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                        }`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <span className="font-bold">NPR {order.totalAmount}</span>
                                    </div>

                                    {/* Payment details */}
                                    <div className="flex justify-between items-center text-[9px] text-swiss-dark/60 pt-1">
                                      <span>Payment Gateway</span>
                                      <span className={`font-bold uppercase ${unpaid ? "text-terracotta" : "text-emerald-700"}`}>
                                        {order.paymentMethod || "Cash"} • {order.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                            {hotelOrders.filter(o => o.tableNumber === activeGuestTable?.number).length === 0 && (
                              <div className="py-12 text-center text-swiss-dark/50 bg-swiss-light border border-dashed border-swiss-dark/30 italic">
                                No orders have been registered from Table {activeGuestTable?.number} yet. Place your first order on the Bag tab!
                              </div>
                            )}
                          </div>

                          {/* Cumulative table metrics at the bottom */}
                          {hotelOrders.filter(o => o.tableNumber === activeGuestTable?.number).length > 0 && (
                            <div className="border-t-2 border-swiss-dark pt-3 mt-4 space-y-1.5 bg-sand-light p-3 border">
                              <div className="flex justify-between font-bold text-[11px] text-swiss-dark/70">
                                <span>Total Table Orders Placed:</span>
                                <span>{hotelOrders.filter(o => o.tableNumber === activeGuestTable?.number).length}</span>
                              </div>
                              <div className="flex justify-between font-bold text-[11px] text-swiss-dark/70">
                                <span>Total Unpaid Amount:</span>
                                <span className="text-terracotta">
                                  NPR {hotelOrders
                                    .filter(o => o.tableNumber === activeGuestTable?.number && o.paymentStatus === "Pending")
                                    .reduce((sum, o) => sum + o.totalAmount, 0)}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-xs border-t border-swiss-dark/20 pt-1.5">
                                <span>Cumulative Table Bill:</span>
                                <span className="text-terracotta text-sm">
                                  NPR {hotelOrders
                                    .filter(o => o.tableNumber === activeGuestTable?.number)
                                    .reduce((sum, o) => sum + o.totalAmount, 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-swiss-gray">
                            <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                              <FileText className="w-4 h-4 text-terracotta" />
                              My Order History
                            </h3>
                            <span className="text-[10px] font-mono bg-terracotta text-white px-1.5 py-0.5">
                              This Session Only
                            </span>
                          </div>

                          <p className="text-[10px] text-swiss-dark/70 mb-3 leading-relaxed">
                            These past choices are limited strictly to orders placed by your current table scan session.
                          </p>

                          <div className="space-y-4 max-h-[450px] overflow-y-auto mb-4 pr-1">
                            {hotelOrders
                              .filter(o => o.tableId === activeGuestTableId)
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map((order) => {
                                const unpaid = order.paymentStatus === "Pending";
                                return (
                                  <div key={order.id} className="p-3 border border-swiss-dark bg-swiss-light space-y-2 font-mono text-[11px]">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-swiss-dark">#{order.id.slice(-6)}</span>
                                      <span className="text-[9px] text-swiss-dark/50">
                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-1 text-swiss-dark/80 text-[10px]">
                                      {order.items.map((it, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span>{it.quantity}x {it.name}</span>
                                          <span>NPR {it.price * it.quantity}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Order note if exists */}
                                    {order.customerNotes && (
                                      <p className="text-[9px] text-swiss-dark/60 bg-white p-1 border border-swiss-gray/50 italic leading-snug">
                                        Note: {order.customerNotes}
                                      </p>
                                    )}

                                    {/* Bottom metrics and statuses */}
                                    <div className="flex justify-between items-center pt-2 border-t border-swiss-gray/30 text-[10px]">
                                      <div>
                                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                                          order.status === "Completed" || order.status === "Served"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : order.status === "Cancelled"
                                            ? "bg-rose-50 text-rose-800 border-rose-300"
                                            : "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                        }`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <span className="font-bold">NPR {order.totalAmount}</span>
                                    </div>

                                    {/* Payment details */}
                                    <div className="flex justify-between items-center text-[9px] text-swiss-dark/60 pt-1">
                                      <span>Payment Gateway</span>
                                      <span className={`font-bold uppercase ${unpaid ? "text-terracotta" : "text-emerald-700"}`}>
                                        {order.paymentMethod || "Cash"} • {order.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                            {hotelOrders.filter(o => o.tableId === activeGuestTableId).length === 0 && (
                              <div className="py-12 text-center text-swiss-dark/50 bg-swiss-light border border-dashed border-swiss-dark/30 italic">
                                No orders have been placed by your table scan yet. Place an order on the Bag tab!
                              </div>
                            )}
                          </div>

                          {/* Cumulative scan metrics at the bottom */}
                          {hotelOrders.filter(o => o.tableId === activeGuestTableId).length > 0 && (
                            <div className="border-t-2 border-swiss-dark pt-3 mt-4 space-y-1.5 bg-sand-light p-3 border">
                              <div className="flex justify-between font-bold text-[11px] text-swiss-dark/70">
                                <span>My Session Orders:</span>
                                <span>{hotelOrders.filter(o => o.tableId === activeGuestTableId).length}</span>
                              </div>
                              <div className="flex justify-between font-bold text-[11px] text-swiss-dark/70">
                                <span>My Cumulative Bill:</span>
                                <span className="text-terracotta">
                                  NPR {hotelOrders
                                    .filter(o => o.tableId === activeGuestTableId)
                                    .reduce((sum, o) => sum + o.totalAmount, 0)}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-xs border-t border-swiss-dark/20 pt-1.5">
                                <span>Status Verification:</span>
                                <span className="text-emerald-700 uppercase text-[10px]">
                                  {hotelOrders.filter(o => o.tableId === activeGuestTableId && o.status !== "Completed" && o.status !== "Served" && o.status !== "Cancelled").length > 0 
                                    ? "Kitchen Preparing" 
                                    : "All Served / Completed"}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t-4 border-swiss-dark bg-white py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs text-swiss-dark/70">
          <div>
            <span className="font-bold text-swiss-dark">HospitalityOS • Swiss Editorial Layout Standard</span>
            <p className="mt-1 text-[10px]">Terracotta Bloom #C96A4A AND Sand Dune #EEDC82. No unrequested emojis.</p>
          </div>
          <div>
            <span>Global Multi-Tenant Sandbox • All Rights Reserved 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
