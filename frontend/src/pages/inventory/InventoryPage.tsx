import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Package, Boxes, Search, Wheat, Egg, Milk, Candy, Apple, Droplets, ChevronDown, ChevronRight, LayoutGrid, ListFilter, Archive, Calendar, History, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStockSummary as apiGetStockSummary, getMaterials as apiGetMaterials, getCategories as apiGetCategories, getStocks as apiGetStocks, getReceipts as apiGetReceipts, Material, Category, Stock as StockRow, Receipt as ReceiptRow } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type InventoryItem = {
  materialId: number;
  name: string;
  unit: string;
  onHand: number; // TotalRemain
  category: string; // category name
};

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: number; name: string; unit: string } | null>(null);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [receiptMap, setReceiptMap] = useState<Record<number, { code: string; date: string }>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, materials, categories] = await Promise.all([
          apiGetStockSummary(),
          apiGetMaterials(),
          apiGetCategories(),
        ]);
        const catMap: Record<number, string> = {};
        categories.forEach((c: Category) => { catMap[c.CatagoryId] = c.CatagoryName; });
        setCategoriesMap(catMap);
        const matMap = new Map<number, Material>();
        materials.forEach((m) => matMap.set(m.MaterialId, m));
        const rows: InventoryItem[] = summary.map((s) => {
          const m = matMap.get(s.MaterialId);
          return {
            materialId: s.MaterialId,
            name: s.MaterialName,
            unit: s.Unit,
            onHand: s.TotalRemain,
            category: m ? (catMap[m.CatagoryId] || '-') : '-',
          };
        });
        setItems(rows);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดคลังไม่สำเร็จ', description: e.message || '' });
      }
    };
    load();
  }, []);

  // Prefetch stocks and receipts once when opening batch dialog for the first time
  useEffect(() => {
    if (!batchOpen) return;
    (async () => {
      try {
        const [allStocks, receipts] = await Promise.all([
          apiGetStocks(),
          apiGetReceipts(),
        ]);
        setStocks(allStocks);
        const rmap: Record<number, { code: string; date: string }> = {};
        receipts.forEach((r: any) => {
          rmap[r.ReceiptId] = { code: r.ReceiptCode, date: r.ReceiptDateTime };
        });
        setReceiptMap(rmap);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดข้อมูลล็อตไม่สำเร็จ', description: e.message || '' });
      }
    })();
  }, [batchOpen]);

  // read-only view

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))];
    return cats;
  }, [items]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [String(i.materialId), i.name, i.category].some((v) => v.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const totalSkus = items.length;
  const totalOnHand = items.reduce((sum, i) => sum + i.onHand, 0);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "แป้ง": return <Wheat className="h-5 w-5 text-primary" />;
      case "ไข่": return <Egg className="h-5 w-5 text-primary" />;
      case "นม": return <Milk className="h-5 w-5 text-primary" />;
      case "เนย": return <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary/30"></div>
      </div>;
      case "น้ำตาล": return <Candy className="h-5 w-5 text-primary" />;
      case "ช็อกโกแลต": return <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
        <div className="w-3 h-1 bg-primary-foreground rounded-full"></div>
      </div>;
      case "น้ำมัน": return <Droplets className="h-5 w-5 text-primary" />;
      case "ผลไม้": return <Apple className="h-5 w-5 text-primary" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  // editing removed

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">คลังวัตถุดิบ (Inventory)</h1>
          <p className="text-slate-500 mt-2 text-lg">ภาพรวมและจัดการวัตถุดิบทั้งหมดในคลังสินค้า</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 shadow-sm" disabled>
            <Archive className="h-4 w-4 mr-2" />
            รายงานสต็อก
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">รหัสสินค้าทั้งหมด</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalSkus} <span className="text-sm font-normal text-slate-400">SKUs</span></h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">หมวดหมู่</p>
              <h3 className="text-3xl font-bold text-slate-800">{Object.keys(groupedItems).length} <span className="text-sm font-normal text-slate-400">หมวด</span></h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">จำนวนคงเหลือรวม</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalOnHand.toLocaleString()} <span className="text-sm font-normal text-slate-400">หน่วย</span></h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Boxes className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white pb-6">
        <CardHeader className="border-b border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-indigo-600 rounded-full" />
              <CardTitle className="text-xl font-bold text-slate-800">รายการคงคลังวัตถุดิบ</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="ค้นหา SKU / ชื่อสินค้า..."
                  className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {Object.keys(groupedItems).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, categoryItems]) => {
                const isExpanded = expandedCategories[category] ?? true;
                const displayItems = isExpanded ? categoryItems : categoryItems.slice(0, 5);

                return (
                  <div key={category} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner">
                          {getCategoryIcon(category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            {category}
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-xs">{categoryItems.length}</Badge>
                          </h3>
                          <p className="text-sm text-slate-500">
                            รวมทั้งหมด: <span className="font-semibold text-slate-700">{categoryItems.reduce((sum, item) => sum + item.onHand, 0).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/40 hover:bg-slate-50/40 border-b border-slate-100">
                                <TableHead className="whitespace-nowrap font-semibold pl-6 w-32">รหัส</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold">วัตถุดิบ</TableHead>
                                <TableHead className="whitespace-nowrap font-semibold w-32">หน่วย</TableHead>
                                <TableHead className="text-right whitespace-nowrap font-semibold w-40">คงเหลือ</TableHead>
                                <TableHead className="text-center whitespace-nowrap w-24"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayItems.length > 0 ? displayItems.map((i) => (
                                <TableRow
                                  key={i.materialId}
                                  className="hover:bg-indigo-50/30 cursor-pointer border-slate-50 transition-colors group"
                                  onClick={() => { setSelectedMaterial({ id: i.materialId, name: i.name, unit: i.unit }); setBatchOpen(true); }}
                                >
                                  <TableCell className="font-mono font-medium text-slate-500 pl-6 group-hover:text-indigo-600 whitespace-nowrap">{i.materialId}</TableCell>
                                  <TableCell className="font-medium text-slate-800 whitespace-nowrap">{i.name}</TableCell>
                                  <TableCell className="text-slate-500 whitespace-nowrap">{i.unit}</TableCell>
                                  <TableCell className="text-right font-bold text-slate-700 whitespace-nowrap">
                                    <span className={i.onHand <= 0 ? "text-rose-500" : ""}>{i.onHand.toLocaleString()}</span>
                                  </TableCell>
                                  <TableCell className="text-right pr-4">
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                  </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">ไม่มีรายการในหมวดนี้</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {categoryItems.length > 5 && (
                          <div className="p-3 text-center bg-slate-50/30 border-t border-slate-50">
                            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => toggleCategory(category)}>
                              แสดงทั้งหมด ({categoryItems.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">ไม่พบวัตถุดิบ</h3>
              <p className="text-slate-500">ลองค้นหาด้วยคำสำคัญอื่น หรือเพิ่มสินค้าใหม่</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch details dialog per material */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-800">ประวัติล็อตสินค้า: {selectedMaterial?.name}</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    รายละเอียดล็อตคงเหลือและการรับเข้าแยกตามรายการ
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            <Table>
              <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                  <TableHead className="whitespace-nowrap pl-6 py-4 font-semibold text-slate-600">วันที่รับ</TableHead>
                  <TableHead className="whitespace-nowrap py-4 font-semibold text-slate-600">เลขที่ใบรับ</TableHead>
                  <TableHead className="whitespace-nowrap py-4 font-semibold text-slate-600">Barcode / Lot</TableHead>
                  <TableHead className="text-right whitespace-nowrap py-4 font-semibold text-slate-600">จำนวนรับ</TableHead>
                  <TableHead className="text-right whitespace-nowrap pr-6 py-4 font-semibold text-slate-600">คงเหลือ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks
                  .filter(s => selectedMaterial && s.MaterialId === selectedMaterial.id)
                  .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
                  .map((s) => (
                    <TableRow key={`${s.Barcode}-${s.ReceiptId}`} className="border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="whitespace-nowrap pl-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(receiptMap[s.ReceiptId]?.date || s.CreatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-4">
                        {receiptMap[s.ReceiptId]?.code ? (
                          <Badge variant="outline" className="font-mono bg-white text-slate-600 border-slate-200">
                            {receiptMap[s.ReceiptId]?.code}
                          </Badge>
                        ) : <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-4 font-mono text-sm text-slate-500">{s.Barcode}</TableCell>
                      <TableCell className="text-right whitespace-nowrap py-4 text-slate-600">{Number(s.Quantity).toLocaleString()} <span className="text-xs text-slate-400">{selectedMaterial?.unit}</span></TableCell>
                      <TableCell className="text-right whitespace-nowrap pr-6 py-4 font-bold text-slate-700">{Number(s.Remain).toLocaleString()} <span className="text-xs font-normal text-slate-400">{selectedMaterial?.unit}</span></TableCell>
                    </TableRow>
                  ))}
                {stocks.filter(s => selectedMaterial && s.MaterialId === selectedMaterial.id).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">ไม่พบประวัติล็อตสินค้า</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
            <Button variant="outline" onClick={() => setBatchOpen(false)} className="rounded-xl h-11 px-8 border-slate-200 hover:bg-white text-slate-600">ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}