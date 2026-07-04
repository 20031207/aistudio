import express from "express";
import path from "path";
import dotenv from "dotenv";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();

// Production level security optimizations
app.disable("x-powered-by"); // Hide Express implementation details

// Enable Gzip/Deflate compression for optimal JSON and static delivery sizing
app.use(compression());

// Basic production safety headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json());

const PORT = 3000;

// Initialize Gemini API with user-agent telemetry and error-handling fallback
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found. AI Assistant will run in simulated expert mode.");
}

// MULTI-TENANT IN-MEMORY DATABASE SEED DATA
interface Hotel {
  id: string;
  name: string;
  tagline: string;
  plan: "Basic" | "Professional" | "Enterprise";
  status: "Active" | "Suspended";
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  font?: string;
  currency: string;
  branches: { id: string; name: string; location: string }[];
  username?: string;
  password?: string;
}

interface Table {
  id: string;
  hotelId: string;
  branchId: string;
  number: string;
  seatingCapacity: number;
  qrUrl: string; // Dynamic URL identifier
  status: "Vacant" | "Occupied" | "Reserved";
  reservedName?: string;
  reservedTime?: string;
}

interface MenuItem {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients: string[];
  allergens: string[];
  nutrition: { calories: number; protein: string; carbs: string };
  prepTime: string;
  isAvailable: boolean;
  isPopular: boolean;
}

interface Order {
  id: string;
  hotelId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  items: { menuItemId: string; name: string; quantity: number; price: number; notes?: string }[];
  totalAmount: number;
  status: "Received" | "Accepted" | "Preparing" | "Ready" | "Served" | "Completed" | "Cancelled";
  paymentStatus: "Pending" | "Paid";
  paymentMethod?: "eSewa" | "Khalti" | "Fonepay" | "Stripe" | "Cash";
  timestamp: string;
  customerNotes?: string;
  rating?: number;
  feedback?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
}

interface StockItem {
  id: string;
  hotelId: string;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  expiryDate: string;
  supplier: string;
}

interface Employee {
  id: string;
  hotelId: string;
  name: string;
  role: "Manager" | "Receptionist" | "Cashier" | "Waiter" | "Kitchen Staff" | "Housekeeping";
  branchId: string;
  attendance: "Present" | "Absent" | "On Leave";
  schedule: string;
}

interface Room {
  id: string;
  hotelId: string;
  number: string;
  type: "Deluxe Suite" | "Standard Room" | "Executive Suite" | "Family Room";
  price: number;
  status: "Available" | "Occupied" | "Cleaning" | "Maintenance";
  guestName?: string;
  checkInDate?: string;
}

interface ServiceCall {
  id: string;
  hotelId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  type: "Call Waiter" | "Request Bill" | "Water Refill";
  status: "Pending" | "Resolved";
  timestamp: string;
}

// Initial Seeds
const hotels: Hotel[] = [
  {
    id: "h-yak-yeti",
    name: "Yak & Yeti Palace",
    tagline: "Himalayan Luxury & Heritage",
    plan: "Enterprise",
    status: "Active",
    logoUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=100&h=100&fit=crop",
    primaryColor: "#C96A4A",
    secondaryColor: "#EEDC82",
    font: "Inter",
    currency: "NPR",
    branches: [
      { id: "b-ktm", name: "Kathmandu Durbar Marg", location: "Durbar Marg, Kathmandu" },
      { id: "b-pkr", name: "Lakeside Pokhara", location: "Lakeside, Pokhara" }
    ],
    username: "yeti",
    password: "yeti123"
  },
  {
    id: "h-himalayan-java",
    name: "Himalayan Java & Kitchen",
    tagline: "Fine Nepalese Coffee & Organic Bakery",
    plan: "Professional",
    status: "Active",
    logoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop",
    primaryColor: "#3B2F2F",
    secondaryColor: "#D2B48C",
    font: "Space Grotesk",
    currency: "NPR",
    branches: [
      { id: "b-bkt", name: "Bhaktapur Square", location: "Bhaktapur Durbar Square" }
    ],
    username: "java",
    password: "java123"
  }
];

const tables: Table[] = [
  { id: "t-1", hotelId: "h-yak-yeti", branchId: "b-ktm", number: "01", seatingCapacity: 4, qrUrl: "h-yak-yeti/b-ktm/t-1", status: "Vacant" },
  { id: "t-2", hotelId: "h-yak-yeti", branchId: "b-ktm", number: "02", seatingCapacity: 2, qrUrl: "h-yak-yeti/b-ktm/t-2", status: "Occupied" },
  { id: "t-3", hotelId: "h-yak-yeti", branchId: "b-ktm", number: "03", seatingCapacity: 6, qrUrl: "h-yak-yeti/b-ktm/t-3", status: "Vacant" },
  { id: "t-4", hotelId: "h-yak-yeti", branchId: "b-ktm", number: "04", seatingCapacity: 4, qrUrl: "h-yak-yeti/b-ktm/t-4", status: "Vacant" },
  { id: "t-5", hotelId: "h-yak-yeti", branchId: "b-ktm", number: "05", seatingCapacity: 2, qrUrl: "h-yak-yeti/b-ktm/t-5", status: "Reserved" },
  { id: "t-6", hotelId: "h-himalayan-java", branchId: "b-bkt", number: "M1", seatingCapacity: 2, qrUrl: "h-himalayan-java/b-bkt/t-6", status: "Vacant" },
  { id: "t-7", hotelId: "h-himalayan-java", branchId: "b-bkt", number: "M2", seatingCapacity: 4, qrUrl: "h-himalayan-java/b-bkt/t-7", status: "Vacant" }
];

