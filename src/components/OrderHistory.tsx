import React, { useState, useMemo } from "react";
import { Order } from "../types";
import { 
  Search, 
  Calendar, 
  DollarSign, 
  Filter, 
  Receipt, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CreditCard,
  UtensilsCrossed
} from "lucide-react";

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Toggle order expansion to view itemized list
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Filter and Search Logic
  const filteredOrders = useMemo(() => {
    // Sort orders by timestamp descending so the most recent past orders are on top
    const sorted = [...orders].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return sorted.filter(order => {
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "All" || order.paymentStatus === paymentFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        (order.tableNumber && order.tableNumber.toLowerCase().includes(searchLower)) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower));

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  // Metric Computations based on filtered list
  const stats = useMemo(() => {
    const totalVolume = filteredOrders.length;
    // Calculate total revenue from all orders in the view (typically settled ones, but let's show total settled and total overall)
    const settledRevenue = filteredOrders
      .filter(o => o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const pendingAmount = filteredOrders
      .filter(o => o.paymentStatus === "Pending")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { totalVolume, settledRevenue, pendingAmount };
  }, [filteredOrders]);

  // Format Timestamp Helper
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white border-2 border-swiss-dark p-6 space-y-6 font-mono text-xs" id="order-history-dashboard">
      <div className="border-b border-swiss-dark pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-swiss-dark">Archived Order History Logs</h3>
          <p className="text-[11px] text-swiss-dark/60">Comprehensive audit list of table orders, settlement statuses, and dynamic revenue metrics.</p>
        </div>
        
        <div className="flex gap-2">
          <span className="bg-sand text-swiss-dark border border-swiss-dark px-2.5 py-1 text-[10px] font-bold uppercase">
            Logs Scoped: {filteredOrders.length} / {orders.length}
          </span>
        </div>
      </div>

      {/* REVENUE & AUDIT METRICS CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-swiss-light border border-swiss-dark p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-swiss-dark/50 block uppercase font-bold">Total Settled Revenue</span>
            <span className="text-lg font-black text-emerald-800">NPR {stats.settledRevenue}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-800 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-swiss-light border border-swiss-dark p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-swiss-dark/50 block uppercase font-bold">Pending Outstanding Balance</span>
            <span className="text-lg font-black text-amber-800">NPR {stats.pendingAmount}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-800 border border-amber-800 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-swiss-light border border-swiss-dark p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-swiss-dark/50 block uppercase font-bold">Total Query volume</span>
            <span className="text-lg font-black text-swiss-dark">{stats.totalVolume} Orders</span>
          </div>
          <div className="p-2 bg-neutral-100 text-swiss-dark border border-swiss-dark shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-swiss-light border border-swiss-dark p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase mb-1">Search Identifier / Dishes</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-swiss-dark/60" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Order ID, table, dumpling..."
              className="w-full bg-white border border-swiss-dark pl-7 pr-2 py-1.5 focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1">Process Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-swiss-dark p-1.5 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Accepted">Accepted</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Served">Served</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1">Payment Status</label>
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-white border border-swiss-dark p-1.5 focus:outline-none"
          >
            <option value="All">All Transactions</option>
            <option value="Paid">Paid (Settled)</option>
            <option value="Pending">Pending (Unpaid)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
              setPaymentFilter("All");
            }}
            className="w-full bg-swiss-dark hover:bg-terracotta text-white py-2 font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* HISTORY LOG TABLE/LIST */}
      <div className="border border-swiss-dark overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-swiss-dark">
            {filteredOrders.map(order => {
              const isExpanded = !!expandedOrders[order.id];
              return (
                <div key={order.id} className="bg-white hover:bg-swiss-light/45 transition-colors">
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleOrderExpand(order.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-terracotta shrink-0">#{order.id}</span>
                      <span className="bg-swiss-dark text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                        Table {order.tableNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-1 text-left sm:text-right">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-swiss-dark/50 block font-bold uppercase">Timestamp</span>
                        <span className="text-swiss-dark font-medium">{formatDateTime(order.timestamp)}</span>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] text-swiss-dark/50 block font-bold uppercase">Status / Flow</span>
                        <span className={`inline-block font-bold text-[10px] uppercase ${
                          order.status === "Completed" ? "text-emerald-700" :
                          order.status === "Cancelled" ? "text-rose-700" :
                          "text-amber-700"
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="sm:text-right col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-swiss-dark/50 block font-bold uppercase">Revenue</span>
                        <span className="font-black text-swiss-dark">NPR {order.totalAmount}</span>
                      </div>

                      <div className="flex items-center justify-end col-span-2 sm:col-span-1 pt-1 sm:pt-0">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border mr-2 ${
                          order.paymentStatus === "Paid" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-800" 
                            : "bg-amber-50 text-amber-800 border-amber-800"
                        }`}>
                          {order.paymentStatus} {order.paymentMethod ? `(${order.paymentMethod})` : ""}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-swiss-dark/60" /> : <ChevronDown className="w-4 h-4 text-swiss-dark/60" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-swiss-light border-t border-dashed border-swiss-gray animate-fadeIn">
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-swiss-dark/50 block mb-2 flex items-center gap-1">
                            <UtensilsCrossed className="w-3 h-3 text-terracotta" /> Itemized Bill Configuration
                          </span>
                          <div className="border border-swiss-dark bg-white divide-y divide-swiss-gray text-[11px]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="p-2.5 flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <span className="font-bold text-swiss-dark">{item.quantity}x {item.name}</span>
                                  {item.notes && (
                                    <p className="text-[9px] text-terracotta italic mt-0.5">Notes: {item.notes}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-semibold text-swiss-dark/80">NPR {item.price} each</span>
                                  <span className="font-bold block text-swiss-dark">NPR {item.price * item.quantity}</span>
                                </div>
                              </div>
                            ))}
                            <div className="p-2.5 bg-swiss-light flex justify-between font-bold text-swiss-dark border-t border-swiss-dark">
                              <span>Subtotal Amount</span>
                              <span className="text-terracotta">NPR {order.totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-swiss-dark/50 block mb-1">Settlement Details</span>
                            <div className="border border-swiss-dark bg-white p-3 space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-swiss-dark/60">Order Unique ID:</span>
                                <span className="font-bold">{order.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-swiss-dark/60">Hotel Tenant ID:</span>
                                <span>{order.hotelId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-swiss-dark/60">Branch Code:</span>
                                <span>{order.branchId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-swiss-dark/60">Billing Status:</span>
                                <span className={`font-bold ${order.paymentStatus === "Paid" ? "text-emerald-700" : "text-amber-700"}`}>
                                  {order.paymentStatus === "Paid" ? "Fully Paid & Audited" : "Pending Table Settlement"}
                                </span>
                              </div>
                              {order.paymentMethod && (
                                <div className="flex justify-between">
                                  <span className="text-swiss-dark/60">Method Selected:</span>
                                  <span className="font-bold text-swiss-dark uppercase flex items-center gap-1">
                                    <CreditCard className="w-3 h-3 text-swiss-dark/60" /> {order.paymentMethod}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {order.customerNotes && (
                            <div>
                              <span className="text-[10px] font-bold uppercase text-swiss-dark/50 block mb-1">Chef Cooking Request</span>
                              <p className="border border-swiss-dark bg-amber-50/50 p-3 text-[11px] text-swiss-dark italic leading-relaxed">
                                "{order.customerNotes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 text-center text-swiss-dark/60 italic font-mono border-none">
            No matching historical orders found in archives.
          </div>
        )}
      </div>
    </div>
  );
}
