import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Power } from 'lucide-react';

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

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
    <div className="px-6 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {companies.map((c) => (
              <div key={c.CompanyId} className="p-3 border rounded hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{c.CompanyName}</div>
                    <div className="text-sm text-muted-foreground">{c.CompanyCode} • {c.CompanyEmail || '—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={c.CompanyStatus === 'ACTIVE' ? 'success' as any : 'secondary'}>{c.CompanyStatus}</Badge>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const next = c.CompanyStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                      try {
                        const row = await apiPut(`/company/${c.CompanyId}`, { CompanyStatus: next });
                        setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                      } catch (e: any) {
                        alert(e?.message || 'Failed to update status');
                      }
                    }}>
                      <Power className="h-4 w-4 mr-1" /> {c.CompanyStatus === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setName(c.CompanyName || ''); setCode(c.CompanyCode || ''); setEditOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="text-sm text-muted-foreground">No companies yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="co-name">ชื่อบริษัท</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="co-code">รหัสบริษัท (unique)</Label>
              <Input id="co-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button disabled={saving} onClick={async () => {
              if (!editing) return;
              setSaving(true);
              try {
                const row = await apiPut(`/company/${editing.CompanyId}`, { CompanyName: name, CompanyCode: code });
                setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                setEditOpen(false);
              } catch (e: any) {
                alert(e?.message || 'Update failed');
              } finally {
                setSaving(false);
              }
            }}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