const menuItems: MenuItem[] = [
  {
    id: "m-1",
    hotelId: "h-yak-yeti",
    name: "Classic Steamed Buff Momos",
    category: "Momo & Dumplings",
    price: 380,
    description: "Minced buffalo meat wrapped in thin flour dough, seasoned with garlic, ginger, and local Himalayan spices. Served with fire-roasted tomato and sesame chutney.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Buffalo Meat", "Wheat Flour", "Onion", "Ginger", "Garlic", "Szechuan Pepper"],
    allergens: ["Gluten", "Sesame"],
    nutrition: { calories: 420, protein: "24g", carbs: "48g" },
    prepTime: "15 min",
    isAvailable: true,
    isPopular: true
  },
  {
    id: "m-2",
    hotelId: "h-yak-yeti",
    name: "Kothey Pan-Fried Chicken Momos",
    category: "Momo & Dumplings",
    price: 420,
    description: "Half-steamed, half-fried chicken momos served with spicy peanut dipping sauce. Delightfully crispy bottom and tender filling.",
    image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Minced Chicken", "Coriander", "Sesame Oil", "Flour", "Himalayan Herbs"],
    allergens: ["Gluten", "Peanuts", "Sesame"],
    nutrition: { calories: 480, protein: "26g", carbs: "50g" },
    prepTime: "18 min",
    isAvailable: true,
    isPopular: true
  },
  {
    id: "m-3",
    hotelId: "h-yak-yeti",
    name: "Himalayan Thakali Thali (Mutton)",
    category: "Traditional Meals",
    price: 780,
    description: "Authentic Thakali platter with organic local rice, slow-cooked mutton curry, black lentil soup, dry mustard greens, spicy radish pickle, and fresh ghee.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Local Rice", "Local Mutton", "Black Lentils", "Spinach", "Radish", "Ghee"],
    allergens: ["Dairy"],
    nutrition: { calories: 750, protein: "38g", carbs: "90g" },
    prepTime: "25 min",
    isAvailable: true,
    isPopular: true
  },
  {
    id: "m-4",
    hotelId: "h-yak-yeti",
    name: "Newari Samay Baji Platter",
    category: "Traditional Meals",
    price: 650,
    description: "Traditional ceremonial Newari feast with beaten rice, spiced grilled buffalo meat (Choila), roasted soy beans, marinated potato salad, garlic ginger greens, and boiled egg.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Beaten Rice", "Buffalo Choila", "Black Soy Beans", "Potato", "Ginger", "Garlic", "Egg"],
    allergens: ["Eggs"],
    nutrition: { calories: 590, protein: "32g", carbs: "75g" },
    prepTime: "20 min",
    isAvailable: true,
    isPopular: false
  },
  {
    id: "m-5",
    hotelId: "h-yak-yeti",
    name: "Sadeko Gundruk & Bhatmas",
    category: "Starters",
    price: 240,
    description: "Fermented dried leafy greens and crunchy dry-roasted soybeans tossed with fresh mustard oil, green chillies, onions, coriander, and Himalayan pink salt.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Fermented Mustard Leaves", "Soybeans", "Mustard Oil", "Green Chillies", "Onions"],
    allergens: ["Soy"],
    nutrition: { calories: 180, protein: "12g", carbs: "22g" },
    prepTime: "10 min",
    isAvailable: true,
    isPopular: false
  },
  {
    id: "m-6",
    hotelId: "h-yak-yeti",
    name: "Spicy Szechuan Chilli Chicken",
    category: "Starters",
    price: 450,
    description: "Stir-fried crispy chicken cubes tossed with bell peppers, green chillies, spring onions, and spicy dark soy sauce.",
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Chicken", "Bell Peppers", "Soy Sauce", "Szechuan Peppercorns", "Chillies"],
    allergens: ["Soy", "Gluten"],
    nutrition: { calories: 390, protein: "28g", carbs: "18g" },
    prepTime: "12 min",
    isAvailable: true,
    isPopular: true
  },
  {
    id: "m-7",
    hotelId: "h-yak-yeti",
    name: "Organic Honey Latte",
    category: "Beverages",
    price: 280,
    description: "Double shot espresso of organic single-origin coffee with steamed organic milk and a splash of wild Himalayan honey.",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Espresso", "Organic Milk", "Wild Honey"],
    allergens: ["Dairy"],
    nutrition: { calories: 160, protein: "8g", carbs: "24g" },
    prepTime: "5 min",
    isAvailable: true,
    isPopular: true
  },
  {
    id: "m-8",
    hotelId: "h-yak-yeti",
    name: "Fresh Himalayan Mint Lemonade",
    category: "Beverages",
    price: 190,
    description: "Freshly squeezed lemons with wild mountain mint leaves, pure sugarcane syrup, and sparkling spring water.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Lemon Juice", "Wild Mint", "Cane Sugar", "Sparkling Water"],
    allergens: [],
    nutrition: { calories: 95, protein: "0g", carbs: "24g" },
    prepTime: "4 min",
    isAvailable: true,
    isPopular: false
  }
];

