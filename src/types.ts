export interface Hotel {
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
  branches: Branch[];
  username?: string;
  password?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Table {
  id: string;
  hotelId: string;
  branchId: string;
  number: string;
  seatingCapacity: number;
  qrUrl: string;
  status: "Vacant" | "Occupied" | "Reserved";
  reservedName?: string;
  reservedTime?: string;
}

export interface MenuItem {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
  };
  prepTime: string;
  isAvailable: boolean;
  isPopular: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  hotelId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  items: OrderItem[];
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

export interface StockItem {
  id: string;
  hotelId: string;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  expiryDate: string;
  supplier: string;
}

export interface Employee {
  id: string;
  hotelId: string;
  name: string;
  role: "Manager" | "Receptionist" | "Cashier" | "Waiter" | "Kitchen Staff" | "Housekeeping";
  branchId: string;
  attendance: "Present" | "Absent" | "On Leave";
  schedule: string;
}

export interface Room {
  id: string;
  hotelId: string;
  number: string;
  type: "Deluxe Suite" | "Standard Room" | "Executive Suite" | "Family Room";
  price: number;
  status: "Available" | "Occupied" | "Cleaning" | "Maintenance";
  guestName?: string;
  checkInDate?: string;
}

export interface ServiceCall {
  id: string;
  hotelId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  type: "Call Waiter" | "Request Bill" | "Water Refill";
  status: "Pending" | "Resolved";
  timestamp: string;
}
