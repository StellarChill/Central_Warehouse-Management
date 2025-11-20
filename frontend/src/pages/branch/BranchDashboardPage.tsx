import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BranchDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stock = await apiGet('/stock');
        const receipts = await apiGet('/receipt');
        const issues = await apiGet('/issue');
        setStats({ stock: stock?.length ?? 0, receipts: receipts?.length ?? 0, issues: issues?.length ?? 0 });
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
          <CardTitle>Branch Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">Stock Items</div>
              <div className="text-2xl font-semibold">{stats?.stock ?? 0}</div>
            </div>
            <div className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">Receipts</div>
              <div className="text-2xl font-semibold">{stats?.receipts ?? 0}</div>
            </div>
            <div className="p-4 border rounded">
              <div className="text-sm text-muted-foreground">Issues</div>
              <div className="text-2xl font-semibold">{stats?.issues ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