const orders: Order[] = [
  {
    id: "ord-101",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-2",
    tableNumber: "02",
    items: [
      { menuItemId: "m-1", name: "Classic Steamed Buff Momos", quantity: 2, price: 380, notes: "Extra spicy sauce" },
      { menuItemId: "m-7", name: "Organic Honey Latte", quantity: 1, price: 280 }
    ],
    totalAmount: 1040,
    status: "Preparing",
    paymentStatus: "Pending",
    timestamp: new Date().toISOString(),
    customerNotes: "Please make the momos extra spicy."
  },
  {
    id: "ord-102",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-5",
    tableNumber: "05",
    items: [
      { menuItemId: "m-3", name: "Himalayan Thakali Thali (Mutton)", quantity: 1, price: 780 }
    ],
    totalAmount: 780,
    status: "Received",
    paymentStatus: "Pending",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: "ord-100",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-1",
    tableNumber: "01",
    items: [
      { menuItemId: "m-2", name: "Kothey Pan-Fried Chicken Momos", quantity: 1, price: 420 },
      { menuItemId: "m-8", name: "Fresh Himalayan Mint Lemonade", quantity: 2, price: 190 }
    ],
    totalAmount: 800,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "eSewa",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    rating: 5,
    feedback: "Exceptional momos! Best in Kathmandu."
  },
  {
    id: "ord-hist-1",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-1",
    tableNumber: "01",
    items: [{ menuItemId: "m-3", name: "Himalayan Thakali Thali (Mutton)", quantity: 2, price: 780 }],
    totalAmount: 1560,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "Fonepay",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-hist-2",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-3",
    tableNumber: "03",
    items: [{ menuItemId: "m-1", name: "Classic Steamed Buff Momos", quantity: 3, price: 380 }],
    totalAmount: 1140,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "Khalti",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-hist-3",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-4",
    tableNumber: "04",
    items: [
      { menuItemId: "m-3", name: "Himalayan Thakali Thali (Mutton)", quantity: 2, price: 780 },
      { menuItemId: "m-6", name: "Spicy Szechuan Chilli Chicken", quantity: 2, price: 450 }
    ],
    totalAmount: 2460,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-hist-4",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-1",
    tableNumber: "01",
    items: [
      { menuItemId: "m-2", name: "Kothey Pan-Fried Chicken Momos", quantity: 2, price: 420 },
      { menuItemId: "m-7", name: "Organic Honey Latte", quantity: 3, price: 280 }
    ],
    totalAmount: 1680,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "eSewa",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-hist-5",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-2",
    tableNumber: "02",
    items: [
      { menuItemId: "m-3", name: "Himalayan Thakali Thali (Mutton)", quantity: 3, price: 780 },
      { menuItemId: "m-8", name: "Fresh Himalayan Mint Lemonade", quantity: 3, price: 190 }
    ],
    totalAmount: 2910,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "Khalti",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-hist-6",
    hotelId: "h-yak-yeti",
    branchId: "b-ktm",
    tableId: "t-5",
    tableNumber: "05",
    items: [
      { menuItemId: "m-4", name: "Newari Samay Baji Platter", quantity: 2, price: 650 },
      { menuItemId: "m-5", name: "Sadeko Gundruk & Bhatmas", quantity: 3, price: 240 }
    ],
    totalAmount: 2020,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "Fonepay",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const stockItems: StockItem[] = [
  { id: "s-1", hotelId: "h-yak-yeti", name: "Buffalo Meat Minced", quantity: 45, unit: "kg", minLevel: 10, expiryDate: "2026-07-03", supplier: "Valley Meat Suppliers" },
  { id: "s-2", hotelId: "h-yak-yeti", name: "Organic Coffee Beans (Lalitpur)", quantity: 18, unit: "kg", minLevel: 5, expiryDate: "2026-12-15", supplier: "EcoHimal Coffee Farms" },
  { id: "s-3", hotelId: "h-yak-yeti", name: "Himalayan Wild Honey", quantity: 4, unit: "Litre", minLevel: 8, expiryDate: "2027-01-20", supplier: "Solukhumbu Cooperatives" },
  { id: "s-4", hotelId: "h-yak-yeti", name: "Local Thakali Rice (Mustang)", quantity: 150, unit: "kg", minLevel: 50, expiryDate: "2026-11-30", supplier: "Thakali Food Traders" },
  { id: "s-5", hotelId: "h-yak-yeti", name: "Sesame Seeds", quantity: 2.5, unit: "kg", minLevel: 3, expiryDate: "2026-08-10", supplier: "Makwanpur Seeds Co." }
];

const employees: Employee[] = [
  { id: "e-1", hotelId: "h-yak-yeti", name: "Subash Tamang", role: "Manager", branchId: "b-ktm", attendance: "Present", schedule: "09:00 - 18:00" },
  { id: "e-2", hotelId: "h-yak-yeti", name: "Sita Sharma", role: "Cashier", branchId: "b-ktm", attendance: "Present", schedule: "08:00 - 16:00" },
  { id: "e-3", hotelId: "h-yak-yeti", name: "Niranjan Shrestha", role: "Kitchen Staff", branchId: "b-ktm", attendance: "Present", schedule: "11:00 - 22:00" },
  { id: "e-4", hotelId: "h-yak-yeti", name: "Maya Lama", role: "Housekeeping", branchId: "b-ktm", attendance: "Present", schedule: "07:00 - 15:00" },
  { id: "e-5", hotelId: "h-yak-yeti", name: "Ram Bahadur", role: "Waiter", branchId: "b-ktm", attendance: "Present", schedule: "12:00 - 21:00" }
];

const rooms: Room[] = [
  { id: "r-201", hotelId: "h-yak-yeti", number: "201", type: "Deluxe Suite", price: 12000, status: "Occupied", guestName: "Sarah Jenkins", checkInDate: "2026-06-28" },
  { id: "r-202", hotelId: "h-yak-yeti", number: "202", type: "Standard Room", price: 6500, status: "Available" },
  { id: "r-203", hotelId: "h-yak-yeti", number: "203", type: "Executive Suite", price: 18000, status: "Cleaning" },
  { id: "r-204", hotelId: "h-yak-yeti", number: "204", type: "Family Room", price: 10000, status: "Maintenance" }
];

const serviceCalls: ServiceCall[] = [
  { id: "sc-1", hotelId: "h-yak-yeti", branchId: "b-ktm", tableId: "t-2", tableNumber: "02", type: "Call Waiter", status: "Pending", timestamp: new Date().toISOString() }
];

// --- ORDER LOAD BALANCING ENGINE STATE & HELPER ---
let activeBalancingAlgorithm = "RoundRobin"; // "RoundRobin" | "LeastWorkload" | "QueueDepth" | "Manual"
let autoBalancingEnabled = true;

function balanceAndAssignOrder(order: Order) {
  if (!autoBalancingEnabled || activeBalancingAlgorithm === "Manual") return;

  const presentStaff = employees.filter(
    e => e.hotelId === order.hotelId && 
         e.branchId === order.branchId && 
         e.attendance === "Present" && 
         (e.role === "Kitchen Staff" || e.role === "Waiter")
  );

  if (presentStaff.length === 0) return;

  let chosenStaff: Employee | null = null;

  if (activeBalancingAlgorithm === "RoundRobin") {
    // Get all orders in the current hotel & branch that have staff assigned
    const assignedOrders = orders.filter(
      o => o.hotelId === order.hotelId && 
           o.branchId === order.branchId && 
           o.assignedStaffId
    );
    if (assignedOrders.length > 0) {
      // Sort by timestamp descending
      assignedOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastAssignedId = assignedOrders[0].assignedStaffId;
      const lastIdx = presentStaff.findIndex(e => e.id === lastAssignedId);
      const nextIdx = (lastIdx + 1) % presentStaff.length;
      chosenStaff = presentStaff[nextIdx];
    } else {
      chosenStaff = presentStaff[0];
    }
  } else if (activeBalancingAlgorithm === "LeastWorkload") {
    let minLoad = Infinity;
    presentStaff.forEach(staff => {
      const activeLoad = orders.filter(
        o => o.assignedStaffId === staff.id && 
             o.status !== "Completed" && 
             o.status !== "Cancelled"
      ).length;
      if (activeLoad < minLoad) {
        minLoad = activeLoad;
        chosenStaff = staff;
      }
    });
  } else if (activeBalancingAlgorithm === "QueueDepth") {
    let minQueueMs = Infinity;
    presentStaff.forEach(staff => {
      const assignedActiveOrders = orders.filter(
        o => o.assignedStaffId === staff.id && 
             o.status !== "Completed" && 
             o.status !== "Cancelled"
      );
      
      let queueMs = 0;
      assignedActiveOrders.forEach(o => {
        let maxPrepMinutes = 10;
        o.items.forEach(item => {
          const menuItem = menuItems.find(m => m.id === item.menuItemId);
          const rawPrep = menuItem?.prepTime || "10 min";
          const matched = rawPrep.match(/\d+/);
          if (matched) {
            const mins = parseInt(matched[0], 10);
            if (mins > maxPrepMinutes) maxPrepMinutes = mins;
          }
        });
        queueMs += maxPrepMinutes * 60 * 1000;
      });

      if (queueMs < minQueueMs) {
        minQueueMs = queueMs;
        chosenStaff = staff;
      }
    });
  }

  if (chosenStaff) {
    order.assignedStaffId = chosenStaff.id;
    order.assignedStaffName = chosenStaff.name;
    console.log(`[Load Balancer] Auto-assigned Order #${order.id} to ${chosenStaff.name} using ${activeBalancingAlgorithm} algorithm.`);
  }
}

// --- REST API MIDDLEWARE & ROUTES ---

// 1. Hotel Management (Super Admin Actions)
app.get("/api/hotels", (req, res) => {
  res.json(hotels);
});

app.post("/api/hotels", (req, res) => {
  const { name, tagline, plan, primaryColor, secondaryColor, font, username, password } = req.body;
  if (!name) return res.status(400).json({ error: "Hotel name is required." });

  const id = `h-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  
  // Set default credentials if they aren't provided
  const resolvedUsername = username || name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const resolvedPassword = password || "password123";

  const newHotel: Hotel = {
    id,
    name,
    tagline: tagline || "A Fine Hospitality Business",
    plan: plan || "Basic",
    status: "Active",
    logoUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=100&h=100&fit=crop",
    primaryColor: primaryColor || "#C96A4A",
    secondaryColor: secondaryColor || "#EEDC82",
    font: font || "Inter",
    currency: "NPR",
    branches: [
      { id: `b-${id}-main`, name: "Main Head Branch", location: "Kathmandu Central" }
    ],
    username: resolvedUsername,
    password: resolvedPassword
  };

  hotels.push(newHotel);

  // Auto Onboarding Creation: tables, menu, employee, stock
  tables.push({
    id: `t-${id}-1`,
    hotelId: id,
    branchId: `b-${id}-main`,
    number: "01",
    seatingCapacity: 4,
    qrUrl: `${id}/b-${id}-main/t-${id}-1`,
    status: "Vacant"
  });

  menuItems.push({
    id: `m-${id}-1`,
    hotelId: id,
    name: `${name} Specialty Dumplings`,
    category: "Signature Dishes",
    price: 350,
    description: `The signature delicious dumplings handcrafted by ${name}. Served with unique chef special spicy chutney.`,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=60",
    ingredients: ["Flour", "Organic Veggies", "Chef Spices"],
    allergens: ["Gluten"],
    nutrition: { calories: 350, protein: "14g", carbs: "42g" },
    prepTime: "15 min",
    isAvailable: true,
    isPopular: true
  });

  stockItems.push({
    id: `s-${id}-1`,
    hotelId: id,
    name: "Specialty Flour Blend",
    quantity: 100,
    unit: "kg",
    minLevel: 20,
    expiryDate: "2026-10-30",
    supplier: "Universal Agro Traders"
  });

  employees.push({
    id: `e-${id}-1`,
    hotelId: id,
    name: "Platform Manager",
    role: "Manager",
    branchId: `b-${id}-main`,
    attendance: "Present",
    schedule: "09:00 - 18:00"
  });

  res.status(201).json(newHotel);
});

// Hotel Authentication Login Endpoint
app.post("/api/hotels/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const hotel = hotels.find(
    h => h.username?.toLowerCase() === username.toLowerCase() && h.password === password
  );

  if (!hotel) {
    return res.status(401).json({ error: "Invalid hotel credentials." });
  }

  if (hotel.status === "Suspended") {
    return res.status(403).json({ error: "This hotel subscription is currently suspended." });
  }

  res.json({ success: true, hotel });
});

app.put("/api/hotels/:id", (req, res) => {
  const { id } = req.params;
  const { status, plan, name, tagline, primaryColor, secondaryColor, font } = req.body;
  const idx = hotels.findIndex(h => h.id === id);
  if (idx === -1) return res.status(404).json({ error: "Hotel not found" });

  if (status) hotels[idx].status = status;
  if (plan) hotels[idx].plan = plan;
  if (name) hotels[idx].name = name;
  if (tagline) hotels[idx].tagline = tagline;
  if (primaryColor) hotels[idx].primaryColor = primaryColor;
  if (secondaryColor) hotels[idx].secondaryColor = secondaryColor;
  if (font) hotels[idx].font = font;

  res.json(hotels[idx]);
});

// 2. Table / QR Code generation
app.get("/api/tables", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) {
    return res.json(tables.filter(t => t.hotelId === hotelId));
  }
  res.json(tables);
});

app.post("/api/tables", (req, res) => {
  const { hotelId, branchId, number, seatingCapacity } = req.body;
  if (!hotelId || !branchId || !number) {
    return res.status(400).json({ error: "Missing required table details" });
  }

  const id = `t-${Date.now()}`;
  const newTable: Table = {
    id,
    hotelId,
    branchId,
    number,
    seatingCapacity: Number(seatingCapacity) || 4,
    qrUrl: `${hotelId}/${branchId}/${id}`,
    status: "Vacant"
  };

  tables.push(newTable);
  res.status(201).json(newTable);
});

app.put("/api/tables/:id", (req, res) => {
  const { id } = req.params;
  const { status, reservedName, reservedTime } = req.body;
  const idx = tables.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Table not found" });

  if (status !== undefined) tables[idx].status = status;
  if (reservedName !== undefined) tables[idx].reservedName = reservedName;
  if (reservedTime !== undefined) tables[idx].reservedTime = reservedTime;

  res.json(tables[idx]);
});

// 3. Menu Endpoints
app.get("/api/menu", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) {
    return res.json(menuItems.filter(m => m.hotelId === hotelId));
  }
  res.json(menuItems);
});

app.post("/api/menu", (req, res) => {
  const { hotelId, name, category, price, description, prepTime, isAvailable, ingredients, allergens } = req.body;
  if (!hotelId || !name || !price) {
    return res.status(400).json({ error: "Missing menu items fields." });
  }

  const newMenuItem: MenuItem = {
    id: `m-${Date.now()}`,
    hotelId,
    name,
    category: category || "General",
    price: Number(price),
    description: description || "",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60",
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    allergens: Array.isArray(allergens) ? allergens : [],
    nutrition: { calories: 340, protein: "15g", carbs: "40g" },
    prepTime: prepTime || "15 min",
    isAvailable: isAvailable !== false,
    isPopular: false
  };

  menuItems.push(newMenuItem);
  res.status(201).json(newMenuItem);
});

app.delete("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const idx = menuItems.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "Menu item not found" });
  const removedItem = menuItems.splice(idx, 1)[0];
  res.json({ message: "Menu item removed successfully", item: removedItem });
});

// 4. Order Management
app.get("/api/orders", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) {
    return res.json(orders.filter(o => o.hotelId === hotelId));
  }
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { hotelId, branchId, tableId, tableNumber, items, customerNotes, paymentMethod } = req.body;
  if (!hotelId || !tableId || !items || !items.length) {
    return res.status(400).json({ error: "Missing order information." });
  }

  const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const newOrder: Order = {
    id: `ord-${Math.floor(100 + Math.random() * 900)}`,
    hotelId,
    branchId: branchId || "b-ktm",
    tableId,
    tableNumber: tableNumber || "01",
    items,
    totalAmount,
    status: "Received",
    paymentStatus: paymentMethod === "Cash" ? "Pending" : "Paid",
    paymentMethod,
    customerNotes,
    timestamp: new Date().toISOString()
  };

  // Mark table as occupied
  const tIdx = tables.findIndex(t => t.id === tableId);
  if (tIdx !== -1) {
    tables[tIdx].status = "Occupied";
  }

  balanceAndAssignOrder(newOrder);
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod, rating, feedback, assignedStaffId, assignedStaffName } = req.body;
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });

  if (assignedStaffId !== undefined) {
    orders[idx].assignedStaffId = assignedStaffId;
  }
  if (assignedStaffName !== undefined) {
    orders[idx].assignedStaffName = assignedStaffName;
  }

  if (status) {
    orders[idx].status = status;
    // If order completed or cancelled, free up the table
    if (status === "Completed" || status === "Cancelled") {
      const tableId = orders[idx].tableId;
      const tIdx = tables.findIndex(t => t.id === tableId);
      if (tIdx !== -1) tables[tIdx].status = "Vacant";
    }
  }
  if (paymentStatus) orders[idx].paymentStatus = paymentStatus;
  if (paymentMethod) orders[idx].paymentMethod = paymentMethod;
  if (rating) orders[idx].rating = rating;
  if (feedback) orders[idx].feedback = feedback;

  res.json(orders[idx]);
});

// 5. Service Calls / Waiter Alerts
app.get("/api/service-calls", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) {
    return res.json(serviceCalls.filter(sc => sc.hotelId === hotelId));
  }
  res.json(serviceCalls);
});

app.post("/api/service-calls", (req, res) => {
  const { hotelId, branchId, tableId, tableNumber, type } = req.body;
  if (!hotelId || !tableId || !type) {
    return res.status(400).json({ error: "Missing service call request info" });
  }

  const newCall: ServiceCall = {
    id: `sc-${Date.now()}`,
    hotelId,
    branchId: branchId || "b-ktm",
    tableId,
    tableNumber,
    type,
    status: "Pending",
    timestamp: new Date().toISOString()
  };

  serviceCalls.push(newCall);
  res.status(201).json(newCall);
});

app.put("/api/service-calls/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = serviceCalls.findIndex(sc => sc.id === id);
  if (idx === -1) return res.status(404).json({ error: "Service call not found" });

  if (status) serviceCalls[idx].status = status;
  res.json(serviceCalls[idx]);
});

// 6. Housekeeping, Rooms & Employees
app.get("/api/rooms", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) return res.json(rooms.filter(r => r.hotelId === hotelId));
  res.json(rooms);
});

app.put("/api/rooms/:id", (req, res) => {
  const { id } = req.params;
  const { status, guestName, checkInDate } = req.body;
  const idx = rooms.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Room not found" });

  if (status) rooms[idx].status = status;
  if (guestName !== undefined) rooms[idx].guestName = guestName;
  if (checkInDate !== undefined) rooms[idx].checkInDate = checkInDate;

  res.json(rooms[idx]);
});

app.get("/api/employees", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) return res.json(employees.filter(e => e.hotelId === hotelId));
  res.json(employees);
});

app.post("/api/employees", (req, res) => {
  const { hotelId, name, role, branchId, attendance, schedule } = req.body;
  if (!hotelId || !name || !role) {
    return res.status(400).json({ error: "Missing required employee details." });
  }
  const newEmp: Employee = {
    id: `e-${Date.now()}`,
    hotelId,
    name,
    role,
    branchId: branchId || "b-ktm",
    attendance: attendance || "Present",
    schedule: schedule || "09:00 - 18:00"
  };
  employees.push(newEmp);
  res.status(201).json(newEmp);
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, role, attendance, schedule } = req.body;
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Employee not found." });

  if (name !== undefined) employees[idx].name = name;
  if (role !== undefined) employees[idx].role = role;
  if (attendance !== undefined) employees[idx].attendance = attendance;
  if (schedule !== undefined) employees[idx].schedule = schedule;

  res.json(employees[idx]);
});

app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Employee not found." });
  const deleted = employees.splice(idx, 1);
  res.json(deleted[0]);
});

// --- LOAD BALANCER CONTROL ENDPOINTS ---
app.get("/api/load-balancer/config", (req, res) => {
  res.json({
    activeBalancingAlgorithm,
    autoBalancingEnabled
  });
});

app.put("/api/load-balancer/config", (req, res) => {
  const { algorithm, enabled } = req.body;
  if (algorithm !== undefined) activeBalancingAlgorithm = algorithm;
  if (enabled !== undefined) autoBalancingEnabled = !!enabled;
  res.json({
    activeBalancingAlgorithm,
    autoBalancingEnabled,
    message: "Load balancer configurations updated successfully."
  });
});

app.post("/api/load-balancer/rebalance", (req, res) => {
  const { hotelId, branchId } = req.body;
  if (!hotelId || !branchId) {
    return res.status(400).json({ error: "Missing hotelId or branchId parameters." });
  }

  const presentStaff = employees.filter(
    e => e.hotelId === hotelId && 
         e.branchId === branchId && 
         e.attendance === "Present" && 
         (e.role === "Kitchen Staff" || e.role === "Waiter")
  );

  if (presentStaff.length === 0) {
    return res.status(400).json({ error: "No present staff members found to balance workload across." });
  }

  const activeOrders = orders.filter(
    o => o.hotelId === hotelId && 
         o.branchId === branchId && 
         o.status !== "Completed" && 
         o.status !== "Cancelled"
  );

  if (activeOrders.length === 0) {
    return res.json({ message: "No active orders require re-balancing.", logs: [] });
  }

  let rrIndex = 0;
  const staffLoads = presentStaff.map(staff => ({
    staff,
    activeOrdersCount: 0,
    queueMs: 0
  }));

  const rebalancedLogs: string[] = [];
  const sortedOrders = [...activeOrders].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  sortedOrders.forEach(order => {
    let chosen = staffLoads[0];

    if (activeBalancingAlgorithm === "RoundRobin") {
      chosen = staffLoads[rrIndex];
      rrIndex = (rrIndex + 1) % staffLoads.length;
    } else if (activeBalancingAlgorithm === "LeastWorkload") {
      chosen = staffLoads.reduce((prev, curr) => prev.activeOrdersCount < curr.activeOrdersCount ? prev : curr);
    } else if (activeBalancingAlgorithm === "QueueDepth") {
      chosen = staffLoads.reduce((prev, curr) => prev.queueMs < curr.queueMs ? prev : curr);
    }

    let maxPrepMinutes = 10;
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      const rawPrep = menuItem?.prepTime || "10 min";
      const matched = rawPrep.match(/\d+/);
      if (matched) {
        const mins = parseInt(matched[0], 10);
        if (mins > maxPrepMinutes) maxPrepMinutes = mins;
      }
    });

    order.assignedStaffId = chosen.staff.id;
    order.assignedStaffName = chosen.staff.name;

    chosen.activeOrdersCount += 1;
    chosen.queueMs += maxPrepMinutes * 60 * 1000;

    rebalancedLogs.push(`Order #${order.id} allocated to ${chosen.staff.name} (${activeBalancingAlgorithm})`);
  });

  res.json({
    message: `Workloads successfully re-balanced for ${activeOrders.length} active orders across ${presentStaff.length} present staff members.`,
    logs: rebalancedLogs
  });
});

