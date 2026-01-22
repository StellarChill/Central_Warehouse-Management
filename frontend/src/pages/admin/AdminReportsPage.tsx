import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { getStocks, getWarehouses, type Stock } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ReportRow = { warehouseId: number; warehouseName: string; received: number; issued: number; balance: number };

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stocks, warehouses] = await Promise.all([
          getStocks(),
          getWarehouses(),
        ]);

        // Initialize rows with all warehouses
        const data: Record<number, ReportRow> = {};
        warehouses.forEach(w => {
          data[w.WarehouseId] = { warehouseId: w.WarehouseId, warehouseName: w.WarehouseName, received: 0, issued: 0, balance: 0 };
        });

        // Aggregate Stocks
        // Received = Sum of Initial Quantity
        // Balance = Sum of Remaining Quantity
        // Issued = Received - Balance (Approximation of total outflow)
        stocks.forEach(s => {
          const wId = s.WarehouseId;
          if (wId && data[wId]) {
            data[wId].received += Number(s.Quantity);
            data[wId].balance += Number(s.Remain);
          }
        });

        // Calculate issued
        Object.values(data).forEach(row => {
          row.issued = row.received - row.balance;
        });

        setRows(Object.values(data));
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดรายงานไม่สำเร็จ', description: e.message || '' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = rows.reduce((acc, r) => ({
    warehouseName: "รวมทั้งหมด",
    received: acc.received + r.received,
    issued: acc.issued + r.issued,
    balance: acc.balance + r.balance,
  }), { warehouseName: "รวมทั้งหมด", received: 0, issued: 0, balance: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายงานคลังสินค้า</h1>
        <p className="text-muted-foreground mt-1">สรุปรับ-จ่าย-คงเหลือตามคลังสินค้า (Real-time)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ภาพรวมการเคลื่อนไหวสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : (
            <Table className="select-none">
              <TableHeader>
                <TableRow>
                  <TableHead>คลังสินค้า</TableHead>
                  <TableHead className="text-right">รับเข้า (ชิ้น/หน่วย)</TableHead>
                  <TableHead className="text-right">จ่ายออก (ชิ้น/หน่วย)</TableHead>
                  <TableHead className="text-right">คงเหลือ (ชิ้น/หน่วย)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.warehouseId} className="select-none">
                    <TableCell>{r.warehouseName}</TableCell>
                    <TableCell className="text-right thai-number">{r.received.toLocaleString()}</TableCell>
                    <TableCell className="text-right thai-number">{r.issued.toLocaleString()}</TableCell>
                    <TableCell className="text-right thai-number">{r.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="select-none bg-muted/50">
                  <TableCell className="font-bold">{total.warehouseName}</TableCell>
                  <TableCell className="text-right font-bold thai-number">{total.received.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold thai-number">{total.issued.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold thai-number">{total.balance.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
