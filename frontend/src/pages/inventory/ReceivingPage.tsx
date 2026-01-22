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
import { Search, Building2, Package, ShoppingCart, CheckCircle, Filter, Plus, X, Edit, Trash2 } from "lucide-react";
import { useStock } from "@/context/StockContext";
import { getReceipts as apiGetReceipts, getPurchaseOrders as apiGetPOs, getPurchaseOrder as apiGetPO, createReceipt as apiCreateReceipt, getMaterials as apiGetMaterials, getReceipt as apiGetReceipt, deleteReceipt as apiDeleteReceipt, updateReceipt as apiUpdateReceipt, getWarehouses, getUser, Receipt as FullReceipt, ReceiptDetail } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
      try {
        const [orows, mats] = await Promise.all([
          apiGetPOs(),
          apiGetMaterials(),
        ]);
        loadReceipts(); // Load receipts
        setPoList(orows.map(o => ({ id: o.PurchaseOrderId, code: o.PurchaseOrderCode, supplier: o.Supplier?.SupplierName || String(o.SupplierId), date: o.DateTime, status: o.PurchaseOrderStatus })));
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
        const pad = (n: number) => String(n).padStart(2, '0');
        const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}${String(ts.getMilliseconds()).padStart(3, '0')}`;
        const code = `RC-${poList.find(p => p.id === poId)?.code || poId}-${stamp}`;
        return apiCreateReceipt({
          PurchaseOrderId: poId,
          ReceiptCode: code,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">การรับวัตถุดิบ (ตามสาขา)</h1>
          <p className="text-muted-foreground mt-1">สรุปว่าสาขาไหนรับวัตถุดิบไปเท่าไหร่</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>บันทึกรับวัตถุดิบ</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <Button onClick={() => setPoDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                เลือกจาก PO
              </Button>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 w-full" placeholder="ค้นหา เลขที่ใบรับ/PO" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">เลขที่ใบรับ</TableHead>
                  <TableHead className="whitespace-nowrap">เลขที่ PO</TableHead>
                  <TableHead className="whitespace-nowrap">วันที่</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {useMemo(() => {
                  const s = q.trim().toLowerCase();
                  const list = s ? receipts.filter(r => `${r.code} ${r.poCode || ''}`.toLowerCase().includes(s)) : receipts;
                  return list;
                }, [receipts, q]).map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">{r.code}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.poCode || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(r.date).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(r)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setReceiptToDelete(r);
                        setDeleteDialogOpen(true);
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Order Selection Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted" />
              เลือกรายการสินค้าจาก Purchase Order
            </DialogTitle>
            <DialogDescription>
              เลือก PO จากนั้นเลือกรายการสินค้าที่ต้องการรับเข้าคลัง
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {poList.filter(p => p.status !== 'RECEIVED').map((po) => {
              const itemsInPo = getFilteredPOItems(po);
              const itemsWithRemaining = itemsInPo.map(item => {
                const receivedQty = receivedByPo[po.id]?.[item.MaterialId] || 0;
                const remaining = Math.max(0, (item.PurchaseOrderQuantity || 0) - receivedQty);
                return { ...item, remaining };
              });

              const isExpanded = expandedPOs[po.id] ?? true;
              const displayItems = isExpanded ? itemsWithRemaining : itemsWithRemaining.slice(0, 5);

              return (
                <Card key={po.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{po.code}</CardTitle>
                        <p className="text-sm text-muted-foreground">{po.supplier}</p>
                        <p className="text-xs text-muted-foreground">วันที่สั่ง: {new Date(po.date).toLocaleDateString("th-TH")}</p>
                      </div>
                      {getStatusBadge(po.status)}
                    </div>

                    {/* PO Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาสินค้าใน PO นี้..."
                          value={poSearchTerms[String(po.id)] || ""}
                          onChange={(e) => setPoSearchTerms(prev => ({
                            ...prev,
                            [String(po.id)]: e.target.value
                          }))}
                          className="pl-10"
                        />
                      </div>
                      {itemsWithRemaining.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePOExpansion(po.id)}
                          className="flex items-center gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          {isExpanded ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${itemsWithRemaining.length})`}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">เลือก</TableHead>
                            <TableHead className="whitespace-nowrap">สินค้า</TableHead>
                            <TableHead className="whitespace-nowrap">จำนวนที่สั่ง</TableHead>
                            <TableHead className="whitespace-nowrap">จำนวนรับ</TableHead>
                            <TableHead className="whitespace-nowrap">คงเหลือรับ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayItems.map((item) => {
                            const isSelected = selectedItems.some(si => si.materialId === item.MaterialId && si.poId === po.id);
                            const key = `${po.id}-${item.MaterialId}`;

                            return (
                              <TableRow key={item.MaterialId} className={item.remaining <= 0 ? "bg-muted/30 text-muted-foreground" : ""}>
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={item.remaining <= 0}
                                    onCheckedChange={(checked) => handleItemSelect(item, po.id, !!checked, item.remaining)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{materialMap[item.MaterialId]?.name || `MAT-${item.MaterialId}`}</div>
                                    <div className="text-sm text-muted-foreground">ID: {item.MaterialId}</div>
                                    {item.remaining <= 0 && (
                                      <Badge variant="secondary" className="mt-1">รับครบแล้ว</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{item.PurchaseOrderQuantity.toLocaleString()} {materialMap[item.MaterialId]?.unit || item.PurchaseOrderUnit}</TableCell>
                                <TableCell>
                                  {isSelected && (
                                    <Input
                                      type="number"
                                      min="1"
                                      max={item.remaining}
                                      value={receivingQuantities[key] ?? item.remaining}
                                      onChange={(e) => setReceivingQuantities(prev => ({
                                        ...prev,
                                        [key]: Math.min(Math.max(1, Number(e.target.value)), item.remaining)
                                      }))}
                                      className="w-24"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{item.remaining.toLocaleString()} {materialMap[item.MaterialId]?.unit || item.PurchaseOrderUnit}</TableCell>
                              </TableRow>
                            );
                          })}

                          {itemsWithRemaining.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {!isExpanded && itemsWithRemaining.length > 5 && (
                      <div className="mt-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePOExpansion(po.id)}
                        >
                          แสดงทั้งหมด ({itemsWithRemaining.length} รายการ)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="text-sm text-muted-foreground">
                  เลือกแล้ว {selectedItems.length} รายการ
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                    setSelectedItems([]);
                    setReceivingQuantities({});
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    ล้างการเลือก
                  </Button>
                  <Button onClick={handleReceiveItems} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    รับเข้าคลัง ({selectedItems.length} รายการ)
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPoDialogOpen(false)}>ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Receipt Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขใบรับสินค้า: {receiptToEdit?.ReceiptCode}</DialogTitle>
            <DialogDescription>
              อัปเดตจำนวนสินค้าที่รับเข้าคลังสำหรับใบรับนี้
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="w-40">จำนวน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptToEdit?.ReceiptDetails.map(detail => (
                  <TableRow key={detail.MaterialId}>
                    <TableCell>
                      <div className="font-medium">{materialMap[detail.MaterialId]?.name || `MAT-${detail.MaterialId}`}</div>
                      <div className="text-sm text-muted-foreground">ID: {detail.MaterialId}</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={editingQuantities[detail.MaterialId] || 0}
                        onChange={(e) => setEditingQuantities(prev => ({
                          ...prev,
                          [detail.MaterialId]: Number(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateReceipt}>บันทึกการเปลี่ยนแปลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Receiving Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รับวัตถุดิบเข้าคลัง (แบบ Manual)</DialogTitle>
            <DialogDescription>
              ระบุ SKU และจำนวนของวัตถุดิบที่ต้องการรับเข้าคลัง
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} list="sku-list" />
              <datalist id="sku-list">
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>{p.name}</option>
                ))}
              </datalist>
            </div>
            <div>
              <Label>จำนวน</Label>
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="w-full sm:w-auto" onClick={() => { receive(sku, qty, "Manual GRN"); setOpen(false); }}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบรับสินค้า <span className="font-bold">{receiptToDelete?.code}</span>? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReceiptToDelete(null)}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceipt}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}