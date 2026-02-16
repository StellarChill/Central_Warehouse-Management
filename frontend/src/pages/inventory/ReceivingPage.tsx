import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Package, ShoppingCart, CheckCircle, Filter, Plus, X, Edit, Trash2, FileText, Calendar, Truck, Clock, ChevronDown, MoreHorizontal, ArrowUpRight, AlertCircle, RefreshCw } from "lucide-react";
import { useStock } from "@/context/StockContext";
import { getReceipts as apiGetReceipts, getPurchaseOrders as apiGetPOs, getPurchaseOrder as apiGetPO, createReceipt as apiCreateReceipt, getMaterials as apiGetMaterials, getReceipt as apiGetReceipt, deleteReceipt as apiDeleteReceipt, updateReceipt as apiUpdateReceipt, getWarehouses, getUser, Receipt as FullReceipt, ReceiptDetail } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { startOfMonth, subMonths, isAfter } from "date-fns";

type Receipt = {
  id: string;
  code: string;
  date: string;
  poCode?: string;
  poId?: number;
};

type PurchaseOrder = {
  id: number;
  code: string;
  supplier: string;
  date: string;
  status: "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED";
  targetWarehouse?: string;
};

type SelectedItem = {
  materialId: number;
  name: string;
  orderedQty: number;
  unit: string;
  poId: number;
};