app.get("/api/inventory", (req, res) => {
  const { hotelId } = req.query;
  if (hotelId) return res.json(stockItems.filter(s => s.hotelId === hotelId));
  res.json(stockItems);
});

app.put("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const idx = stockItems.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Stock item not found" });

  if (quantity !== undefined) stockItems[idx].quantity = Number(quantity);
  res.json(stockItems[idx]);
});

// --- SERVER-SIDE GEMINI API INTENT PROXIES ---

// IN-MEMORY CACHE FOR AI REQUESTS TO PREVENT RATE LIMITS AND REDUCE LATENCY
const aiCache: { [key: string]: { timestamp: number; data: any } } = {};
const CACHE_TTL_MS = 60 * 1000; // 1-minute cache

// 7. AI Guest Assistant Recommendation Endpoint
app.post("/api/ai/recommend", async (req, res) => {
  const { query, hotelId } = req.body;
  if (!query) return res.status(400).json({ error: "Search query is required." });

  // Check cache first
  const cacheKey = `${hotelId || "h-yak-yeti"}-recommend-${query.toLowerCase().trim()}`;
  if (aiCache[cacheKey] && (Date.now() - aiCache[cacheKey].timestamp) < CACHE_TTL_MS) {
    return res.json(aiCache[cacheKey].data);
  }

  // Gather current menu as context
  const filteredMenu = menuItems.filter(m => m.hotelId === (hotelId || "h-yak-yeti"));
  const menuContext = filteredMenu.map(m => ({
    name: m.name,
    category: m.category,
    price: m.price,
    description: m.description,
    ingredients: m.ingredients,
    allergens: m.allergens,
    prepTime: m.prepTime,
    calories: m.nutrition.calories
  }));

  const systemInstruction = `You are a world-class Swiss-trained professional hospitality AI Butler. 
The hotel currency is Nepali Rupees (NPR). 
Analyze the guest's input query and provide a sophisticated, professional culinary recommendation strictly based on the hotel's menu list provided in the context.
Do not use emojis under any circumstances (per Swiss-style specifications).
Respond in professional, clean, Swiss-minimal formatting with zero promotional fluff.
Recommend 1 to 3 items that match the user's constraints (budget, spicy preference, diet, allergies, vegetarian, etc.) and explain precisely why they match.
Suggest cross-sell/upsell combinations (e.g., matching a delicious hot Momos starter with a refreshing organic Mint Lemonade).
If no item directly matches, suggest the closest alternative professionally.`;

  const prompt = `GUEST QUERY: "${query}"
HOTEL MENU CONTEXT:
${JSON.stringify(menuContext, null, 2)}`;

  const getSimulatedRecommendation = (query: string) => {
    let simText = `Offline/AI-Simulated recommendation based on Swiss standard:

Matched Selection:
- Classic Steamed Buff Momos (NPR 380)
  A perfect option. Features buffalo meat wrapper flavored with spicy ginger, garlic and sesame. Matches spicy craving.
- Organic Honey Latte (NPR 280)
  Cross-sell Suggestion: The smooth dairy sweetness pairs exceptionally with the spicy momo chutney.

Allergen Warning:
- The chicken momos contain peanuts in the sauce. The Steamed Buff Momos are peanut-free.`;

    if (query.toLowerCase().includes("vegetarian") || query.toLowerCase().includes("veg")) {
      simText = `Offline/AI-Simulated recommendation based on Swiss standard:

Matched Selection:
- Sadeko Gundruk & Bhatmas (NPR 240)
  100% Vegetarian starter. Traditional dried fermented greens combined with crispy toasted soybeans tossed in organic mustard oil. High protein, vegan, and nut-free.
- Fresh Himalayan Mint Lemonade (NPR 190)
  A refreshing zero-dairy cold-pressed drink to cleanse the palate.`;
    } else if (query.toLowerCase().includes("peanut") || query.toLowerCase().includes("allergy")) {
      simText = `Offline/AI-Simulated recommendation based on Swiss standard:

Allergen-Safe Matched Selection:
- Classic Steamed Buff Momos (NPR 380)
  Peanut-free preparation. Handcrafted wheat dumplings with buffalo seasoned filling. Safe for your peanut allergy.
- Himalayan Thakali Thali (Mutton) (NPR 780)
  Rich, nut-free traditional Nepali platter. Cooked with organic rice, lentils, ghee, and roasted mutton.`;
    } else if (query.toLowerCase().includes("800") || query.toLowerCase().includes("budget")) {
      simText = `Offline/AI-Simulated recommendation based on Swiss standard:

Budget Optimized Platter (Total NPR 620 / Under NPR 800):
- Kothey Pan-Fried Chicken Momos (NPR 420)
  Crispy bottom pan-seared dumplings. High protein.
- Organic Honey Latte (NPR 280)
  Hot organic espresso beverage to round off your meal.`;
    }
    return simText;
  };

  let recommendationText = "";
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });
      recommendationText = response.text || "";
    } catch (err: any) {
      console.log("AI system utilizing Swiss local simulation engine.");
      recommendationText = getSimulatedRecommendation(query);
    }
  } else {
    recommendationText = getSimulatedRecommendation(query);
  }

  const responseData = { recommendation: recommendationText };
  aiCache[cacheKey] = { timestamp: Date.now(), data: responseData };
  res.json(responseData);
});

