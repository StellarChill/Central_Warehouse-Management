import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { Warehouse as WarehouseIcon, Factory, HardHat, RadioTower, ClipboardList } from 'lucide-react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';

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
    <PlatformLayout>
      <div className="px-6 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 rounded-lg bg-blue-50 text-blue-600 items-center justify-center shadow-sm">
            <WarehouseIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Platform Admin — Home</h1>
            <p className="text-muted-foreground text-sm">ภาพรวมระบบทั้งหมด และทางลัดไปยังเมนูสำคัญ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Super Admin</Badge>
          <Badge variant="outline" className="flex items-center gap-1"><RadioTower className="h-3 w-3" /> Real-time (mock)</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
       
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Factory className="h-4 w-4 text-blue-600" />Companies</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.companyCount}</div></CardContent>
        </Card>
        <Card className="hover:shadow-sm transition">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><HardHat className="h-4 w-4 text-green-600" />Users</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{stats.totalUsers}</div></CardContent>
        </Card>
     
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
           
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><Factory className="h-4 w-4 text-blue-600" /> Manage Companies</div>
              <Button className="w-full" onClick={() => navigate('/platform/companies')}>Open</Button>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2 flex items-center gap-2"><HardHat className="h-4 w-4 text-green-600" /> Manage Users</div>
              <Button className="w-full" onClick={() => navigate('/platform/users')}>Open</Button>
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
    </PlatformLayout>
  );
}
