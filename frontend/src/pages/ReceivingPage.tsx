import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Search, Building2, Package, ShoppingCart, CheckCircle, Filter } from "lucide-react";
import { useStock } from "@/context/StockContext";

type Receipt = {
  id: string;
  branch: string;
  date: string;
  items: { name: string; qty: number; unit: string }[];
};

type PurchaseOrder = {
  id: string;
  supplier: string;
  date: string;
  status: "PENDING" | "RECEIVED" | "PARTIAL";
  items: {
    sku: string;
    name: string;
    orderedQty: number;
    receivedQty: number;
    unit: string;
  }[];
};

type SelectedItem = {
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  poId: string;
};

export default function ReceivingPage() {
  const [q, setQ] = useState("");
  const { products, receive } = useStock();
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState(products[0]?.sku || "");
  const [qty, setQty] = useState(0);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});
  
  // State for PO filtering
  const [poSearchTerms, setPoSearchTerms] = useState<Record<string, string>>({});
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});

  const receipts: Receipt[] = [
    { id: "GRN-2024-045", branch: "สาขาลาดพร้าว", date: "2024-03-15", items: [ { name: "น้ำดื่ม 600ml", qty: 80, unit: "ขวด" }, { name: "ข้าวสาร 5kg", qty: 10, unit: "ถุง" } ] },
    { id: "GRN-2024-046", branch: "สาขาบางนา", date: "2024-03-15", items: [ { name: "นม 1L", qty: 40, unit: "กล่อง" } ] },
    { id: "GRN-2024-047", branch: "สาขาหาดใหญ่", date: "2024-03-14", items: [ { name: "ผักรวม แพ็ค", qty: 25, unit: "แพ็ค" } ] },
  ];

  // Mock Purchase Orders data
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "PO-2024-001",
      supplier: "บริษัท วัตถุดิบไทย จำกัด",
      date: "2024-03-10",
      status: "PENDING",
      items: [
        { sku: "WATER-600", name: "น้ำดื่ม 600ml", orderedQty: 100, receivedQty: 0, unit: "ขวด" },
        { sku: "RICE-5KG", name: "ข้าวสาร 5kg", orderedQty: 20, receivedQty: 0, unit: "ถุง" },
        { sku: "MILK-1L", name: "นม 1L", orderedQty: 50, receivedQty: 0, unit: "กล่อง" }
      ]
    },
    {
      id: "PO-2024-002", 
      supplier: "ห้างหุ้นส่วนจำกัด ผักสด",
      date: "2024-03-12",
      status: "PARTIAL",
      items: [
        { sku: "VEGGIE-MIX", name: "ผักรวม แพ็ค", orderedQty: 30, receivedQty: 25, unit: "แพ็ค" },
        { sku: "TOMATO", name: "มะเขือเทศ", orderedQty: 15, receivedQty: 0, unit: "กิโลกรัม" }
      ]
    }
  ];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return receipts;
    return receipts.filter((r) => [r.id, r.branch].some((v) => v.toLowerCase().includes(s)));
  }, [q]);

  const totalByBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      const sum = r.items.reduce((acc, it) => acc + it.qty, 0);
      map.set(r.branch, (map.get(r.branch) || 0) + sum);
    }
    return Array.from(map.entries()).map(([branch, qty]) => ({ branch, qty }));
  }, []);

  // Helper functions for PO management
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">รอรับ</Badge>;
      case "PARTIAL":
        return <Badge variant="outline">รับบางส่วน</Badge>;
      case "RECEIVED":
        return <Badge variant="default">รับครบแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleItemSelect = (item: any, poId: string, checked: boolean) => {
    if (checked) {
      const selectedItem: SelectedItem = {
        sku: item.sku,
        name: item.name,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        unit: item.unit,
        poId: poId
      };
      setSelectedItems(prev => [...prev, selectedItem]);
      setReceivingQuantities(prev => ({
        ...prev,
        [`${poId}-${item.sku}`]: item.orderedQty - item.receivedQty
      }));
    } else {
      setSelectedItems(prev => prev.filter(i => !(i.sku === item.sku && i.poId === poId)));
      setReceivingQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[`${poId}-${item.sku}`];
        return newQuantities;
      });
    }
  };

  const handleReceiveItems = () => {
    selectedItems.forEach(item => {
      const key = `${item.poId}-${item.sku}`;
      const qty = receivingQuantities[key] || 0;
      if (qty > 0) {
        receive(item.sku, qty, `GRN from ${item.poId}`);
      }
    });
    setSelectedItems([]);
    setReceivingQuantities({});
    setPoDialogOpen(false);
  };

  // Filter PO items based on search term
  const getFilteredPOItems = (po: PurchaseOrder) => {
    const searchTerm = poSearchTerms[po.id]?.toLowerCase() || "";
    if (!searchTerm) return po.items;
    
    return po.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) || 
      item.sku.toLowerCase().includes(searchTerm)
    );
  };

  // Toggle PO expansion
  const togglePOExpansion = (poId: string) => {
    setExpandedPOs(prev => ({
      ...prev,
      [poId]: !prev[poId]
    }));
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
                เลือกจาก PO
              </Button>
              
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 w-full" placeholder="ค้นหา เลขที่/สาขา" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">เลขที่</TableHead>
                  <TableHead className="whitespace-nowrap">สาขา</TableHead>
                  <TableHead className="whitespace-nowrap">วันที่</TableHead>
                  <TableHead className="whitespace-nowrap">รายการวัตถุดิบที่รับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">{r.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.branch}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(r.date).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {r.items.map((i, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm flex-wrap">
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="whitespace-nowrap">{i.name}</span>
                            <span className="thai-number whitespace-nowrap">× {i.qty.toLocaleString()} {i.unit}</span>
                          </div>
                        ))}
                      </div>
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
          </DialogHeader>
          
          <div className="space-y-4">
            {purchaseOrders.map((po) => {
              const filteredItems = getFilteredPOItems(po);
              const isExpanded = expandedPOs[po.id] ?? true;
              const displayItems = isExpanded ? filteredItems : filteredItems.slice(0, 5);
              
              return (
                <Card key={po.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{po.id}</CardTitle>
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
                          value={poSearchTerms[po.id] || ""}
                          onChange={(e) => setPoSearchTerms(prev => ({
                            ...prev,
                            [po.id]: e.target.value
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
                            <TableHead className="whitespace-nowrap">สั่ง</TableHead>
                            <TableHead className="whitespace-nowrap">รับแล้ว</TableHead>
                            <TableHead className="whitespace-nowrap">ค้างรับ</TableHead>
                            <TableHead className="whitespace-nowrap">จำนวนรับ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayItems.map((item) => {
                            const remainingQty = item.orderedQty - item.receivedQty;
                            const isSelected = selectedItems.some(si => si.sku === item.sku && si.poId === po.id);
                            const key = `${po.id}-${item.sku}`;
                            
                            return (
                              <TableRow key={item.sku}>
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleItemSelect(item, po.id, !!checked)}
                                    disabled={remainingQty <= 0}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">{item.sku}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{item.orderedQty.toLocaleString()} {item.unit}</TableCell>
                                <TableCell className="whitespace-nowrap">{item.receivedQty.toLocaleString()} {item.unit}</TableCell>
                                <TableCell>
                                  <span className={remainingQty > 0 ? "text-primary font-medium" : "text-green-600"}>
                                    {remainingQty.toLocaleString()} {item.unit}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {isSelected && remainingQty > 0 && (
                                    <Input
                                      type="number"
                                      min="1"
                                      max={remainingQty}
                                      value={receivingQuantities[key] || remainingQty}
                                      onChange={(e) => setReceivingQuantities(prev => ({
                                        ...prev,
                                        [key]: Number(e.target.value)
                                      }))}
                                      className="w-24"
                                    />
                                  )}
                                </TableCell>
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