import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Search, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";

type Role = "ADMIN" | "CENTER" | "BRANCH";
type RemoteUser = {
  UserId: string;
  UserName: string;
  RoleId: number;
  BranchId?: number | null;
  BranchName?: string | null;
  Company?: string | null;
  Email?: string | null;
  LineId?: string | null;
  status?: string | null;
  CreatedAt?: string | null;
};

type User = { id: string; name: string; branch: string; role: Role; status: "PENDING" | "ACTIVE"; lineId?: string | null; createdAt?: string | null };

const branches = [
  { id: "1", name: "สาขากลาง (Center A)" },
  { id: "2", name: "สาขา B" },
  { id: "3", name: "สาขา C" },
];

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<{ name: string; branch: string; role: Role; status: "PENDING" | "ACTIVE"; userId?: string; company?: string }>(
    { name: "", branch: "ศูนย์", role: "BRANCH", status: "PENDING" }
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch pending users from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // fetch all users and split by status so admin can view both pending and approved
        const data: RemoteUser[] = await apiGet('/admin/users');
        const mapped: User[] = data.map((u) => ({
          id: String(u.UserId),
          name: u.UserName,
          branch: u.BranchName || (u.BranchId ? `สาขา ${u.BranchId}` : "-"),
          lineId: u.LineId || null,
          createdAt: u.CreatedAt || null,
          role: u.RoleId === 1 ? "ADMIN" : u.RoleId === 2 ? "CENTER" : "BRANCH",
          status: (u.status as any) === "ACTIVE" ? "ACTIVE" : "PENDING",
        }));
        setPendingUsers(mapped.filter((m) => m.status === 'PENDING'));
        setApprovedUsers(mapped.filter((m) => m.status === 'ACTIVE'));
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPending = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return pendingUsers;
    return pendingUsers.filter((u) => [u.id, u.name, u.branch, u.role, u.lineId].some((v) => String(v || '').toLowerCase().includes(s)));
  }, [q, pendingUsers]);

  const filteredApproved = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return approvedUsers;
    return approvedUsers.filter((u) => [u.id, u.name, u.branch, u.role, u.lineId].some((v) => String(v || '').toLowerCase().includes(s)));
  }, [q, approvedUsers]);

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, branch: u.branch, role: u.role, status: u.status, userId: u.id, company: "" });
    setOpen(true);
  };

  const approveUser = async () => {
    if (!form.userId) return;
    setActionLoading(true);
    try {
      // Call backend to approve and assign branch/company
      const body: any = {
        BranchId: Number(form.branch) || 0,
        BranchName: isNaN(Number(form.branch)) ? form.branch : undefined,
        Company: form.company || undefined,
        status: "ACTIVE",
      };
      const result = await apiPost(`/admin/users/${form.userId}/approve`, body);

      // result is updated user mapped from backend; convert to frontend User
      const updated: User = {
        id: String(result.UserId),
        name: result.UserName,
        branch: result.BranchName || (result.BranchId ? `สาขา ${result.BranchId}` : "-"),
        role: result.RoleId === 1 ? "ADMIN" : result.RoleId === 2 ? "CENTER" : "BRANCH",
        status: (result.status as any) === "ACTIVE" ? "ACTIVE" : "PENDING",
        lineId: result.LineId || null,
        createdAt: result.CreatedAt || null,
      };

      // remove from pending and add to approved
      setPendingUsers((prev) => prev.filter((p) => p.id !== form.userId));
      setApprovedUsers((prev) => [updated, ...prev]);
      setOpen(false);
    } catch (err: any) {
      alert(err?.message || "อนุมัติไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("ยืนยันการลบผู้ใช้?")) return;
    try {
      await apiDelete(`/admin/users/${id}`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setApprovedUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
          <p className="text-muted-foreground mt-1">รายการผู้ใช้ที่รอการอนุมัติ</p>
        </div>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => { setOpen(true); setEditing(null); }}><Plus className="h-4 w-4" /> เพิ่มผู้ใช้</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายชื่อผู้ใช้ (รออนุมัติ)</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 w-80" placeholder="ค้นหา ชื่อ/สาขา/บทบาท" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ</TableHead>
                    <TableHead>LineId</TableHead>
                  <TableHead>สาขา</TableHead>
                  <TableHead>สิทธิ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สมัคร</TableHead>
                  <TableHead className="text-center">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell className="break-all text-sm">{u.lineId || '-'}</TableCell>
                    <TableCell>{u.branch}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.status === "ACTIVE" ? "ใช้งาน" : "รออนุมัติ"}</TableCell>
                    <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {u.status !== "ACTIVE" && (
                          <Button size="sm" variant="outline" onClick={() => startEdit(u)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                            <ShieldCheck className="h-4 w-4 mr-1" /> อนุมัติ
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => startEdit(u)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "อนุมัติ/แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ (เดโม)"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ชื่อ</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>บริษัท</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label>สาขา (ใส่ id หรือพิมพ์ชื่อ)</Label>
              <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            </div>
            <div>
              <Label>สิทธิ์</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={approveUser} disabled={actionLoading}>{actionLoading ? 'กำลังประมวลผล...' : 'อนุมัติผู้ใช้'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


