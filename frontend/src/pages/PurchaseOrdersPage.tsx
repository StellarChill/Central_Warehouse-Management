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
  X
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
import { th } from "../i18n/th";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getPurchaseOrders as apiGetPOs, getPurchaseOrder as apiGetPO, updatePurchaseOrder as apiUpdatePO, deletePurchaseOrder as apiDeletePO, getSuppliers as apiGetSuppliers, getMaterials as apiGetMaterials, createPurchaseOrder as apiCreatePO, Supplier as ApiSupplier, Material as ApiMaterial } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedStatus, setExpandedStatus] = useState<Record<string, boolean>>({});
  const [poList, setPoList] = useState<PO[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    SupplierId: 0,
    PurchaseOrderCode: "",
    DateTime: "",
    PurchaseOrderStatus: "DRAFT" as "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED",
    details: [] as Array<{ MaterialId: number; PurchaseOrderQuantity: number; PurchaseOrderPrice: number; PurchaseOrderUnit: string }>,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<number | null>(null);
  // View dialog states
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingPo, setViewingPo] = useState<POWithDetails | null>(null);
  const [viewingPoItems, setViewingPoItems] = useState<ApiMaterial[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await apiGetPOs();
        const mapped: PO[] = rows.map((r) => ({
          poId: r.PurchaseOrderId,
          id: r.PurchaseOrderCode,
          supplier: r.Supplier?.SupplierName || String(r.SupplierId),
          date: r.DateTime,
          total: r.TotalPrice,
          status: r.PurchaseOrderStatus,
        }));
        setPoList(mapped);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'โหลดใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCreate = async () => {
    setCreateOpen(true);
    try {
      const [ss, ms] = await Promise.all([apiGetSuppliers(), apiGetMaterials()]);
      setSuppliers(ss);
      setMaterials(ms);
      const now = new Date();
      const rand = Math.floor(Math.random()*9000)+1000;
      const code = `PO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}-${rand}`;
      setForm({ SupplierId: ss[0]?.SupplierId || 0, PurchaseOrderCode: code, DateTime: now.toISOString().slice(0,10), PurchaseOrderStatus: 'DRAFT', details: [] });
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

  const totalPrice = useMemo(() => form.details.reduce((sum, d) => sum + (Number(d.PurchaseOrderQuantity)||0) * (Number(d.PurchaseOrderPrice)||0), 0), [form.details]);

  const submitCreate = async () => {
    if (!form.SupplierId) return toast({ variant: 'destructive', title: 'กรุณาเลือกผู้จำหน่าย' });
    if (!form.PurchaseOrderCode) return toast({ variant: 'destructive', title: 'กรุณากรอกรหัส PO' });
    if (form.details.length === 0) return toast({ variant: 'destructive', title: 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ' });
    // validate details
    for (const d of form.details) {
      if (!d.MaterialId || d.MaterialId <= 0) return toast({ variant: 'destructive', title: 'เลือกรายการวัตถุดิบไม่ถูกต้อง' });
      if (!d.PurchaseOrderQuantity || d.PurchaseOrderQuantity <= 0) return toast({ variant: 'destructive', title: 'จำนวนต้องมากกว่า 0' });
      if (d.PurchaseOrderPrice === undefined || d.PurchaseOrderPrice === null || Number(d.PurchaseOrderPrice) < 0) return toast({ variant: 'destructive', title: 'ราคาต้องไม่ติดลบ' });
      if (!d.PurchaseOrderUnit) return toast({ variant: 'destructive', title: 'กรุณาระบุหน่วย' });
    }
    setCreating(true);
    try {
      await apiCreatePO({
        SupplierId: form.SupplierId,
        PurchaseOrderCode: form.PurchaseOrderCode,
        DateTime: form.DateTime ? new Date(form.DateTime).toISOString() : undefined,
        PurchaseOrderStatus: form.PurchaseOrderStatus,
        details: form.details.map(d => ({
          MaterialId: Number(d.MaterialId),
          PurchaseOrderQuantity: Number(d.PurchaseOrderQuantity),
          PurchaseOrderPrice: Number(d.PurchaseOrderPrice),
          PurchaseOrderUnit: d.PurchaseOrderUnit || (materials.find(m => m.MaterialId === d.MaterialId)?.Unit || '')
        }))
      });
      toast({ title: 'สร้างใบสั่งซื้อสำเร็จ' });
      setCreateOpen(false);
      // refresh list
      setLoading(true);
      const rows = await apiGetPOs();
      const mapped: PO[] = rows.map((r) => ({
        poId: r.PurchaseOrderId,
        id: r.PurchaseOrderCode,
        supplier: r.Supplier?.SupplierName || String(r.SupplierId),
        date: r.DateTime,
        total: r.TotalPrice,
        status: r.PurchaseOrderStatus,
      }));
      setPoList(mapped);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'สร้างใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    } finally {
      setCreating(false);
      setLoading(false);
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
        DateTime: (full.DateTime ? new Date(full.DateTime).toISOString().slice(0,10) : ""),
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
    for (const d of form.details) {
      if (!d.MaterialId || d.MaterialId <= 0) return toast({ variant: 'destructive', title: 'เลือกรายการวัตถุดิบไม่ถูกต้อง' });
      if (!d.PurchaseOrderQuantity || d.PurchaseOrderQuantity <= 0) return toast({ variant: 'destructive', title: 'จำนวนต้องมากกว่า 0' });
      if (d.PurchaseOrderPrice === undefined || d.PurchaseOrderPrice === null || Number(d.PurchaseOrderPrice) < 0) return toast({ variant: 'destructive', title: 'ราคาต้องไม่ติดลบ' });
      if (!d.PurchaseOrderUnit) return toast({ variant: 'destructive', title: 'กรุณาระบุหน่วย' });
    }
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
      // refresh list
      setLoading(true);
      const rows = await apiGetPOs();
      const mapped: PO[] = rows.map((r) => ({
        poId: r.PurchaseOrderId,
        id: r.PurchaseOrderCode,
        supplier: r.Supplier?.SupplierName || String(r.SupplierId),
        date: r.DateTime,
        total: r.TotalPrice,
        status: r.PurchaseOrderStatus,
      }));
      setPoList(mapped);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'แก้ไขใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (po: PO) => {
    if (!confirm(`ยืนยันลบ PO ${po.id}?`)) return;
    try {
      await apiDeletePO(po.poId);
      toast({ title: 'ลบใบสั่งซื้อแล้ว' });
      // refresh list
      setLoading(true);
      const rows = await apiGetPOs();
      const mapped: PO[] = rows.map((r) => ({
        poId: r.PurchaseOrderId,
        id: r.PurchaseOrderCode,
        supplier: r.Supplier?.SupplierName || String(r.SupplierId),
        date: r.DateTime,
        total: r.TotalPrice,
        status: r.PurchaseOrderStatus,
      }));
      setPoList(mapped);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'ลบใบสั่งซื้อไม่สำเร็จ', description: e.message || '' });
    } finally {
      setLoading(false);
    }
  };

  // View PO details
  const openView = async (po: PO) => {
    setViewOpen(true);
    try {
      const [full, mats] = await Promise.all([
        apiGetPO(po.poId),
        apiGetMaterials(),
      ]);
      // Type assertion to match our state type
      setViewingPo(full as POWithDetails);
      setViewingPoItems(mats);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'โหลดข้อมูล PO ไม่สำเร็จ', description: e.message || '' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">ร่าง</Badge>;
      case "SENT":
        return <Badge variant="default" className="bg-primary">ส่งแล้ว</Badge>;
      case "CONFIRMED":
        return <Badge variant="default" className="bg-success">ยืนยันแล้ว</Badge>;
      case "RECEIVED":
        return <Badge variant="default" className="bg-purple-500">รับแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "text-gray-500";
      case "SENT": return "text-primary";
      case "CONFIRMED": return "text-success";
      case "RECEIVED": return "text-purple-500";
      default: return "text-gray-500";
    }
  };

  const filteredPOs = useMemo(() => {
    return poList.filter(po => {
      const matchesSearch = !searchTerm || 
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [poList, searchTerm, statusFilter]);

  const groupedPOs = useMemo(() => {
    const groups: Record<string, PO[]> = {};
    filteredPOs.forEach(po => {
      if (!groups[po.status]) {
        groups[po.status] = [];
      }
      groups[po.status].push(po);
    });
    return groups;
  }, [filteredPOs]);

  const toggleStatus = (status: string) => {
    setExpandedStatus(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "ร่าง";
      case "SENT": return "ส่งแล้ว";
      case "CONFIRMED": return "ยืนยันแล้ว";
      case "RECEIVED": return "รับแล้ว";
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
        <Button className="gap-2 w-full sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" /> สร้างใบสั่งซื้อ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ร่าง</p>
                <p className="text-2xl font-bold mt-1">
                  {poList.filter(po => po.status === "DRAFT").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ส่งแล้ว</p>
                <p className="text-2xl font-bold mt-1">
                  {poList.filter(po => po.status === "SENT").length}
                </p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยืนยันแล้ว</p>
                <p className="text-2xl font-bold mt-1">
                  {poList.filter(po => po.status === "CONFIRMED").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รับแล้ว</p>
                <p className="text-2xl font-bold mt-1">
                  {poList.filter(po => po.status === "RECEIVED").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>รายการใบสั่งซื้อ</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10 w-full" 
                  placeholder="ค้นหา เลขที่ PO / ผู้จำหน่าย / ผู้ขอ" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="DRAFT">ร่าง</SelectItem>
                    <SelectItem value="SENT">ส่งแล้ว</SelectItem>
                    <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
                    <SelectItem value="RECEIVED">รับแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
            ) : Object.keys(groupedPOs).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedPOs).map(([status, pos]) => {
                const isExpanded = expandedStatus[status] ?? true;
                const displayPOs = isExpanded ? pos : pos.slice(0, 3);
                
                return (
                  <div key={status} className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleStatus(status)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? 
                          <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        }
                        <h3 className="font-semibold text-lg">
                          {getStatusLabel(status)} <span className="text-muted-foreground">({pos.length})</span>
                        </h3>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    
                    {isExpanded && (
                      <div className="overflow-x-auto border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">เลขที่ PO</TableHead>
                              <TableHead className="whitespace-nowrap">ผู้จำหน่าย</TableHead>
                              <TableHead className="whitespace-nowrap">วันที่</TableHead>
                              <TableHead className="whitespace-nowrap">จำนวนรายการ</TableHead>
                              <TableHead className="whitespace-nowrap">ยอดรวม</TableHead>
                              <TableHead className="whitespace-nowrap">ผู้ขอ</TableHead>
                              <TableHead className="whitespace-nowrap">กำหนดส่ง</TableHead>
                              <TableHead className="whitespace-nowrap">สถานะ</TableHead>
                              <TableHead className="text-center whitespace-nowrap">การดำเนินการ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayPOs.map((po) => (
                              <TableRow key={po.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">{po.id}</TableCell>
                                <TableCell className="whitespace-nowrap">{po.supplier}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {new Date(po.date).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{po.items ?? '-'}</TableCell>
                                <TableCell className="whitespace-nowrap">฿{po.total.toLocaleString()}</TableCell>
                                <TableCell className="whitespace-nowrap">{po.requestedBy}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : '-'}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(po.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full sm:w-auto hover:bg-accent"
                                      onClick={() => openView(po)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full sm:w-auto hover:bg-accent"
                                      onClick={() => openEdit(po)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDelete(po)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>

                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {!isExpanded && pos.length > 3 && (
                          <div className="p-4 text-center border-t">
                            <Button variant="ghost" onClick={() => toggleStatus(status)}>
                              แสดงทั้งหมด ({pos.length} รายการ)
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted" />
              <p>ไม่พบใบสั่งซื้อ</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>สร้างใบสั่งซื้อ</DialogTitle>
            <DialogDescription>เลือกผู้จำหน่ายและเพิ่มรายการวัตถุดิบให้ครบถ้วนก่อนบันทึก</DialogDescription>
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
            <div>
              <Label>สถานะ</Label>
              <Select value={form.PurchaseOrderStatus} onValueChange={(v) => setForm(prev => ({ ...prev, PurchaseOrderStatus: v as any }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="สถานะ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">ร่าง</SelectItem>
                  <SelectItem value="SENT">ส่งแล้ว</SelectItem>
                  <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
                </SelectContent>
              </Select>
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
                        <TableCell className="whitespace-nowrap">฿{((Number(d.PurchaseOrderQuantity)||0)*(Number(d.PurchaseOrderPrice)||0)).toLocaleString()}</TableCell>
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
            <Button onClick={submitCreate} disabled={creating}>{creating ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
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
            <div>
              <Label>สถานะ</Label>
              <Select value={form.PurchaseOrderStatus} onValueChange={(v) => setForm(prev => ({ ...prev, PurchaseOrderStatus: v as any }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="สถานะ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">ร่าง</SelectItem>
                  <SelectItem value="SENT">ส่งแล้ว</SelectItem>
                  <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
                  <SelectItem value="RECEIVED">รับแล้ว</SelectItem>
                </SelectContent>
              </Select>
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
                        <TableCell className="whitespace-nowrap">฿{((Number(d.PurchaseOrderQuantity)||0)*(Number(d.PurchaseOrderPrice)||0)).toLocaleString()}</TableCell>
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
    </div>
  );
}