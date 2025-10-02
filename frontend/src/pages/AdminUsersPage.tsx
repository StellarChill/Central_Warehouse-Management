import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";

type Role = "ADMIN" | "CENTER" | "BRANCH";
type User = { id: string; name: string; branch: string; role: Role; status: "PENDING" | "ACTIVE" };

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>({ name: "", branch: "ศูนย์", role: "BRANCH", status: "PENDING" });
  const [users, setUsers] = useState<User[]>([
    { id: "U-001", name: "สมชาย ใจดี", branch: "ศูนย์ A", role: "CENTER", status: "ACTIVE" },
    { id: "U-002", name: "สุดา รักดี", branch: "สาขาบางนา", role: "BRANCH", status: "PENDING" },
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => [u.id, u.name, u.branch, u.role].some((v) => String(v).toLowerCase().includes(s)));
  }, [q, users]);

  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", branch: "ศูนย์", role: "BRANCH", status: "PENDING" });
    setOpen(true);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, branch: u.branch, role: u.role, status: u.status });
    setOpen(true);
  };

  const save = () => {
    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...editing, ...form } : u)));
    } else {
      const nextId = `U-${(users.length + 1).toString().padStart(3, "0")}`;
      setUsers((prev) => [...prev, { id: nextId, ...form }]);
    }
    setOpen(false);
    setEditing(null);
  };

  const approve = (id: string) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "ACTIVE" } : u)));
  const remove = (id: string) => {
    if (!confirm("ยืนยันการลบผู้ใช้?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
          <p className="text-muted-foreground mt-1">เพิ่ม/แก้ไข/ลบ และอนุมัติผู้ใช้ (เดโม่)</p>
        </div>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={startCreate}><Plus className="h-4 w-4" /> เพิ่มผู้ใช้</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายชื่อผู้ใช้</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 w-80" placeholder="ค้นหา ชื่อ/สาขา/บทบาท" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>สาขา</TableHead>
                <TableHead>สิทธิ์</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.branch}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status === "ACTIVE" ? "ใช้งาน" : "รออนุมัติ"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {u.status !== "ACTIVE" && (
                        <Button size="sm" variant="outline" onClick={() => approve(u.id)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
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
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ชื่อ</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>สาขา</Label>
              <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            </div>
            <div>
              <Label>สิทธิ์</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} />
            </div>
            <div>
              <Label>สถานะ</Label>
              <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as User["status"] })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={save}>{editing ? "บันทึก" : "เพิ่ม"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


