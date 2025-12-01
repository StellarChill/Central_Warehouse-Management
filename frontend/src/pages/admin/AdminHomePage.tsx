import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardHat, Factory, ChartBar } from "lucide-react";

export default function AdminHomePage() {
  const tiles = [
    { title: "ผู้ใช้", desc: "เพิ่ม/อนุมัติ/กำหนดสิทธิ์", href: "/admin/users", icon: HardHat },
    { title: "สาขา", desc: "จัดการสาขาทั้งหมด", href: "/admin/branches", icon: Factory },
    { title: "รายงานรวม", desc: "สรุปทุกสาขา", href: "/admin/reports", icon: ChartBar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ผู้ดูแลระบบ</h1>
        <p className="text-muted-foreground mt-1">ศูนย์รวมการตั้งค่าและการจัดการทั้งหมด</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <t.icon className="h-5 w-5" /> {t.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <Button asChild variant="outline">
                <a href={t.href}>เปิด</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}