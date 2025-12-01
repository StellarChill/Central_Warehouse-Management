import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { platformListUsers, platformApproveUser, platformRejectUser, platformSetUserActive, type PlatformSignupUser, getRoles, getBranches, platformAssignUser, apiGet } from '@/lib/api';
import { Check, X, Ban, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { PlatformLayout } from '@/components/layout/PlatformLayout';

type TabStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function PlatformApprovalsPage() {
  const [status, setStatus] = useState<TabStatus>('PENDING');
  const [rows, setRows] = useState<PlatformSignupUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<PlatformSignupUser | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [saving, setSaving] = useState(false);

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

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Approvals & Users</CardTitle>
        </CardHeader>
        <CardContent>
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
                  {rows.map((u) => {
                    const isPending = u.UserStatusApprove === 'PENDING';
                    const isApproved = u.UserStatusApprove === 'APPROVED';
                    return (
                    <div key={u.UserId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.UserName}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {u.Email || '—'} • {u.TelNumber || '—'} • {u.RequestedRoleText || 'No requested role'}
                        </div>
                        <div className="text-xs text-muted-foreground">Company: {resolveCompanyName(u)}</div>
                        {u.TempCompany && (
                          <div className="text-xs text-muted-foreground truncate">
                            Temp Company: {u.TempCompany.TempCompanyName} ({u.TempCompany.TempCompanyCode})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={u.UserStatusActive === 'ACTIVE' ? 'success' as any : 'secondary'}>
                          {u.UserStatusActive}
                        </Badge>
                        {isPending && (
                          <>
                            <Button size="sm" onClick={async () => {
                              await platformApproveUser(u.UserId);
                              await load(status);
                            }}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              await platformRejectUser(u.UserId);
                              await load(status);
                            }}>
                              <X className="h-4 w-4 mr-1" /> Reject
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
                              <Ban className="h-4 w-4 mr-1" /> {u.UserStatusActive === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                            </Button>
                            <Button size="sm" onClick={() => { setAssignUser(u); setAssignOpen(true); }}>
                              <UserCog className="h-4 w-4 mr-1" /> Assign
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );})}
                  {rows.length === 0 && (
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
            <DialogTitle>Assign Company / Branch / Role</DialogTitle>
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
            <Button disabled={saving || !assignUser || !companyId || !branchId || !roleId} onClick={async () => {
              if (!assignUser) return;
              setSaving(true);
              try {
                await platformAssignUser(assignUser.UserId, {
                  CompanyId: Number(companyId),
                  BranchId: Number(branchId),
                  RoleId: Number(roleId),
                });
                setAssignOpen(false);
                setCompanyId(''); setBranchId(''); setRoleId('');
                await load(status);
              } catch (e: any) {
                alert(e?.message || 'Failed to assign');
              } finally {
                setSaving(false);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PlatformLayout>
  );
}
