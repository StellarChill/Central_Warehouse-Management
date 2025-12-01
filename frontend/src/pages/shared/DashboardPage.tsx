import {
  ClipboardSignature,
  Factory,
  ShieldAlert,
  ClipboardPlus,
  Truck,
  FileBox,
  ChartBar,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { th } from "../i18n/th";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStockSummary as apiGetStockSummary, getPurchaseOrders as apiGetPOs, getSuppliers as apiGetSuppliers, getReceipts as apiGetReceipts } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [totalPOs, setTotalPOs] = useState<number>(0);
  const [totalSuppliers, setTotalSuppliers] = useState<number>(0);
  const { toast } = useToast();
  const [activities, setActivities] = useState<Array<{ id: string; message: string; time: string; status: 'success' | 'warning' | 'error' | 'info' }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [summary, pos, sups, receipts] = await Promise.all([
          apiGetStockSummary(),
          apiGetPOs(),
          apiGetSuppliers(),
          apiGetReceipts(),
        ]);
        setLowStockCount(summary.filter((row) => Number(row.TotalRemain) < 5).length);
        setTotalPOs(pos.length);
        setTotalSuppliers(sups.length);

        // Build recent activities from latest POs and Receipts
        const poEvents = pos
          .slice()
          .sort((a, b) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime())
          .slice(0, 5)
          .map((p) => ({
            id: `po-${p.PurchaseOrderId}`,
            message: `ใบสั่งซื้อ ${p.PurchaseOrderCode} (${p.PurchaseOrderStatus})`,
            time: timeAgo(new Date(p.DateTime)),
            status: (p.PurchaseOrderStatus === 'RECEIVED' ? 'success' : p.PurchaseOrderStatus === 'CONFIRMED' ? 'info' : 'warning') as 'success' | 'info' | 'warning',
          }));
        const rcEvents = receipts
          .slice()
          .sort((a, b) => new Date(b.ReceiptDateTime).getTime() - new Date(a.ReceiptDateTime).getTime())
          .slice(0, 5)
          .map((r) => ({
            id: `rc-${r.ReceiptId}`,
            message: `บันทึกใบรับ ${r.ReceiptCode} (${r.PurchaseOrderCode || '-'})`,
            time: timeAgo(new Date(r.ReceiptDateTime)),
            status: 'success' as const,
          }));
        const merged = [...poEvents, ...rcEvents]
          .sort((a, b) => fromAgo(a.time) - fromAgo(b.time))
          .slice(0, 8);
        setActivities(merged);
      } catch (e: any) {
        // keep default when API fails
        toast({ variant: 'destructive', title: 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ', description: e?.message || '' });
      }
    })();
  }, []);

  function timeAgo(date: Date) {
    const diff = Math.max(0, Date.now() - date.getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    const d = Math.floor(h / 24);
    return `${d} วันที่แล้ว`;
  }
  // for sorting by recency when using timeAgo strings; smaller value means newer
  function fromAgo(text: string) {
    if (text === 'เมื่อสักครู่') return 0;
    const n = Number(text.split(' ')[0]);
    if (text.includes('นาที')) return n;
    if (text.includes('ชั่วโมง')) return n * 60;
    if (text.includes('วัน')) return n * 24 * 60;
    return Number.MAX_SAFE_INTEGER;
  }

  // Mock data - in real app this would come from API
  const stats = [
    {
      title: th.dashboard.stats.totalPOs,
      value: String(totalPOs),
      icon: ClipboardSignature,
      trend: "+12%",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: th.dashboard.stats.totalSuppliers,
      value: String(totalSuppliers),
      icon: Factory,
      trend: "+2%",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: th.dashboard.stats.lowStock,
      value: String(lowStockCount),
      icon: ShieldAlert,
      trend: "-3%",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  // recent activities now come from API (POs and Receipts)

  const quickActions = [
    {
      id: "createPO",
      title: th.dashboard.actions.createPO,
      description: "สร้างใบสั่งซื้อใหม่",
      icon: ClipboardPlus,
      color: "primary",
      href: "/purchase-orders",
    },
    {
      id: "receiveGoods",
      title: th.dashboard.actions.receiveGoods,
      description: "บันทึกการรับสินค้า",
      icon: Truck,
      color: "success",
      href: "/receiving",
    },
    {
      id: "createRequisition",
      title: th.dashboard.actions.createRequisition,
      description: "สร้างใบเบิกสินค้า",
      icon: FileBox,
      color: "info",
      href: "/requisitions/create",
    },
    {
      id: "viewReports",
      title: th.dashboard.actions.viewReports,
      description: "ดูรายงานประจำเดือน",
      icon: ChartBar,
      color: "accent",
      href: "/admin/reports",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "status-success";
      case "warning": return "status-warning";
      case "error": return "status-error";
      case "info": return "status-info";
      default: return "status-pending";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Date Filter */}
      <div className="gradient-primary rounded-xl p-6 text-white shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              ยินดีต้อนรับสู่ระบบจัดการผู้จำหน่าย
            </h1>
            <p className="text-white/80">
              ติดตามการดำเนินงานและจัดการข้อมูลได้อย่างมีประสิทธิภาพ
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium whitespace-nowrap">
                {formatDate(selectedDate)}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-premium transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {th.dashboard.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <Badge className={`${getStatusColor(activity.status)} shrink-0`} variant="outline">
                    ●
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardPlus className="h-5 w-5" />
              {th.dashboard.quickActions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 justify-start hover:bg-accent shadow-sm"
                  asChild
                >
                  <Link to={action.href}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${action.color}/10`}>
                        <action.icon className={`h-5 w-5 text-${action.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
    
    </div>
  );
}