import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { getMaterials } from "@/lib/api";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Item = { name: string; qty: number; unit: string; sku?: number };

export default function BranchRequisitionCreatePage() {
  const { user, isLoading } = useAuth();
  const [branch, setBranch] = useState("กำลังโหลด...");
  const [sku, setSku] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("ชิ้น");
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // แคตตาล็อกวัตถุดิบ
  type BackendCatalogItem = { MaterialId: number; MaterialName: string; Unit: string };
  const [catalog, setCatalog] = useState<BackendCatalogItem[]>([]);

  // Load Branch Name from User
  useEffect(() => {
    if (user?.BranchId) {
      import("@/lib/api").then(({ getBranch, getCompany }) => {
        getBranch(user.BranchId)
          .then(async (b) => {
            let name = b.BranchName;
            if (b.CompanyId) {
              try {
                const co = await getCompany(b.CompanyId);
                if (co) name += ` (${co.CompanyName})`;
              } catch { }
            }
            setBranch(name);
          })
          .catch(() => setBranch("ไม่พบข้อมูลสาขา"));
      });
    } else if (user && !user.BranchId) {
      setBranch("ไม่ระบุสาขา");
    }
  }, [user]);

  // เรียกวัสดุจาก backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mats: any = await getMaterials();
        if (!mounted) return;
        const mapped = mats.map((m: any) => ({ MaterialId: m.MaterialId, MaterialName: m.MaterialName, Unit: m.Unit }));
        setCatalog(mapped);
      } catch (e) {
        if (!mounted) return;
        setCatalog([
          { MaterialId: 1, MaterialName: "แป้งสาลีอเนกประสงค์", Unit: "กิโลกรัม" },
          { MaterialId: 2, MaterialName: "น้ำตาลทราย", Unit: "กิโลกรัม" },
          { MaterialId: 3, MaterialName: "เนยเค็ม", Unit: "กิโลกรัม" },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedProduct = useMemo(() => catalog.find((c) => String(c.MaterialId) === sku), [catalog, sku]);

  // If user opens this page directly without auth
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/liff', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return null;
  }

  const addItem = () => {
    if (!selectedProduct || qty <= 0) {
      toast.error("กรุณาเลือกวัตถุดิบและระบุจำนวนที่ถูกต้อง");
      return;
    }
    const name = selectedProduct.MaterialName;
    const materialId = selectedProduct.MaterialId;

    // prevent duplicate
    if (items.some((it: any) => Number(it.sku) === Number(materialId))) {
      toast.error("วัตถุดิบนี้มีอยู่แล้วในรายการ");
      return;
    }
    setItems((prev) => [...prev, { name, qty, unit, sku: materialId }]);
    setSku("");
    setQty(1);
    setSearchTerm("");
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (items.length === 0) {
      toast.error('รายการว่าง');
      return;
    }
    try {
      const details = items.map((i: any) => ({ MaterialId: Number(i.sku), WithdrawnQuantity: Number(i.qty) }));
      const code = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload: any = {
        WithdrawnRequestCode: code,
        BranchId: Number(user?.BranchId) || 1,
        RequestDate: new Date().toISOString(),
        WithdrawnRequestStatus: 'REQUESTED',
        details,
        CreatedBy: user?.UserId || undefined,
      };

      const res = await apiPost('/request', payload);
      toast.success("ส่งคำขอเรียบร้อย ติดตามสถานะได้ที่หน้ารายการเบิก", { description: `รหัส: ${res.RequestId} | รายการ: ${items.length}` });
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
              <label className="text-sm">สาขา / บริษัท</label>
              <Input value={branch} readOnly className="bg-slate-50 text-slate-500" />
            </div>
            <div>
              <label className="text-sm">ค้นหาวัตถุดิบ</label>
              <Input placeholder={catalog.length ? "พิมพ์เพื่อค้นหา..." : "กำลังโหลด..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="mt-2">
                {searchTerm && (
                  <div className="border rounded bg-white max-h-48 overflow-auto">
                    {catalog.filter(c => c.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
                      <div key={c.MaterialId} className="p-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setSku(String(c.MaterialId)); setUnit(c.Unit); setSearchTerm(''); }}>
                        {c.MaterialName} <span className="text-muted-foreground text-sm">({c.Unit})</span>
                      </div>
                    ))}
                    {catalog.filter(c => c.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">ไม่พบวัตถุดิบ</div>
                    )}
                  </div>
                )}
                {!searchTerm && (
                  <div className="mt-1 text-sm text-muted-foreground">พิมพ์ชื่อวัตถุดิบเพื่อค้นหา</div>
                )}
              </div>
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

          <div className="my-6">
            <h3 className="text-lg font-semibold mb-3">รายการวัตถุดิบทั้งหมด</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {catalog.filter(c => !searchTerm || c.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())).map((m) => (
                <Card key={m.MaterialId} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200" onClick={() => {
                  setSku(String(m.MaterialId));
                  setUnit(m.Unit);
                  setQty(1); // Reset qty to 1 when clicking from catalog
                }}>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      {/* Placeholder image logic or icon */}
                      {m.MaterialName}
                    </div>
                    <div>
                      <p className="font-semibold text-sm truncate" title={m.MaterialName}>{m.MaterialName}</p>
                      <p className="text-xs text-slate-500">หน่วย: {m.Unit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
