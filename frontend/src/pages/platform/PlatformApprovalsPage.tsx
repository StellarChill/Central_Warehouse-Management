import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPut, platformListUsers, platformRejectUser, platformSetUserActive, platformAssignUser, platformApproveUser, type PlatformSignupUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Search, UserCheck, Shield, ChevronLeft, ChevronRight, SlidersHorizontal, UserPlus, Users, Building2, ClipboardCheck, ShieldX, ShieldBan, HardHat, AlertTriangle } from 'lucide-react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type TabStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function PlatformApprovalsPage() {
  const [rows, setRows] = useState<PlatformSignupUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filters & State
  const [status, setStatus] = useState<TabStatus>('PENDING'); // Default to PENDING for approvals focus
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC'>('NEWEST');

  // Assign Data
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Selection
  const [assignUser, setAssignUser] = useState<PlatformSignupUser | null>(null);
  const [assignMode, setAssignMode] = useState<'APPROVE' | 'ASSIGN'>('APPROVE');
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');

  // Reject Dialog State
  const [rejectOpen, setRejectOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<PlatformSignupUser | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function getRoles() { return apiGet('/role'); }
  async function getBranches() { return apiGet('/branch'); }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      // Always load ALL data regardless of tab
      const buckets: Exclude<TabStatus, 'ALL'>[] = ['PENDING', 'APPROVED', 'REJECTED'];
      const results = await Promise.all(buckets.map((state) => platformListUsers(state)));
      setRows(results.flat());
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [co, rl] = await Promise.all([apiGet('/company'), getRoles()]);
        // Only show ACTIVE (approved) companies in the assign dropdown
        const activeCompanies = (co || []).filter((c: any) => {
          const st = String(c.CompanyStatus || '').toUpperCase();
          return st === 'ACTIVE';
        });
        setCompanies(activeCompanies);
        const allow = new Set(['COMPANY_ADMIN', 'WAREHOUSE_ADMIN', 'BRANCH_USER']);
        const filtered = (rl || []).filter((r: any) => allow.has(String(r.RoleCode).toUpperCase()));
        setRoles(filtered);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!companyId) { setBranches([]); setBranchId(''); return; }
      try {
        const all = await getBranches();
        setBranches(all.filter((b: any) => String(b.CompanyId) === String(companyId)));
      } catch { }
    })();
  }, [companyId]);

  const resolveCompanyName = (u: PlatformSignupUser) => {
    const direct = (u as any).CompanyName || (u as any).Company?.CompanyName;
    if (direct) return direct;
    if (u.TempCompany) return u.TempCompany.TempCompanyName;
    return '—';
  };

  const resolveRoleName = (u: PlatformSignupUser) => u.Role?.RoleName || u.RequestedRoleText || '—';
  const resolveBranchName = (u: PlatformSignupUser) => u.Branch?.BranchName || '—';

  const filteredRows = useMemo(() => {
    let result = rows.filter((u) => {
      const search = filterQuery.trim().toLowerCase();
      const matchesSearch = !search || [u.UserName, u.Email, u.TelNumber, resolveCompanyName(u)]
        .some((field) => field?.toLowerCase().includes(search));
      const matchesCompany = !filterCompany || String(u.Company?.CompanyId ?? '') === filterCompany;
      const matchesRole = !filterRole || String(u.Role?.RoleId ?? '') === filterRole;
      const matchesStatus = status === 'ALL' || u.UserStatusApprove === status;
      return matchesSearch && matchesCompany && matchesRole && matchesStatus;
    });

    return result.sort((a, b) => {
      const timeA = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0;
      const timeB = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0;
      switch (sortOrder) {
        case 'NAME_ASC': return (a.UserName || '').localeCompare(b.UserName || '');
        case 'NAME_DESC': return (b.UserName || '').localeCompare(a.UserName || '');
        case 'OLDEST': return timeA - timeB;
        case 'NEWEST': default: return timeB - timeA;
      }
    });
  }, [rows, filterQuery, filterCompany, filterRole, sortOrder, status]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filterQuery, filterCompany, filterRole, status]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter(r => r.UserStatusApprove === 'PENDING').length,
      approved: rows.filter(r => r.UserStatusApprove === 'APPROVED').length,
      rejected: rows.filter(r => r.UserStatusApprove === 'REJECTED').length
    }
  }, [rows]);

  const statusOptions: { value: TabStatus; label: string; count: number }[] = [
    { value: 'ALL', label: 'ทั้งหมด', count: stats.total },
    { value: 'PENDING', label: 'รออนุมัติ', count: stats.pending },
    { value: 'APPROVED', label: 'อนุมัติแล้ว', count: stats.approved },
    { value: 'REJECTED', label: 'ปฏิเสธแล้ว', count: stats.rejected },
  ];

  const handleRejectClick = (u: PlatformSignupUser) => {
    setUserToReject(u);
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!userToReject) return;
    try {
      await platformRejectUser(userToReject.UserId);
      toast({ title: 'User rejected successfully' });
      await load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to reject user', description: e.message });
    } finally {
      setRejectOpen(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-6 bg-slate-50/50 min-h-screen font-sans">

        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Total Users</p><h3 className="text-2xl font-bold mt-1 text-slate-800">{stats.total}</h3></div>
              <div className="p-3 rounded-xl bg-blue-50/80"><Users className="h-5 w-5 text-blue-600" /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Pending</p><h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</h3></div>
              <div className="p-3 rounded-xl bg-amber-50/80"><ClipboardCheck className="h-5 w-5 text-amber-600" /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Approved</p><h3 className="text-2xl font-bold mt-1 text-emerald-600">{stats.approved}</h3></div>
              <div className="p-3 rounded-xl bg-emerald-50/80"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Rejected</p><h3 className="text-2xl font-bold mt-1 text-rose-600">{stats.rejected}</h3></div>
              <div className="p-3 rounded-xl bg-rose-50/80"><ShieldX className="h-5 w-5 text-rose-600" /></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100/80 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-slate-800 tracking-tight">User Approvals</CardTitle>
                <CardDescription className="text-slate-500">จัดการคำขอสมัครสมาชิกและกำหนดสิทธิ์ผู้ใช้งานให้ถูกต้อง</CardDescription>
              </div>

              {/* Status Pills like Company Page */}
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/50">
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={status === opt.value ? 'default' : 'ghost'}
                    className={`rounded-xl transition-all duration-200 px-4 ${status === opt.value
                      ? 'bg-white text-slate-900 shadow-sm hover:bg-white'
                      : 'text-slate-600 hover:bg-white/50'
                      }`}
                    onClick={() => setStatus(opt.value)}
                  >
                    <span className="font-medium mr-2">{opt.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${status === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700'
                      }`}>
                      {opt.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 mt-8">
              <div className="relative lg:col-span-4 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  className="pl-10 h-11 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/10 rounded-xl transition-all"
                  placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                />
              </div>

              <div className="lg:col-span-3">
                <Select value={filterCompany} onValueChange={(v) => setFilterCompany(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="ทุกบริษัท" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    <SelectItem value="ALL">ทุกบริษัท</SelectItem>
                    {companies.map((c) => <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>{c.CompanyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select value={filterRole} onValueChange={(v) => setFilterRole(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="ทุกระดับ" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    <SelectItem value="ALL">ทุกระดับ</SelectItem>
                    {roles.map((r) => <SelectItem key={r.RoleId} value={String(r.RoleId)}>{r.RoleName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    <SelectItem value="NEWEST">ล่าสุดก่อน</SelectItem>
                    <SelectItem value="OLDEST">เก่าสุดก่อน</SelectItem>
                    <SelectItem value="NAME_ASC">ชื่อ A-Z</SelectItem>
                    <SelectItem value="NAME_DESC">ชื่อ Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-1">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/30 transition-all"
                  onClick={() => { setFilterQuery(''); setFilterCompany(''); setFilterRole(''); setSortOrder('NEWEST'); setStatus('PENDING'); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
              </div>
            ) : error ? (
              <div className="p-16 text-center">
                <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <X className="h-6 w-6 text-rose-600" />
                </div>
                <p className="text-rose-600 font-semibold mb-1">พบข้อผิดพลาด</p>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">{error}</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={load}>ลองใหม่อีกครั้ง</Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/50">
                {paginatedRows.map((u) => {
                  const isPending = u.UserStatusApprove === 'PENDING';
                  const isApproved = u.UserStatusApprove === 'APPROVED';
                  const isRejected = u.UserStatusApprove === 'REJECTED';

                  return (
                    <div key={u.UserId} className="group p-6 hover:bg-slate-50/80 flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-all duration-300">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-700 transition-all">
                            {(u.UserName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors uppercase text-base">{u.UserName}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold px-2 py-0 border-none tracking-wider ${isPending ? 'bg-amber-100 text-amber-700' :
                                  isApproved ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-rose-100 text-rose-700'
                                  }`}
                              >
                                {u.UserStatusApprove}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <span className="font-mono">{u.Email || 'ไม่มีอีเมล'}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span>{u.TelNumber || 'ไม่มีเบอร์โทร'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-white/50 rounded-xl p-3 border border-slate-100 group-hover:border-blue-100/50 transition-all">
                          <div className="flex items-start gap-2.5">
                            <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">บริษัท</span>
                              <span className="text-slate-700 font-medium truncate">{resolveCompanyName(u)}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Shield className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">บทบาท</span>
                              <span className="text-slate-700 font-medium truncate">{resolveRoleName(u)}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">สาขา</span>
                              <span className="text-slate-700 font-medium truncate">{resolveBranchName(u)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:self-center">
                        <Badge
                          variant="outline"
                          className={`rounded-lg px-2.5 py-1 tracking-tight font-bold text-[11px] ${u.UserStatusActive === 'ACTIVE'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                        >
                          {u.UserStatusActive === 'ACTIVE' ? 'ใช้งานปกติ' : 'ปิดการใช้งาน'}
                        </Badge>

                        <div className="h-8 w-[1px] bg-slate-200/50 mx-1 hidden sm:block" />

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="rounded-xl shadow-lg shadow-blue-500/10 h-10 px-4 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                              setAssignUser(u);
                              setAssignMode('APPROVE');
                              setAssignOpen(true);
                              setCompanyId('');
                              setBranchId('');
                              setRoleId('');
                            }}>
                              <ClipboardCheck className="h-4 w-4 mr-2" /> กำหนดสิทธิ์และอนุมัติ
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-xl h-10 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleRejectClick(u)}>
                              <ShieldX className="h-4 w-4 mr-2" /> ปฏิเสธ
                            </Button>
                          </div>
                        )}

                        {(isApproved || isRejected) && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className={`rounded-xl h-10 px-4 transition-all ${u.UserStatusActive === 'ACTIVE'
                              ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-blue-600 hover:bg-blue-50'
                              }`} onClick={async () => {
                                const next = u.UserStatusActive === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                await platformSetUserActive(u.UserId, next);
                                toast({ title: `เปลี่ยนสถานะเป็น ${next} เรียบร้อย` });
                                await load();
                              }}>
                              {u.UserStatusActive === 'ACTIVE' ? <ShieldBan className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                              {u.UserStatusActive === 'ACTIVE' ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl h-10 px-4 border-slate-200 hover:bg-slate-50" onClick={() => {
                              setAssignUser(u);
                              setAssignMode('ASSIGN');
                              setAssignOpen(true);
                              setCompanyId('');
                              setBranchId('');
                              setRoleId('');
                            }}>
                              <HardHat className="h-4 w-4 mr-2" /> แก้ไขสิทธิ์
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {paginatedRows.length === 0 && (
                  <div className="p-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                      <Search className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="text-slate-800 font-bold text-lg">ไม่พบข้อมูลผู้ใช้งาน</p>
                    <p className="text-slate-500 mt-1 max-w-xs mx-auto text-sm">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง</p>
                    <Button variant="link" className="mt-4 text-blue-600" onClick={() => { setFilterQuery(''); setStatus('ALL'); }}>ล้างค่าการกรองทั้งหมด</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {/* Pagination UI */}
          {!loading && totalPages > 1 && (
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
              <div className="text-sm text-slate-500">
                แสดงหน้าที่ <span className="font-bold text-slate-800">{currentPage}</span> จากทั้งหมด <span className="font-bold text-slate-800">{totalPages}</span> หน้า
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 px-4 border-slate-200"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 px-4 border-slate-200"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  ถัดไป <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-2xl rounded-3xl overflow-hidden border-none shadow-premium p-0">
            <div className="p-8 space-y-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                  {assignMode === 'APPROVE' ? 'Assign Role & Approve' : 'จัดการกำหนดสิทธิ์ผู้ใช้งาน'}
                </DialogTitle>
                <CardDescription>กรอกข้อมูลบริษัทและบทบาทที่ต้องการมอบหมายให้กับผู้ใช้งานนี้</CardDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info Section */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 space-y-4">
                    <p className="text-xs font-bold text-blue-800 flex items-center gap-2 uppercase tracking-widest">
                      <UserPlus className="h-3.5 w-3.5" />
                      ข้อมูลการสมัคร
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-blue-600/70 font-bold uppercase">ชื่อผู้ใช้งาน</p>
                        <p className="font-bold text-slate-800 truncate">{assignUser?.UserName}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-blue-600/70 font-bold uppercase">บริษัทที่ขอเข้าร่วม</p>
                        <p className="font-medium text-slate-800">{assignUser ? (assignUser.TempCompany?.TempCompanyName || resolveCompanyName(assignUser)) : '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-blue-600/70 font-bold uppercase">บทบาทที่ต้องการ</p>
                        <p className="font-medium text-slate-800">{assignUser?.RequestedRoleText || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      บันทึกสิทธิ์โดยระบบ
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-bold">เลือกบริษัทที่สังกัด</Label>
                        <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                            <SelectValue placeholder="เลือกบริษัท..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100">
                            {companies.map((c) => (
                              <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>{c.CompanyName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-bold">เลือกบทบาท (Role)</Label>
                        <Select value={roleId} onValueChange={(v) => { setRoleId(v); setBranchId(''); }}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                            <SelectValue placeholder="เลือกบทบาท..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100">
                            {roles.map((r) => (
                              <SelectItem key={r.RoleId} value={String(r.RoleId)}>{r.RoleName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(() => {
                        const selectedRole = roles.find((r) => String(r.RoleId) === roleId);
                        const isBranchRole = selectedRole && String(selectedRole.RoleCode).toUpperCase() === 'BRANCH_USER';
                        if (!isBranchRole) return null;
                        return (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-slate-700 font-bold">เลือกสาขา (Branch)</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                                <SelectValue placeholder="เลือกสาขา..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-100">
                                {branches.map((b) => (
                                  <SelectItem key={b.BranchId} value={String(b.BranchId)}>{b.BranchName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/80 border-t border-slate-100/50 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => setAssignOpen(false)}>ยกเลิก</Button>
              <Button
                className="rounded-xl h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                disabled={saving || !companyId || !roleId}
                onClick={async () => {
                  if (!assignUser) return;
                  setSaving(true);
                  try {
                    await platformAssignUser(assignUser.UserId, {
                      CompanyId: Number(companyId),
                      BranchId: branchId ? Number(branchId) : undefined,
                      RoleId: Number(roleId),
                    });
                    if (assignMode === 'APPROVE') await platformApproveUser(assignUser.UserId);
                    setAssignOpen(false);
                    toast({ title: assignMode === 'APPROVE' ? 'อนุมัติการสมัครสำเร็จ' : 'แก้ไขข้อมูลสิทธิ์สำเร็จ' });
                    await load();
                  } catch (e: any) {
                    toast({ variant: 'destructive', title: 'ดำเนินการไม่สำเร็จ', description: e.message });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'กำลังประมวลผล...' : (assignMode === 'APPROVE' ? 'บันทึกและอนุมัติทันที' : 'บันทึกการเปลี่ยนแปลง')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <AlertDialogContent className="max-w-[400px] rounded-3xl border-none shadow-premium">
            <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center p-4">
              <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 border border-rose-100 animate-in zoom-in">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-slate-800">ปฏิเสธการสมัครสมาชิก?</AlertDialogTitle>
              <AlertDialogDescription className="text-center pt-2 text-slate-500 text-base">
                คุณกำลังจะปฏิเสธคำขอสมัครของ <span className="font-bold text-slate-900">{userToReject?.UserName}</span><br />
                การกระทำนี้จะส่งผลให้ผู้ใช้งานไม่สามารถเข้าถึงระบบได้จนกว่าจะได้รับการอนุมัติใหม่
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-3 p-4">
              <AlertDialogCancel className="w-full sm:w-auto rounded-xl h-12 px-6 border-slate-200">ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReject} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-rose-500/20">
                ยืนยันปฏิเสธ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PlatformLayout>
  );
}
