import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { useStock } from "@/context/StockContext";
import { Package, Boxes, Search, Edit, Trash2, Plus, Wheat, Egg, Milk, Candy, Apple, Droplets, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type InventoryItem = {
  sku: string;
  name: string;
  unit: string;
  onHand: number;
  minStock: number;
  location: string;
  category: string;
};

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const { products, onHandBySku } = useStock();
  const [items, setItems] = useState<InventoryItem[]>([
    { sku: "FLOUR-WHITE", name: "แป้งสาลีอเนกประสงค์", unit: "กิโลกรัม", onHand: 50, minStock: 20, location: "A1", category: "แป้ง" },
    { sku: "FLOUR-CAKE", name: "แป้งเค้ก", unit: "กิโลกรัม", onHand: 30, minStock: 15, location: "A2", category: "แป้ง" },
    { sku: "SUGAR-GRAN", name: "น้ำตาลทราย", unit: "กิโลกรัม", onHand: 40, minStock: 25, location: "B1", category: "น้ำตาล" },
    { sku: "SUGAR-POWDER", name: "น้ำตาลป่น", unit: "กิโลกรัม", onHand: 25, minStock: 15, location: "B2", category: "น้ำตาล" },
    { sku: "BUTTER-SALT", name: "เนยเค็ม", unit: "กิโลกรัม", onHand: 20, minStock: 10, location: "C1", category: "เนย" },
    { sku: "BUTTER-UNSALT", name: "เนยจืด", unit: "กิโลกรัม", onHand: 15, minStock: 10, location: "C2", category: "เนย" },
    { sku: "EGG-WHITE", name: "ไข่ไก่ขาว", unit: "ฟอง", onHand: 200, minStock: 100, location: "D1", category: "ไข่" },
    { sku: "EGG-BROWN", name: "ไข่ไก่แดง", unit: "ฟอง", onHand: 150, minStock: 100, location: "D2", category: "ไข่" },
    { sku: "MILK-WHOLE", name: "นมจืดเต็มไขมัน", unit: "ลิตร", onHand: 50, minStock: 30, location: "E1", category: "นม" },
    { sku: "MILK-SKIM", name: "นมจืดไขมันต่ำ", unit: "ลิตร", onHand: 40, minStock: 25, location: "E2", category: "นม" },
    { sku: "CHOC-COCOA", name: "ผงโกโก้", unit: "กิโลกรัม", onHand: 15, minStock: 10, location: "F1", category: "ช็อกโกแลต" },
    { sku: "CHOC-DARK", name: "ช็อกโกแลตดำ", unit: "กิโลกรัม", onHand: 10, minStock: 8, location: "F2", category: "ช็อกโกแลต" },
    { sku: "OIL-VEG", name: "น้ำมันพืช", unit: "ลิตร", onHand: 30, minStock: 20, location: "G1", category: "น้ำมัน" },
    { sku: "FRUIT-STRAW", name: "สตอเบอร์รี่แช่แข็ง", unit: "กิโลกรัม", onHand: 20, minStock: 15, location: "H1", category: "ผลไม้" },
  ]);

  const [open, setOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [form, setForm] = useState<Pick<InventoryItem, "sku" | "name" | "unit" | "onHand" | "category">>({ sku: "", name: "", unit: "กิโลกรัม", onHand: 0, category: "แป้ง" });

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
      [i.sku, i.name, i.location, i.category].some((v) => v.toLowerCase().includes(q))
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

  const startCreate = () => {
    setEditingSku(null);
    setForm({ sku: "", name: "", unit: "กิโลกรัม", onHand: 0, category: "แป้ง" });
    setOpen(true);
  };

  const startEdit = (i: InventoryItem) => {
    setEditingSku(i.sku);
    setForm({ sku: i.sku, name: i.name, unit: i.unit, onHand: i.onHand, category: i.category });
    setOpen(true);
  };

  const save = () => {
    if (editingSku) {
      setItems((prev) => prev.map((it) => (it.sku === editingSku ? { ...it, ...form } : it)));
    } else {
      // append new, hidden fields default
      setItems((prev) => [...prev, { sku: form.sku, name: form.name, unit: form.unit, onHand: form.onHand, minStock: 0, location: "-", category: form.category }]);
    }
    setOpen(false);
  };

  const remove = (sku: string) => {
    if (!confirm("ยืนยันการลบวัตถุดิบออกจากคลัง?")) return;
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">คลังวัตถุดิบ</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมจำนวนวัตถุดิบในคลัง </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">จำนวนรายการสินค้า</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalSkus}</p>
            </div>
            <Boxes className="h-6 w-6 sm:h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">จำนวนคงเหลือรวม</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalOnHand.toLocaleString()}</p>
            </div>
            <Package className="h-6 w-6 sm:h-8 w-8 text-success" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>รายการคงคลังวัตถุดิบ</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา SKU / ชื่อสินค้า"
                  className="pl-10 w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button className="gap-2 w-full sm:w-auto" onClick={startCreate}>
                <Plus className="h-4 w-4" /> เพิ่มรายการ
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedItems).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems]) => {
                const isExpanded = expandedCategories[category] ?? true;
                const displayItems = isExpanded ? categoryItems : categoryItems.slice(0, 5);
                
                return (
                  <div key={category} className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category)}
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {category} <Badge variant="secondary">{categoryItems.length}</Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            จำนวนคงเหลือรวม: {categoryItems.reduce((sum, item) => sum + item.onHand, 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryItems.length > 5 && (
                          <span className="text-sm text-muted-foreground">
                            {isExpanded ? 'แสดงทั้งหมด' : `แสดง ${displayItems.length} จาก ${categoryItems.length}`}
                          </span>
                        )}
                        {categoryItems.length > 5 ? (
                          isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                        ) : null}
                      </div>
                    </div>
                    
                    {displayItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">SKU</TableHead>
                              <TableHead className="whitespace-nowrap">วัตถุดิบ</TableHead>
                              <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                              <TableHead className="text-right whitespace-nowrap">คงเหลือ</TableHead>
                              <TableHead className="whitespace-nowrap">สถานที่</TableHead>
                              <TableHead className="text-center whitespace-nowrap">การดำเนินการ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayItems.map((i) => (
                              <TableRow key={i.sku} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">{i.sku}</TableCell>
                                <TableCell className="whitespace-nowrap">{i.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{i.unit}</TableCell>
                                <TableCell className="text-right thai-number whitespace-nowrap">{(onHandBySku[i.sku] ?? i.onHand).toLocaleString()}</TableCell>
                                <TableCell className="whitespace-nowrap">{i.location}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                    <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => startEdit(i)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => remove(i.sku)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        ไม่มีวัตถุดิบในหมวดนี้
                      </div>
                    )}
                    
                    {!isExpanded && categoryItems.length > 5 && (
                      <div className="p-4 pt-0 text-center">
                        <Button 
                          variant="ghost" 
                          className="text-primary"
                          onClick={() => toggleCategory(category)}
                        >
                          แสดงทั้งหมด ({categoryItems.length} รายการ)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSku ? "แก้ไขรายการคงคลัง" : "เพิ่มรายการคงคลัง"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} disabled={!!editingSku} />
            </div>
            <div>
              <Label htmlFor="name">วัตถุดิบ</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="unit">หน่วย</Label>
              <select
                id="unit"
                className="w-full border border-input bg-background rounded-md px-3 py-2"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="กิโลกรัม">กิโลกรัม</option>
                <option value="ลิตร">ลิตร</option>
                <option value="ฟอง">ฟอง</option>
                <option value="ขวด">ขวด</option>
                <option value="ถุง">ถุง</option>
                <option value="ชิ้น">ชิ้น</option>
              </select>
            </div>
            <div>
              <Label htmlFor="onhand">คงเหลือ</Label>
              <Input id="onhand" type="number" value={form.onHand} onChange={(e) => setForm({ ...form, onHand: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="category">หมวดหมู่</Label>
              <select
                id="category"
                className="w-full border border-input bg-background rounded-md px-3 py-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="แป้ง">แป้ง</option>
                <option value="ไข่">ไข่</option>
                <option value="นม">นม</option>
                <option value="เนย">เนย</option>
                <option value="น้ำตาล">น้ำตาล</option>
                <option value="ช็อกโกแลต">ช็อกโกแลต</option>
                <option value="น้ำมัน">น้ำมัน</option>
                <option value="ผลไม้">ผลไม้</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="w-full sm:w-auto" onClick={save}>{editingSku ? "บันทึก" : "เพิ่ม"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}