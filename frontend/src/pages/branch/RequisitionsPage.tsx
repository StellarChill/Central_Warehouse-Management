import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { approveRequisition, getRequisitions, rejectRequisition, shipRequisition, type WithdrawnRequest } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";

type Row = {
  id: number;
  code: string;
  branchId: number;
  requestedBy?: number | null;
  status: string;
  date: string;
};

export default function RequisitionsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const { canApproveRequisition } = usePermissions();

  async function load() {
    setLoading(true);
    try {
      const data = await getRequisitions();
      const mapped: Row[] = data.map((r: WithdrawnRequest) => ({
        id: r.RequestId,
        code: r.WithdrawnRequestCode,
        branchId: r.BranchId,
        requestedBy: r.CreatedBy ?? null,
        status: r.WithdrawnRequestStatus,
        date: r.RequestDate,
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.code, String(r.branchId), String(r.requestedBy ?? "")].some((v) => v.toLowerCase().includes(s)));
  }, [q, rows]);

  async function onApprove(id: number) {
    await approveRequisition(id);
    await load();
  }
  async function onReject(id: number) {
    await rejectRequisition(id);
    await load();
  }
  async function onShip(id: number) {
    await shipRequisition(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Requisitions</span>
            <div className="relative">
              <Input
                className="pl-3 w-80"
                placeholder="Search by code/branch/user"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{r.code}</TableCell>
                  <TableCell>{r.branchId}</TableCell>
                  <TableCell>{r.requestedBy ?? '-'}</TableCell>
                  <TableCell>
                    {(() => {
                      const status = r.status?.toUpperCase?.() || '';
                      const cls =
                        status === 'SHIPPED' || status === 'COMPLETED'
                          ? "bg-success/10 text-success border-success/20"
                          : status === 'REJECTED'
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : status === 'APPROVED' || status === 'PREPARING'
                          ? "bg-info/10 text-info border-info/20"
                          : "bg-warning/10 text-warning-foreground border-warning/20";
                      return (
                        <Badge variant="outline" className={cls}>
                          {status || 'REQUESTED'}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{new Date(r.date).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {canApproveRequisition && r.status === 'REQUESTED' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onApprove(r.id)}>Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => onReject(r.id)} className="text-destructive hover:bg-destructive/10">Reject</Button>
                        </>
                      )}
                      {canApproveRequisition && (r.status === 'APPROVED' || r.status === 'PREPARING') && (
                        <Button size="sm" onClick={() => onShip(r.id)}>Ship</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

