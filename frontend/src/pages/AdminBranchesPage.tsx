import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, Building2, AlertCircle, Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  getBranches, 
  createBranch, 
  updateBranch, 
  deleteBranch,
  type Branch 
} from "@/lib/api";

export default function AdminBranchesPage() {
  const { isAdmin } = usePermissions();
  
  const [q, setQ] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  
  const [form, setForm] = useState({ BranchName: "", BranchCode: "", BranchAddress: "" });
  const [formErrors, setFormErrors] = useState({ BranchName: "", BranchCode: "", BranchAddress: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    try {
      setLoading(true);
      setError(null);
      const data = await getBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return branches;
    return branches.filter((b) => 
      [b.BranchId.toString(), b.BranchName, b.BranchCode].some((v) => 
        v.toLowerCase().includes(s)
      )
    );
  }, [q, branches]);

  function validateForm() {
    const errors = { BranchName: "", BranchCode: "", BranchAddress: "" };
    let valid = true;

    if (!form.BranchName.trim()) {
      errors.BranchName = "กรุณากรอกชื่อสาขา";
      valid = false;
    }
    if (!form.BranchCode.trim()) {
      errors.BranchCode = "กรุณากรอกรหัสสาขา";
      valid = false;
    } else if (!/^[A-Z0-9-]+$/.test(form.BranchCode)) {
      errors.BranchCode = "รหัสต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข หรือ - เท่านั้น";
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  }

  function startCreate() {
    setEditing(null);
    setForm({ BranchName: "", BranchCode: "", BranchAddress: "" });
    setFormErrors({ BranchName: "", BranchCode: "", BranchAddress: "" });
    setOpen(true);
  }

  function startEdit(b: Branch) {
    setEditing(b);
    setForm({
      BranchName: b.BranchName,
      BranchCode: b.BranchCode,
      BranchAddress: b.BranchAddress || "",
    });
    setFormErrors({ BranchName: "", BranchCode: "", BranchAddress: "" });
    setOpen(true);
  }

  async function handleSave() {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editing) {
        await updateBranch(editing.BranchId, {
          BranchName: form.BranchName.trim(),
          BranchCode: form.BranchCode.trim().toUpperCase(),
          BranchAddress: form.BranchAddress.trim() || undefined,
        });
      } else {
        await createBranch({
          BranchName: form.BranchName.trim(),
          BranchCode: form.BranchCode.trim().toUpperCase(),
          BranchAddress: form.BranchAddress.trim() || undefined,
        });
      }
      await loadBranches();
      setOpen(false);
      setEditing(null);
      setForm({ BranchName: "", BranchCode: "", BranchAddress: "" });
      setFormErrors({ BranchName: "", BranchCode: "", BranchAddress: "" });
    } catch (err: any) {
      setFormErrors({
        ...formErrors,
        BranchCode: err.message.includes("already exists") 
          ? "รหัสนี้มีในระบบแล้ว" 
          : err.message
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startDelete(b: Branch) {
    setDeletingBranch(b);
    setOpenDelete(true);
  }

  async function handleDelete() {
    if (!deletingBranch) return;

    setSubmitting(true);
    try {
      await deleteBranch(deletingBranch.BranchId);
      await loadBranches();
      setOpenDelete(false);
      setDeletingBranch(null);
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบได้");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            จัดการสาขา
          </h1>
          <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือลบสาขาในระบบ</p>
        </div>
        {isAdmin && (
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={startCreate}>
            <Plus className="h-4 w-4" /> เพิ่มสาขา
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            คุณไม่มีสิทธิ์ในการจัดการสาขา (ต้องเป็น Admin เท่านั้น)
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายการสาขา ({branches.length})</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 w-80" 
                placeholder="ค้นหา รหัส/ชื่อสาขา" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">ยังไม่มีสาขาในระบบ</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ชื่อสาขา</TableHead>
                  <TableHead>รหัสสาขา</TableHead>
                  <TableHead>ที่อยู่</TableHead>
                  <TableHead>วันที่แก้ไข</TableHead>
                  {isAdmin && <TableHead className="text-center">การดำเนินการ</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.BranchId}>
                    <TableCell className="font-medium">#{b.BranchId}</TableCell>
                    <TableCell className="font-semibold">{b.BranchName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{b.BranchCode}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.BranchAddress || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(b.UpdatedAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startEdit(b)}
                            className="hover:bg-amber-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startDelete(b)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขสาขา" : "เพิ่มสาขาใหม่"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                ชื่อสาขา <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.BranchName}
                onChange={(e) => setForm({ ...form, BranchName: e.target.value })}
                placeholder="เช่น สาขาบางนา"
              />
              {formErrors.BranchName && (
                <p className="text-xs text-destructive mt-1">{formErrors.BranchName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">
                รหัสสาขา <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={form.BranchCode}
                onChange={(e) => setForm({ ...form, BranchCode: e.target.value.toUpperCase() })}
                placeholder="เช่น BANGNA, CENTER-A"
              />
              {formErrors.BranchCode && (
                <p className="text-xs text-destructive mt-1">{formErrors.BranchCode}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">ที่อยู่</Label>
              <Input
                id="address"
                value={form.BranchAddress}
                onChange={(e) => setForm({ ...form, BranchAddress: e.target.value })}
                placeholder="เช่น 123 ถนนบางนา กรุงเทพฯ"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังบันทึก...
                </>
              ) : (
                editing ? "บันทึก" : "เพิ่มสาขา"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบสาขา</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบสาขา:</p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold">{deletingBranch?.BranchName}</p>
              <p className="text-sm text-muted-foreground">
                รหัส: {deletingBranch?.BranchCode}
              </p>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                การลบนี้ไม่สามารถย้อนกลับได้ และอาจส่งผลต่อข้อมูลที่เกี่ยวข้อง
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังลบ...
                </>
              ) : (
                "ลบสาขา"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


