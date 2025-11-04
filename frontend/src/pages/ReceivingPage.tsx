import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Package, ShoppingCart, CheckCircle, Filter, Plus, X } from "lucide-react";
import { useStock } from "@/context/StockContext";
import { getReceipts as apiGetReceipts, getPurchaseOrders as apiGetPOs, getPurchaseOrder as apiGetPO, createReceipt as apiCreateReceipt, getMaterials as apiGetMaterials, getReceipt as apiGetReceipt } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const { products, receive } = useStock();
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

  useEffect(() => {
    const load = async () => {
      try {
        const [rrows, orows, mats] = await Promise.all([
          apiGetReceipts(),
          apiGetPOs(),
          apiGetMaterials(),
        ]);
        setReceipts(rrows.map(r => ({ id: String(r.ReceiptId), code: r.ReceiptCode, date: r.ReceiptDateTime, poCode: r.PurchaseOrderCode, poId: (r as any).PurchaseOrderId })));
        setPoList(orows.map(o => ({ id: o.PurchaseOrderId, code: o.PurchaseOrderCode, supplier: o.Supplier?.SupplierName || String(o.SupplierId), date: o.DateTime, status: o.PurchaseOrderStatus })));
        const m: Record<number, { name: string; unit: string }> = {};
        mats.forEach(mt => { m[mt.MaterialId] = { name: mt.MaterialName, unit: mt.Unit }; });
        setMaterialMap(m);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดข้อมูลไม่สำเร็จ', description: e.message || '' });
      }
    };
    load();
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
            } catch {}
          })
        );
      } catch {}
    })();
    return () => controller.abort();
  }, [poDialogOpen, poList]);

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

  const handleItemSelect = (entry: { MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderUnit: string; }, poId: number, checked: boolean) => {
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
      setReceivingQuantities(prev => ({ ...prev, [key]: entry.PurchaseOrderQuantity }));
    } else {
      setSelectedItems(prev => prev.filter(i => !(i.materialId === entry.MaterialId && i.poId === poId)));
      setReceivingQuantities(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleReceiveItems = async () => {
    if (selectedItems.length === 0) return;
    // จัดกลุ่มตาม PO เพื่อสร้างใบรับหลายใบในครั้งเดียว
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
      const results = await Promise.all(poIds.map(async (poId) => {
        const code = `RC-${poList.find(p => p.id === poId)?.code || poId}-${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}`;
        return apiCreateReceipt({ PurchaseOrderId: poId, ReceiptCode: code, details: group[poId] });
      }));

      // แทรกใบรับใหม่ด้านบน
      setReceipts(prev => [
        ...results.map(created => ({
          id: String(created.ReceiptId),
          code: created.ReceiptCode,
          date: created.ReceiptDateTime,
          poCode: created.PurchaseOrderCode,
        })),
        ...prev,
      ]);

      toast({ title: 'บันทึกรับสินค้าแล้ว' });
      setSelectedItems([]);
      setReceivingQuantities({});
      setPoDialogOpen(false);
      // Refresh receipts & PO list (เพื่อซ่อน PO ที่รับครบแล้ว)
      (async () => {
        try {
          const [rrows, orows] = await Promise.all([apiGetReceipts(), apiGetPOs()]);
          setReceipts(rrows.map(r => ({ id: String(r.ReceiptId), code: r.ReceiptCode, date: r.ReceiptDateTime, poCode: r.PurchaseOrderCode })));
          setPoList(orows.map(o => ({ id: o.PurchaseOrderId, code: o.PurchaseOrderCode, supplier: o.Supplier?.SupplierName || String(o.SupplierId), date: o.DateTime, status: o.PurchaseOrderStatus })));
        } catch {}
      })();
      // ไปหน้า Inventory เพื่อแสดงสต็อกที่เพิ่มแล้ว
      navigate('/inventory');
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

  // Toggle PO expansion
  const togglePOExpansion = async (poId: number) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poId]: !prev[poId]
    }));
    if (!poDetails[poId]) {
      try {
        const full = await apiGetPO(poId);
        setPoDetails(prev => ({ ...prev, [poId]: full.PurchaseOrderDetails }));
        // compute received sums per material for this PO
        const relatedReceipts = receipts.filter(r => r.poId === poId);
        if (relatedReceipts.length > 0) {
          const detailLists = await Promise.all(relatedReceipts.map(r => apiGetReceipt(Number(r.id))));
          const sumMap: Record<number, number> = {};
          for (const rec of detailLists) {
            for (const d of rec.ReceiptDetails) {
              sumMap[d.MaterialId] = (sumMap[d.MaterialId] || 0) + Number(d.MaterialQuantity || 0);
            }
          }
          setReceivedByPo(prev => ({ ...prev, [poId]: sumMap }));
        } else {
          setReceivedByPo(prev => ({ ...prev, [poId]: {} }));
        }
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดรายการสินค้าใน PO ไม่สำเร็จ', description: e.message || '' });
      }
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
              const filteredItems = getFilteredPOItems(po);
              const isExpanded = expandedPOs[po.id] ?? true;
              const displayItems = isExpanded ? filteredItems : filteredItems.slice(0, 5);
              
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
                      {filteredItems.length > 5 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => togglePOExpansion(po.id)}
                          className="flex items-center gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          {isExpanded ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${filteredItems.length})`}
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
                            const receivedQty = receivedByPo[po.id]?.[item.MaterialId] || 0;
                            const remaining = Math.max(0, (item.PurchaseOrderQuantity || 0) - receivedQty);
                            
                            return (
                              <TableRow key={item.MaterialId}>
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={remaining <= 0}
                                    onCheckedChange={(checked) => handleItemSelect(item, po.id, !!checked)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{materialMap[item.MaterialId]?.name || `MAT-${item.MaterialId}`}</div>
                                    <div className="text-sm text-muted-foreground">ID: {item.MaterialId}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{item.PurchaseOrderQuantity.toLocaleString()} {materialMap[item.MaterialId]?.unit || item.PurchaseOrderUnit}</TableCell>
                                <TableCell>
                                  {isSelected && (
                                    <Input
                                      type="number"
                                      min="1"
                                      max={remaining}
                                      value={receivingQuantities[key] || item.PurchaseOrderQuantity}
                                      onChange={(e) => setReceivingQuantities(prev => ({
                                        ...prev,
                                        [key]: Math.min(Math.max(1, Number(e.target.value)), remaining)
                                      }))}
                                      className="w-24"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{remaining.toLocaleString()} {materialMap[item.MaterialId]?.unit || item.PurchaseOrderUnit}</TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {filteredItems.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {!isExpanded && filteredItems.length > 5 && (
                      <div className="mt-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => togglePOExpansion(po.id)}
                        >
                          แสดงทั้งหมด ({filteredItems.length} รายการ)
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
    </div>
  );
}