import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { platformListUsers, platformApproveUser, platformRejectUser, platformSetUserActive, type PlatformSignupUser } from '@/lib/api';
import { Check, X, Ban } from 'lucide-react';

export default function PlatformApprovalsPage() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rows, setRows] = useState<PlatformSignupUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(s: typeof status) {
    try {
      setLoading(true);
      setError(null);
      const data = await platformListUsers(s);
      setRows(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(status); }, [status]);

  return (
    <div className="px-6 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Approvals & Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
            <TabsList>
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
                  {rows.map((u) => (
                    <div key={u.UserId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.UserName}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {u.Email || '—'} • {u.TelNumber || '—'} • {u.RequestedRoleText || 'No requested role'}
                        </div>
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
                        {status === 'PENDING' && (
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
                        {status === 'APPROVED' && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const next = u.UserStatusActive === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                            await platformSetUserActive(u.UserId, next);
                            await load(status);
                          }}>
                            <Ban className="h-4 w-4 mr-1" /> {u.UserStatusActive === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {rows.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No users in this state.</div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