export default function ReceivingPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { products, receive, refresh } = useStock();


  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState(products[0]?.sku || "");
  const [qty, setQty] = useState(0);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  const [poDetails, setPoDetails] = useState<Record<number, { MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderUnit: string; PurchaseOrderPrice: number; }[]>>({});
  const [materialMap, setMaterialMap] = useState<Record<number, { name: string; unit: string }>>({});
  const [receivedByPo, setReceivedByPo] = useState<Record<number, Record<number, number>>>({}); // poId -> materialId -> received qty
  const { toast } = useToast();

  // State for PO filtering
  const [poSearchTerms, setPoSearchTerms] = useState<Record<string, string>>({});
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [receiptToEdit, setReceiptToEdit] = useState<(FullReceipt & { ReceiptDetails: ReceiptDetail[] }) | null>(null);
  const [editingQuantities, setEditingQuantities] = useState<Record<number, number>>({});
  const [warehouses, setWarehouses] = useState<{ WarehouseId: number; WarehouseName: string }[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");

  const loadReceipts = async () => {
    try {
      const rrows = await apiGetReceipts();
      setReceipts(rrows.map(r => ({ id: String(r.ReceiptId), code: r.ReceiptCode, date: r.ReceiptDateTime, poCode: r.PurchaseOrderCode, poId: (r as any).PurchaseOrderId })));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดใบรับไม่สำเร็จ', description: e.message || '' });
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      // Check context
      const stored = localStorage.getItem('selected_warehouse_id');
      if (stored) setSelectedWarehouseId(stored);

      try {
        const [orows, mats, whs] = await Promise.all([
          apiGetPOs(),
          apiGetMaterials(),
          getWarehouses().catch(() => []),
        ]);
        setWarehouses(whs || []);
        loadReceipts();

        // Map POs - include PurchaseOrderAddress as a property we can check later
        setPoList(orows.map(o => ({
          id: o.PurchaseOrderId,
          code: o.PurchaseOrderCode,
          supplier: o.Supplier?.SupplierName || String(o.SupplierId),
          date: o.DateTime,
          status: o.PurchaseOrderStatus,
          targetWarehouse: o.PurchaseOrderAddress // key addition
        })));

        const m: Record<number, { name: string; unit: string }> = {};
        mats.forEach(mt => { m[mt.MaterialId] = { name: mt.MaterialName, unit: mt.Unit }; });
        setMaterialMap(m);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดข้อมูลไม่สำเร็จ', description: e.message || '' });
      }
    };
    loadInitialData();
  }, []);

  // Prefetch PO details once dialog opens so items show up immediately
  useEffect(() => {
    if (!poDialogOpen || poList.length === 0) return;
    // Fetch details for POs that are visible in the dialog but not yet loaded
    const controller = new AbortController();
    (async () => {
      try {
        const toFetch = poList
          .map((p) => p.id)
          .filter((id) => !poDetails[id]);
        await Promise.all(
          toFetch.map(async (id) => {
            try {
              const full = await apiGetPO(id);
              if (!controller.signal.aborted) {
                setPoDetails((prev) => ({ ...prev, [id]: full.PurchaseOrderDetails }));
              }
            } catch { }
          })
        );
      } catch { }
    })();
    return () => controller.abort();
  }, [poDialogOpen, poList]);

  // Recalculate received quantities for all visible POs when dialog opens
  // or when receipts change, so rows are disabled immediately if fully received.
  useEffect(() => {
    if (!poDialogOpen || poList.length === 0) return;
    const controller = new AbortController();
    (async () => {
      try {
        const visiblePoIds = poList.filter(p => p.status !== 'RECEIVED').map(p => p.id);
        const perPo: Record<number, Record<number, number>> = {};
        await Promise.all(visiblePoIds.map(async (poId) => {
          if (controller.signal.aborted) return;
          const relatedReceipts = receipts.filter(r => r.poId === poId);
          if (relatedReceipts.length === 0) { perPo[poId] = {}; return; }
          const detailLists = await Promise.all(relatedReceipts.map(r => apiGetReceipt(Number(r.id))));
          const sumMap: Record<number, number> = {};
          for (const rec of detailLists) {
            for (const d of rec.ReceiptDetails) {
              sumMap[d.MaterialId] = (sumMap[d.MaterialId] || 0) + Number(d.MaterialQuantity || 0);
            }
          }
          perPo[poId] = sumMap;
        }));
        if (!controller.signal.aborted) setReceivedByPo(prev => ({ ...prev, ...perPo }));
      } catch { }
    })();
    return () => controller.abort();
  }, [poDialogOpen, receipts, poList]);

  // Helper functions for PO management
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">ร่าง</Badge>;
      case "SENT":
        return <Badge variant="default">ส่งแล้ว</Badge>;
      case "CONFIRMED":
        return <Badge variant="default">ยืนยันแล้ว</Badge>;
      case "RECEIVED":
        return <Badge variant="default">รับแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleItemSelect = (entry: { MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderUnit: string; }, poId: number, checked: boolean, remaining: number) => {
    const key = `${poId}-${entry.MaterialId}`;
    if (checked) {
      // อนุญาตให้เลือกจากหลาย PO ได้
      setSelectedItems(prev => {
        const name = materialMap[entry.MaterialId]?.name || `MAT-${entry.MaterialId}`;
        const unit = materialMap[entry.MaterialId]?.unit || entry.PurchaseOrderUnit;
        // ป้องกันซ้ำ
        if (prev.some(i => i.materialId === entry.MaterialId && i.poId === poId)) return prev;
        return [...prev, { materialId: entry.MaterialId, name, orderedQty: entry.PurchaseOrderQuantity, unit, poId }];
      });
      setReceivingQuantities(prev => ({ ...prev, [key]: Math.max(0, Math.min(remaining, entry.PurchaseOrderQuantity)) }));
    } else {
      setSelectedItems(prev => prev.filter(i => !(i.materialId === entry.MaterialId && i.poId === poId)));
      setReceivingQuantities(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleReceiveItems = async () => {
    if (selectedItems.length === 0) return;
    const group: Record<number, { MaterialId: number; MaterialQuantity: number }[]> = {};
    for (const si of selectedItems) {
      const qty = receivingQuantities[`${si.poId}-${si.materialId}`] || 0;
      if (qty <= 0) continue;
      if (!group[si.poId]) group[si.poId] = [];
      group[si.poId].push({ MaterialId: si.materialId, MaterialQuantity: qty });
    }
    const poIds = Object.keys(group).map(Number);
    if (poIds.length === 0) return;

    const ts = new Date();
    try {
      // Robust WarehouseId resolution:
      let targetWarehouseId = getUser()?.WarehouseId;
      if (!targetWarehouseId) {
        const selected = localStorage.getItem('selected_warehouse_id');
        if (selected) targetWarehouseId = Number(selected);
      }
      if (!targetWarehouseId) {
        try {
          const whs = await getWarehouses();
          if (whs && whs.length > 0) targetWarehouseId = whs[0].WarehouseId;
        } catch { }
      }

      await Promise.all(poIds.map(async (poId) => {
        // Let backend generate running code
        return apiCreateReceipt({
          PurchaseOrderId: poId,
          ReceiptCode: "", // Backend will generate RC-YYYYMMDD-XXXX
          details: group[poId],
          WarehouseId: targetWarehouseId
        });
      }));

      loadReceipts();

      toast({ title: 'บันทึกรับสินค้าแล้ว' });
      refresh();
      setSelectedItems([]);
      setReceivingQuantities({});
      setPoDialogOpen(false);

      (async () => {
        try {
          const orows = await apiGetPOs();
          setPoList(orows.map(o => ({ id: o.PurchaseOrderId, code: o.PurchaseOrderCode, supplier: o.Supplier?.SupplierName || String(o.SupplierId), date: o.DateTime, status: o.PurchaseOrderStatus })));
        } catch { }
      })();

      // navigate('/inventory');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: e.message || '' });
    }
  };



  // Filter PO items based on search term
  const getFilteredPOItems = (po: PurchaseOrder) => {
    const searchTerm = poSearchTerms[String(po.id)]?.toLowerCase() || "";
    const items = poDetails[po.id] || [];
    if (!searchTerm) return items;
    return items.filter(item => {
      const mat = materialMap[item.MaterialId];
      const text = `${mat?.name || ''} ${item.MaterialId}`.toLowerCase();
      return text.includes(searchTerm);
    });
  };

  const togglePOExpansion = async (poId: number) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poId]: !prev[poId]
    }));

    // Fetch details only if not present
    if (!poDetails[poId]) {
      try {
        const full = await apiGetPO(poId);
        setPoDetails(prev => ({ ...prev, [poId]: full.PurchaseOrderDetails }));
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดรายการสินค้าใน PO ไม่สำเร็จ', description: e.message || '' });
        return; // Stop if we can't get the PO details
      }
    }

    // Always recalculate received quantities on expand to get the latest data
    try {
      const relatedReceipts = receipts.filter(r => r.poId === poId);
      if (relatedReceipts.length > 0) {
        // This is an expensive network call, but necessary for correctness with the current backend API.
        const detailLists = await Promise.all(relatedReceipts.map(r => apiGetReceipt(Number(r.id))));
        const sumMap: Record<number, number> = {};
        for (const rec of detailLists) {
          for (const d of rec.ReceiptDetails) {
            sumMap[d.MaterialId] = (sumMap[d.MaterialId] || 0) + Number(d.MaterialQuantity || 0);
          }
        }
        setReceivedByPo(prev => ({ ...prev, [poId]: sumMap }));
      } else {
        // If there are no receipts, ensure the map is empty for this PO.
        setReceivedByPo(prev => ({ ...prev, [poId]: {} }));
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'คำนวณจำนวนที่รับแล้วไม่สำเร็จ', description: e.message || '' });
    }
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    const deletedPoId = receiptToDelete.poId; // Capture poId

    try {
      // 1. Delete the receipt on the backend
      await apiDeleteReceipt(Number(receiptToDelete.id));
      toast({ title: 'ลบใบรับสินค้าสำเร็จ' });

      // 2. Close the confirmation dialog
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);

      // 3. Reload the receipts list from the server to ensure it's in sync
      const rrows = await apiGetReceipts();
      setReceipts(rrows.map(r => ({ id: String(r.ReceiptId), code: r.ReceiptCode, date: r.ReceiptDateTime, poCode: r.PurchaseOrderCode, poId: (r as any).PurchaseOrderId })));

      // 4. Manually update the local PO list as a workaround for a potential backend
      // issue where the PO status is not updated after a receipt is deleted.
      setPoList(prevPoList =>
        prevPoList.map(po => {
          if (po.id === deletedPoId && po.status === 'RECEIVED') {
            // We know for a fact this PO is no longer fully received.
            // Change status to 'CONFIRMED' to make it reappear in the dialog.
            return { ...po, status: 'CONFIRMED' };
          }
          return po;
        })
      );
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message || '' });
      // Still try to close the dialog on error
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
    }
  };

  const handleOpenEditDialog = async (receipt: Receipt) => {
    try {
      const fullReceipt = await apiGetReceipt(Number(receipt.id));
      setReceiptToEdit(fullReceipt);
      const quantities: Record<number, number> = {};
      fullReceipt.ReceiptDetails.forEach(detail => {
        quantities[detail.MaterialId] = detail.MaterialQuantity;
      });
      setEditingQuantities(quantities);
      setEditDialogOpen(true);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'เปิดหน้าแก้ไขไม่สำเร็จ', description: e.message || '' });
    }
  };

  const handleUpdateReceipt = async () => {
    if (!receiptToEdit) return;
    const updatedDetails = Object.entries(editingQuantities).map(([materialId, quantity]) => ({
      MaterialId: Number(materialId),
      MaterialQuantity: quantity,
    }));

    try {
      await apiUpdateReceipt(receiptToEdit.ReceiptId, { details: updatedDetails });
      toast({ title: 'แก้ไขใบรับสินค้าสำเร็จ' });
      setEditDialogOpen(false);
      setReceiptToEdit(null);
      loadReceipts(); // Refresh the list
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'แก้ไขใบรับสินค้าไม่สำเร็จ', description: e.message || '' });
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = receipts.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;

    const total = receipts.length;
    // Mock pending POs calculation based on poList
    const pendingPOs = poList.filter(p => p.status === 'SENT' || p.status === 'CONFIRMED').length;

    return { total, thisMonth, pendingPOs };
  }, [receipts, poList]);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState("ALL");

  const filteredReceipts = useMemo(() => {
    let data = receipts;
    const now = new Date();

    if (timeFilter === "THIS_MONTH") {
      const start = startOfMonth(now);
      data = data.filter(r => isAfter(new Date(r.date), start));
    } else if (timeFilter === "LAST_MONTH") {
      const start = startOfMonth(subMonths(now, 1));
      const end = startOfMonth(now);
      data = data.filter(r => {
        const d = new Date(r.date);
        return isAfter(d, start) && d < end;
      });
    }

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter(r => `${r.code} ${r.poCode || ''}`.toLowerCase().includes(s));
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receipts, q, timeFilter]);

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">การรับวัตถุดิบ (Receiving)</h1>
          <p className="text-slate-500 mt-2 text-lg">จัดการการรับสินค้าเข้าคลังและตรวจสอบรายการจาก Purchase Orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600 shadow-sm transition-all" onClick={() => loadReceipts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรชข้อมูล
          </Button>
          <Button
            className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 font-bold transition-all hover:scale-105 active:scale-95"
            onClick={() => setPoDialogOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            รับสินค้าจาก PO
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">ใบรับสินค้าทั้งหมด</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">รับเข้าเดือนนี้</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.thisMonth}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group cursor-pointer hover:ring-2 hover:ring-amber-100"
          onClick={() => setPoDialogOpen(true)}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">PO รอรับของ</p>
              <h3 className="text-3xl font-bold text-amber-600">{stats.pendingPOs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Truck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-premium bg-white pb-6 overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full md:w-auto">
              <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full md:w-auto grid grid-cols-3 md:flex gap-1">
                <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium px-6">ทั้งหมด</TabsTrigger>
                <TabsTrigger value="THIS_MONTH" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium px-6">เดือนนี้</TabsTrigger>
                <TabsTrigger value="LAST_MONTH" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium px-6">เดือนที่แล้ว</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                placeholder="ค้นหาเลขที่ใบรับ, PO..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 sticky top-0 backdrop-blur-sm z-10">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-4 pl-6 font-semibold text-slate-600 w-[240px]">เลขที่ใบรับ</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">อ้างอิง PO</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">วันที่รับเข้า</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-600">คลังสินค้า</TableHead>
                  <TableHead className="py-4 pr-6 text-right font-semibold text-slate-600">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((r) => (
                    <TableRow key={r.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-sm border border-blue-100/50">RC</div>
                          <span className="font-bold text-slate-800 tracking-tight text-sm font-mono whitespace-nowrap">{r.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {r.poCode ? (
                          <Badge variant="outline" className="font-mono bg-white text-slate-600 border-slate-200 px-3 py-1 rounded-md shadow-sm">
                            {r.poCode}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-sm italic">- ไม่มี -</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{new Date(r.date).toLocaleDateString("th-TH", { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-600">
                        {/* Placeholder for Warehouse if available in Receipt later */}
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => handleOpenEditDialog(r)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" onClick={() => {
                            setReceiptToDelete(r);
                            setDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                          <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">ไม่พบรายการรับสินค้า</h3>
                        <p className="text-slate-500 max-w-sm mt-1">
                          {q ? `ไม่พบข้อมูลที่ตรงกับ "${q}"` : "ยังไม่มีข้อมูลการรับสินค้าในช่วงเวลานี้"}
                        </p>
                        <Button variant="link" className="mt-4 text-blue-600 font-medium" onClick={() => { setTimeFilter("ALL"); setQ("") }}>
                          ล้างตัวกรองทั้งหมด
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Order Selection Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-[2.5rem] border-none shadow-premium">
          <div className="p-8 border-b border-slate-100 bg-white flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold text-slate-800 tracking-tight">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                เลือกรายการจากใบสั่งซื้อ (PO)
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-base mt-2 ml-16">
                เลือก PO ที่ต้องการรับสินค้าและระบุจำนวนที่รับเข้าจริงจากผู้จำหน่าย
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 space-y-4">
            {poList.filter(p => {
              // Warehouse Isolation Logic
              if (selectedWarehouseId !== "all") {
                const currentWhName = warehouses.find(w => String(w.WarehouseId) === selectedWarehouseId)?.WarehouseName;
                if (currentWhName && p.targetWarehouse && p.targetWarehouse !== currentWhName) {
                  return false;
                }
              }
              return p.status !== 'RECEIVED';
            }).map((po) => {
              const itemsInPo = getFilteredPOItems(po);
              const itemsWithRemaining = itemsInPo.map(item => {
                const receivedQty = receivedByPo[po.id]?.[item.MaterialId] || 0;
                const remaining = Math.max(0, (item.PurchaseOrderQuantity || 0) - receivedQty);
                return { ...item, remaining };
              });

              const isExpanded = expandedPOs[po.id] ?? true;
              const displayItems = isExpanded ? itemsWithRemaining : itemsWithRemaining.slice(0, 5);

              return (
                <Card key={po.id} className="border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        PO
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-lg tracking-tight">{po.code}</h4>
                          {getStatusBadge(po.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {po.supplier}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(po.date).toLocaleDateString("th-TH")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="ค้นหาสินค้าใน PO..."
                          value={poSearchTerms[String(po.id)] || ""}
                          onChange={(e) => setPoSearchTerms(prev => ({ ...prev, [String(po.id)]: e.target.value }))}
                          className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 border-b border-slate-100">
                          <TableHead className="w-12 py-2 pl-4">เลือก</TableHead>
                          <TableHead className="py-2">รายการสินค้า</TableHead>
                          <TableHead className="py-2 text-right">จำนวนซื้อ</TableHead>
                          <TableHead className="py-2 text-center w-32">จำนวนที่รับ</TableHead>
                          <TableHead className="py-2 text-right pr-4">คงเหลือ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayItems.map((item) => {
                          const isSelected = selectedItems.some(si => si.materialId === item.MaterialId && si.poId === po.id);
                          const key = `${po.id}-${item.MaterialId}`;
                          const isFullyReceived = item.remaining <= 0;

                          return (
                            <TableRow key={item.MaterialId} className={`border-slate-50 ${isFullyReceived ? "bg-slate-50/50 opacity-60" : "hover:bg-blue-50/10"}`}>
                              <TableCell className="pl-4 py-3">
                                <Checkbox
                                  checked={isSelected}
                                  disabled={item.remaining <= 0}
                                  onCheckedChange={(checked) => handleItemSelect(item, po.id, !!checked, item.remaining)}
                                  className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                                />
                              </TableCell>
                              <TableCell className="py-3">
                                <div>
                                  <div className="font-semibold text-slate-700">{materialMap[item.MaterialId]?.name || `MAT-${item.MaterialId}`}</div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {item.MaterialId}</div>
                                  {isFullyReceived && <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-1.5 bg-slate-200 text-slate-600">ครบแล้ว</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-3 font-medium text-slate-600">
                                {item.PurchaseOrderQuantity.toLocaleString()} <span className="text-slate-400 text-xs">{materialMap[item.MaterialId]?.unit || item.PurchaseOrderUnit}</span>
                              </TableCell>
                              <TableCell className="py-3 px-2">
                                {isSelected ? (
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="1"
                                      max={item.remaining}
                                      value={receivingQuantities[key] ?? item.remaining}
                                      onChange={(e) => setReceivingQuantities(prev => ({
                                        ...prev,
                                        [key]: Math.min(Math.max(1, Number(e.target.value)), item.remaining)
                                      }))}
                                      className="h-9 text-center font-bold text-blue-600 border-blue-200 focus:ring-blue-200 bg-blue-50/30"
                                    />
                                    {/* <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400">/ {item.remaining}</span> */}
                                  </div>
                                ) : (
                                  <div className="text-center text-slate-300">-</div>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-4 py-3 font-mono text-slate-600">
                                {item.remaining.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {itemsWithRemaining.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                              ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {!isExpanded && itemsWithRemaining.length > 5 && (
                      <div className="bg-slate-50/30 border-t border-slate-100 p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePOExpansion(po.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-8"
                        >
                          แสดงรายการที่เหลืออีก {itemsWithRemaining.length - 5} รายการ
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {poList.length === 0 && (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">ไม่พบ Purchase Order</h3>
                <p className="text-slate-500">กรุณาสร้าง PO และส่งไปยัง Supplier ก่อนทำการรับสินค้า</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className={`h-5 w-5 ${selectedItems.length > 0 ? 'text-blue-600' : 'text-slate-300'}`} />
                <span className="font-medium">เลือก {selectedItems.length} รายการ</span>
                {selectedItems.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-rose-500 hover:text-rose-700 px-2" onClick={() => {
                    setSelectedItems([]);
                    setReceivingQuantities({});
                  }}>
                    ล้างค่า
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPoDialogOpen(false)} className="rounded-xl h-11 px-6 border-slate-200 hover:bg-slate-50 text-slate-700">ปิดหน้าต่าง</Button>
                <Button
                  onClick={handleReceiveItems}
                  disabled={selectedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <ArrowUpRight className="h-5 w-5 mr-2" />
                  บันทึกรับสินค้า ({selectedItems.length})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Receipt Dialog */}
      {/* Edit Receipt Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] shadow-premium border-none p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-800">แก้ไขใบรับสินค้า</DialogTitle>
                  <p className="text-sm font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md w-fit mt-1">{receiptToEdit?.ReceiptCode}</p>
                </div>
              </div>
              <DialogDescription className="text-slate-500 text-base">
                อัปเดตจำนวนสินค้าที่รับเข้าคลังสำหรับใบรับนี้
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {receiptToEdit?.ReceiptDetails.map(detail => (
                  <div key={detail.MaterialId} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                    <div className="flex-1">
                      <div className="font-bold text-slate-700 text-lg">{materialMap[detail.MaterialId]?.name || `MAT-${detail.MaterialId}`}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {detail.MaterialId}</div>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        value={editingQuantities[detail.MaterialId] || 0}
                        onChange={(e) => setEditingQuantities(prev => ({
                          ...prev,
                          [detail.MaterialId]: Number(e.target.value)
                        }))}
                        className="h-12 text-center font-bold text-lg bg-white border-slate-200 focus:ring-indigo-100 focus:border-indigo-300 rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 gap-3">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="h-12 rounded-xl border-slate-200 hover:bg-white px-6">ยกเลิก</Button>
            <Button onClick={handleUpdateReceipt} className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 px-8">บันทึกการเปลี่ยนแปลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Receiving Dialog - Simplified visuals */}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Kept minimal changes here as context suggests focus elsewhere, but styled consistent */}
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>รับวัตถุดิบเข้าคลัง (Manual)</DialogTitle>
            <DialogDescription>
              ระบุ SKU และจำนวนของวัตถุดิบที่ต้องการรับเข้าคลัง
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} list="sku-list" className="rounded-lg h-10" />
              <datalist id="sku-list">
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>{p.name}</option>
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>จำนวน</Label>
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded-lg h-10" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="w-full sm:w-auto rounded-xl bg-blue-600" onClick={() => { receive(sku, qty, "Manual GRN"); setOpen(false); }}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[420px] rounded-[2rem] border-none shadow-premium p-0 overflow-hidden">
          <div className="p-8 space-y-6 text-center">
            <div className="h-24 w-24 rounded-full flex items-center justify-center mx-auto border-4 bg-rose-50 border-rose-100 text-rose-600">
              <Trash2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-bold text-slate-800">
                ยืนยันการลบ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-base">
                คุณต้องการลบใบรับสินค้า <span className="font-bold text-rose-600 bg-rose-50 px-2 rounded">{receiptToDelete?.code}</span> ใช่หรือไม่?<br />
                สต็อกสินค้าจะถูกหักออกและสถานะ PO อาจเปลี่ยนแปลง
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3">
            <AlertDialogCancel onClick={() => setReceiptToDelete(null)} className="w-full h-12 rounded-xl border-slate-200 hover:bg-white hover:text-slate-900">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReceipt}
              className="w-full h-12 rounded-xl font-bold text-white shadow-lg bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
            >
              ลบข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}