import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, Building2 } from "lucide-react";

type Branch = { id: string; name: string; code: string; address?: string };

export default function AdminBranchesPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<Omit<Branch, "id">>({ name: "", code: "" });
  const [branches, setBranches] = useState<Branch[]>([
    { id: "B-001", name: "ศูนย์ A", code: "CENTER-A" },
    { id: "B-002", name: "สาขาบางนา", code: "BN" },
    { id: "B-003", name: "สาขาหาดใหญ่", code: "HY" },
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return branches;
    return branches.filter((b) => [b.id, b.name, b.code].some((v) => v.toLowerCase().includes(s)));
  }, [q, branches]);

  const startCreate = () => { setEditing(null); setForm({ name: "", code: "" }); setOpen(true); };
  const startEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, code: b.code, address: b.address }); setOpen(true); };

  const save = () => {
    if (editing) setBranches((prev) => prev.map((b) => (b.id === editing.id ? { ...editing, ...form } : b)));
    else {
      const nextId = `B-${(branches.length + 1).toString().padStart(3, "0")}`;
      setBranches((prev) => [...prev, { id: nextId, ...form }]);
    }
    setOpen(false); setEditing(null);
  };
  const remove = (id: string) => { if (!confirm("ยืนยันการลบสาขา?")) return; setBranches((prev) => prev.filter((b) => b.id !== id)); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการสาขา</h1>
          <p className="text-muted-foreground mt-1">เพิ่ม/แก้ไข/ลบ สาขา (เดโม่)</p>
        </div>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={startCreate}><Plus className="h-4 w-4" /> เพิ่มสาขา</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายการสาขา</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 w-80" placeholder="ค้นหา รหัส/ชื่อสาขา" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสาขา</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.code}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(b)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "แก้ไขสาขา" : "เพิ่มสาขา"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ชื่อสาขา</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>ที่อยู่ (optional)</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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


