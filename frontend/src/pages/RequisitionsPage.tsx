import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { useStock } from "@/context/StockContext";

type Requisition = {
  id: string;
  branch: string;
  requestedBy: string;
  items: { name: string; qty: number; unit: string }[];
  status: "PENDING" | "REJECTED" | "PREPARING" | "SHIPPED";
};

export default function RequisitionsPage() {
  const [q, setQ] = useState("");
  const { issue } = useStock();

  const [reqs, setReqs] = useState<Requisition[]>([
    {
      id: "REQ-2024-089",
      branch: "สาขาลาดพร้าว",
      requestedBy: "วิชาญ",
      status: "PENDING",
      items: [
        { name: "น้ำดื่ม 600ml", qty: 100, unit: "ขวด" },
        { name: "ข้าวสาร 5kg", qty: 20, unit: "ถุง" },
      ],
    },
    {
      id: "REQ-2024-090",
      branch: "สาขาบางนา",
      requestedBy: "สุดา",
      status: "PREPARING",
      items: [{ name: "นม 1L", qty: 60, unit: "กล่อง" }],
    },
    {
      id: "REQ-2024-091",
      branch: "สาขาหาดใหญ่",
      requestedBy: "ปรีชา",
      status: "SHIPPED",
      items: [{ name: "ผักรวม แพ็ค", qty: 30, unit: "แพ็ค" }],
    },
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return reqs;
    return reqs.filter((r) =>
      [r.id, r.branch, r.requestedBy].some((v) => v.toLowerCase().includes(s))
    );
  }, [q, reqs]);

  const approve = (id: string) =>
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: "PREPARING" } : r)));

  const reject = (id: string) =>
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));

  const ship = (id: string) => {
    const req = reqs.find((r) => r.id === id);
    if (req) {
      for (const it of req.items) {
        // demo: ใช้ชื่อเป็น sku placeholder
        issue(it.name as any, it.qty, `Ship ${id}`);
      }
    }
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: "SHIPPED" } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">การเบิกวัตถุดิบ (ตามสาขา)</h1>
          <p className="text-muted-foreground mt-1">
            สรุปรายการวัตถุดิบที่แต่ละสาขาขอเบิกจากคลัง   
          </p>
        </div>
      </div>

      {/* ✅ เหลือเฉพาะตาราง */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายการคำขอเบิกวัตถุดิบ</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 w-80"
                placeholder="ค้นหา รหัส/สาขา/ผู้ขอ"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>สาขา</TableHead>
                <TableHead>ผู้ขอเบิก</TableHead>
                <TableHead>รายการที่ต้องการ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell>{r.branch}</TableCell>
                  <TableCell>{r.requestedBy}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {r.items.map((i, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{i.name}</span>
                          <span className="thai-number">
                            × {i.qty.toLocaleString()} {i.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const text =
                        r.status === "PENDING"
                          ? "รอดำเนินการ"
                          : r.status === "PREPARING"
                          ? "จัดเตรียมแล้ว"
                          : r.status === "SHIPPED"
                          ? "จัดส่งแล้ว"
                          : "จัดส่งไม่สำเร็จ";
                      const cls =
                        r.status === "SHIPPED"
                          ? "bg-success/10 text-success border-success/20"
                          : r.status === "REJECTED"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : r.status === "PREPARING"
                          ? "bg-info/10 text-info border-info/20"
                          : "bg-warning/10 text-warning-foreground border-warning/20";
                      return (
                        <Badge variant="outline" className={cls}>
                          {text}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {r.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => approve(r.id)}>
                            อนุมัติ
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(r.id)} className="text-destructive hover:bg-destructive/10">
                            ปฏิเสธ
                          </Button>
                        </>
                      )}
                      {r.status === "PREPARING" && (
                        <Button size="sm" onClick={() => ship(r.id)}>
                          ทำเครื่องหมายว่า "จัดส่งแล้ว"
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}