// 8. AI Business Intelligence Endpoint
app.post("/api/ai/insights", async (req, res) => {
  const { hotelId } = req.body;
  const targetId = hotelId || "h-yak-yeti";

  // Check cache first
  const cacheKey = `${targetId}-insights`;
  if (aiCache[cacheKey] && (Date.now() - aiCache[cacheKey].timestamp) < CACHE_TTL_MS) {
    return res.json(aiCache[cacheKey].data);
  }

  const currentOrders = orders.filter(o => o.hotelId === targetId);
  const currentInventory = stockItems.filter(s => s.hotelId === targetId);

  const metricsContext = {
    totalRevenue: currentOrders.reduce((acc, o) => acc + (o.paymentStatus === "Paid" ? o.totalAmount : 0), 0),
    totalOrders: currentOrders.length,
    averageOrderValue: currentOrders.length ? Math.round(currentOrders.reduce((acc, o) => acc + o.totalAmount, 0) / currentOrders.length) : 0,
    lowStockItems: currentInventory.filter(s => s.quantity <= s.minLevel).map(s => s.name),
    recentFeedback: currentOrders.filter(o => o.feedback).map(o => o.feedback)
  };

  const systemInstruction = `You are a senior Swiss business intelligence analyst specializing in hospitality operations.
You will receive business metrics and current stock status.
Do not use emojis under any circumstances (per Swiss specifications).
Analyze the performance, identify bottlenecks, forecast trends, predict stock-out events, and provide 3 distinct, highly professional, actionable executive insights.
You MUST respond with a valid JSON object matching the following TypeScript interface schema:
{
  "executiveSummary": "A concise, high-level summary paragraph of the business performance.",
  "insights": [
    {
      "title": "string (Insight Title)",
      "category": "REVENUE" | "INVENTORY" | "CUSTOMER" | "STAFFING",
      "metric": "string (e.g., NPR 873 AOV or 2.5 kg left)",
      "description": "string (Deep-dive analysis of the issue)",
      "action": "string (actionable executive recommendation)"
    }
  ]
}
Return ONLY the raw JSON. Do not wrap it in markdown code blocks like \`\`\`json.`;

  const prompt = `HOTEL BUSINESS DATA:
${JSON.stringify(metricsContext, null, 2)}`;

  const getSimulatedInsights = () => {
    return JSON.stringify({
      executiveSummary: "Yak & Yeti Palace is operating at standard professional metrics with an Average Order Value of NPR 873. Peak hour analytics identify Friday between 18:00 and 21:00 as generating 44% of total weekly order volume. Overall inventory is healthy with minor restock warnings.",
      insights: [
        {
          title: "Revenue Flow Optimization",
          category: "REVENUE",
          metric: "NPR 873 AOV",
          description: "Friday evening (18:00-21:00) represents the highest-density dining window, accounting for 44% of weekly revenue. Checkouts and table turnaround times show minor delays.",
          action: "Allocate one additional waiter to table support during peak Friday shifts to maximize seating turnaround."
        },
        {
          title: "Sesame Seed Low Stock Alert",
          category: "INVENTORY",
          metric: "2.5 kg remaining",
          description: "Current stock of Sesame Seeds (2.5 kg) is below the minimum safety threshold (3.0 kg). Szechuan pepper and sesame are critical ingredients in Momo chutney.",
          action: "Reorder 10 kg from Makwanpur Seeds Co. immediately to prevent recipe-breaking stock-out within 48 hours."
        },
        {
          title: "Exceptional Culinary Reviews",
          category: "CUSTOMER",
          metric: "100% Positive Feedback",
          description: "Customer satisfaction with Classic Steamed Buff Momos remains at 5/5 stars. Organic Honey Latte is frequently ordered alongside momos, establishing a high-value cross-sell loop.",
          action: "Maintain strict quality standards on Buff Momos and continue suggesting the Organic Honey Latte pair on digital menu."
        }
      ]
    });
  };

  let rawInsights = "";
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      rawInsights = response.text || "";
    } catch (err: any) {
      console.log("AI system utilizing Swiss local simulation engine.");
      rawInsights = getSimulatedInsights();
    }
  } else {
    rawInsights = getSimulatedInsights();
  }

  // Clean any accidental markdown wraps from API response
  let cleaned = rawInsights.trim();
  if (cleaned.includes("```json")) {
    cleaned = cleaned.split("```json")[1].split("```")[0].trim();
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.split("```")[1].split("```")[0].trim();
  }

  const responseData = { insights: cleaned };
  aiCache[cacheKey] = { timestamp: Date.now(), data: responseData };
  res.json(responseData);
});

