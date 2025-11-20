import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = { branch: string; received: number; issued: number; balance: number };

export default function AdminReportsPage() {
  const rows: Row[] = [
    { branch: "ศูนย์ A", received: 1000, issued: 700, balance: 300 },
    { branch: "สาขาบางนา", received: 400, issued: 380, balance: 20 },
    { branch: "สาขาหาดใหญ่", received: 300, issued: 250, balance: 50 },
  ];

  const total = rows.reduce((acc, r) => ({
    branch: "รวมทั้งหมด",
    received: acc.received + r.received,
    issued: acc.issued + r.issued,
    balance: acc.balance + r.balance,
  }), { branch: "รวมทั้งหมด", received: 0, issued: 0, balance: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายงานรวมทุกสาขา</h1>
        <p className="text-muted-foreground mt-1">สรุปรับ-จ่าย-คงเหลือตามสาขา (เดโม่)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ภาพรวมการเคลื่อนไหว</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="select-none">
            <TableHeader>
              <TableRow>
                <TableHead>สาขา</TableHead>
                <TableHead className="text-right">รับเข้า</TableHead>
                <TableHead className="text-right">จ่ายออก</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.branch} className="select-none">
                  <TableCell>{r.branch}</TableCell>
                  <TableCell className="text-right thai-number">{r.received.toLocaleString()}</TableCell>
                  <TableCell className="text-right thai-number">{r.issued.toLocaleString()}</TableCell>
                  <TableCell className="text-right thai-number">{r.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="select-none">
                <TableCell className="font-bold">{total.branch}</TableCell>
                <TableCell className="text-right font-bold thai-number">{total.received.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold thai-number">{total.issued.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold thai-number">{total.balance.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


