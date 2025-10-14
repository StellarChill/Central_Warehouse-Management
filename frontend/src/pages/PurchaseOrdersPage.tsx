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
import { th } from "../i18n/th";
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

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);

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

  // Mock PO items data
  const poItems: Record<string, POItem[]> = {
    "PO-2024-001": [
      { product: products[0], quantity: 100, price: 45, total: 4500 },
      { product: products[3], quantity: 50, price: 40, total: 2000 },
      { product: products[6], quantity: 80, price: 180, total: 14400 },
      { product: products[8], quantity: 2000, price: 2, total: 4000 },
      { product: products[10], quantity: 100, price: 65, total: 6500 },
    ],
    "PO-2024-002": [
      { product: products[1], quantity: 50, price: 65, total: 3250 },
      { product: products[4], quantity: 30, price: 50, total: 1500 },
      { product: products[7], quantity: 40, price: 190, total: 7600 },
    ],
    "PO-2024-003": [
      { product: products[2], quantity: 80, price: 55, total: 4400 },
      { product: products[5], quantity: 60, price: 42, total: 2520 },
      { product: products[9], quantity: 1500, price: 3, total: 4500 },
      { product: products[11], quantity: 120, price: 55, total: 6600 },
      { product: products[13], quantity: 40, price: 250, total: 10000 },
      { product: products[14], quantity: 30, price: 300, total: 9000 },
      { product: products[16], quantity: 20, price: 35, total: 700 },
      { product: products[18], quantity: 15, price: 80, total: 1200 },
    ],
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
        po.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
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
        <Button className="gap-2 w-full sm:w-auto">
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
          {Object.keys(groupedPOs).length > 0 ? (
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
                                <TableCell className="whitespace-nowrap">{po.items}</TableCell>
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
                                      onClick={() => {
                                        setSelectedPO(po);
                                        setViewDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full sm:w-auto hover:bg-accent"
                                      onClick={() => {
                                        setSelectedPO(po);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
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
    </div>
  );
}