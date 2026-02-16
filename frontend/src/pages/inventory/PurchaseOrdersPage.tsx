import { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  FileText,
  Calendar,
  User,
  Package,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  Send,
  FileTextIcon,
  X,
  AlertTriangle,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getPurchaseOrders as apiGetPOs, getPurchaseOrder as apiGetPO, updatePurchaseOrder as apiUpdatePO, deletePurchaseOrder as apiDeletePO, getSuppliers as apiGetSuppliers, getMaterials as apiGetMaterials, createPurchaseOrder as apiCreatePO, Supplier as ApiSupplier, Material as ApiMaterial, getWarehouses } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type PO = {
  poId: number;
  id: string;
  supplier: string;
  date: string;
  total: number;
  status: string;
  requestedBy?: string;
  deliveryDate?: string;
  items?: number;
  targetWarehouse?: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  category: string;
};

type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
};

type POItem = {
  product: Product;
  quantity: number;
  price: number;
  total: number;
};

// Type for the full PO details from API
type POWithDetails = {
  PurchaseOrderId: number;
  SupplierId: number;
  PurchaseOrderCode: string;
  PurchaseOrderStatus: string;
  TotalPrice: number;
  DateTime: string;
  CreatedAt: string;
  UpdatedAt: string;
  PurchaseOrderDetails: Array<{
    PurchaseOrderDetailId: number;
    PurchaseOrderId: number;
    MaterialId: number;
    PurchaseOrderQuantity: number;
    PurchaseOrderPrice: number;
    PurchaseOrderUnit: string;
  }>;
  Supplier?: {
    SupplierId: number;
    SupplierName: string;
    ContactName: string;
    Phone: string;
    Email: string;
    Address: string;
    Status: string;
  };
};

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // active | history | all
  const [poList, setPoList] = useState<PO[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [creating, setCreating] = useState(false);
  const [warehouses, setWarehouses] = useState<{ WarehouseId: number; WarehouseName: string }[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all"); // "all" or WarehouseId
  const [form, setForm] = useState({
    SupplierId: 0,
    PurchaseOrderCode: "",
    DateTime: "",
    PurchaseOrderAddress: "", // Used to store Target Warehouse Name
    PurchaseOrderStatus: "DRAFT" as "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED",
    details: [] as Array<{ MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderPrice: number; PurchaseOrderUnit: string }>,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingPo, setViewingPo] = useState<POWithDetails | null>(null);
  const [viewingPoItems, setViewingPoItems] = useState<ApiMaterial[]>([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PO | null>(null);

  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [poToConfirm, setPoToConfirm] = useState<PO | null>(null);

  // Load params or local storage for current warehouse context
  useEffect(() => {
    const stored = localStorage.getItem('selected_warehouse_id');
    if (stored) setSelectedWarehouseId(stored);

    // Initial fetch
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pos, whs] = await Promise.all([
        apiGetPOs(),
        getWarehouses().catch(() => [])
      ]);

      const mapped: PO[] = pos.map((r) => ({
        poId: r.PurchaseOrderId,
        id: r.PurchaseOrderCode,
        supplier: r.Supplier?.SupplierName || String(r.SupplierId),
        date: r.DateTime,
        total: r.TotalPrice,
        status: r.PurchaseOrderStatus,
        items: r._count?.PurchaseOrderDetails || 0,
        requestedBy: r.CreatedByUser?.UserName || '-',
        targetWarehouse: r.PurchaseOrderAddress || 'ไม่ระบุ',
      }));
      setPoList(mapped);
      setWarehouses(whs);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดข้อมูลไม่สำเร็จ', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = async () => {
    setCreateOpen(true);
    try {
      const [ss, ms, whs] = await Promise.all([
        apiGetSuppliers(),
        apiGetMaterials(),
        getWarehouses().catch(() => [])
      ]);
      setSuppliers(ss);
      setMaterials(ms);
      setWarehouses(whs);

      const now = new Date();
      // Default to first warehouse if available, or empty string
      const defaultWh = whs.length > 0 ? whs[0].WarehouseName : "";

      // Auto-select current warehouse if in context
      let initialAddress = defaultWh;
      if (selectedWarehouseId !== "all") {
        const found = whs.find(w => String(w.WarehouseId) === selectedWarehouseId);
        if (found) initialAddress = found.WarehouseName;
      }

      setForm({
        SupplierId: ss[0]?.SupplierId || 0,
        PurchaseOrderCode: '',
        DateTime: now.toISOString().slice(0, 10),
        PurchaseOrderAddress: initialAddress,
        PurchaseOrderStatus: 'DRAFT',
        details: []
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดข้อมูลสำหรับสร้าง PO ไม่สำเร็จ', description: e.message || '' });
    }
  };

  const addDetailRow = () => {
    if (!materials.length) {
      toast({ variant: 'destructive', title: 'ยังโหลดรายการวัตถุดิบไม่เสร็จ' });
      return;
    }
    setForm(prev => ({
      ...prev,
      details: [...prev.details, { MaterialId: materials[0]?.MaterialId || 0, PurchaseOrderQuantity: 1, PurchaseOrderPrice: materials[0]?.Price || 0, PurchaseOrderUnit: materials[0]?.Unit || '' }]
    }));
  };

  const updateDetail = (idx: number, patch: Partial<{ MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderPrice: number; PurchaseOrderUnit: string }>) => {
    setForm(prev => {
      const details = prev.details.slice();
      details[idx] = { ...details[idx], ...patch } as any;
      return { ...prev, details };
    });
  };

  const removeDetail = (idx: number) => {
    setForm(prev => ({ ...prev, details: prev.details.filter((_, i) => i !== idx) }));
  };

  const totalPrice = useMemo(() => form.details.reduce((sum, d) => sum + (Number(d.PurchaseOrderQuantity) || 0) * (Number(d.PurchaseOrderPrice) || 0), 0), [form.details]);

  const submitCreate = async () => {
    if (!form.SupplierId) return toast({ variant: 'destructive', title: 'กรุณาเลือกผู้จำหน่าย' });
    if (form.details.length === 0) return toast({ variant: 'destructive', title: 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ' });
    if (!form.PurchaseOrderAddress) return toast({ variant: 'destructive', title: 'กรุณาเลือกคลังสินค้าที่จะรับของ' });

    for (const d of form.details) {
      if (!d.MaterialId || d.MaterialId <= 0) return toast({ variant: 'destructive', title: 'เลือกรายการวัตถุดิบไม่ถูกต้อง' });
      if (!d.PurchaseOrderQuantity || d.PurchaseOrderQuantity <= 0) return toast({ variant: 'destructive', title: 'จำนวนต้องมากกว่า 0' });
      if (d.PurchaseOrderPrice === undefined || d.PurchaseOrderPrice === null || Number(d.PurchaseOrderPrice) < 0) return toast({ variant: 'destructive', title: 'ราคาต้องไม่ติดลบ' });
      if (!d.PurchaseOrderUnit) return toast({ variant: 'destructive', title: 'กรุณาระบุหน่วย' });
    }
    setCreating(true);
    try {
      // Determine the warehouse ID to send
      let whToSubmit: number | undefined = undefined;
      if (selectedWarehouseId !== "all") {
        whToSubmit = Number(selectedWarehouseId);
      } else if (warehouses.length > 0) {
        // Fallback to the first warehouse if "all" is selected but we need one for PO
        whToSubmit = warehouses[0].WarehouseId;
      }

      if (!whToSubmit) {
        return toast({
          variant: 'destructive',
          title: 'ไม่พบข้อมูลคลังสินค้า',
          description: 'กรุณาเลือกคลังสำหรับรับของ'
        });
      }

      await apiCreatePO({
        SupplierId: form.SupplierId,
        WarehouseId: whToSubmit,
        DateTime: form.DateTime ? new Date(form.DateTime).toISOString() : undefined,
        PurchaseOrderStatus: form.PurchaseOrderStatus,
        PurchaseOrderAddress: form.PurchaseOrderAddress,
        details: form.details.map(d => ({
          MaterialId: Number(d.MaterialId),
          PurchaseOrderQuantity: Number(d.PurchaseOrderQuantity),
          PurchaseOrderPrice: Number(d.PurchaseOrderPrice),
          PurchaseOrderUnit: d.PurchaseOrderUnit || (materials.find(m => m.MaterialId === d.MaterialId)?.Unit || '')
        }))
      });
      toast({ title: 'สร้างใบสั่งซื้อสำเร็จ' });
      setCreateOpen(false);
      fetchData(); // Refresh list using shared function

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'สร้างใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = async (po: PO) => {
    setEditingPoId(po.poId);
    setEditOpen(true);
    try {
      const [ss, ms, full] = await Promise.all([
        apiGetSuppliers(),
        apiGetMaterials(),
        apiGetPO(po.poId),
      ]);
      setSuppliers(ss);
      setMaterials(ms);
      setForm({
        SupplierId: full.SupplierId,
        PurchaseOrderCode: full.PurchaseOrderCode,
        DateTime: (full.DateTime ? new Date(full.DateTime).toISOString().slice(0, 10) : ""),
        PurchaseOrderAddress: full.PurchaseOrderAddress || "",
        PurchaseOrderStatus: full.PurchaseOrderStatus as any,
        details: full.PurchaseOrderDetails.map(d => ({
          MaterialId: d.MaterialId,
          PurchaseOrderQuantity: d.PurchaseOrderQuantity,
          PurchaseOrderPrice: d.PurchaseOrderPrice,
          PurchaseOrderUnit: d.PurchaseOrderUnit,
        })),
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดข้อมูลแก้ไข PO ไม่สำเร็จ', description: e.message || '' });
    }
  };

  const submitEdit = async () => {
    if (!editingPoId) return;
    if (!form.SupplierId) return toast({ variant: 'destructive', title: 'กรุณาเลือกผู้จำหน่าย' });
    if (!form.PurchaseOrderCode) return toast({ variant: 'destructive', title: 'กรุณากรอกรหัส PO' });
    if (form.details.length === 0) return toast({ variant: 'destructive', title: 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ' });
    try {
      await apiUpdatePO(editingPoId, {
        SupplierId: form.SupplierId,
        PurchaseOrderCode: form.PurchaseOrderCode,
        DateTime: form.DateTime ? new Date(form.DateTime).toISOString() : undefined,
        PurchaseOrderStatus: form.PurchaseOrderStatus,
        details: form.details.map(d => ({
          MaterialId: Number(d.MaterialId),
          PurchaseOrderQuantity: Number(d.PurchaseOrderQuantity),
          PurchaseOrderPrice: Number(d.PurchaseOrderPrice),
          PurchaseOrderUnit: d.PurchaseOrderUnit,
        })),
      } as any);
      toast({ title: 'แก้ไขใบสั่งซื้อสำเร็จ' });
      setEditOpen(false);
      setEditingPoId(null);
      fetchData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'แก้ไขใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    }
  };

  const handleDelete = (po: PO) => {
    setPoToDelete(po);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!poToDelete) return;
    try {
      await apiDeletePO(poToDelete.poId);
      toast({ title: 'ลบใบสั่งซื้อแล้ว' });
      fetchData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'ลบใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    }
    setDeleteConfirmOpen(false);
  };

  const openView = async (po: PO) => {
    setViewOpen(true);
    try {
      const [full, mats] = await Promise.all([
        apiGetPO(po.poId),
        apiGetMaterials(),
      ]);
      setViewingPo(full as POWithDetails);
      setViewingPoItems(mats);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดข้อมูล PO ไม่สำเร็จ', description: e.message || '' });
    }
  };

  const getStatusBadge = (status: string) => {
    const display = status;
    switch (display) {
      case "PROFESSIONAL": // Legacy mapping if needed
      case "DRAFT":
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">ร่างเอกสาร</Badge>;
      case "SENT":
      case "PENDING":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">สั่งซื้อแล้ว</Badge>;
      case "RECEIVED":
      case "STOCKED":
        return <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">รับของแล้ว</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">ยกเลิก</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredPOs = useMemo(() => {
    let filtered = poList.filter(po => {
      // 1. Warehouse Filter
      if (selectedWarehouseId !== "all") {
        const currentWhName = warehouses.find(w => String(w.WarehouseId) === selectedWarehouseId)?.WarehouseName;
        if (currentWhName && po.targetWarehouse && po.targetWarehouse !== currentWhName) {
          return false;
        }
      }

      // 2. Search Filter
      const matchesSearch = !searchTerm ||
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Status Tab Filter
      if (statusFilter === "active") {
        // Show pending tasks
        return ["DRAFT", "SENT", "CONFIRMED", "PENDING"].includes(po.status);
      } else if (statusFilter === "history") {
        // Show completed tasks
        return ["RECEIVED", "CANCELLED", "STOCKED"].includes(po.status);
      }
      return true;
    });

    // Sort by Date Descending (Newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [poList, searchTerm, selectedWarehouseId, warehouses, statusFilter]);

  // Quick Action Handler
  const handleQuickAction = (po: PO) => {
    if (po.status === 'DRAFT') {
      setPoToConfirm(po);
      setConfirmActionOpen(true);
    }
  };

  const confirmQuickAction = async () => {
    if (!poToConfirm) return;
    try {
      await apiUpdatePO(poToConfirm.poId, { PurchaseOrderStatus: 'SENT' } as any);
      toast({ title: 'ยืนยันใบสั่งซื้อเรียบร้อย', description: 'สถานะเปลี่ยนเป็นส่งใบสั่งซื้อแล้ว' });
      fetchData(); // Refresh
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: e.message });
    }
    setConfirmActionOpen(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "ร่างเอกสาร";
      case "SENT": return "ส่งใบสั่งซื้อแล้ว";
      case "RECEIVED": return "รับของแล้ว";
      case "CANCELLED": return "ยกเลิก";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ใบสั่งซื้อ (Purchase Orders)</h1>
          <p className="text-muted-foreground mt-1">จัดการใบสั่งซื้อวัตถุดิบจากผู้จำหน่าย</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto shadow-sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> สร้างใบสั่งซื้อ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">กำลังจัดส่ง</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {poList.filter(po => po.status === "SENT" || po.status === "PENDING").length}
                </p>
              </div>
              <FileTextIcon className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รับของแล้ว</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {poList.filter(po => po.status === "RECEIVED" || po.status === "STOCKED").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ร่างเอกสาร</p>
                <p className="text-2xl font-bold mt-1 text-gray-500">
                  {poList.filter(po => po.status === "DRAFT").length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-gray-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          {/* Filter Tabs */}
          <div className="flex p-1 bg-muted rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              กำลังดำเนินการ ({poList.filter(p => ["DRAFT", "SENT", "CONFIRMED", "PENDING"].includes(p.status)).length})
            </button>
            <button
              onClick={() => setStatusFilter("history")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              ประวัติ ({poList.filter(p => ["RECEIVED", "CANCELLED", "STOCKED"].includes(p.status)).length})
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              ทั้งหมด
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full bg-background border-border/60"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[140px] pl-6 py-4">เลขที่ PO</TableHead>
                  <TableHead className="py-4">ผู้จำหน่าย</TableHead>
                  <TableHead className="py-4">วันที่</TableHead>
                  <TableHead className="py-4 text-center">รายการ</TableHead>
                  <TableHead className="py-4">ผู้ขอ</TableHead>
                  <TableHead className="py-4">สถานะ</TableHead>
                  <TableHead className="py-4 text-right pr-6">ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">กำลังโหลดข้อมูล...</TableCell>
                  </TableRow>
                ) : filteredPOs.length > 0 ? (
                  filteredPOs.map((po) => (
                    <TableRow key={po.id} className="group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(po)}>
                      <TableCell className="pl-6 font-semibold">{po.id}</TableCell>
                      <TableCell className="font-medium">{po.supplier}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(po.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-center">{po.items ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{po.requestedBy ?? '-'}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Action Button */}
                          {po.status === 'DRAFT' && (
                            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => handleQuickAction(po)}>
                              <Send className="h-3 w-3 mr-1.5" /> ยืนยันสั่งซื้อ
                            </Button>
                          )}

                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-600" onClick={() => openEdit(po)} title="แก้ไข">
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(po)} title="ลบรายการ">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-60 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                        <p>ไม่พบรายการใบสั่งซื้อในหน้านี้</p>
                        {statusFilter !== 'all' && <Button variant="link" onClick={() => setStatusFilter('all')}>ดูรายการทั้งหมด</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                สร้างใบสั่งซื้อใหม่
              </DialogTitle>
              <DialogDescription className="mt-1">สร้างเอกสารสั่งซื้อวัตถุดิบเข้าคลังสินค้า</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-4 hidden sm:block">
                <span className="text-sm text-muted-foreground block">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">ผู้จำหน่าย (Supplier)</Label>
                <Select value={String(form.SupplierId)} onValueChange={(v) => setForm(prev => ({ ...prev, SupplierId: Number(v) }))}>
                  <SelectTrigger className="w-full bg-background"><SelectValue placeholder="เลือกบริษัทคู่ค้า" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.SupplierId} value={String(s.SupplierId)}>{s.SupplierName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">รหัสเอกสาร</Label>
                <Input
                  value={form.PurchaseOrderCode}
                  placeholder="Auto (PO-XXXX)"
                  disabled
                  className="bg-muted text-muted-foreground font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">วันที่เอกสาร</Label>
                <Input type="date" className="bg-background" value={form.DateTime} onChange={(e) => setForm(prev => ({ ...prev, DateTime: e.target.value }))} />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" /> รายการสินค้า
                </h3>
                <Button size="sm" onClick={addDetailRow} disabled={!materials.length} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-1" /> เพิ่มรายการ
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="w-[40%] pl-4">รายการวัตถุดิบ</TableHead>
                      <TableHead className="w-[15%]">จำนวน</TableHead>
                      <TableHead className="w-[15%]">หน่วย</TableHead>
                      <TableHead className="w-[15%] text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="w-[10%] text-right">รวม</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.details.map((d, idx) => {
                      const mat = materials.find(m => m.MaterialId === d.MaterialId) || materials[0];
                      return (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="pl-4 py-2">
                            <Select value={String(d.MaterialId)} onValueChange={(v) => {
                              const m = materials.find(mm => mm.MaterialId === Number(v));
                              updateDetail(idx, { MaterialId: Number(v), PurchaseOrderPrice: m?.Price || 0, PurchaseOrderUnit: m?.Unit || '' });
                            }}>
                              <SelectTrigger className="w-full border-0 shadow-none bg-transparent hover:bg-muted/50 h-9 px-2 focus:ring-0 font-medium">
                                <SelectValue placeholder="เลือกสินค้า" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map(m => (
                                  <SelectItem key={m.MaterialId} value={String(m.MaterialId)}>{m.MaterialName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number" min="1"
                              className="border-0 shadow-none bg-transparent hover:bg-muted/50 h-9 focus-visible:ring-0 text-center font-medium"
                              value={d.PurchaseOrderQuantity}
                              onChange={(e) => updateDetail(idx, { PurchaseOrderQuantity: Number(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              className="border-0 shadow-none bg-transparent hover:bg-muted/50 h-9 focus-visible:ring-0 text-center text-muted-foreground"
                              value={d.PurchaseOrderUnit}
                              onChange={(e) => updateDetail(idx, { PurchaseOrderUnit: e.target.value })}
                              placeholder={mat?.Unit || ''}
                            />
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Input
                              type="number" min="0"
                              className="border-0 shadow-none bg-transparent hover:bg-muted/50 h-9 focus-visible:ring-0 text-right font-mono"
                              value={d.PurchaseOrderPrice}
                              onChange={(e) => updateDetail(idx, { PurchaseOrderPrice: Number(e.target.value) })}
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-foreground py-2 pr-4">
                            {((Number(d.PurchaseOrderQuantity) || 0) * (Number(d.PurchaseOrderPrice) || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-2 pr-2">
                            <Button variant="ghost" size="icon" onClick={() => removeDetail(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {form.details.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground bg-muted/10 border-none">
                          <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          ยังไม่มีรายการสินค้า กดปุ่ม "เพิ่มรายการ" เพื่อเริ่ม
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

            </div>
            {/* Mobile Total Display */}
            <div className="sm:hidden flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <span className="font-semibold">ยอดรวมทั้งสิ้น</span>
              <span className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
            <Button onClick={submitCreate} disabled={creating} className="min-w-[120px] shadow-md">
              {creating ? <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> บันทึก...</span> : 'ยืนยันใบสั่งซื้อ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>แก้ไขใบสั่งซื้อ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลและรายการวัตถุดิบของ PO</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ผู้จำหน่าย</Label>
              <Select value={String(form.SupplierId)} onValueChange={(v) => setForm(prev => ({ ...prev, SupplierId: Number(v) }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="เลือกผู้จำหน่าย" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.SupplierId} value={String(s.SupplierId)}>{s.SupplierName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>รหัส PO</Label>
              <Input value={form.PurchaseOrderCode} onChange={(e) => setForm(prev => ({ ...prev, PurchaseOrderCode: e.target.value }))} />
            </div>
            <div>
              <Label>วันที่</Label>
              <Input type="date" value={form.DateTime} onChange={(e) => setForm(prev => ({ ...prev, DateTime: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 border rounded-lg">
            <div className="flex items-center justify-between p-3">
              <div className="font-medium">รายการสินค้า</div>
              <Button size="sm" variant="outline" onClick={addDetailRow} disabled={!materials.length}><Plus className="h-4 w-4 mr-1" />เพิ่มรายการ</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">วัตถุดิบ</TableHead>
                    <TableHead className="whitespace-nowrap">จำนวน</TableHead>
                    <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                    <TableHead className="whitespace-nowrap">ราคา/หน่วย</TableHead>
                    <TableHead className="whitespace-nowrap">รวม</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.details.map((d, idx) => {
                    const mat = materials.find(m => m.MaterialId === d.MaterialId) || materials[0];
                    return (
                      <TableRow key={idx}>
                        <TableCell className="min-w-[220px]">
                          <Select value={String(d.MaterialId)} onValueChange={(v) => {
                            const m = materials.find(mm => mm.MaterialId === Number(v));
                            updateDetail(idx, { MaterialId: Number(v), PurchaseOrderPrice: m?.Price || 0, PurchaseOrderUnit: m?.Unit || '' });
                          }}>
                            <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกวัตถุดิบ" /></SelectTrigger>
                            <SelectContent>
                              {materials.map(m => (
                                <SelectItem key={m.MaterialId} value={String(m.MaterialId)}>{m.MaterialName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <Input type="number" min="1" value={d.PurchaseOrderQuantity} onChange={(e) => updateDetail(idx, { PurchaseOrderQuantity: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <Input value={d.PurchaseOrderUnit} onChange={(e) => updateDetail(idx, { PurchaseOrderUnit: e.target.value })} placeholder={mat?.Unit || ''} />
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <Input type="number" min="0" value={d.PurchaseOrderPrice} onChange={(e) => updateDetail(idx, { PurchaseOrderPrice: Number(e.target.value) })} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">฿{((Number(d.PurchaseOrderQuantity) || 0) * (Number(d.PurchaseOrderPrice) || 0)).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeDetail(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {form.details.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">ยังไม่มีรายการสินค้า</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end p-3 gap-4">
              <div className="text-sm text-muted-foreground">รวมทั้งสิ้น</div>
              <div className="font-semibold">฿{totalPrice.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button onClick={submitEdit}>บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบสั่งซื้อ</DialogTitle>
            <DialogDescription>ข้อมูลใบสั่งซื้อและรายการสินค้า</DialogDescription>
          </DialogHeader>
          {viewingPo && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>เลขที่ PO</Label>
                  <div className="font-medium">{viewingPo.PurchaseOrderCode}</div>
                </div>
                <div>
                  <Label>ผู้จำหน่าย</Label>
                  <div className="font-medium">{viewingPo.Supplier?.SupplierName || '-'}</div>
                </div>
                <div>
                  <Label>วันที่</Label>
                  <div className="font-medium">
                    {new Date(viewingPo.DateTime).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <div className="font-medium">{getStatusLabel(viewingPo.PurchaseOrderStatus)}</div>
                </div>
                <div>
                  <Label>ยอดรวม</Label>
                  <div className="font-medium">฿{viewingPo.TotalPrice.toLocaleString()}</div>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="p-3 font-medium border-b">รายการสินค้า</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">วัตถุดิบ</TableHead>
                        <TableHead className="whitespace-nowrap">จำนวน</TableHead>
                        <TableHead className="whitespace-nowrap">หน่วย</TableHead>
                        <TableHead className="whitespace-nowrap">ราคา/หน่วย</TableHead>
                        <TableHead className="whitespace-nowrap">รวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPo.PurchaseOrderDetails.map((d) => {
                        const mat = viewingPoItems.find(m => m.MaterialId === d.MaterialId);
                        return (
                          <TableRow key={d.PurchaseOrderDetailId}>
                            <TableCell>
                              <div className="font-medium">{mat?.MaterialName || `MAT-${d.MaterialId}`}</div>
                              <div className="text-sm text-muted-foreground">ID: {d.MaterialId}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{d.PurchaseOrderQuantity.toLocaleString()}</TableCell>
                            <TableCell className="whitespace-nowrap">{d.PurchaseOrderUnit}</TableCell>
                            <TableCell className="whitespace-nowrap">฿{d.PurchaseOrderPrice.toLocaleString()}</TableCell>
                            <TableCell className="whitespace-nowrap">฿{(d.PurchaseOrderQuantity * d.PurchaseOrderPrice).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                      {viewingPo.PurchaseOrderDetails.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">ไม่มีรายการสินค้า</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Alert Dialog for Deletion */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl text-red-600">ยืนยันการลบรายการ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              ท่านต้องการลบใบสั่งซื้อ <span className="font-semibold text-foreground">{poToDelete?.id}</span> ใช่หรือไม่?
              <br />การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for Quick Action (Send PO) */}
      <AlertDialog open={confirmActionOpen} onOpenChange={setConfirmActionOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader className="flex flex-col items-center text-center sm:text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <Send className="h-6 w-6 text-blue-600 ml-1" />
            </div>
            <AlertDialogTitle className="text-xl text-blue-700">ยืนยันการส่งใบสั่งซื้อ?</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              ท่านต้องการยืนยันส่งใบสั่งซื้อ <span className="font-semibold text-foreground">{poToConfirm?.id}</span> ใช่หรือไม่?
              <br />สถานะเอกสารจะถูกเปลี่ยนเป็น "สั่งซื้อแล้ว"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto">ตรวจสอบก่อน</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuickAction} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              ยืนยันส่งทันที
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}