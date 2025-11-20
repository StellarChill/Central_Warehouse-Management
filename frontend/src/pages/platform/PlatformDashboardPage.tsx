import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckSquare, Users, LayoutDashboard, ShieldCheck, Timer } from 'lucide-react';

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await apiGet('/company');
        setCompanies(rows);
      } catch (e: any) {
        setError(e?.message || 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    companyCount: companies.length,
    pendingApprovals: 4, // mock until API ready
    totalUsers: 37, // mock until API ready
    systemHealthy: true,
  }), [companies]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 rounded-lg bg-blue-50 text-blue-600 items-center justify-center shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Platform Admin — Home</h1>
            <p className="text-muted-foreground text-sm">ภาพรวมระบบทั้งหมด และทางลัดไปยังเมนูสำคัญ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Super Admin</Badge>
          <Badge variant="outline" className="flex items-center gap-1"><Timer className="h-3 w-3" /> Real-time (mock)</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-600" />Pending Approvals</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.pendingApprovals}</div></CardContent>
        </Card>
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" />Companies</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.companyCount}</div></CardContent>
        </Card>
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-green-600" />Users</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.totalUsers}</div></CardContent>
        </Card>
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-600" />System</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.systemHealthy ? 'Healthy' : 'Degraded'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-600" /> Approvals</div>
              <p className="text-sm text-muted-foreground mb-3">อนุมัติการสมัครบริษัท/ผู้ใช้ ดูเหตุผล reject แก้ role ก่อนอนุมัติ</p>
              <Button className="w-full" onClick={() => navigate('/platform/approvals')}>Open</Button>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" /> Manage Companies</div>
              <p className="text-sm text-muted-foreground mb-3">แก้ชื่อ TEMP → ชื่อจริง ตั้ง Active/Inactive</p>
              <Button className="w-full" onClick={() => navigate('/platform/companies')}>Open</Button>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-green-600" /> Manage Users</div>
              <p className="text-sm text-muted-foreground mb-3">ดูผู้ใช้ทั้งระบบ เปลี่ยน role/สถานะ แก้ข้อมูล</p>
              <Button className="w-full" onClick={() => navigate('/platform/users')}>Open</Button>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-slate-600" /> System Overview</div>
              <p className="text-sm text-muted-foreground mb-3">ภาพรวมสุขภาพระบบและตัวชี้วัดหลัก</p>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/platform/system')}>Open</Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <div className="text-sm font-medium">Companies</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {companies.map((c) => (
                <div key={c.CompanyId} className="p-3 rounded border hover:shadow-sm transition">
                  <div className="font-medium">{c.CompanyName}</div>
                  <div className="text-sm text-muted-foreground">{c.CompanyCode} • {c.CompanyEmail || '—'}</div>
                </div>
              ))}
              {companies.length === 0 && (
                <div className="text-sm text-muted-foreground">No companies yet.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
