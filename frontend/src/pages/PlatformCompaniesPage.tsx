import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformCompaniesPage() {
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companies.map((c) => (
              <div key={c.CompanyId} className="p-3 border rounded">
                <div className="font-medium">{c.CompanyName}</div>
                <div className="text-sm text-muted-foreground">{c.CompanyCode} • {c.CompanyEmail || '—'}</div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="text-sm text-muted-foreground">No companies yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
