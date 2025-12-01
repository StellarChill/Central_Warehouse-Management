import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Power, Check, X } from 'lucide-react';
import { useMemo } from 'react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';

type StatusFilter = 'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';

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
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    (async () => {
      try {
        const rows = await apiGet('/company');
        const SYSTEM_CODES = new Set(['PLATFORM']);
        const visible = (rows || []).filter((co: any) => {
          const code = String(co?.CompanyCode || '').toUpperCase();
          return code.length === 0 || !SYSTEM_CODES.has(code);
        });
        setCompanies(visible);
      } catch (e: any) {
        setError(e?.message || 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const summary = { total: companies.length, pending: 0, active: 0, inactive: 0, rejected: 0 };
    companies.forEach((c) => {
      switch (String(c?.CompanyStatus || '').toUpperCase()) {
        case 'PENDING':
          summary.pending += 1;
          break;
        case 'ACTIVE':
          summary.active += 1;
          break;
        case 'INACTIVE':
          summary.inactive += 1;
          break;
        case 'REJECTED':
          summary.rejected += 1;
          break;
        default:
          break;
      }
    });
    return summary;
  }, [companies]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      return (c.CompanyName || '').toLowerCase().includes(q) || (c.CompanyCode || '').toLowerCase().includes(q) || (c.CompanyEmail || '').toLowerCase().includes(q);
    });
  }, [companies, query]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return searched;
    return searched.filter((c) => String(c.CompanyStatus || '').toUpperCase() === statusFilter);
  }, [searched, statusFilter]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const normalizedCode = code.trim().toLowerCase();
  const codeConflict = editing
    ? companies.some((co) => co.CompanyId !== editing.CompanyId && (co.CompanyCode || '').toLowerCase() === normalizedCode && normalizedCode.length > 0)
    : false;
  const statusFilterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'ALL', label: 'ทั้งหมด', count: stats.total },
    { value: 'PENDING', label: 'รออนุมัติ', count: stats.pending },
    { value: 'ACTIVE', label: 'พร้อมใช้งาน', count: stats.active },
    { value: 'INACTIVE', label: 'พักใช้งาน', count: stats.inactive },
    { value: 'REJECTED', label: 'ถูกปฏิเสธ', count: stats.rejected },
  ];

  const statusBadgeMap: Record<string, { className: string; label: string }> = {
    ACTIVE: { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'ACTIVE' },
    PENDING: { className: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'PENDING' },
    INACTIVE: { className: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'INACTIVE' },
    REJECTED: { className: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'REJECTED' },
  };

  const formatSubmitted = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-6 bg-slate-50 min-h-screen">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'บริษัททั้งหมด', value: stats.total, hint: 'ในระบบทั้งหมด', accent: 'text-slate-900' },
          { label: 'รออนุมัติ', value: stats.pending, hint: 'ต้องตรวจสอบ', accent: 'text-amber-600' },
          { label: 'พร้อมใช้งาน', value: stats.active, hint: 'อนุมัติแล้ว', accent: 'text-emerald-600' },
          { label: 'พักใช้งาน', value: stats.inactive, hint: 'ปิดการใช้งาน', accent: 'text-slate-500' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/60 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <div className="mt-3 flex items-end justify-between">
              <span className={`text-3xl font-semibold ${item.accent}`}>{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <Card className="border border-white shadow-md">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Manage Companies</CardTitle>
            <p className="text-sm text-muted-foreground">ดูสถานะบริษัททั้งหมด ค้นหา และอนุมัติอย่างมั่นใจก่อนเปิดใช้งาน</p>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  className={`rounded-full border ${statusFilter === option.value ? 'shadow-sm' : 'bg-white/70'}`}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                  <span className={`ml-2 rounded-full px-2 text-xs font-semibold ${statusFilter === option.value ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 text-3xl flex items-center justify-center">🗂️</div>
              <div>
                <p className="text-base font-semibold text-slate-800">ไม่พบบริษัทที่ตรงกับตัวกรอง</p>
                <p className="text-sm text-muted-foreground">ลองปรับตัวกรองหรือเคลียร์คำค้นหาเพื่อดูรายการทั้งหมด</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {query && (
                  <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                    ล้างคำค้นหา
                  </Button>
                )}
                {statusFilter !== 'ALL' && (
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter('ALL')}>
                    ดูทั้งหมด
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[260px]">บริษัท</TableHead>
                    <TableHead className="min-w-[220px]">ข้อมูลติดต่อ</TableHead>
                    <TableHead className="min-w-[160px]">สถานะ / ส่งคำขอ</TableHead>
                    <TableHead className="min-w-[180px] text-right">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const statusKey = String(c.CompanyStatus || '').toUpperCase();
                    const badgeMeta = statusBadgeMap[statusKey] || { className: 'bg-slate-100 text-slate-600 border border-slate-200', label: statusKey || 'N/A' };
                    const submitted = formatSubmitted(c.CreatedAt);
                    const initials = (c.CompanyName || '').split(' ').map((s: any) => s?.[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '—';

                    return (
                      <TableRow key={c.CompanyId} className="align-top">
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white font-semibold">
                              {initials}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-slate-900 truncate" title={c.CompanyName}>{c.CompanyName}</span>
                                <Badge variant="outline" className={`uppercase text-[11px] tracking-wide ${badgeMeta.className}`}>
                                  {badgeMeta.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 truncate" title={c.CompanyEmail || ''}>{c.CompanyCode} • {c.CompanyEmail || '—'}</p>
                              {c.CompanyAddress && <p className="text-xs text-slate-500 line-clamp-2">{c.CompanyAddress}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm text-slate-600">
                            {c.CompanyTelNumber && <div>โทร: {c.CompanyTelNumber}</div>}
                            {c.TaxId && <div>Tax: {c.TaxId}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-slate-600">
                            <span className="font-medium">{statusKey || 'N/A'}</span>
                            {submitted && <span className="text-xs text-muted-foreground">ส่งคำขอ {submitted}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap gap-2 justify-end">
                            {c.CompanyStatus === 'PENDING' ? (
                              <>
                                <Button size="sm" onClick={() => {
                                  setEditing(c);
                                  setName('');
                                  setCode('');
                                  setAddress('');
                                  setTaxId('');
                                  setEmail('');
                                  setTel('');
                                  setApproveMode(true);
                                  setFormError(null);
                                  setEditOpen(true);
                                }}>
                                  <Check className="mr-1 h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={async () => {
                                  try {
                                    const row = await apiPut(`/company/${c.CompanyId}`, { CompanyStatus: 'REJECTED' });
                                    setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                                  } catch (e: any) {
                                    alert(e?.message || 'Reject failed');
                                  }
                                }}>
                                  <X className="mr-1 h-4 w-4" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={async () => {
                                const next = c.CompanyStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                try {
                                  const row = await apiPut(`/company/${c.CompanyId}`, { CompanyStatus: next });
                                  setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                                } catch (e: any) {
                                  alert(e?.message || 'Failed to update status');
                                }
                              }}>
                                <Power className="mr-1 h-4 w-4" /> {c.CompanyStatus === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => {
                              setEditing(c);
                              setName(c.CompanyName || '');
                              setCode(c.CompanyCode || '');
                              setAddress(c.CompanyAddress || '');
                              setTaxId(c.TaxId || '');
                              setEmail(c.CompanyEmail || '');
                              setTel(c.CompanyTelNumber || '');
                              setApproveMode(false);
                              setFormError(null);
                              setEditOpen(true);
                            }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setApproveMode(false);
          setFormError(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{approveMode ? 'ตรวจสอบและอนุมัติบริษัท' : 'แก้ไขบริษัท'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">ข้อมูลที่ผู้สมัครกรอก</p>
                <dl className="text-sm space-y-1">
                  <div><dt className="font-semibold text-slate-700">ชื่อบริษัท</dt><dd>{editing.CompanyName || '—'}</dd></div>
                  <div><dt className="font-semibold text-slate-700">รหัส</dt><dd>{editing.CompanyCode || '—'}</dd></div>
                  <div><dt className="font-semibold text-slate-700">อีเมล</dt><dd>{editing.CompanyEmail || '—'}</dd></div>
                  <div><dt className="font-semibold text-slate-700">เบอร์โทร</dt><dd>{editing.CompanyTelNumber || '—'}</dd></div>
                  <div><dt className="font-semibold text-slate-700">ที่อยู่</dt><dd>{editing.CompanyAddress || '—'}</dd></div>
                  <div><dt className="font-semibold text-slate-700">Tax ID</dt><dd>{editing.TaxId || '—'}</dd></div>
                </dl>
              </div>
              {approveMode ? (
                <div className="rounded-lg border border-dashed p-4 space-y-3">
                  <p className="text-sm font-medium">ข้อมูลที่ผู้ดูแลยืนยัน</p>
                  <p className="text-xs text-muted-foreground">กรอกข้อมูลบริษัทชุดใหม่ที่ผ่านการตรวจสอบเพื่อป้องกันข้อมูลซ้ำหรือผิดพลาด หากต้องการใช้ข้อมูลที่ผู้สมัครกรอก ให้คลิกปุ่มด้านล่างแล้วปรับแก้ก่อนอนุมัติ</p>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setName(editing.CompanyName || '');
                    setCode(editing.CompanyCode || '');
                    setAddress(editing.CompanyAddress || '');
                    setTaxId(editing.TaxId || '');
                    setEmail(editing.CompanyEmail || '');
                    setTel(editing.CompanyTelNumber || '');
                  }}>ใช้ข้อมูลที่ผู้สมัครกรอก</Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  ปรับแก้ข้อมูลบริษัทนี้ได้ตามต้องการ
                </div>
              )}
            </div>
          )}
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="co-name">ชื่อบริษัท</Label>
                <Input id="co-name" value={name} placeholder={approveMode ? (editing?.CompanyName || '') : undefined} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-code">รหัสบริษัท (unique)</Label>
                <Input id="co-code" value={code} placeholder={approveMode ? (editing?.CompanyCode || '') : undefined} onChange={(e) => setCode(e.target.value)} />
                {codeConflict && (
                  <p className="text-xs text-red-500">รหัสบริษัทนี้ถูกใช้งานแล้ว กรุณาใช้รหัสอื่นเพื่อหลีกเลี่ยงบริษัทซ้ำ</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-address">ที่อยู่</Label>
                <Input id="co-address" value={address} placeholder={approveMode ? (editing?.CompanyAddress || '') : undefined} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="co-tax">Tax ID</Label>
                <Input id="co-tax" value={taxId} placeholder={approveMode ? (editing?.TaxId || '') : undefined} onChange={(e) => setTaxId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-tel">Phone</Label>
                <Input id="co-tel" value={tel} placeholder={approveMode ? (editing?.CompanyTelNumber || '') : undefined} onChange={(e) => setTel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-email">Email</Label>
                <Input id="co-email" type="email" value={email} placeholder={approveMode ? (editing?.CompanyEmail || '') : undefined} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            {approveMode ? (
              <Button disabled={saving} onClick={async () => {
                if (!editing) return;
                setSaving(true);
                const trimmedName = name.trim();
                const trimmedCode = code.trim();
                const trimmedEmail = email.trim();
                if (!trimmedName || !trimmedCode || !trimmedEmail) {
                  setFormError('กรอกชื่อบริษัท รหัสบริษัท และอีเมลให้ครบก่อนอนุมัติ');
                  setSaving(false);
                  return;
                }
                if (codeConflict) {
                  setFormError('ไม่สามารถอนุมัติได้เนื่องจากรหัสบริษัทนี้ถูกใช้แล้ว');
                  setSaving(false);
                  return;
                }
                try {
                  const row = await apiPut(`/company/${editing.CompanyId}`, {
                    CompanyName: trimmedName,
                    CompanyCode: trimmedCode,
                    CompanyAddress: address.trim(),
                    TaxId: taxId.trim() || null,
                    CompanyEmail: trimmedEmail,
                    CompanyTelNumber: tel.trim(),
                    CompanyStatus: 'ACTIVE',
                  });
                  setCompanies((prev) => prev.map((x) => x.CompanyId === row.CompanyId ? row : x));
                  setEditOpen(false);
                  setFormError(null);
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
                  setFormError(null);
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
    </PlatformLayout>
  );
}
