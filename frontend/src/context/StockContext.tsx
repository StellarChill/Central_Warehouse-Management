import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Product = { sku: string; name: string; unit: string; min?: number };
export type LedgerEntry = { id: string; sku: string; qty: number; type: "GRN" | "ISSUE"; at: string; note?: string };

type StockContextType = {
  products: Product[];
  ledger: LedgerEntry[];
  onHandBySku: Record<string, number>;
  receive: (sku: string, qty: number, note?: string) => void;
  issue: (sku: string, qty: number, note?: string) => void;
};

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  const [products] = useState<Product[]>([
    { sku: "WAT-600", name: "น้ำดื่ม 600ml", unit: "ขวด", min: 50 },
    { sku: "RICE-5KG", name: "ข้าวสาร 5kg", unit: "ถุง", min: 20 },
    { sku: "MILK-1L", name: "นม 1L", unit: "กล่อง", min: 80 },
  ]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    { id: "L1", sku: "WAT-600", qty: 120, type: "GRN", at: new Date().toISOString() },
    { id: "L2", sku: "RICE-5KG", qty: 18, type: "GRN", at: new Date().toISOString() },
    { id: "L3", sku: "MILK-1L", qty: 260, type: "GRN", at: new Date().toISOString() },
  ]);

  const onHandBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of ledger) {
      map[l.sku] = (map[l.sku] || 0) + (l.type === "GRN" ? l.qty : -l.qty);
    }
    return map;
  }, [ledger]);

  const receive = (sku: string, qty: number, note?: string) => {
    setLedger((prev) => [...prev, { id: `L${prev.length + 1}`, sku, qty, type: "GRN", at: new Date().toISOString(), note }]);
  };
  const issue = (sku: string, qty: number, note?: string) => {
    setLedger((prev) => [...prev, { id: `L${prev.length + 1}`, sku, qty, type: "ISSUE", at: new Date().toISOString(), note }]);
  };

  const value = useMemo(() => ({ products, ledger, onHandBySku, receive, issue }), [products, ledger, onHandBySku]);

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used within StockProvider");
  return ctx;
}


