import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Placeholder: call simple endpoints to warm auth
        const warehouses = await apiGet('/warehouse');
        const branches = await apiGet('/branch');
        setStats({ warehouses: warehouses?.length ?? 0, branches: branches?.length ?? 0 });
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">Warehouses</div>
              <div className="text-2xl font-semibold">{stats?.warehouses ?? 0}</div>
            </div>
            <div className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">Branches</div>
              <div className="text-2xl font-semibold">{stats?.branches ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