// 9. AI Inventory Restock Predictor
app.post("/api/ai/restock", async (req, res) => {
  const { hotelId } = req.body;
  const targetId = hotelId || "h-yak-yeti";

  // Check cache first
  const cacheKey = `${targetId}-restock`;
  if (aiCache[cacheKey] && (Date.now() - aiCache[cacheKey].timestamp) < CACHE_TTL_MS) {
    return res.json(aiCache[cacheKey].data);
  }

  const currentInventory = stockItems.filter(s => s.hotelId === targetId);

  const prompt = `Provide an inventory restock recommendation for these stock items:
${JSON.stringify(currentInventory, null, 2)}`;

  const systemInstruction = `You are a professional supply chain model. Return a concise restock recommendation report.
You MUST respond with a valid JSON object matching the following TypeScript interface schema:
{
  "reportTitle": "string (Logistics Prediction Report)",
  "predictions": [
    {
      "itemName": "string",
      "currentQuantity": "string",
      "depletionRisk": "HIGH" | "MEDIUM" | "LOW",
      "recommendedOrder": "string",
      "supplier": "string"
    }
  ]
}
Return ONLY the raw JSON. Do not wrap it in markdown code blocks like \`\`\`json.`;

  const getSimulatedRestock = () => {
    return JSON.stringify({
      reportTitle: "AI Supply Chain Predictions",
      predictions: [
        {
          itemName: "Sesame Seeds",
          currentQuantity: "2.5 kg",
          depletionRisk: "HIGH",
          recommendedOrder: "10 kg",
          supplier: "Makwanpur Seeds Co."
        },
        {
          itemName: "Himalayan Wild Honey",
          currentQuantity: "4 Litres",
          depletionRisk: "HIGH",
          recommendedOrder: "10 Litres",
          supplier: "Solukhumbu Cooperatives"
        },
        {
          itemName: "Buffalo Meat Minced",
          currentQuantity: "45 kg",
          depletionRisk: "MEDIUM",
          recommendedOrder: "40 kg (Weekly standard)",
          supplier: "Valley Meat Suppliers"
        }
      ]
    });
  };

  let rawPrediction = "";
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      rawPrediction = response.text || "";
    } catch (err: any) {
      console.log("AI system utilizing Swiss local simulation engine.");
      rawPrediction = getSimulatedRestock();
    }
  } else {
    rawPrediction = getSimulatedRestock();
  }

  // Clean any accidental markdown wraps from API response
  let cleaned = rawPrediction.trim();
  if (cleaned.includes("```json")) {
    cleaned = cleaned.split("```json")[1].split("```")[0].trim();
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.split("```")[1].split("```")[0].trim();
  }

  const responseData = { prediction: cleaned };
  aiCache[cacheKey] = { timestamp: Date.now(), data: responseData };
  res.json(responseData);
});


// --- PRODUCTION ROBUST MIDDLEWARES & RUNTIME ---

// Custom global error handling middleware to avoid leaking server crash details
app.use((err: any, req: any, res: any, next: any) => {
  console.error("CRITICAL RUNTIME EXCEPTION IN ROUTE:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" 
      ? "An unexpected system error occurred. Please try again." 
      : err.message || String(err)
  });
});

// Vite middleware integration or production static routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static assets with fine-tuned caching control headers
    app.use(express.static(distPath, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Prevent browser from caching main SPA index.html so updates roll out immediately
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          // Cache js, css, images, etc. for 1 year with immutability since they have unique build hashes
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`HospitalityOS server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Graceful shutdown handling for cloud run containers / production orchestrators
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      console.log("HTTP server closed. Exiting process safely.");
      process.exit(0);
    });

    // Enforce hard exit after 10 seconds in case some resources/connections stay stuck open
    setTimeout(() => {
      console.error("Forced exit: connections remained open after 10s.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
