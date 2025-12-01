import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, Edit, Trash2, Wheat, Egg, Milk, Filter, Candy, Apple, Droplets, Package, AlertCircle } from "lucide-react";
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

export default function ProductsPage() {
  const { canEditProducts, isBranch } = usePermissions();
  
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
      } else {
        // Create
        await createMaterial(form);
      }
      await loadData();
      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      const errorMessage = err.message || "เกิดข้อผิดพลาด";
      if (errorMessage.includes("already exists")) {
        setFormErrors({ ...formErrors, MaterialCode: "รหัสนี้มีในระบบแล้ว" });
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Handle delete
  async function handleDelete(id: number) {
    if (!confirm("ยืนยันการลบวัตถุดิบ?")) return;
    
    try {
      await deleteMaterial(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "ไม่สามารถลบได้");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">วัตถุดิบคลังสินค้า</h1>
          <p className="text-muted-foreground mt-1">จัดการฐานข้อมูลวัตถุดิบสำหรับคลังกลางและทุกสาขา</p>
        </div>
        {canEditProducts && (
          <Button className="gap-2 w-full sm:w-auto" onClick={startCreate}>
            <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
          </Button>
        )}
      </div>

      {/* Permission Alert */}
      {isBranch && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            คุณสามารถดูข้อมูลได้เท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบได้
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-premium">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>รายการวัตถุดิบ</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 w-full focus-visible:ring-primary" placeholder="ค้นหา SKU/ชื่อวัตถุดิบ" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  className="border border-input bg-background rounded-md px-3 py-2 text-sm focus-visible:ring-primary"
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMaterials ? (
            <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
          ) : Object.keys(groupedMaterials).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedMaterials).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category} <Badge variant="secondary">{items.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((m) => (
                      <Card key={m.MaterialId} className="hover:shadow-premium transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{m.MaterialName}</h3>
                              <p className="text-sm text-muted-foreground">{m.MaterialCode}</p>
                            </div>
                            <Badge variant="outline">{m.Unit}</Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="font-semibold text-primary">฿{m.Price.toLocaleString()}</span>
                            {canEditProducts && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="hover:bg-accent" onClick={() => startEdit(m)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(m.MaterialId)}>
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
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted" />
              <p>{q ? "ไม่พบวัตถุดิบที่ค้นหา" : "ยังไม่มีวัตถุดิบ"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>รหัสวัตถุดิบ (SKU) <span className="text-destructive">*</span></Label>
              <Input 
                value={form.MaterialCode} 
                onChange={(e) => setForm({...form, MaterialCode: e.target.value.toUpperCase()})}
                placeholder="เช่น FLOUR-001"
              />
              {formErrors.MaterialCode && (
                <p className="text-xs text-destructive mt-1">{formErrors.MaterialCode}</p>
              )}
            </div>
            <div>
              <Label>ชื่อวัตถุดิบ <span className="text-destructive">*</span></Label>
              <Input 
                value={form.MaterialName} 
                onChange={(e) => setForm({...form, MaterialName: e.target.value})}
                placeholder="เช่น แป้งสาลี"
              />
              {formErrors.MaterialName && (
                <p className="text-xs text-destructive mt-1">{formErrors.MaterialName}</p>
              )}
            </div>
            <div>
              <Label>หน่วย <span className="text-destructive">*</span></Label>
              <Input 
                value={form.Unit} 
                onChange={(e) => setForm({...form, Unit: e.target.value})}
                placeholder="เช่น กิโลกรัม, ถุง, ขวด"
              />
              {formErrors.Unit && (
                <p className="text-xs text-destructive mt-1">{formErrors.Unit}</p>
              )}
            </div>
            <div>
              <Label>ราคาต่อหน่วย (บาท) <span className="text-destructive">*</span></Label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                value={form.Price} 
                onChange={(e) => setForm({...form, Price: Number(e.target.value)})}
              />
              {formErrors.Price && (
                <p className="text-xs text-destructive mt-1">{formErrors.Price}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>หมวดหมู่ <span className="text-destructive">*</span></Label>
              {loadingCategories ? (
                <div className="w-full border border-input bg-background rounded-md px-3 py-2 text-muted-foreground">
                  กำลังโหลดหมวดหมู่...
                </div>
              ) : apiCategories.length > 0 ? (
                <select 
                  className="w-full border border-input bg-background rounded-md px-3 py-2"
                  value={form.CatagoryId}
                  onChange={(e) => setForm({...form, CatagoryId: Number(e.target.value)})}
                >
                  {apiCategories.map((cat) => (
                    <option key={cat.CatagoryId} value={cat.CatagoryId}>
                      {cat.CatagoryName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full border border-input bg-background rounded-md px-3 py-2 text-destructive">
                  ยังไม่มีหมวดหมู่ในระบบ กรุณาเพิ่มหมวดหมู่ก่อน
                </div>
              )}
              {formErrors.CatagoryId && (
                <p className="text-xs text-destructive mt-1">{formErrors.CatagoryId}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={submitting || apiCategories.length === 0}>
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}