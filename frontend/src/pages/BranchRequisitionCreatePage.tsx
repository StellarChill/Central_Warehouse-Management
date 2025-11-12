import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { getMaterials } from "@/lib/api";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Item = { name: string; qty: number; unit: string; sku?: number };
type CatalogItem = { sku?: string; name?: string; unit?: string; category?: string };

export default function BranchRequisitionCreatePage() {
  const [branch, setBranch] = useState("สาขาลาดพร้าว");
  const [sku, setSku] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("ชิ้น");
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  // แคตตาล็อกวัตถุดิบ - ดึงจาก backend หากเป็นไปได้
  type BackendCatalogItem = { MaterialId: number; MaterialName: string; Unit: string; CatagoryName?: string };
  const [catalog, setCatalog] = useState<BackendCatalogItem[]>([]);

  // เรียกวัสดุจาก backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mats: any = await getMaterials();
        if (!mounted) return;
        // map to minimal shape
        const mapped = mats.map((m: any) => ({ MaterialId: m.MaterialId, MaterialName: m.MaterialName, Unit: m.Unit }));
        setCatalog(mapped);
      } catch (e) {
        // fallback to small inline catalog if backend not available
        setCatalog([
          { MaterialId: 1, MaterialName: "แป้งสาลีอเนกประสงค์", Unit: "กิโลกรัม" },
          { MaterialId: 2, MaterialName: "น้ำตาลทราย", Unit: "กิโลกรัม" },
          { MaterialId: 3, MaterialName: "เนยเค็ม", Unit: "กิโลกรัม" },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedProduct = useMemo(() => catalog.find((c: any) => String((c as any).MaterialId) === sku), [catalog, sku]);

  const addItem = () => {
    if (!selectedProduct || qty <= 0) return;
    // Store MaterialId as sku value when available
    const name = (selectedProduct as any).MaterialName || (selectedProduct as any).name;
    const materialId = (selectedProduct as any).MaterialId || undefined;
    setItems((prev) => [...prev, { name, qty, unit, sku: materialId } as any]);
    setSku("");
    setQty(1);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const { user } = useAuth();

  const submit = async () => {
    if (items.length === 0) return;
    try {
      // build details array for backend
      const details = items.map((i: any) => ({ MaterialId: Number(i.sku) || 0, WithdrawnQuantity: Number(i.qty) }));
      // generate a request code
      const code = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload: any = {
        WithdrawnRequestCode: code,
        BranchId: Number(user?.BranchId) || Number(branch) || 1,
        RequestDate: new Date().toISOString(),
        WithdrawnRequestStatus: 'REQUESTED',
        details,
        CreatedBy: user?.UserId || undefined,
      };

      const res = await apiPost('/request', payload);
      toast.success("ส่งคำขอเรียบร้อย", { description: `รหัส: ${res.RequestId} | รายการ: ${items.length}` });
      setItems([]);
      navigate('/requisitions');
    } catch (e: any) {
      toast.error('ส่งคำขอไม่สำเร็จ: ' + (e?.message || 'Unknown error'));
    }
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
              <label className="text-sm">วัตถุดิบ</label>
              <Select value={sku} onValueChange={(v) => { setSku(v); const p = catalog.find(x => String(x.MaterialId) === v); if (p) setUnit(p.Unit); }} disabled={catalog.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={catalog.length ? "เลือกวัตถุดิบ" : "กำลังโหลดวัตถุดิบ..."} />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((c: any) => (
                    <SelectItem key={c.MaterialId} value={String(c.MaterialId)}>{c.MaterialName}</SelectItem>
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