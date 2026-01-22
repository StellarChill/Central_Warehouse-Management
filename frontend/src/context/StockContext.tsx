import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { getMaterials, getStocks, getIssues } from "@/lib/api";

export type Product = { sku: string; name: string; unit: string; min?: number };
export type LedgerEntry = { id: string; sku: string; qty: number; remain?: number; type: "GRN" | "ISSUE"; at: string; note?: string };

export type StockContextType = {
  products: Product[];
  ledger: LedgerEntry[];
  onHandBySku: Record<string, number>;
  receive: (sku: string, qty: number, note?: string) => void;
  refresh: () => Promise<void>;
};

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
  /* 
    Connect StockContext to backend API:
    - Products: fetch from /material
    - Ledger: fetch from /stock (GRN) and /issue (ISSUE)
  */
  const [products, setProducts] = useState<Product[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const refresh = async () => {
    try {
      const [mats, stocks, issues] = await Promise.all([
        getMaterials(),
        getStocks(),
        getIssues()
      ]);

      const mappedProducts: Product[] = mats.map((m: any) => ({
        sku: String(m.MaterialId),
        name: m.MaterialName,
        unit: m.Unit,
        min: 10 // default min
      }));

      const grnEntries: LedgerEntry[] = stocks.map((s: any) => ({
        id: `S-${s.StockId}`,
        sku: String(s.MaterialId),
        qty: s.Quantity,
        remain: s.Remain,
        type: "GRN",
        at: s.CreatedAt,
        note: `Auto: ${s.MaterialName}`
      }));

      const issueEntries: LedgerEntry[] = issues.map((i: any) =>
        (i.IssueDetails || []).map((d: any) => ({
          id: `I-${d.IssueDetailId}`,
          sku: String(d.MaterialId),
          qty: d.IssueQuantity,
          type: "ISSUE",
          at: i.IssueDate,
          note: `Issue ${i.IssueCode}`
        }))
      ).flat();

      setProducts(mappedProducts);
      setLedger([...grnEntries, ...issueEntries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()));
    } catch (e) {
      console.error("Failed to load stock data", e);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onHandBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of ledger) {
      // Use 'remain' from GRN entries (fetched from Stock table) for accurate on-hand balance.
      // Ignore ISSUE entries for balance calculation as they are already accounted for in 'remain'.
      if (l.type === "GRN" && l.remain !== undefined) {
        map[l.sku] = (map[l.sku] || 0) + l.remain;
      }
    }
    return map;
  }, [ledger]);

  // Local-only receive for "Manual GRN" (placeholder as backend requires PO)
  const receive = (sku: string, qty: number, note?: string) => {
    console.warn("Manual GRN is not persisted to backend yet (requires PO)");
    setLedger((prev) => [...prev, { id: `L${prev.length + 1}`, sku, qty, type: "GRN", at: new Date().toISOString(), note }]);
  };

  const value = useMemo(() => ({ products, ledger, onHandBySku, receive, refresh }), [products, ledger, onHandBySku]);

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used within StockProvider");
  return ctx;
}


