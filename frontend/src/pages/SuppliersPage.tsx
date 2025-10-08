import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Users } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "SUP-001", name: "บริษัท ซัพพลาย จำกัด", contact: "คุณดวงใจ", phone: "081-234-5678", email: "contact@supply.co.th", status: "ACTIVE" },
    { id: "SUP-002", name: "บริษัท โกลบอล เทรด", contact: "คุณธันยา", phone: "082-345-6789", email: "sales@globaltrade.co.th", status: "ACTIVE" },
    { id: "SUP-003", name: "หจก. คุณภาพดี", contact: "คุณปรีชา", phone: "083-456-7890", email: "info@quality.co.th", status: "INACTIVE" },
  ]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>({ name: "", contact: "", phone: "", email: "", status: "ACTIVE" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => [s.id, s.name, s.contact, s.phone, s.email].some((v) => v.toLowerCase().includes(q)));
  }, [suppliers, query]);

  const resetForm = () => setForm({ name: "", contact: "", phone: "", email: "", status: "ACTIVE" });

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const startEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, status: s.status });
    setOpen(true);
  };

  const save = () => {
    if (editing) {
      setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...editing, ...form } : s)));
    } else {
      const nextId = `SUP-${(suppliers.length + 1).toString().padStart(3, "0")}`;
      setSuppliers((prev) => [...prev, { id: nextId, ...form }]);
    }
    setOpen(false);
    setEditing(null);
    resetForm();
  };

  const remove = (id: string) => {
    if (!confirm("ยืนยันการลบผู้จำหน่ายนี้?")) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ผู้จำหน่ายวัตถุดิบ</h1>
          <p className="text-muted-foreground mt-1">เพิ่ม/แก้ไข/ลบ รายชื่อร้านค้าวัตถุดิบที่เราซื้อประจำ </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={startCreate}>
          <Plus className="h-4 w-4" /> เพิ่มผู้จำหน่าย
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ผู้จำหน่ายทั้งหมด</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{suppliers.length}</p>
            </div>
            <Users className="h-6 w-6 sm:h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>รายชื่อผู้จำหน่ายวัตถุดิบ</span>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 w-full" placeholder="ค้นหา ชื่อ/ติดต่อ/โทร/email" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">รหัส</TableHead>
                  <TableHead className="whitespace-nowrap">ชื่อร้าน</TableHead>
                  <TableHead className="whitespace-nowrap">ผู้ติดต่อ</TableHead>
                  <TableHead className="whitespace-nowrap">โทรศัพท์</TableHead>
                  <TableHead className="whitespace-nowrap">อีเมล</TableHead>
                  <TableHead className="whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="text-center whitespace-nowrap">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">{s.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.contact}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.phone}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.email}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status === "ACTIVE" ? "ใช้งาน" : "ปิดใช้งาน"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto hover:bg-accent" onClick={() => startEdit(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</div>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขผู้จำหน่าย" : "เพิ่มผู้จำหน่าย"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">ชื่อร้าน</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="contact">ผู้ติดต่อ</Label>
              <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">โทรศัพท์</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="status">สถานะ</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant={form.status === "ACTIVE" ? "default" : "outline"} onClick={() => setForm({ ...form, status: "ACTIVE" })}>
                  ใช้งาน
                </Button>
                <Button variant={form.status === "INACTIVE" ? "default" : "outline"} onClick={() => setForm({ ...form, status: "INACTIVE" })}>
                  ปิดใช้งาน
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="w-full sm:w-auto" onClick={save}>{editing ? "บันทึก" : "เพิ่ม"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}