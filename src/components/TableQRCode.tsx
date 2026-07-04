import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, QrCode as QrIcon } from "lucide-react";
import { Table } from "../types";

interface TableQRCodeProps {
  key?: string | number;
  table: Table;
  onScanSimulate: (tableId: string) => void;
  triggerNotification: (msg: string) => void;
}

export function TableQRCode({ table, onScanSimulate, triggerNotification }: TableQRCodeProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR url pointing to guest ordering page
  const qrUrl = `${window.location.origin}/?hotelId=${table.hotelId}&branchId=${table.branchId}&tableId=${table.id}&role=Guest`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#1A1A1A", // Swiss deep dark
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error);
          }
        }
      );
    }
  }, [qrUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    try {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `HospitalityOS-Hotel-${table.hotelId}-Table-${table.number}-QR.png`;
      link.href = url;
      link.click();
      triggerNotification(`QR Code for Table ${table.number} downloaded successfully.`);
    } catch (err) {
      console.error("Failed to download QR code image", err);
      triggerNotification("Failed to download QR code image.");
    }
  };

  return (
    <div className="border-2 border-swiss-dark p-4 text-center bg-swiss-light font-mono text-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="bg-white p-3 border border-swiss-dark mx-auto w-44 h-44 flex flex-col justify-center items-center relative shadow-inner">
        <canvas ref={canvasRef} className="w-40 h-40" />
        <span className="absolute -bottom-2 right-2 text-[9px] bg-terracotta text-white px-1.5 py-0.5 font-bold uppercase tracking-wider border border-swiss-dark">
          Table {table.number}
        </span>
      </div>
      
      <div className="mt-4 space-y-1">
        <div className="font-bold text-sm text-swiss-dark">Table Number: {table.number}</div>
        <div className="text-swiss-dark/60 text-[11px]">Seating Capacity: {table.seatingCapacity} guests</div>
        <div className="pt-1">
          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border ${
            table.status === "Vacant" ? "bg-emerald-100 text-emerald-800 border-emerald-800" :
            table.status === "Occupied" ? "bg-amber-100 text-amber-800 border-amber-800" :
            "bg-blue-100 text-blue-800 border-blue-800"
          }`}>
            {table.status}
          </span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button 
          onClick={() => onScanSimulate(table.id)}
          className="bg-swiss-dark hover:bg-terracotta text-white py-2 font-bold uppercase text-[9px] tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-transparent"
          title="Simulate scanning this QR code as a guest customer"
        >
          <QrIcon className="w-3.5 h-3.5" />
          Test Scan
        </button>
        <button 
          onClick={handleDownload}
          className="bg-terracotta hover:bg-swiss-dark text-white py-2 font-bold uppercase text-[9px] tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-transparent"
          title="Download printable high-resolution PNG QR Code"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
