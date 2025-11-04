import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Package, Boxes, Search, Wheat, Egg, Milk, Candy, Apple, Droplets, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStockSummary as apiGetStockSummary, getMaterials as apiGetMaterials, getCategories as apiGetCategories, Material, Category } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type InventoryItem = {
  materialId: number;
  name: string;
  unit: string;
  onHand: number; // TotalRemain
  category: string; // category name
};

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, materials, categories] = await Promise.all([
          apiGetStockSummary(),
          apiGetMaterials(),
          apiGetCategories(),
        ]);
        const catMap: Record<number, string> = {};
        categories.forEach((c: Category) => { catMap[c.CatagoryId] = c.CatagoryName; });
        setCategoriesMap(catMap);
        const matMap = new Map<number, Material>();
        materials.forEach((m) => matMap.set(m.MaterialId, m));
        const rows: InventoryItem[] = summary.map((s) => {
          const m = matMap.get(s.MaterialId);
          return {
            materialId: s.MaterialId,
            name: s.MaterialName,
            unit: s.Unit,
            onHand: s.TotalRemain,
            category: m ? (catMap[m.CatagoryId] || '-') : '-',
          };
        });
        setItems(rows);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดคลังไม่สำเร็จ', description: e.message || '' });
      }
    };
    load();
  }, []);

  // read-only view

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))];
    return cats;
  }, [items]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [String(i.materialId), i.name, i.category].some((v) => v.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const totalSkus = items.length;
  const totalOnHand = items.reduce((sum, i) => sum + i.onHand, 0);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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
      case "น้ำมัน": return <Droplets className="h-5 w-5 text-primary" />;
      case "ผลไม้": return <Apple className="h-5 w-5 text-primary" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  // editing removed

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">คลังวัตถุดิบ</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมจำนวนวัตถุดิบในคลัง </p>
        </div>
      </div>

     
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>รายการคงคลังวัตถุดิบ</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา SKU / ชื่อสินค้า"
                  className="pl-10 w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {/* Read-only */}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedItems).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems]) => {
                const isExpanded = expandedCategories[category] ?? true;
                const displayItems = isExpanded ? categoryItems : categoryItems.slice(0, 5);
                
                return (
                  <div key={category} className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category)}
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {category} <Badge variant="secondary">{categoryItems.length}</Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            จำนวนคงเหลือรวม: {categoryItems.reduce((sum, item) => sum + item.onHand, 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryItems.length > 5 && (
                          <span className="text-sm text-muted-foreground">
                            {isExpanded ? 'แสดงทั้งหมด' : `แสดง ${displayItems.length} จาก ${categoryItems.length}`}
                          </span>
                        )}
                        {categoryItems.length > 5 ? (
                          isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                        ) : null}
                      </div>
                    </div>
                    
                    {displayItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">รหัส</TableHead>
                              <TableHead className="whitespace-nowrap">วัตถุดิบ</TableHead>
                              <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                              <TableHead className="text-right whitespace-nowrap">คงเหลือ</TableHead>
                              <TableHead className="text-center whitespace-nowrap"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayItems.map((i) => (
                              <TableRow key={i.materialId} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">{i.materialId}</TableCell>
                                <TableCell className="whitespace-nowrap">{i.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{i.unit}</TableCell>
                                <TableCell className="text-right thai-number whitespace-nowrap">{i.onHand.toLocaleString()}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        ไม่มีวัตถุดิบในหมวดนี้
                      </div>
                    )}
                    
                    {!isExpanded && categoryItems.length > 5 && (
                      <div className="p-4 pt-0 text-center">
                        <Button 
                          variant="ghost" 
                          className="text-primary"
                          onClick={() => toggleCategory(category)}
                        >
                          แสดงทั้งหมด ({categoryItems.length} รายการ)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</div>
          )}
        </CardContent>
      </Card>

      {/* read-only; editing dialog removed */}
    </div>
  );
}