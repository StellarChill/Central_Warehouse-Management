import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Power, Check, X } from 'lucide-react';
import { useMemo } from 'react';

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [approveMode, setApproveMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      return (c.CompanyName || '').toLowerCase().includes(q) || (c.CompanyCode || '').toLowerCase().includes(q) || (c.CompanyEmail || '').toLowerCase().includes(q);
    });
  }, [companies, query]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="px-6 py-8 space-y-4 bg-slate-50 min-h-screen">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Manage Companies</CardTitle>
            <div className="flex items-center gap-3">
              <Input placeholder="Search companies, code or email..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
              <div className="text-sm text-muted-foreground">{filtered.length} / {companies.length}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.CompanyId} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition duration-150 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-indigo-500 to-emerald-400">{(c.CompanyName || '').split(' ').map((s:any)=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-slate-900 truncate">{c.CompanyName}</div>
                        <div className="ml-2">
                          <Badge
                            className="uppercase text-xs"
                            variant={
                              c.CompanyStatus === 'ACTIVE' ? 'success' as any :
                              c.CompanyStatus === 'PENDING' ? 'outline' :
                              c.CompanyStatus === 'REJECTED' ? 'destructive' : 'secondary'
                            }
                          >{c.CompanyStatus}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground truncate">{c.CompanyCode} • {c.CompanyEmail || '—'}</div>
                      {c.CompanyAddress && <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.CompanyAddress}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.CompanyStatus === 'PENDING' ? (
                      <>
                        <Button size="sm" variant="outline" className={`w-32 ${saving && approveMode ? 'opacity-80 animate-pulse' : ''}`} onClick={async () => {
                          // open edit dialog in approve mode so admin can review/edit before approving
                          setEditing(c);
                          setName(c.CompanyName || '');
                          setCode(c.CompanyCode || '');
                          setAddress(c.CompanyAddress || '');
                          setTaxId(c.TaxId || '');
                          setEmail(c.CompanyEmail || '');
                          setTel(c.CompanyTelNumber || '');
                          setApproveMode(true);
                          setEditOpen(true);
                        }}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="w-32" onClick={async () => {
                          try {
                            const row = await apiPut(`/company/${c.CompanyId}`, { CompanyStatus: 'REJECTED' });
                            setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                          } catch (e: any) { alert(e?.message || 'Reject failed'); }
                        }}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="w-36" onClick={async () => {
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
                    )}
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setName(c.CompanyName || ''); setCode(c.CompanyCode || ''); setAddress(c.CompanyAddress || ''); setTaxId(c.TaxId || ''); setEmail(c.CompanyEmail || ''); setTel(c.CompanyTelNumber || ''); setApproveMode(false); setEditOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">No companies match your search.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setApproveMode(false); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{approveMode ? 'ตรวจสอบและอนุมัติบริษัท' : 'แก้ไขบริษัท'}</DialogTitle>
          </DialogHeader>
          {approveMode && (
            <div className="text-sm text-muted-foreground mb-2">คุณกำลังอนุมัติบริษัทนี้ — กรุณาตรวจสอบข้อมูลและกด Approve เพื่อยืนยัน</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="co-name">ชื่อบริษัท</Label>
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-code">รหัสบริษัท (unique)</Label>
                <Input id="co-code" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-address">ที่อยู่</Label>
                <Input id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="co-tax">Tax ID</Label>
                <Input id="co-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-tel">Phone</Label>
                <Input id="co-tel" value={tel} onChange={(e) => setTel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-email">Email</Label>
                <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            {approveMode ? (
              <Button disabled={saving} onClick={async () => {
                if (!editing) return;
                setSaving(true);
                try {
                  const row = await apiPut(`/company/${editing.CompanyId}`, { CompanyName: name, CompanyCode: code, CompanyAddress: address, TaxId: taxId, CompanyEmail: email, CompanyTelNumber: tel, CompanyStatus: 'ACTIVE' });
                  setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                  setEditOpen(false);
                } catch (e: any) {
                  alert(e?.message || 'Approve failed');
                } finally {
                  setSaving(false);
                  setApproveMode(false);
                }
              }}>Approve</Button>
            ) : (
              <Button disabled={saving} onClick={async () => {
                if (!editing) return;
                setSaving(true);
                try {
                  const row = await apiPut(`/company/${editing.CompanyId}`, { CompanyName: name, CompanyCode: code, CompanyAddress: address, TaxId: taxId, CompanyEmail: email, CompanyTelNumber: tel });
                  setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                  setEditOpen(false);
                } catch (e: any) {
                  alert(e?.message || 'Update failed');
                } finally {
                  setSaving(false);
                }
              }}>บันทึก</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
