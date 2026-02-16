import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { adminGetUsers, adminApproveUser, adminUpdateUser, adminDeleteUser, AdminUser } from "@/lib/api";
import { Search, Plus, Edit, Trash2, ShieldCheck, UserCheck, Users, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";

type Role = "ADMIN" | "CENTER" | "BRANCH";

type User = { id: string; name: string; branch: string; role: Role; status: "PENDING" | "ACTIVE"; lineId?: string | null; createdAt?: string | null };

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState<{ name: string; branch: string; role: Role; status: "PENDING" | "ACTIVE"; userId?: string; company?: string }>(
    { name: "", branch: "ศูนย์", role: "BRANCH", status: "PENDING" }
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch pending users from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data: AdminUser[] = await adminGetUsers();
        const mapped: User[] = data.map((u) => ({
          id: String(u.UserId),
          name: u.UserName,
          branch: u.BranchName || (u.BranchId ? `สาขา ${u.BranchId}` : "-"),
          lineId: u.LineId || null,
          createdAt: u.CreatedAt || null,
          role: u.RoleId === 1 ? "ADMIN" : u.RoleId === 2 ? "CENTER" : "BRANCH",
          status: u.UserStatusActive === "ACTIVE" ? "ACTIVE" : "PENDING",
        }));
        setPendingUsers(mapped.filter((m) => m.status === 'PENDING'));
        setApprovedUsers(mapped.filter((m) => m.status === 'ACTIVE'));
      } catch (err) {
        toast({ variant: "destructive", title: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้" });
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
      const result = await adminApproveUser(Number(form.userId), {
        BranchId: Number(form.branch) || undefined,
        BranchName: isNaN(Number(form.branch)) ? form.branch : undefined,
        UserStatusActive: "ACTIVE",
      });

      const updated: User = {
        id: String(result.UserId),
        name: result.UserName,
        branch: result.BranchName || (result.BranchId ? `สาขา ${result.BranchId}` : "-"),
        role: result.RoleId === 1 ? "ADMIN" : result.RoleId === 2 ? "CENTER" : "BRANCH",
        status: result.UserStatusActive === "ACTIVE" ? "ACTIVE" : "PENDING",
        lineId: result.LineId || null,
        createdAt: result.CreatedAt || null,
      };

      setPendingUsers((prev) => prev.filter((p) => p.id !== form.userId));
      setApprovedUsers((prev) => [updated, ...prev]);
      toast({ title: "อนุมัติผู้ใช้สำเร็จ" });
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "ล้มเหลว", description: err?.message || "อนุมัติไม่สำเร็จ" });
    } finally {
      setActionLoading(false);
    }
  };

  const initiateDelete = (u: User) => {
    setUserToDelete(u);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminDeleteUser(Number(userToDelete.id));
      setPendingUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setApprovedUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast({ title: "ลบผู้ใช้สำเร็จ" });
    } catch (err) {
      toast({ variant: "destructive", title: "ไม่สามารถลบผู้ใช้ได้" });
    } finally {
      setDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">จัดการผู้ใช้</h1>
          <p className="text-slate-500">ตรวจสอบและอนุมัติการเข้าถึงระบบสำหรับบุคลากร</p>
        </div>
        <Button className="gap-2 h-12 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20 transform transition-all active:scale-95" onClick={() => { setOpen(true); setEditing(null); }}>
          <Plus className="h-5 w-5" /> เพิ่มผู้ใช้ใหม่
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">ทั้งหมด</p><h3 className="text-2xl font-black mt-1 text-slate-800">{pendingUsers.length + approvedUsers.length}</h3></div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100"><Users className="h-5 w-5 text-slate-400" /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-amber-500">รออนุมัติ</p><h3 className="text-2xl font-black mt-1 text-amber-600">{pendingUsers.length}</h3></div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-premium bg-white/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-500">ใช้งานอยู่</p><h3 className="text-2xl font-black mt-1 text-emerald-600">{approvedUsers.length}</h3></div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-800">รายชื่อผู้ใช้ที่รอดำเนินการ</CardTitle>
              <CardDescription>ตรวจสอบความถูกต้องก่อนกดอนุมัติ</CardDescription>
            </div>
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <Input className="h-11 pl-10 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-amber-500/20" placeholder="ค้นหา ชื่อ/สาขา/บทบาท..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {loading ? (
            <div className="py-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-500 mb-2"></div><p className="text-slate-500">กำลังโหลดข้อมูล...</p></div>
          ) : (
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold text-slate-700">ชื่อ</TableHead>
                    <TableHead className="font-bold text-slate-700">สาขา</TableHead>
                    <TableHead className="font-bold text-slate-700">สิทธิ์</TableHead>
                    <TableHead className="font-bold text-slate-700">สถานะ</TableHead>
                    <TableHead className="font-bold text-slate-700">วันที่สมัคร</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">ไม่มีข้อมูลผู้ใช้ที่รออนุมัติ</TableCell></TableRow>
                  ) : filteredPending.map((u) => (
                    <TableRow key={u.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <TableCell className="font-bold text-slate-800">{u.name}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-600 font-bold rounded-lg">{u.branch}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className="bg-amber-100/50 text-amber-700 border-none font-bold uppercase text-[10px] tracking-wider">{u.role}</Badge></TableCell>
                      <TableCell><Badge className="bg-amber-50 text-amber-600 border-amber-100 shadow-none font-bold">รออนุมัติ</Badge></TableCell>
                      <TableCell className="text-xs text-slate-400 font-medium">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(u)} className="h-9 w-9 rounded-xl text-emerald-600 hover:bg-emerald-50"><ShieldCheck className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(u)} className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => initiateDelete(u)} className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">ผู้ใช้ที่อนุมัติแล้ว</CardTitle>
          <CardDescription>รายการบุคลากรผู้ที่มีสิทธิ์เข้าใช้งานระบบตามปกติ</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-700">ชื่อ</TableHead>
                  <TableHead className="font-bold text-slate-700">สาขา</TableHead>
                  <TableHead className="font-bold text-slate-700">สิทธิ์</TableHead>
                  <TableHead className="font-bold text-slate-700">สถานะ</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApproved.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">ยังไม่มีผู้ใช้งานที่อนุมัติแล้ว</TableCell></TableRow>
                ) : filteredApproved.map((u) => (
                  <TableRow key={u.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-bold text-slate-800">{u.name}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-500 font-bold rounded-lg">{u.branch}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-bold uppercase text-[10px] tracking-wider">{u.role}</Badge></TableCell>
                    <TableCell><Badge className="bg-emerald-500 text-white border-none shadow-sm font-bold">ใช้งานปกติ</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(u)} className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => initiateDelete(u)} className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] border-none shadow-premium p-0 overflow-hidden">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">{editing ? "อนุมัติและกำหนดบทบาทผู้ใช้" : "เพิ่มผู้ใช้ใหม่ลงในระบบ"}</DialogTitle>
              <p className="text-slate-500 text-sm">ระบุข้อมูลพื้นที่จัดเก็บและสิทธิ์การเข้าถึงให้ถูกต้อง</p>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">ชื่อผู้ใช้งาน</Label>
                <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">บริษัท (สังกัด)</Label>
                <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">รหัสสาขา / ชื่อสาขา</Label>
                <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">ระดับสิทธิ์ (Role)</Label>
                <select className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all cursor-pointer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="BRANCH">BRANCH USER</option>
                  <option value="CENTER">CENTER ADMIN</option>
                  <option value="ADMIN">PLATFORM ADMIN</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="rounded-xl h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20" onClick={approveUser} disabled={actionLoading}>{actionLoading ? 'กำลังประมวลผล...' : editing ? 'บันทึกและอนุมัติ' : 'สร้างผู้ใช้'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-3xl border-none shadow-premium p-0 overflow-hidden">
          <div className="p-8 space-y-6 text-center">
            <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="h-10 w-10 text-rose-600" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-bold text-slate-800">ยืนยันการลบผู้ใช้?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-base">
                คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-bold text-slate-900">{userToDelete?.name}</span>? ข้อมูลนี้จะไม่สามารถย้อนคืนได้
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 sm:justify-center gap-3">
            <AlertDialogCancel className="w-full sm:w-auto h-12 rounded-xl px-6">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto h-12 rounded-xl px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold">ยืนยันการลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


