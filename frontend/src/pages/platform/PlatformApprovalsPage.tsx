import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { platformListUsers, platformApproveUser, platformRejectUser, platformSetUserActive, type PlatformSignupUser, getRoles, getBranches, platformAssignUser, apiGet } from '@/lib/api';
import { ClipboardCheck, ShieldX, ShieldBan, HardHat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Input } from '@/components/ui/input';

type TabStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function PlatformApprovalsPage() {
  const [status, setStatus] = useState<TabStatus>('PENDING');
  const [rows, setRows] = useState<PlatformSignupUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<PlatformSignupUser | null>(null);
  const [assignMode, setAssignMode] = useState<'ASSIGN' | 'APPROVE'>('ASSIGN');
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole, setFilterRole] = useState('');

  async function load(s: TabStatus) {
    try {
      setLoading(true);
      setError(null);
      if (s === 'ALL') {
        const buckets: Exclude<TabStatus, 'ALL'>[] = ['PENDING', 'APPROVED', 'REJECTED'];
        const results = await Promise.all(buckets.map((state) => platformListUsers(state)));
        setRows(results.flat());
      } else {
        const data = await platformListUsers(s);
        setRows(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(status); }, [status]);
  useEffect(() => {
    // Preload companies and roles for assignment form
    (async () => {
      try {
        const [co, rl] = await Promise.all([
          apiGet('/company'),
          getRoles(),
        ]);
        setCompanies(co);
        // Restrict role options to warehouse-access roles only
        const allow = new Set(['COMPANY_ADMIN', 'WAREHOUSE_ADMIN', 'BRANCH_USER']);
        const filtered = (rl || []).filter((r: any) => allow.has(String(r.RoleCode).toUpperCase()));
        setRoles(filtered);
      } catch {}
    })();
  }, []);

  // Load branches when company changes
  useEffect(() => {
    (async () => {
      if (!companyId) { setBranches([]); setBranchId(''); return; }
      try {
        const all = await getBranches();
        setBranches(all.filter((b: any) => String(b.CompanyId) === String(companyId)));
      } catch {}
    })();
  }, [companyId]);

  const resolveCompanyName = (u: PlatformSignupUser) => {
    const direct = (u as any).CompanyName || (u as any).Company?.CompanyName;
    if (direct) return direct;
    if (u.TempCompany) return u.TempCompany.TempCompanyName;
    return '—';
  };

  const resolveRoleName = (u: PlatformSignupUser) => {
    if (u.Role?.RoleName) return u.Role.RoleName;
    return '—';
  };

  const resolveBranchName = (u: PlatformSignupUser) => {
    if (u.Branch?.BranchName) return u.Branch.BranchName;
    return '—';
  };

  const filteredRows = useMemo(() => {
    return rows.filter((u) => {
      const search = filterQuery.trim().toLowerCase();
      const matchesSearch = !search || [u.UserName, u.Email, u.TelNumber, resolveCompanyName(u)]
        .some((field) => field?.toLowerCase().includes(search));
      const matchesCompany = !filterCompany || String(u.Company?.CompanyId ?? '') === filterCompany;
      const matchesRole = !filterRole || String(u.Role?.RoleId ?? '') === filterRole;
      return matchesSearch && matchesCompany && matchesRole;
    });
  }, [rows, filterQuery, filterCompany, filterRole]);

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Approvals & Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <div>
              <Label htmlFor="filter-search" className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
              <Input id="filter-search" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} placeholder="ชื่อผู้ใช้ / อีเมล / เบอร์" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Company</Label>
              <Select value={filterCompany} onValueChange={(v) => setFilterCompany(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All companies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All companies</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>{c.CompanyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
              <Select value={filterRole} onValueChange={(v) => setFilterRole(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.RoleId} value={String(r.RoleId)}>{r.RoleName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setFilterQuery(''); setFilterCompany(''); setFilterRole(''); }}>Clear Filters</Button>
            </div>
          </div>
          <Tabs value={status} onValueChange={(v) => setStatus(v as TabStatus)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value={status}>
              {loading ? (
                <div className="p-4">Loading...</div>
              ) : error ? (
                <div className="p-4 text-red-600">{error}</div>
              ) : (
                <div className="divide-y">
                  {filteredRows.map((u) => {
                    const isPending = u.UserStatusApprove === 'PENDING';
                    const isApproved = u.UserStatusApprove === 'APPROVED';
                    return (
                    <div key={u.UserId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.UserName}</div>
                      
                        <div className="text-xs text-muted-foreground">Company: {resolveCompanyName(u)}</div>
                        <div className="text-xs text-muted-foreground">Assigned Role: {resolveRoleName(u)}</div>
                        <div className="text-xs text-muted-foreground">Assigned Branch: {resolveBranchName(u)}</div>
                       
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
                              await platformRejectUser(u.UserId);
                              await load(status);
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
                              await load(status);
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
                              <HardHat className="h-4 w-4 mr-1" /> Assign
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );})}
                  {filteredRows.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No users in this state.</div>
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
              {assignMode === 'APPROVE' ? 'เลือกบริษัทและบทบาทก่อนอนุมัติ' : 'Assign Company / Branch / Role'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
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
                if (assignMode === 'APPROVE') {
                  await platformApproveUser(assignUser.UserId);
                }
                setAssignOpen(false);
                setCompanyId(''); setBranchId(''); setRoleId('');
                await load(status);
              } catch (e: any) {
                alert(e?.message || 'Failed to assign');
              } finally {
                setSaving(false);
              }
            }}>{assignMode === 'APPROVE' ? 'Assign & Approve' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PlatformLayout>
  );
}
