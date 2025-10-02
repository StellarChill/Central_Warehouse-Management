import { useState, useMemo } from "react";
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
import { th } from "@/i18n/th";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type PO = {
  id: string;
  supplier: string;
  date: string;
  total: number;
  status: string;
  requestedBy: string;
  deliveryDate?: string;
  items: number;
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

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedStatus, setExpandedStatus] = useState<Record<string, boolean>>({});
  const [poList, setPoList] = useState<PO[]>([
    {
      id: "PO-2024-001",
      supplier: "บริษัท ซัพพลาย จำกัด",
      date: "2024-03-15",
      total: 125000,
      status: "SENT",
      requestedBy: "สมชาย ใจดี",
      deliveryDate: "2024-03-22",
      items: 5,
    },
    {
      id: "PO-2024-002",
      supplier: "บริษัท โกลบอล เทรด",
      date: "2024-03-14",
      total: 89500,
      status: "CONFIRMED",
      requestedBy: "สุดา รักดี",
      deliveryDate: "2024-03-21",
      items: 3,
    },
    {
      id: "PO-2024-003",
      supplier: "บริษัท เวิลด์คลาส",
      date: "2024-03-13",
      total: 245000,
      status: "RECEIVED",
      requestedBy: "วิเชียร เก่งมาก",
      deliveryDate: "2024-03-20",
      items: 8,
    },
    {
      id: "PO-2024-004",
      supplier: "บริษัท คุณภาพดี",
      date: "2024-03-12",
      total: 67800,
      status: "DRAFT",
      requestedBy: "ปิยะ สุขใจ",
      deliveryDate: "2024-03-19",
      items: 4,
    },
    {
      id: "PO-2024-005",
      supplier: "บริษัท เฟิสต์คลาส",
      date: "2024-03-11",
      total: 156700,
      status: "CONFIRMED",
      requestedBy: "นิรันดร์ ดีมาก",
      deliveryDate: "2024-03-18",
      items: 6,
    },
    {
      id: "PO-2024-006",
      supplier: "บริษัท สตาร์ทอัพ",
      date: "2024-03-10",
      total: 98000,
      status: "SENT",
      requestedBy: "วรัญญา พานิช",
      deliveryDate: "2024-03-17",
      items: 7,
    },
    {
      id: "PO-2024-007",
      supplier: "บริษัท พรีเมียมฟู้ด",
      date: "2024-03-09",
      total: 210500,
      status: "RECEIVED",
      requestedBy: "ธนากร รุ่งเรือง",
      deliveryDate: "2024-03-16",
      items: 9,
    },
    {
      id: "PO-2024-008",
      supplier: "บริษัท ฟู๊ดเซอร์วิส",
      date: "2024-03-08",
      total: 76500,
      status: "DRAFT",
      requestedBy: "อรอุมา ศรีสวัสดิ์",
      deliveryDate: "2024-03-15",
      items: 4,
    },
  ]);

  // Mock suppliers data
  const suppliers: Supplier[] = [
    { id: "SUP-001", name: "บริษัท ซัพพลาย จำกัด", contact: "คุณดวงใจ", phone: "081-234-5678", email: "contact@supply.co.th", status: "ACTIVE" },
    { id: "SUP-002", name: "บริษัท โกลบอล เทรด", contact: "คุณธันยา", phone: "082-345-6789", email: "sales@globaltrade.co.th", status: "ACTIVE" },
    { id: "SUP-003", name: "หจก. คุณภาพดี", contact: "คุณปรีชา", phone: "083-456-7890", email: "info@quality.co.th", status: "INACTIVE" },
  ];

  // Mock products data
  const products: Product[] = [
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
  ];

  // State for multi-step PO creation
  const [openCreate, setOpenCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1: select supplier, 2: select items, 3: review
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedItems, setSelectedItems] = useState<POItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const [openReceive, setOpenReceive] = useState<PO | null>(null);

  // Filter products by supplier (in a real app, this would come from API)
  const supplierProducts = useMemo(() => {
    if (!selectedSupplier) return [];
    // For demo purposes, we'll return all products
    // In a real app, this would be filtered by supplier
    return products;
  }, [selectedSupplier]);

  const createPO = () => {
    if (selectedItems.length === 0) return;
    
    const total = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const nextNum = (poList.length + 1).toString().padStart(3, "0");
    
    const po: PO = {
      id: `PO-2024-${nextNum}`,
      supplier: selectedSupplier?.name || "ไม่ระบุร้าน",
      date: new Date().toISOString(),
      total: total,
      status: "DRAFT",
      requestedBy: "ระบบ",
      items: selectedItems.length,
    };
    
    setPoList((prev) => [po, ...prev]);
    resetCreatePO();
  };

  const resetCreatePO = () => {
    setOpenCreate(false);
    setCreateStep(1);
    setSelectedSupplier(null);
    setSelectedItems([]);
    setQuantities({});
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setCreateStep(2);
  };

  const handleItemSelect = (product: Product, checked: boolean) => {
    if (checked) {
      // Add item with default quantity of 1
      const newItem: POItem = {
        product,
        quantity: 1,
        price: product.price,
        total: product.price,
      };
      setSelectedItems([...selectedItems, newItem]);
      setQuantities({ ...quantities, [product.id]: 1 });
    } else {
      // Remove item
      setSelectedItems(selectedItems.filter(item => item.product.id !== product.id));
      const newQuantities = { ...quantities };
      delete newQuantities[product.id];
      setQuantities(newQuantities);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setQuantities({ ...quantities, [productId]: quantity });
    
    // Update the selected items with new quantity
    setSelectedItems(selectedItems.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity,
          total: item.price * quantity
        };
      }
      return item;
    }));
  };

  const markReceived = (po: PO) => {
    setPoList((prev) => prev.map((p) => (p.id === po.id ? { ...p, status: "RECEIVED" } : p)));
    setOpenReceive(null);
  };

  // Group POs by status
  const groupedPOs = useMemo(() => {
    const groups: Record<string, PO[]> = {};
    poList.forEach((po) => {
      if (!groups[po.status]) {
        groups[po.status] = [];
      }
      groups[po.status].push(po);
    });
    return groups;
  }, [poList]);

  // Filter POs based on search and status
  const filteredPOs = useMemo(() => {
    const filtered: Record<string, PO[]> = {};
    
    Object.entries(groupedPOs).forEach(([status, pos]) => {
      if (statusFilter !== "all" && statusFilter !== status) return;
      
      const filteredPOs = pos.filter((po) => {
        const matchesSearch =
          po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
      
      if (filteredPOs.length > 0) {
        filtered[status] = filteredPOs;
      }
    });
    
    return filtered;
  }, [groupedPOs, searchTerm, statusFilter]);

  // Toggle status group expansion
  const toggleStatusGroup = (status: string) => {
    setExpandedStatus(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { 
          label: th.status.DRAFT, 
          icon: FileTextIcon, 
          color: "text-muted-foreground",
          bg: "bg-muted"
        };
      case "SENT":
        return { 
          label: th.status.SENT, 
          icon: Send, 
          color: "text-info",
          bg: "bg-info/10"
        };
      case "CONFIRMED":
        return { 
          label: th.status.CONFIRMED, 
          icon: CheckCircle, 
          color: "text-success",
          bg: "bg-success/10"
        };
      case "RECEIVED":
        return { 
          label: th.status.RECEIVED, 
          icon: Package, 
          color: "text-primary",
          bg: "bg-primary/10"
        };
      default:
        return { 
          label: status, 
          icon: FileTextIcon, 
          color: "text-muted-foreground",
          bg: "bg-muted"
        };
    }
  };

  const stats = [
    {
      title: "ใบสั่งซื้อทั้งหมด",
      value: poList.length.toString(),
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      title: "ร่าง",
      value: poList.filter((po) => po.status === "DRAFT").length.toString(),
      icon: FileTextIcon,
      color: "text-muted-foreground",
    },
    {
      title: "ส่งแล้ว",
      value: poList.filter((po) => po.status === "SENT").length.toString(),
      icon: Send,
      color: "text-info",
    },
    {
      title: "ได้รับแล้ว",
      value: poList.filter((po) => po.status === "RECEIVED").length.toString(),
      icon: Package,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{th.po.title}</h1>
          <p className="text-muted-foreground mt-1">
            จัดการและติดตามใบสั่งซื้อทั้งหมด
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto bg-amber-600 hover:bg-amber-700" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4" />
          {th.po.create}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {th.po.list}
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${th.common.search}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={th.common.filter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="DRAFT">{th.status.DRAFT}</SelectItem>
                  <SelectItem value="SENT">{th.status.SENT}</SelectItem>
                  <SelectItem value="CONFIRMED">{th.status.CONFIRMED}</SelectItem>
                  <SelectItem value="RECEIVED">{th.status.RECEIVED}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(filteredPOs).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(filteredPOs).map(([status, pos]) => {
                const statusInfo = getStatusInfo(status);
                const isExpanded = expandedStatus[status] ?? true;
                const displayPOs = isExpanded ? pos : pos.slice(0, 3);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={status} className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleStatusGroup(status)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{statusInfo.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pos.length} ใบสั่งซื้อ
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pos.length > 3 && (
                          <span className="text-sm text-muted-foreground">
                            {isExpanded ? 'แสดงทั้งหมด' : `แสดง ${displayPOs.length} จาก ${pos.length}`}
                          </span>
                        )}
                        {pos.length > 3 ? (
                          isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                        ) : null}
                      </div>
                    </div>
                    
                    {displayPOs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">{th.po.number}</TableHead>
                              <TableHead className="whitespace-nowrap">{th.po.supplier}</TableHead>
                              <TableHead className="whitespace-nowrap">{th.po.date}</TableHead>
                              <TableHead className="whitespace-nowrap">{th.po.requestedBy}</TableHead>
                              <TableHead className="text-right whitespace-nowrap">{th.po.total}</TableHead>
                              <TableHead className="text-center whitespace-nowrap">การดำเนินการ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayPOs.map((po) => (
                              <TableRow key={po.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium whitespace-nowrap">{po.id}</TableCell>
                                <TableCell className="whitespace-nowrap">{po.supplier}</TableCell>
                                <TableCell className="whitespace-nowrap">{new Date(po.date).toLocaleDateString("th-TH")}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="whitespace-nowrap">{po.requestedBy}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium thai-number whitespace-nowrap">
                                  ฿{po.total.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                    {po.status === "SENT" && (
                                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setOpenReceive(po)}>
                                        รับสินค้า
                                      </Button>
                                    )}
                                    {po.status === "CONFIRMED" && (
                                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setOpenReceive(po)}>
                                        รับสินค้า
                                      </Button>
                                    )}
                                    {po.status === "DRAFT" && (
                                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" disabled>
                                        รอการส่ง
                                      </Button>
                                    )}
                                    {po.status === "RECEIVED" && (
                                      <Badge variant="secondary">รับแล้ว</Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        ไม่มีใบสั่งซื้อในสถานะนี้
                      </div>
                    )}
                    
                    {!isExpanded && pos.length > 3 && (
                      <div className="p-4 pt-0 text-center">
                        <Button 
                          variant="ghost" 
                          className="text-primary"
                          onClick={() => toggleStatusGroup(status)}
                        >
                          แสดงทั้งหมด ({pos.length} รายการ)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {th.common.noData}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create PO Dialog - Multi-step process */}
      <Dialog open={openCreate} onOpenChange={(open) => {
        if (!open) resetCreatePO();
        else setOpenCreate(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {createStep === 1 && "เลือกผู้จำหน่าย"}
              {createStep === 2 && `เลือกวัตถุดิบจาก ${selectedSupplier?.name}`}
              {createStep === 3 && "ตรวจสอบและยืนยัน"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Step 1: Select Supplier */}
          {createStep === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                กรุณาเลือกผู้จำหน่ายที่คุณต้องการสั่งซื้อวัตถุดิบ
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {suppliers.filter(s => s.status === "ACTIVE").map((supplier) => (
                  <div 
                    key={supplier.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{supplier.phone}</p>
                        <p className="text-xs text-muted-foreground">{supplier.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpenCreate(false)}>ยกเลิก</Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Select Items */}
          {createStep === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                เลือกวัตถุดิบที่คุณต้องการสั่งซื้อจาก {selectedSupplier?.name}
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {supplierProducts.map((product) => {
                  const isSelected = selectedItems.some(item => item.product.id === product.id);
                  const quantity = quantities[product.id] || 1;
                  
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleItemSelect(product, !!checked)}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <Label htmlFor={`product-${product.id}`} className="font-medium">
                              {product.name}
                            </Label>
                            <span className="font-semibold text-primary">
                              ฿{product.price.toLocaleString()}/{product.unit}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm">จำนวน:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, quantity - 1);
                                }}
                                disabled={quantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, quantity + 1);
                                }}
                              >
                                +
                              </Button>
                              <span className="text-sm">
                                รวม: ฿{(product.price * quantity).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setCreateStep(1)}>
                  ย้อนกลับ
                </Button>
                <Button 
                  onClick={() => setCreateStep(3)}
                  disabled={selectedItems.length === 0}
                >
                  ถัดไป ({selectedItems.length} รายการ)
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Confirm */}
          {createStep === 3 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">สรุปรายการสั่งซื้อ</h3>
                <div className="flex justify-between text-sm">
                  <span>ผู้จำหน่าย:</span>
                  <span className="font-medium">{selectedSupplier?.name}</span>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วัตถุดิบ</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div>{item.product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.product.sku}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{item.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>รวมทั้งสิ้น:</span>
                  <span>
                    ฿{selectedItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setCreateStep(2)}>
                  ย้อนกลับ
                </Button>
                <Button onClick={createPO}>
                  สร้างใบสั่งซื้อ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Goods Dialog */}
      <Dialog open={!!openReceive} onOpenChange={() => setOpenReceive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกรับสินค้า</DialogTitle>
          </DialogHeader>
          <p>เลขที่: {openReceive?.id} | ร้าน: {openReceive?.supplier}</p>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpenReceive(null)}>ยกเลิก</Button>
            {openReceive && <Button className="w-full sm:w-auto" onClick={() => markReceived(openReceive)}>ยืนยันรับ</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
