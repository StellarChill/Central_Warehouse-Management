import { useEffect, useState, useMemo } from 'react';
import { apiGet, apiPut, platformListUsers, platformRejectUser, platformSetUserActive, platformAssignUser, platformApproveUser, type PlatformSignupUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Search, UserCheck, Shield, ChevronLeft, ChevronRight, SlidersHorizontal, UserPlus, Users, Building2, ClipboardCheck, ShieldX, ShieldBan, HardHat } from 'lucide-react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type TabStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function PlatformApprovalsPage() {
  const [rows, setRows] = useState<PlatformSignupUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setCompanies(co);
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
      return matchesSearch && matchesCompany && matchesRole;
    });

    return result.sort((a, b) => {
      switch (sortOrder) {
        case 'NAME_ASC': return (a.UserName || '').localeCompare(b.UserName || '');
        case 'NAME_DESC': return (b.UserName || '').localeCompare(a.UserName || '');
        case 'OLDEST': return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        case 'NEWEST': default: return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
      }
    });
  }, [rows, filterQuery, filterCompany, filterRole, sortOrder]);

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

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-6 bg-slate-50/50 min-h-screen">

        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Total Users</p><h3 className="text-2xl font-bold mt-1 text-slate-800">{stats.total}</h3></div>
              <div className="p-3 rounded-xl bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Approved</p><h3 className="text-2xl font-bold mt-1 text-slate-800">{stats.approved}</h3></div>
              <div className="p-3 rounded-xl bg-emerald-50"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm font-medium text-muted-foreground">Rejected</p><h3 className="text-2xl font-bold mt-1 text-slate-800">{stats.rejected}</h3></div>
              <div className="p-3 rounded-xl bg-rose-50"><X className="h-5 w-5 text-rose-600" /></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">User Approvals</CardTitle>
                <CardDescription>Review and manage user registration requests.</CardDescription>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col xl:flex-row gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 bg-white" placeholder="Search users..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={filterCompany} onValueChange={(v) => setFilterCompany(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="All Companies" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Companies</SelectItem>
                    {companies.map((c) => <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>{c.CompanyName}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={filterRole} onValueChange={(v) => setFilterRole(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="All Roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    {roles.map((r) => <SelectItem key={r.RoleId} value={String(r.RoleId)}>{r.RoleName}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="w-[160px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEWEST">Newest</SelectItem>
                    <SelectItem value="OLDEST">Oldest</SelectItem>
                    <SelectItem value="NAME_ASC">Name (A-Z)</SelectItem>
                    <SelectItem value="NAME_DESC">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" onClick={() => { setFilterQuery(''); setFilterCompany(''); setFilterRole(''); setSortOrder('NEWEST'); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={status} onValueChange={(v) => setStatus(v as TabStatus)}>
              <div className="border-b px-6">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-4">
                  <TabsTrigger value="PENDING" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Pending Approval</TabsTrigger>
                  <TabsTrigger value="APPROVED" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Approved Users</TabsTrigger>
                  <TabsTrigger value="REJECTED" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Rejected Users</TabsTrigger>
                  <TabsTrigger value="ALL" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">All Users</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={status} className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">{error}</div>
                ) : (
                  <div className="divide-y">
                    {paginatedRows.map((u) => {
                      const isPending = u.UserStatusApprove === 'PENDING';
                      const isApproved = u.UserStatusApprove === 'APPROVED';
                      return (
                        <div key={u.UserId} className="p-4 px-6 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-slate-800 truncate">{u.UserName}</div>
                              <Badge variant="outline" className="text-[10px] h-5">{u.UserStatusApprove}</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {resolveCompanyName(u)}</div>
                              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> {resolveRoleName(u)}</div>
                              <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {resolveBranchName(u)}</div>
                              <div>{u.Email || u.TelNumber}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={u.UserStatusActive === 'ACTIVE' ? 'success' as any : 'secondary'}>
                              {u.UserStatusActive}
                            </Badge>
                            {isPending && (
                              <>
                                <Button size="sm" onClick={() => {
                                  setAssignUser(u);
                                  setAssignMode('APPROVE');
                                  setAssignOpen(true);
                                  setCompanyId('');
                                  setBranchId('');
                                  setRoleId('');
                                }}>
                                  <ClipboardCheck className="h-4 w-4 mr-1" /> Assign & Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={async () => {
                                  if (!confirm('Are you sure you want to reject this user?')) return;
                                  await platformRejectUser(u.UserId);
                                  await load();
                                }}>
                                  <ShieldX className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {isApproved && (
                              <>
                                <Button size="sm" variant="outline" onClick={async () => {
                                  const next = u.UserStatusActive === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                  await platformSetUserActive(u.UserId, next);
                                  await load();
                                }}>
                                  <ShieldBan className="h-4 w-4 mr-1" /> {u.UserStatusActive === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                                </Button>
                                <Button size="sm" onClick={() => {
                                  setAssignUser(u);
                                  setAssignMode('ASSIGN');
                                  setAssignOpen(true);
                                  setCompanyId('');
                                  setBranchId('');
                                  setRoleId('');
                                }}>
                                  <HardHat className="h-4 w-4 mr-1" /> Re-Assign
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {paginatedRows.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground">
                        <p>No users found in this category.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {assignMode === 'APPROVE' ? 'Assign Role & Approve' : 'Assign Company / Branch / Role'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={(v) => setCompanyId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>{c.CompanyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.BranchId} value={String(b.BranchId)}>{b.BranchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => {
                      const code = String(r.RoleCode).toUpperCase();
                      const label = code === 'WAREHOUSE_ADMIN' ? 'Warehouse Manager'
                        : code === 'BRANCH_USER' ? 'Warehouse Staff'
                          : code === 'COMPANY_ADMIN' ? 'Company Admin'
                            : r.RoleName;
                      return (
                        <SelectItem key={r.RoleId} value={String(r.RoleId)}>{label}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button disabled={saving || !assignUser || !companyId || !roleId} onClick={async () => {
                if (!assignUser) return;
                setSaving(true);
                try {
                  await platformAssignUser(assignUser.UserId, {
                    CompanyId: Number(companyId),
                    BranchId: branchId ? Number(branchId) : undefined,
                    RoleId: Number(roleId),
                  });
                  // If we are approving, we also call approve API
                  if (assignMode === 'APPROVE') {
                    await platformApproveUser(assignUser.UserId);
                  }

                  setAssignOpen(false);
                  setCompanyId(''); setBranchId(''); setRoleId('');
                  await load();
                } catch (e: any) {
                  alert(e?.message || 'Failed to assign');
                } finally {
                  setSaving(false);
                }
              }}>{assignMode === 'APPROVE' ? 'Assign & Approve' : 'Save Assignment'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  );
}
