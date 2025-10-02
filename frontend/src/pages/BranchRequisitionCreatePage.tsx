import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

type Item = { name: string; qty: number; unit: string };

export default function BranchRequisitionCreatePage() {
  const [branch, setBranch] = useState("สาขาลาดพร้าว");
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("ชิ้น");
  const [items, setItems] = useState<Item[]>([]);

  const addItem = () => {
    if (!name || qty <= 0) return;
    setItems((prev) => [...prev, { name, qty, unit }]);
    setName("");
    setQty(1);
  };

  const submit = () => {
    alert(`ส่งคำขอเรียบร้อย\nสาขา: ${branch}\nจำนวนรายการ: ${items.length}`);
    setItems([]);
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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น น้ำดื่ม 600ml" />
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
            <Button onClick={addItem} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">เพิ่มรายการ</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">สินค้า</TableHead>
                  <TableHead className="text-right whitespace-nowrap">จำนวน</TableHead>
                  <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap">{i.name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{i.qty}</TableCell>
                    <TableCell className="whitespace-nowrap">{i.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button disabled={items.length === 0} onClick={submit} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">ส่งคำขอ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}