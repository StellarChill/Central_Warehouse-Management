import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Edit, Trash2, Wheat, Egg, Milk, Filter, Candy, Apple, Droplets, Package, AlertCircle, AlertTriangle, LayoutGrid, ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getCategories,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  type Category,
  type Material
} from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
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

export default function ProductsPage() {
  const { canEditProducts, isBranch } = usePermissions();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  // โหลดหมวดหมู่จาก API
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // โหลด materials จาก API
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Dialog State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Form state
  const [form, setForm] = useState({
    MaterialName: "",
    MaterialCode: "",
    Unit: "กิโลกรัม",
    Price: 0,
    CatagoryId: 0
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoadingCategories(true);
      setLoadingMaterials(true);
      setError(null);

      const [categoriesData, materialsData] = await Promise.all([
        getCategories(),
        getMaterials()
      ]);

      setApiCategories(categoriesData);
      setMaterials(materialsData);

      // ตั้งค่า default category
      if (categoriesData.length > 0 && form.CatagoryId === 0) {
        setForm(prev => ({ ...prev, CatagoryId: categoriesData[0].CatagoryId }));
      }
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoadingCategories(false);
      setLoadingMaterials(false);
    }
  }

  // Get unique categories
  const categories = useMemo(() => {
    const materialCategories = materials
      .map(m => {
        const cat = apiCategories.find(c => c.CatagoryId === m.CatagoryId);
        return cat?.CatagoryName || "";
      })
      .filter(Boolean);
    const uniqueCats = [...new Set(materialCategories)];
    return ["all", ...uniqueCats];
  }, [materials, apiCategories]);

  // Get category name from ID
  function getCategoryName(categoryId: number): string {
    return apiCategories.find(c => c.CatagoryId === categoryId)?.CatagoryName || "ไม่ระบุ";
  }

  // Filter materials
  const filteredMaterials = useMemo(() => {
    const s = q.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesSearch = !s ||
        m.MaterialName.toLowerCase().includes(s) ||
        m.MaterialCode.toLowerCase().includes(s);

      const categoryName = getCategoryName(m.CatagoryId);
      const matchesCategory = categoryFilter === "all" || categoryName === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [q, materials, categoryFilter, apiCategories]);

  // Group materials by category
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, Material[]> = {};
    filteredMaterials.forEach((material) => {
      const categoryName = getCategoryName(material.CatagoryId);
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(material);
    });
    return groups;
  }, [filteredMaterials, apiCategories]);

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "แป้ง": return <Wheat className="h-5 w-5 text-primary" />;
      case "ไข่": return <Egg className="h-5 w-5 text-primary" />;
      case "นม": return <Milk className="h-5 w-5 text-primary" />;
      case "เนย": return <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary/30"></div>
      </div>;
      case "น้ำตาล": return <Candy className="h-5 w-5 text-primary" />;
      case "ช็อกโกแลต": return <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
        <div className="w-3 h-1 bg-primary-foreground rounded-full"></div>
      </div>;
      case "วัตถุเจือปน": return <Package className="h-5 w-5 text-gray-500" />;
      case "น้ำมัน": return <Droplets className="h-5 w-5 text-primary" />;
      case "ผลไม้": return <Apple className="h-5 w-5 text-primary" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  // Validate form
  function validateForm() {
    const errors: Record<string, string> = {};
    if (!form.MaterialName.trim()) errors.MaterialName = "กรุณากรอกชื่อวัตถุดิบ";
    if (!form.MaterialCode.trim()) errors.MaterialCode = "กรุณากรอกรหัสวัตถุดิบ";
    if (!form.Unit.trim()) errors.Unit = "กรุณากรอกหน่วย";
    if (form.Price <= 0) errors.Price = "ราคาต้องมากกว่า 0";
    if (form.CatagoryId === 0) errors.CatagoryId = "กรุณาเลือกหมวดหมู่";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Start create
  function startCreate() {
    setEditing(null);
    const defaultCategoryId = apiCategories.length > 0 ? apiCategories[0].CatagoryId : 0;
    setForm({
      MaterialName: "",
      MaterialCode: "",
      Unit: "กิโลกรัม",
      Price: 0,
      CatagoryId: defaultCategoryId
    });
    setFormErrors({});
    setOpen(true);
  }

  // Start edit
  function startEdit(m: Material) {
    setEditing(m);
    setForm({
      MaterialName: m.MaterialName,
      MaterialCode: m.MaterialCode,
      Unit: m.Unit,
      Price: m.Price,
      CatagoryId: m.CatagoryId
    });
    setFormErrors({});
    setOpen(true);
  }

  // Handle save (create or update)
  async function handleSave() {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editing) {
        // Update
        await updateMaterial(editing.MaterialId, form);
        toast({ title: "อัปเดตข้อมูลสำเร็จ" });
      } else {
        // Create
        await createMaterial(form);
        toast({ title: "เพิ่มวัตถุดิบใหม่สำเร็จ" });
      }
      await loadData();
      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      const errorMessage = err.message || "เกิดข้อผิดพลาด";
      if (errorMessage.includes("already exists")) {
        setFormErrors({ ...formErrors, MaterialCode: "รหัสนี้มีในระบบแล้ว" });
      } else {
        toast({ variant: "destructive", title: "ล้มเหลว", description: errorMessage });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Handle delete click
  const initiateDelete = (m: Material) => {
    setMaterialToDelete(m);
    setDeleteOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      await deleteMaterial(materialToDelete.MaterialId);
      toast({ title: "ลบวัตถุดิบเรียบร้อยแล้ว" });
      await loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ไม่สามารถลบได้", description: err.message });
    } finally {
      setDeleteOpen(false);
      setMaterialToDelete(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">วัตถุดิบคลังสินค้า</h1>
          <p className="text-slate-500">จัดการรายละเอียดวัตถุดิบและฐานข้อมูล SKU ทั้งหมดที่ใช้ในระบบ</p>
        </div>
        {canEditProducts && (
          <Button className="gap-2 h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transform transition-all active:scale-95" onClick={startCreate}>
            <Plus className="h-5 w-5" /> เพิ่มวัตถุดิบใหม่
          </Button>
        )}
      </div>

      {/* Permission Alert */}
      {isBranch && (
        <Alert className="rounded-2xl border-blue-100 bg-blue-50/50 text-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="font-medium">
            สิทธิ์ระดับสาขา: คุณสามารถเข้าชมข้อมูลได้เท่านั้น ไม่สามารถแก้ไขฐานข้อมูลกลางได้
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-premium bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl font-bold text-slate-800">ฐานข้อมูล SKU</CardTitle>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  className="h-11 pl-10 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-blue-500/20"
                  placeholder="ค้นหา SKU หรือชื่อวัตถุดิบ..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="relative group">
                <ListFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <select
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "ทุกหมวดหมู่" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-0">
          {loadingMaterials ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600 mb-4" />
              <p className="text-slate-500 font-medium">กำลังเตรียมข้อมูลวัตถุดิบ...</p>
            </div>
          ) : Object.keys(groupedMaterials).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedMaterials).map(([category, items]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-800">{category}</h2>
                      <Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-600 border-none font-bold">{items.length}</Badge>
                    </div>
                    <div className="flex-1 h-[1px] bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((m) => (
                      <Card key={m.MaterialId} className="group border-none shadow-sm hover:shadow-premium bg-white transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-1">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-800 text-base leading-tight truncate group-hover:text-blue-600 transition-colors" title={m.MaterialName}>
                                {m.MaterialName}
                              </h3>
                              <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">{m.MaterialCode}</p>
                            </div>
                            <Badge variant="outline" className="bg-slate-50/50 border-slate-100 text-slate-500 font-bold rounded-lg shrink-0">
                              {m.Unit}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-end pt-2">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-blue-600 text-lg tracking-tight">฿{m.Price.toLocaleString()}</span>
                            </div>

                            {canEditProducts && (
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 hover:text-slate-800" onClick={() => startEdit(m)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600" onClick={() => initiateDelete(m)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Package className="h-10 w-10 text-slate-200" />
              </div>
              <p className="text-slate-800 font-bold text-lg">{q ? "ไม่พบรายการที่ต้องการ" : "ยังไม่มีข้อมูลวัตถุดิบ"}</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                {q ? "ลองปรับเปลี่ยนเงื่อนไขการค้นหาอีกครั้ง" : "เริ่มต้นเพิ่มวัตถุดิบชิ้นแรกเพื่อจัดการคลังสินค้า"}
              </p>
              {q && <Button variant="ghost" className="text-blue-600" onClick={() => setQ("")}>ล้างคำค้นหา</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-premium p-0 overflow-hidden">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                {editing ? "แก้ไขรายละเอียดวัตถุดิบ" : "เพิ่มวัตถุดิบ SKU ใหม่ลงในฐานข้อมูล"}
              </DialogTitle>
              <p className="text-slate-500 text-sm">ระบุข้อมูลที่จำเป็นสำหรับการจัดการและการคำนวณต้นทุน</p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">รหัสวัตถุดิบ (SKU Code)</Label>
                  <Input
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 uppercase font-mono"
                    value={form.MaterialCode}
                    onChange={(e) => setForm({ ...form, MaterialCode: e.target.value.toUpperCase() })}
                    placeholder="เช่น FLOUR-001"
                  />
                  {formErrors.MaterialCode && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.MaterialCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">ชื่อวัตถุดิบ</Label>
                  <Input
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                    value={form.MaterialName}
                    onChange={(e) => setForm({ ...form, MaterialName: e.target.value })}
                    placeholder="ระบุชื่อเรียกที่เข้าใจง่าย"
                  />
                  {formErrors.MaterialName && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.MaterialName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">หน่วยนับ</Label>
                    <Input
                      className="h-11 rounded-xl bg-slate-50 border-slate-200"
                      value={form.Unit}
                      onChange={(e) => setForm({ ...form, Unit: e.target.value })}
                      placeholder="เช่น กก., ถุง"
                    />
                    {formErrors.Unit && (
                      <p className="text-xs text-rose-500 font-medium">{formErrors.Unit}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">ราคา (บาท)</Label>
                    <Input
                      className="h-11 rounded-xl bg-slate-50 border-slate-200"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.Price}
                      onChange={(e) => setForm({ ...form, Price: Number(e.target.value) })}
                    />
                    {formErrors.Price && (
                      <p className="text-xs text-rose-500 font-medium">{formErrors.Price}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">หมวดหมู่</Label>
                  {loadingCategories ? (
                    <div className="h-11 flex items-center px-4 rounded-xl bg-slate-100 text-slate-400 text-sm animate-pulse">
                      กำลังโหลดข้อมูล...
                    </div>
                  ) : apiCategories.length > 0 ? (
                    <select
                      className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                      value={form.CatagoryId}
                      onChange={(e) => setForm({ ...form, CatagoryId: Number(e.target.value) })}
                    >
                      {apiCategories.map((cat) => (
                        <option key={cat.CatagoryId} value={cat.CatagoryId}>
                          {cat.CatagoryName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600 text-xs font-medium border border-rose-100">
                      พบปัญหา: ยังไม่มีหมวดหมู่ในระบบ กรุณาเพิ่มหมวดหมู่ก่อนใช้งานหน้านี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => setOpen(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button
              className="rounded-xl h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
              onClick={handleSave}
              disabled={submitting || apiCategories.length === 0}
            >
              {submitting ? "กำลังบันทึก..." : (editing ? "บันทึกการเปลี่ยนแปลง" : "สร้างข้อมูล SKU")}
            </Button>
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
              <AlertDialogTitle className="text-2xl font-bold text-slate-800">ยืนยันการลบข้อมูล?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-base">
                คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-bold text-slate-900">{materialToDelete?.MaterialName}</span> ออกจากฐานข้อมูล SKU?
                การกระทำนี้ไม่สามารถย้อนคืนได้
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 sm:justify-center gap-3">
            <AlertDialogCancel className="w-full sm:w-auto h-12 rounded-xl px-6 border-slate-200">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto h-12 rounded-xl px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/20">
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}