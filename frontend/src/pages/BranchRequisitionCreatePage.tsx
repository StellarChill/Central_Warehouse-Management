import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";

type Item = { name: string; qty: number; unit: string };
type CatalogItem = { sku: string; name: string; unit: string; category: string };

export default function BranchRequisitionCreatePage() {
  const [branch, setBranch] = useState("สาขาลาดพร้าว");
  const [category, setCategory] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("ชิ้น");
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  // แคตตาล็อกวัตถุดิบ (ยกมาจากหน้าวัตถุดิบขนมหวาน แบบย่อ)
  const catalog: CatalogItem[] = [
    { sku: "FLOUR-WHITE", name: "แป้งสาลีอเนกประสงค์", unit: "กิโลกรัม", category: "แป้ง" },
    { sku: "FLOUR-CAKE", name: "แป้งเค้ก", unit: "กิโลกรัม", category: "แป้ง" },
    { sku: "FLOUR-BREAD", name: "แป้งทำขนมปัง", unit: "กิโลกรัม", category: "แป้ง" },
    { sku: "SUGAR-GRAN", name: "น้ำตาลทราย", unit: "กิโลกรัม", category: "น้ำตาล" },
    { sku: "SUGAR-POWDER", name: "น้ำตาลป่น", unit: "กิโลกรัม", category: "น้ำตาล" },
    { sku: "SUGAR-BROWN", name: "น้ำตาลทรายแดง", unit: "กิโลกรัม", category: "น้ำตาล" },
    { sku: "BUTTER-SALT", name: "เนยเค็ม", unit: "กิโลกรัม", category: "เนย" },
    { sku: "BUTTER-UNSALT", name: "เนยจืด", unit: "กิโลกรัม", category: "เนย" },
    { sku: "EGG-WHITE", name: "ไข่ไก่ขาว", unit: "ฟอง", category: "ไข่" },
    { sku: "EGG-BROWN", name: "ไข่ไก่แดง", unit: "ฟอง", category: "ไข่" },
    { sku: "MILK-WHOLE", name: "นมจืดเต็มไขมัน", unit: "ลิตร", category: "นม" },
    { sku: "MILK-SKIM", name: "นมจืดไขมันต่ำ", unit: "ลิตร", category: "นม" },
    { sku: "CREAM-HEAVY", name: "ครีมจืด", unit: "ลิตร", category: "นม" },
    { sku: "CHOC-COCOA", name: "ผงโกโก้", unit: "กิโลกรัม", category: "ช็อกโกแลต" },
    { sku: "CHOC-DARK", name: "ช็อกโกแลตดำ", unit: "กิโลกรัม", category: "ช็อกโกแลต" },
    { sku: "CHOC-WHITE", name: "ช็อกโกแลตขาว", unit: "กิโลกรัม", category: "ช็อกโกแลต" },
  ];

  const categories = useMemo(() => Array.from(new Set(catalog.map((c) => c.category))), [catalog]);
  const productsByCategory = useMemo(() => catalog.filter((c) => c.category === category), [catalog, category]);
  const selectedProduct = useMemo(() => catalog.find((c) => c.sku === sku), [catalog, sku]);

  const addItem = () => {
    if (!selectedProduct || qty <= 0) return;
    setItems((prev) => [...prev, { name: selectedProduct.name, qty, unit }]);
    setSku("");
    setQty(1);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = () => {
    if (items.length === 0) return;
    toast.success("ส่งคำขอเรียบร้อย", { description: `สาขา: ${branch} | รายการ: ${items.length}` });
    setItems([]);
    navigate("/requisitions");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้างคำขอเบิกวัตถุดิบสำหรับสาขา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm">สาขา</label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">หมวดหมู่</label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setSku(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">วัตถุดิบ</label>
              <Select value={sku} onValueChange={(v) => { setSku(v); const p = catalog.find(x => x.sku === v); if (p) setUnit(p.unit); }} disabled={!category}>
                <SelectTrigger>
                  <SelectValue placeholder={category ? "เลือกวัตถุดิบ" : "เลือกหมวดหมู่ก่อน"} />
                </SelectTrigger>
                <SelectContent>
                  {productsByCategory.map((p) => (
                    <SelectItem key={p.sku} value={p.sku}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">จำนวน</label>
                <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm">หน่วย</label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addItem} disabled={!selectedProduct} className="w-full sm:w-auto">เพิ่มรายการ</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">สินค้า</TableHead>
                  <TableHead className="text-right whitespace-nowrap">จำนวน</TableHead>
                  <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                  <TableHead className="whitespace-nowrap text-right">ลบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap">{i.name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{i.qty}</TableCell>
                    <TableCell className="whitespace-nowrap">{i.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button disabled={items.length === 0} onClick={submit} className="w-full sm:w-auto">ส่งคำขอ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}