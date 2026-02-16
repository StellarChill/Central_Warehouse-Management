import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Users, AlertTriangle } from "lucide-react";
import {
  getSuppliers as apiGetSuppliers,
  createSupplier as apiCreateSupplier,
  updateSupplier as apiUpdateSupplier,
  deleteSupplier as apiDeleteSupplier,
  Supplier as ApiSupplier
} from "@/lib/api";
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

type Supplier = ApiSupplier;

export default function SuppliersPage() {
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ SupplierName: "", SupplierCode: "", SupplierAddress: "", SupplierTelNumber: "" });

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const rows = await apiGetSuppliers();
      setSuppliers(rows);
    } catch (e: any) {
      toast({ variant: "destructive", title: "โหลดผู้จำหน่ายไม่สำเร็จ", description: e.message || "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => [
      s.SupplierCode,
      s.SupplierName,
      s.SupplierAddress || '',
      s.SupplierTelNumber || ''
    ].some((v) => v.toLowerCase().includes(q)));
  }, [suppliers, query]);

  const resetForm = () => setForm({ SupplierName: "", SupplierCode: "", SupplierAddress: "", SupplierTelNumber: "" });

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const startEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      SupplierName: s.SupplierName,
      SupplierCode: s.SupplierCode,
      SupplierAddress: s.SupplierAddress || "",
      SupplierTelNumber: s.SupplierTelNumber || "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await apiUpdateSupplier(editing.SupplierId, {
          SupplierName: form.SupplierName,
          SupplierCode: form.SupplierCode,
          SupplierAddress: form.SupplierAddress || undefined,
          SupplierTelNumber: form.SupplierTelNumber || undefined,
        });
        toast({ title: "บันทึกผู้จำหน่ายแล้ว" });
      } else {
        await apiCreateSupplier({
          SupplierName: form.SupplierName,
          SupplierCode: form.SupplierCode,
          SupplierAddress: form.SupplierAddress || undefined,
          SupplierTelNumber: form.SupplierTelNumber || undefined,
        });
        toast({ title: "เพิ่มผู้จำหน่ายแล้ว" });
      }
      setOpen(false);
      setEditing(null);
      resetForm();
      await loadSuppliers();
    } catch (e: any) {
      toast({ variant: "destructive", title: "บันทึกไม่สำเร็จ", description: e.message || "" });
    }
  };

  const initiateDelete = (id: number) => {
    setSupplierToDelete(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await apiDeleteSupplier(supplierToDelete);
      toast({ title: "ลบผู้จำหน่ายแล้ว" });
      await loadSuppliers();
    } catch (e: any) {
      toast({ variant: "destructive", title: "ลบไม่สำเร็จ", description: e.message || "" });
    } finally {
      setDeleteOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ผู้จำหน่ายวัตถุดิบ</h1>
          <p className="text-muted-foreground mt-1">เพิ่ม/แก้ไข/ลบ รายชื่อผู้จำหน่ายจากฐานข้อมูล</p>
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
                  <TableHead className="whitespace-nowrap">ชื่อผู้จำหน่าย</TableHead>
                  <TableHead className="whitespace-nowrap">ที่อยู่</TableHead>
                  <TableHead className="whitespace-nowrap">โทรศัพท์</TableHead>
                  <TableHead className="text-center whitespace-nowrap">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.SupplierId} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">{s.SupplierCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.SupplierName}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.SupplierAddress || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.SupplierTelNumber || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto hover:bg-accent" onClick={() => startEdit(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={() => initiateDelete(s.SupplierId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {loading && <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>}
          {!loading && filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</div>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขผู้จำหน่าย" : "เพิ่มผู้จำหน่าย"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">ชื่อผู้จำหน่าย</Label>
              <Input id="name" value={form.SupplierName} onChange={(e) => setForm({ ...form, SupplierName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="code">รหัส</Label>
              <Input id="code" value={form.SupplierCode} onChange={(e) => setForm({ ...form, SupplierCode: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address">ที่อยู่</Label>
              <Input id="address" value={form.SupplierAddress} onChange={(e) => setForm({ ...form, SupplierAddress: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="tel">โทรศัพท์</Label>
              <Input id="tel" value={form.SupplierTelNumber} onChange={(e) => setForm({ ...form, SupplierTelNumber: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button className="w-full sm:w-auto" onClick={save}>{editing ? "บันทึก" : "เพิ่ม"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl text-red-600">ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              คุณต้องการลบผู้จำหน่ายรายนี้ใช่หรือไม่? <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
              ลบผู้จำหน่าย
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}