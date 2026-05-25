import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  type Category 
} from "@/lib/api";

export default function CategoriesManagePage() {
  const { canEditProducts, isBranch } = usePermissions();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [form, setForm] = useState({ CatagoryName: "", CatagoryCode: "" });
  const [formErrors, setFormErrors] = useState({ CatagoryName: "", CatagoryCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const errors = { CatagoryName: "", CatagoryCode: "" };
    let valid = true;

    if (!form.CatagoryName.trim()) {
      errors.CatagoryName = "กรุณากรอกชื่อหมวดหมู่";
      valid = false;
    }
    if (!form.CatagoryCode.trim()) {
      errors.CatagoryCode = "กรุณากรอกรหัสหมวดหมู่";
      valid = false;
    } else if (!/^[A-Z0-9-]+$/.test(form.CatagoryCode)) {
      errors.CatagoryCode = "รหัสต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข หรือ - เท่านั้น";
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  }

  function parseErrorMessage(err: any, context: 'create' | 'edit' | 'delete'): string {
    const msg = (err?.message || '').toLowerCase();

    // Duplicate code
    if (msg.includes('already exists') || msg.includes('unique') || msg.includes('409')) {
      return 'รหัสหมวดหมู่นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น';
    }
    // Foreign key / has materials
    if (msg.includes('has_materials') || msg.includes('material') || msg.includes('foreign') || msg.includes('referenced')) {
      return 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีวัตถุดิบที่อยู่ในหมวดหมู่นี้ กรุณาย้ายหรือลบวัตถุดิบก่อน';
    }
    // Not found
    if (msg.includes('not found') || msg.includes('404')) {
      return 'ไม่พบหมวดหมู่นี้ในระบบ อาจถูกลบไปแล้ว';
    }
    // Auth errors
    if (msg.includes('401') || msg.includes('unauthorized')) {
      return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
    }
    if (msg.includes('403') || msg.includes('forbidden')) {
      return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
    }
    // Network error
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('ernet')) {
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    // Server error
    if (msg.includes('500') || msg.includes('internal')) {
      return 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
    }

    // Fallback
    const contextLabel = context === 'create' ? 'สร้าง' : context === 'edit' ? 'แก้ไข' : 'ลบ';
    return err?.message || `ไม่สามารถ${contextLabel}หมวดหมู่ได้ กรุณาลองใหม่`;
  }

  async function handleCreate() {
    if (!validateForm()) return;

    setSubmitting(true);
    setCreateError(null);
    try {
      await createCategory({
        CatagoryName: form.CatagoryName.trim(),
        CatagoryCode: form.CatagoryCode.trim().toUpperCase(),
      });
      await loadCategories();
      setOpenCreate(false);
      setForm({ CatagoryName: "", CatagoryCode: "" });
      setFormErrors({ CatagoryName: "", CatagoryCode: "" });
      setCreateError(null);
    } catch (err: any) {
      const errorMsg = parseErrorMessage(err, 'create');
      // If it's a duplicate code error, show it under the code field
      if (errorMsg.includes('รหัส')) {
        setFormErrors({
          ...formErrors,
          CatagoryCode: errorMsg,
        });
      } else {
        setCreateError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selectedCategory || !validateForm()) return;

    setSubmitting(true);
    setEditError(null);
    try {
      await updateCategory(selectedCategory.CatagoryId, {
        CatagoryName: form.CatagoryName.trim(),
        CatagoryCode: form.CatagoryCode.trim().toUpperCase(),
      });
      await loadCategories();
      setOpenEdit(false);
      setSelectedCategory(null);
      setForm({ CatagoryName: "", CatagoryCode: "" });
      setFormErrors({ CatagoryName: "", CatagoryCode: "" });
      setEditError(null);
    } catch (err: any) {
      const errorMsg = parseErrorMessage(err, 'edit');
      if (errorMsg.includes('รหัส')) {
        setFormErrors({
          ...formErrors,
          CatagoryCode: errorMsg,
        });
      } else {
        setEditError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return;

    setSubmitting(true);
    setDeleteError(null);
    try {
      await deleteCategory(selectedCategory.CatagoryId);
      await loadCategories();
      setOpenDelete(false);
      setSelectedCategory(null);
      setDeleteError(null);
    } catch (err: any) {
      setDeleteError(parseErrorMessage(err, 'delete'));
    } finally {
      setSubmitting(false);
    }
  }

  function startCreate() {
    setForm({ CatagoryName: "", CatagoryCode: "" });
    setFormErrors({ CatagoryName: "", CatagoryCode: "" });
    setCreateError(null);
    setOpenCreate(true);
  }

  function startEdit(cat: Category) {
    setSelectedCategory(cat);
    setForm({
      CatagoryName: cat.CatagoryName,
      CatagoryCode: cat.CatagoryCode,
    });
    setFormErrors({ CatagoryName: "", CatagoryCode: "" });
    setEditError(null);
    setOpenEdit(true);
  }

  function startDelete(cat: Category) {
    setSelectedCategory(cat);
    setDeleteError(null);
    setOpenDelete(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการหมวดหมู่วัตถุดิบ</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข หรือลบหมวดหมู่วัตถุดิบ</p>
        </div>
      </div>

      {isBranch && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            คุณสามารถดูข้อมูลได้เท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบได้
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              หมวดหมู่ทั้งหมด
              <Badge variant="secondary">{categories.length}</Badge>
            </CardTitle>
            
            {canEditProducts && (
              <Button onClick={startCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มหมวดหมู่
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">ยังไม่มีหมวดหมู่</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Card key={cat.CatagoryId} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cat.CatagoryName}</h3>
                          <p className="text-sm text-muted-foreground">{cat.CatagoryCode}</p>
                        </div>
                      </div>
                      
                      {canEditProducts && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(cat)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startDelete(cat)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      แก้ไขล่าสุด: {new Date(cat.UpdatedAt).toLocaleDateString('th-TH')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={(open) => { setOpenCreate(open); if (!open) setCreateError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
          </DialogHeader>
          
          {createError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อหมวดหมู่ <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.CatagoryName}
                onChange={(e) => setForm({ ...form, CatagoryName: e.target.value })}
                placeholder="เช่น แป้ง, น้ำตาล, เนย"
              />
              {formErrors.CatagoryName && (
                <p className="text-xs text-destructive mt-1">{formErrors.CatagoryName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">รหัสหมวดหมู่ <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                value={form.CatagoryCode}
                onChange={(e) => setForm({ ...form, CatagoryCode: e.target.value.toUpperCase() })}
                placeholder="เช่น FLOUR, SUGAR, BUTTER"
              />
              {formErrors.CatagoryCode && (
                <p className="text-xs text-destructive mt-1">{formErrors.CatagoryCode}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={(open) => { setOpenEdit(open); if (!open) setEditError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
          </DialogHeader>
          
          {editError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">ชื่อหมวดหมู่ <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                value={form.CatagoryName}
                onChange={(e) => setForm({ ...form, CatagoryName: e.target.value })}
              />
              {formErrors.CatagoryName && (
                <p className="text-xs text-destructive mt-1">{formErrors.CatagoryName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-code">รหัสหมวดหมู่ <span className="text-destructive">*</span></Label>
              <Input
                id="edit-code"
                value={form.CatagoryCode}
                onChange={(e) => setForm({ ...form, CatagoryCode: e.target.value.toUpperCase() })}
              />
              {formErrors.CatagoryCode && (
                <p className="text-xs text-destructive mt-1">{formErrors.CatagoryCode}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDelete} onOpenChange={(open) => { setOpenDelete(open); if (!open) setDeleteError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <p>คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <strong>{selectedCategory?.CatagoryName}</strong>?</p>
          <p className="text-sm text-muted-foreground">การลบนี้ไม่สามารถย้อนกลับได้</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "กำลังลบ..." : "ลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

