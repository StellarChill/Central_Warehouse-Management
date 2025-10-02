import { 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { th } from "@/i18n/th";
import { useState } from "react";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - in real app this would come from API
  const stats = [
    {
      title: th.dashboard.stats.totalPOs,
      value: "156",
      icon: ShoppingCart,
      trend: "+12%",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: th.dashboard.stats.totalSuppliers,
      value: "42",
      icon: Users,
      trend: "+2%",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: th.dashboard.stats.lowStock,
      value: "8",
      icon: AlertTriangle,
      trend: "-3%",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "po_approved",
      message: "ใบสั่งซื้อ PO-2024-001 ได้รับอนุมัติแล้ว",
      time: "5 นาทีที่แล้ว",
      status: "success",
    },
    {
      id: 2,
      type: "grn_posted",
      message: "บันทึกใบรับสินค้า GRN-2024-045 เรียบร้อยแล้ว",
      time: "15 นาทีที่แล้ว",
      status: "info",
    },
    {
      id: 3,
      type: "req_submitted",
      message: "สาขาลาดพร้าวส่งใบเบิก REQ-2024-089",
      time: "30 นาทีที่แล้ว",
      status: "warning",
    },
    {
      id: 4,
      type: "low_stock",
      message: "สินค้า \"น้ำดื่ม 600ml\" เหลือน้อย (10 ขวด)",
      time: "1 ชั่วโมงที่แล้ว",
      status: "error",
    },
  ];

  const quickActions = [
    {
      id: "createPO",
      title: th.dashboard.actions.createPO,
      description: "สร้างใบสั่งซื้อใหม่",
      icon: Plus,
      color: "primary",
      href: "/purchase-orders/create",
    },
    {
      id: "receiveGoods",
      title: th.dashboard.actions.receiveGoods,
      description: "บันทึกการรับสินค้า",
      icon: Package,
      color: "success",
      href: "/receiving/create",
    },
    {
      id: "createRequisition",
      title: th.dashboard.actions.createRequisition,
      description: "สร้างใบเบิกสินค้า",
      icon: FileText,
      color: "info",
      href: "/requisitions/create",
    },
    {
      id: "viewReports",
      title: th.dashboard.actions.viewReports,
      description: "ดูรายงานประจำเดือน",
      icon: Eye,
      color: "accent",
      href: "/reports",
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
          <Card key={index} className="hover:shadow-premium transition-all border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-success mr-1" />
                    <span className="text-sm text-success">{stat.trend}</span>
                  </div>
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
        <Card className="border-amber-200 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {th.dashboard.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
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
        <Card className="border-amber-200 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {th.dashboard.quickActions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 justify-start hover:bg-amber-50 hover:border-amber-200 border-amber-200 shadow-sm"
                  asChild
                >
                  <a href={action.href}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${action.color}/10`}>
                        <action.icon className={`h-5 w-5 text-${action.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm text-amber-900">{action.title}</div>
                        <div className="text-xs text-amber-700">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card className="border-amber-200 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {th.dashboard.stats.monthlyValue}
            </span>
            <Badge variant="secondary" className="text-lg font-bold bg-amber-100 text-amber-900">
              ฿2,450,000
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">124</div>
              <div className="text-sm text-muted-foreground">ใบสั่งซื้อสำเร็จ</div>
            </div>
            <div className="text-center p-4 bg-info/10 rounded-lg border border-info/20">
              <div className="text-2xl font-bold text-info">89</div>
              <div className="text-sm text-muted-foreground">ใบรับสินค้า</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">156</div>
              <div className="text-sm text-muted-foreground">ใบเบิกสินค้า</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}