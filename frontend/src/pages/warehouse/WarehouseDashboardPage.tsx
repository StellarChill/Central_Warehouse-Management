import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getWarehouse, getStockSummary, getStocks, type Warehouse, type StockSummaryRow, type Stock } from "@/lib/api";
import { Warehouse as WarehouseIcon, Boxes, ShieldAlert, Truck, Route, ArrowLeft, RefreshCcw, TriangleAlert, Gauge } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const LOW_STOCK_THRESHOLD = 10;
const MOVEMENT_DAYS = 7;
const dayShort = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateTime = (value: string | Date) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(Number(value || 0));

const WarehouseDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const warehouseQuery = useQuery<Warehouse>({
    queryKey: ["warehouse", warehouseId],
    queryFn: () => getWarehouse(warehouseId),
    enabled: Number.isFinite(warehouseId),
  });

  const summaryQuery = useQuery<StockSummaryRow[]>({
    queryKey: ["stock-summary", warehouseId],
    queryFn: () => getStockSummary({ warehouseId }),
    enabled: Number.isFinite(warehouseId),
  });

  const stocksQuery = useQuery<Stock[]>({
    queryKey: ["stocks", warehouseId],
    queryFn: () => getStocks({ warehouseId }),
    enabled: Number.isFinite(warehouseId),
  });

  const isLoading = warehouseQuery.isLoading || summaryQuery.isLoading || stocksQuery.isLoading;
  const hasError = warehouseQuery.isError || summaryQuery.isError || stocksQuery.isError;

  const summary = summaryQuery.data ?? [];
  const stocks = stocksQuery.data ?? [];

  const metrics = useMemo(() => {
    const totalSku = summary.length;
    const totalRemain = summary.reduce((sum, row) => sum + Number(row.TotalRemain ?? 0), 0);
    const totalUsed = summary.reduce(
      (sum, row) => sum + Math.max(Number(row.TotalQuantity ?? 0) - Number(row.TotalRemain ?? 0), 0),
      0
    );
    const lowStockCount = summary.filter((row) => Number(row.TotalRemain ?? 0) <= LOW_STOCK_THRESHOLD).length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const inboundReceiptIds = new Set<number>();
    stocks.forEach((stock) => {
      const created = new Date(stock.CreatedAt);
      if (created >= sevenDaysAgo && stock.ReceiptId) {
        inboundReceiptIds.add(stock.ReceiptId);
      }
    });
    return {
      totalSku,
      totalRemain,
      totalUsed,
      lowStockCount,
      inboundReceipts: inboundReceiptIds.size,
    };
  }, [summary, stocks]);

  const movementData = useMemo(() => {
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - (MOVEMENT_DAYS - 1));
    const inboundMap = new Map<string, number>();
    const outboundMap = new Map<string, number>();
    stocks.forEach((stock) => {
      const createdDay = startOfDay(new Date(stock.CreatedAt));
      const key = createdDay.toISOString().slice(0, 10);
      inboundMap.set(key, (inboundMap.get(key) ?? 0) + Number(stock.Quantity ?? 0));
      const used = Math.max(Number(stock.Quantity ?? 0) - Number(stock.Remain ?? 0), 0);
      if (used > 0) {
        outboundMap.set(key, (outboundMap.get(key) ?? 0) + used);
      }
    });

    return Array.from({ length: MOVEMENT_DAYS }).map((_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      const key = day.toISOString().slice(0, 10);
      return {
        day: dayShort[day.getDay()] ?? key,
        inbound: inboundMap.get(key) ?? 0,
        outbound: outboundMap.get(key) ?? 0,
      };
    });
  }, [stocks]);

  const lowStockItems = useMemo(() => {
    return summary
      .filter((row) => Number(row.TotalRemain ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => Number(a.TotalRemain ?? 0) - Number(b.TotalRemain ?? 0))
      .slice(0, 5);
  }, [summary]);

  const recentInbound = useMemo(() => {
    return stocks
      .slice()
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
      .slice(0, 4)
      .map((stock) => ({
        id: stock.StockId,
        material: stock.MaterialName || `รหัส ${stock.MaterialId}`,
        quantity: stock.Quantity,
        unit: stock.Unit,
        createdAt: stock.CreatedAt,
        receiptId: stock.ReceiptId,
      }));
  }, [stocks]);

  const topConsumptions = useMemo(() => {
    return summary
      .map((row) => ({
        id: row.MaterialId,
        name: row.MaterialName,
        unit: row.Unit,
        used: Math.max(Number(row.TotalQuantity ?? 0) - Number(row.TotalRemain ?? 0), 0),
      }))
      .filter((row) => row.used > 0)
      .sort((a, b) => b.used - a.used)
      .slice(0, 4);
  }, [summary]);

  const handleRefresh = () => {
    warehouseQuery.refetch();
    summaryQuery.refetch();
    stocksQuery.refetch();
  };

  const enterOperations = () => {
    const role = user?.role;
    if (!role) return;
    if (["COMPANY_ADMIN", "PLATFORM_ADMIN", "PLATFORM_STAFF", "ADMIN", "WAREHOUSE_ADMIN"].includes(role)) {
      navigate(`/admin-company/${id}`);
    } else {
      navigate(`/warehouse-manager/${id}`);
    }
  };

  if (!Number.isFinite(warehouseId)) {
    return <div className="p-6 text-red-600">กรุณาเลือกคลังที่ต้องการดูข้อมูล</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 rounded-lg bg-blue-50 text-blue-600 items-center justify-center shadow-sm">
              <WarehouseIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">ภาพรวมคลัง</h1>
              <p className="text-slate-500 text-sm">คำนวณจากข้อมูลจริงของคลังนี้</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {warehouseQuery.data?.WarehouseName && (
                  <Badge variant="outline">{warehouseQuery.data.WarehouseName}</Badge>
                )}
                <Badge variant="secondary">คลัง ID: {warehouseId}</Badge>
                {warehouseQuery.data?.WarehouseCode && (
                  <Badge variant="outline" className="font-mono">รหัส: {warehouseQuery.data.WarehouseCode}</Badge>
                )}
                {user?.CompanyName && (
                  <Badge variant="outline">บริษัท: {user.CompanyName}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> รีเฟรช
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> กลับ
            </Button>
         
          </div>
        </div>

        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-5 flex flex-col gap-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="h-4 w-4" /> โหลดข้อมูลไม่สำเร็จ
              </div>
              <p>กรุณาลองรีเฟรชอีกครั้ง หรือกลับไปหลังบ้าน</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="w-fit">ลองใหม่</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={`sk-${idx}`} className="hover:shadow-sm transition">
                <CardContent className="py-6 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard icon={Boxes} label="จำนวนวัตถุดิบ" value={formatNumber(metrics.totalSku)} helper="SKU ทั้งหมดในคลัง" />
              <StatCard icon={Gauge} label="ปริมาณคงเหลือรวม" value={formatNumber(metrics.totalRemain)} helper="รวมทุกหน่วย" />
              <StatCard icon={ShieldAlert} label="ใกล้หมดสต๊อก" value={formatNumber(metrics.lowStockCount)} helper={`ต่ำกว่า ${LOW_STOCK_THRESHOLD} หน่วย`} />
              <StatCard icon={Truck} label="รับเข้าใน 7 วัน" value={formatNumber(metrics.inboundReceipts)} helper="นับตามใบรับเข้า" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Route className="h-4 w-4 text-slate-500" /> การเคลื่อนไหว 7 วันล่าสุด
              </CardTitle>
              <CardDescription>ปริมาณนำเข้า / ใช้งานแยกตามวัน</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={movementData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="inbound" stroke="#2563eb" strokeWidth={2} dot={false} name="นำเข้า" />
                      <Line type="monotone" dataKey="outbound" stroke="#dc2626" strokeWidth={2} dot={false} name="ใช้ไป" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">สถานะคลัง</CardTitle>
              <CardDescription>สรุปข้อมูลปัจจุบัน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={`sk-status-${idx}`} className="h-5 w-full" />)
              ) : (
                <>
                  <div className="flex justify-between"><span>คงเหลือรวม</span><span className="font-semibold">{formatNumber(metrics.totalRemain)}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span>ใช้ไปทั้งหมด</span><span className="font-semibold">{formatNumber(metrics.totalUsed)}</span></div>
                  <div className="flex justify-between"><span>จำนวน SKU</span><span className="font-semibold">{formatNumber(metrics.totalSku)}</span></div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">ข้อมูลคำนวณจากสต๊อกและการเบิกของคลังนี้เท่านั้น</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> วัสดุที่ใกล้หมด
              </CardTitle>
              <CardDescription>เรียงจากคงเหลือน้อยสุด</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`sk-low-${idx}`} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))
              ) : lowStockItems.length ? (
                lowStockItems.map((item) => (
                  <div key={item.MaterialId} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.MaterialName}</p>
                      <p className="text-xs text-muted-foreground">คงเหลือ {formatNumber(item.TotalRemain)} {item.Unit || ''}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-200">เตือน</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">ยังไม่มีวัสดุที่ต่ำกว่าเกณฑ์</p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">กิจกรรมล่าสุด</CardTitle>
              <CardDescription>อ้างอิงจากประวัติการรับเข้าและการใช้งาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">รับเข้า</h4>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => <Skeleton key={`sk-in-${idx}`} className="h-12 w-full" />)
                ) : recentInbound.length ? (
                  recentInbound.map((item) => (
                    <div key={item.id} className="rounded-lg border px-3 py-2 mb-3 last:mb-0">
                      <p className="text-sm font-medium">{item.material}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(item.quantity)} {item.unit} · {formatDateTime(item.createdAt)} {item.receiptId ? `· RC-${item.receiptId}` : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการรับเข้าล่าสุด</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">การใช้งานสูงสุด</h4>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => <Skeleton key={`sk-out-${idx}`} className="h-12 w-full" />)
                ) : topConsumptions.length ? (
                  topConsumptions.map((item) => (
                    <div key={item.id} className="rounded-lg border px-3 py-2 mb-3 last:mb-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ใช้ไป {formatNumber(item.used)} {item.unit || ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลการใช้งาน</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

type StatCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper?: string;
};

function StatCard({ icon: Icon, label, value, helper }: StatCardProps) {
  return (
    <Card className="hover:shadow-sm transition">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
        {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
      </CardContent>
    </Card>
  );
}

export default WarehouseDashboardPage;
