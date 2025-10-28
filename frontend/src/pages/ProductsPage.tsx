import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Wheat, Egg, Milk, Filter, Candy, Apple, Droplets, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategories, type Category } from "@/lib/api";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  category: string;
};

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>({ sku: "", name: "", unit: "กิโลกรัม", price: 0, category: "" });
  
  // โหลดหมวดหมู่จาก API
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [products, setProducts] = useState<Product[]>([
    { id: "MAT-001", sku: "FLOUR-WHITE", name: "แป้งสาลีอเนกประสงค์", unit: "กิโลกรัม", price: 45, category: "แป้ง" },
    { id: "MAT-002", sku: "FLOUR-CAKE", name: "แป้งเค้ก", unit: "กิโลกรัม", price: 65, category: "แป้ง" },
    { id: "MAT-003", sku: "FLOUR-BREAD", name: "แป้งทำขนมปัง", unit: "กิโลกรัม", price: 55, category: "แป้ง" },
    { id: "MAT-004", sku: "SUGAR-GRAN", name: "น้ำตาลทราย", unit: "กิโลกรัม", price: 40, category: "น้ำตาล" },
    { id: "MAT-005", sku: "SUGAR-POWDER", name: "น้ำตาลป่น", unit: "กิโลกรัม", price: 50, category: "น้ำตาล" },
    { id: "MAT-006", sku: "SUGAR-BROWN", name: "น้ำตาลทรายแดง", unit: "กิโลกรัม", price: 42, category: "น้ำตาล" },
    { id: "MAT-007", sku: "BUTTER-SALT", name: "เนยเค็ม", unit: "กิโลกรัม", price: 180, category: "เนย" },
    { id: "MAT-008", sku: "BUTTER-UNSALT", name: "เนยจืด", unit: "กิโลกรัม", price: 190, category: "เนย" },
    { id: "MAT-009", sku: "EGG-WHITE", name: "ไข่ไก่ขาว", unit: "ฟอง", price: 2, category: "ไข่" },
    { id: "MAT-010", sku: "EGG-BROWN", name: "ไข่ไก่แดง", unit: "ฟอง", price: 3, category: "ไข่" },
    { id: "MAT-011", sku: "MILK-WHOLE", name: "นมจืดเต็มไขมัน", unit: "ลิตร", price: 65, category: "นม" },
    { id: "MAT-012", sku: "MILK-SKIM", name: "นมจืดไขมันต่ำ", unit: "ลิตร", price: 55, category: "นม" },
    { id: "MAT-013", sku: "CREAM-HEAVY", name: "ครีมจืด", unit: "ลิตร", price: 120, category: "นม" },
    { id: "MAT-014", sku: "CHOC-COCOA", name: "ผงโกโก้", unit: "กิโลกรัม", price: 250, category: "ช็อกโกแลต" },
    { id: "MAT-015", sku: "CHOC-DARK", name: "ช็อกโกแลตดำ", unit: "กิโลกรัม", price: 300, category: "ช็อกโกแลต" },
    { id: "MAT-016", sku: "CHOC-WHITE", name: "ช็อกโกแลตขาว", unit: "กิโลกรัม", price: 280, category: "ช็อกโกแลต" },
    { id: "MAT-017", sku: "BAKING-POWDER", name: "ผงฟู", unit: "ถุง", price: 35, category: "วัตถุเจือปน" },
    { id: "MAT-018", sku: "BAKING-SODA", name: "โซดาบิคคาร์บอเนต", unit: "ถุง", price: 30, category: "วัตถุเจือปน" },
    { id: "MAT-019", sku: "VANILLA-EXTRACT", name: "สารสกัดวานิลลา", unit: "ขวด", price: 80, category: "วัตถุเจือปน" },
    { id: "MAT-020", sku: "SALT", name: "เกลือ", unit: "กิโลกรัม", price: 25, category: "วัตถุเจือปน" },
    { id: "MAT-021", sku: "OIL-VEG", name: "น้ำมันพืช", unit: "ลิตร", price: 75, category: "น้ำมัน" },
    { id: "MAT-022", sku: "OIL-COCONUT", name: "น้ำมันมะพร้าว", unit: "ลิตร", price: 90, category: "น้ำมัน" },
    { id: "MAT-023", sku: "FRUIT-STRAW", name: "สตอเบอร์รี่แช่แข็ง", unit: "กิโลกรัม", price: 200, category: "ผลไม้" },
    { id: "MAT-024", sku: "FRUIT-MANGO", name: "มะม่วงแช่แข็ง", unit: "กิโลกรัม", price: 180, category: "ผลไม้" },
  ]);

  // โหลดหมวดหมู่จาก API เมื่อ component mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const data = await getCategories();
        setApiCategories(data);
        // ตั้งค่า default category ในฟอร์มเป็นหมวดหมู่แรก
        if (data.length > 0 && !form.category) {
          setForm(prev => ({ ...prev, category: data[0].CatagoryName }));
        }
      } catch (error) {
        console.error("ไม่สามารถโหลดหมวดหมู่:", error);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Get unique categories (รวมทั้งจาก products และจาก API)
  const categories = useMemo(() => {
    const productsCategories = [...new Set(products.map(p => p.category))];
    const apiCategoryNames = apiCategories.map(c => c.CatagoryName);
    const allCategories = [...new Set([...productsCategories, ...apiCategoryNames])];
    return ["all", ...allCategories];
  }, [products, apiCategories]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !s || [p.sku, p.name].some((v) => v.toLowerCase().includes(s));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [q, products, categoryFilter]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((product) => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    return groups;
  }, [filteredProducts]);

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

  const startCreate = () => {
    setEditing(null);
    const defaultCategory = apiCategories.length > 0 ? apiCategories[0].CatagoryName : "";
    setForm({ sku: "", name: "", unit: "กิโลกรัม", price: 0, category: defaultCategory });
    setOpen(true);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, unit: p.unit, price: p.price, category: p.category });
    setOpen(true);
  };

  const save = () => {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } as Product : p)));
    } else {
      const nextId = `MAT-${(products.length + 1).toString().padStart(3, "0")}`;
      setProducts((prev) => [...prev, { id: nextId, ...form } as Product]);
    }
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm("ยืนยันการลบวัตถุดิบ?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">วัตถุดิบขนมหวาน</h1>
          <p className="text-muted-foreground mt-1">จัดการวัตถุดิบสำหรับทำขนมและของหวาน</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={startCreate}>
          <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
        </Button>
      </div>

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
          {Object.keys(groupedProducts).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category} <Badge variant="secondary">{items.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((p) => (
                      <Card key={p.id} className="hover:shadow-premium transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{p.name}</h3>
                              <p className="text-sm text-muted-foreground">{p.sku}</p>
                            </div>
                            <Badge variant="outline">{p.unit}</Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="font-semibold text-primary">฿{p.price.toLocaleString()}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="hover:bg-accent" onClick={() => startEdit(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => remove(p.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              <p>ไม่พบวัตถุดิบ</p>
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
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} />
            </div>
            <div>
              <Label>ชื่อวัตถุดิบ</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <Label>หน่วย</Label>
              <Input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} />
            </div>
            <div>
              <Label>ราคาต่อหน่วย (บาท)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <Label>หมวดหมู่</Label>
              {loadingCategories ? (
                <div className="w-full border border-input bg-background rounded-md px-3 py-2 text-muted-foreground">
                  กำลังโหลดหมวดหมู่...
                </div>
              ) : apiCategories.length > 0 ? (
                <select 
                  className="w-full border border-input bg-background rounded-md px-3 py-2"
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  {apiCategories.map((cat) => (
                    <option key={cat.CatagoryId} value={cat.CatagoryName}>
                      {cat.CatagoryName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full border border-input bg-background rounded-md px-3 py-2 text-muted-foreground">
                  ยังไม่มีหมวดหมู่ <a href="/categories" className="text-primary underline ml-1">เพิ่มหมวดหมู่</a>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={save}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}