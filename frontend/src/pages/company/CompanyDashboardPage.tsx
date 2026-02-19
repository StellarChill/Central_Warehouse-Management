
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockSummary, getStocks, type StockSummaryRow, type Stock, getWarehouses } from "@/lib/api";
import { Warehouse as WarehouseIcon, Boxes, ShieldAlert, Truck, Route, RefreshCcw, TriangleAlert, Gauge, Building2, Store } from "lucide-react";
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

const CompanyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch data for ALL warehouses (no warehouseId param passed)
  const summaryQuery = useQuery<StockSummaryRow[]>({
    queryKey: ["stock-summary", "all"],
    queryFn: () => getStockSummary(),
  });

  const stocksQuery = useQuery<Stock[]>({
    queryKey: ["stocks", "all"],
    queryFn: () => getStocks(),
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => getWarehouses(),
  });

  const isLoading = summaryQuery.isLoading || stocksQuery.isLoading || warehousesQuery.isLoading;
  const hasError = summaryQuery.isError || stocksQuery.isError || warehousesQuery.isError;

  const rawSummary = summaryQuery.data ?? [];
  const stocks = stocksQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  // Data processing: Aggregate summary by MaterialId
  const aggregatedSummary = useMemo(() => {
    const map = new Map<number, StockSummaryRow>();

    // Group by MaterialId and sum quantities
    rawSummary.forEach(row => {
      if (map.has(row.MaterialId)) {
        const existing = map.get(row.MaterialId)!;
        map.set(row.MaterialId, {
          ...existing,
          TotalQuantity: Number(existing.TotalQuantity) + Number(row.TotalQuantity),
          TotalRemain: Number(existing.TotalRemain) + Number(row.TotalRemain),
        });
      } else {
        map.set(row.MaterialId, { ...row });
      }
    });

    return Array.from(map.values());
  }, [rawSummary]);

  const metrics = useMemo(() => {
    const totalSku = aggregatedSummary.length;
    const totalRemain = aggregatedSummary.reduce((sum, row) => sum + Number(row.TotalRemain ?? 0), 0);
    const totalUsed = aggregatedSummary.reduce(
      (sum, row) => sum + Math.max(Number(row.TotalQuantity ?? 0) - Number(row.TotalRemain ?? 0), 0),
      0
    );
    // Count materials across ALL warehouses that are low
    const lowStockCount = aggregatedSummary.filter((row) => Number(row.TotalRemain ?? 0) <= LOW_STOCK_THRESHOLD).length;

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
      warehouseCount: warehouses.length,
    };
  }, [aggregatedSummary, stocks, warehouses]);

  const movementData = useMemo(() => {
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - (MOVEMENT_DAYS - 1));
    const inboundMap = new Map<string, number>();
    const outboundMap = new Map<string, number>();

    stocks.forEach((stock) => {
      const createdDay = startOfDay(new Date(stock.CreatedAt));
      // Only include recent
      if (createdDay < start) return;

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
    return aggregatedSummary
      .filter((row) => Number(row.TotalRemain ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => Number(a.TotalRemain ?? 0) - Number(b.TotalRemain ?? 0))
      .slice(0, 5);
  }, [aggregatedSummary]);

  const recentInbound = useMemo(() => {
    return stocks
      .slice()
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()) // Sort by newest first
      .slice(0, 5) // Increased to 5
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
    return aggregatedSummary
      .map((row) => ({
        id: row.MaterialId,
        name: row.MaterialName,
        unit: row.Unit,
        used: Math.max(Number(row.TotalQuantity ?? 0) - Number(row.TotalRemain ?? 0), 0),
      }))
      .filter((row) => row.used > 0)
      .sort((a, b) => b.used - a.used)
      .slice(0, 5); // Increased to 5
  }, [aggregatedSummary]);

  const handleRefresh = () => {
    summaryQuery.refetch();
    stocksQuery.refetch();
    warehousesQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">ภาพรวมทุกคลังสินค้า (Global Dashboard)</h1>
              <p className="text-slate-500 text-sm mt-1">ข้อมูลรวมจากทั้งหมด {metrics.warehouseCount || '...'} คลังสินค้าในระบบ</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-indigo-100 text-indigo-700">
                  {user?.CompanyName || 'My Company'}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  All Warehouses
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2 h-10 border-slate-200 hover:bg-white hover:text-indigo-600 shadow-sm">
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              อัปเดตข้อมูล
            </Button>
          </div>
        </div>

        {hasError && (
          <Card className="border-red-100 bg-red-50/50">
            <CardContent className="py-6 flex flex-col items-center justify-center gap-3 text-sm text-red-600">
              <div className="flex items-center gap-2 font-bold text-lg">
                <TriangleAlert className="h-5 w-5" /> โหลดข้อมูลไม่สำเร็จ
              </div>
              <p className="text-red-500">กรุณาลองใหม่อีกครั้ง</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2 border-red-200 hover:bg-red-50 hover:text-red-700">ลองใหม่</Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={`sk-${idx}`} className="border-none shadow-premium bg-white">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-4 w-1/3 rounded-full" />
                  <Skeleton className="h-8 w-1/2 rounded-lg" />
                  <Skeleton className="h-3 w-1/4 rounded-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                icon={Store}
                label="จำนวนคลังสินค้า"
                value={formatNumber(metrics.warehouseCount)}
                helper="คลังทั้งหมดในระบบ"
                color="indigo"
              />
              <StatCard
                icon={Boxes}
                label="รายการวัตถุดิบรวม"
                value={formatNumber(metrics.totalSku)}
                helper="SKU ที่มีในระบบ"
                color="blue"
              />
              <StatCard
                icon={Gauge}
                label="คงเหลือรวมทุกคลัง"
                value={formatNumber(metrics.totalRemain)}
                helper="ชิ้น/หน่วย รวมกัน"
                color="emerald"
              />
              <StatCard
                icon={ShieldAlert}
                label="รายการใกล้หมด"
                value={formatNumber(metrics.lowStockCount)}
                helper={`ต่ำกว่า ${LOW_STOCK_THRESHOLD} หน่วย (รวม)`}
                color="amber"
              />
            </>
          )}
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Movement Chart */}
          <Card className="lg:col-span-2 border-none shadow-premium bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Route className="h-4 w-4 text-indigo-500" /> การเคลื่อนไหวรวม (7 วันล่าสุด)
                  </CardTitle>
                  <CardDescription>ปริมาณนำเข้า / ใช้งาน รวมทุกคลังแยกตามวัน</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={movementData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="inbound"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                        name="นำเข้า"
                      />
                      <Line
                        type="monotone"
                        dataKey="outbound"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 2 }}
                        name="ใช้ไป"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card className="border-none shadow-premium bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">สถานะโดยรวม</CardTitle>
              <CardDescription>สรุปตัวเลขทั้งบริษัท</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={`sk-status-${idx}`} className="h-6 w-full rounded-lg" />)
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-500 group-hover:text-slate-800 transition-colors">คงเหลือรวม</span>
                      <span className="font-bold text-lg text-slate-800">{formatNumber(metrics.totalRemain)}</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-500 group-hover:text-slate-800 transition-colors">ใช้ไปทั้งหมด</span>
                      <span className="font-bold text-lg text-rose-600">{formatNumber(metrics.totalUsed)}</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-500 group-hover:text-slate-800 transition-colors">จำนวน SKU</span>
                      <span className="font-bold text-lg text-indigo-600">{formatNumber(metrics.totalSku)}</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-500 group-hover:text-slate-800 transition-colors">รับเข้า (7 วัน)</span>
                      <span className="font-bold text-lg text-emerald-600">{formatNumber(metrics.inboundReceipts)} <span className="text-xs font-normal text-slate-400">รายการ</span></span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed text-center">
                      ข้อมูลนี้เป็นการคำนวณรวมจากทุกคลังสินค้าในระบบเพื่อแสดงภาพรวมของบริษัท
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Low Stock */}
          <Card className="border-none shadow-premium bg-gradient-to-br from-amber-50/50 to-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-700">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> วัตถุดิบใกล้หมด (รวมทุกคลัง)
              </CardTitle>
              <CardDescription>ตรวจสอบด่วน รายการที่คงเหลือน้อยทั่วองค์กร</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={`sk-low-${idx}`} className="h-14 w-full rounded-xl" />
                ))
              ) : lowStockItems.length ? (
                lowStockItems.map((item) => (
                  <div key={item.MaterialId} className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">{item.MaterialName}</p>
                      <p className="text-xs font-medium text-slate-400">เหลือรวม {formatNumber(item.TotalRemain)} {item.Unit || ''}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-bold px-3 py-1">วิกฤต</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm bg-white/50 rounded-xl border border-dashed border-slate-200">
                  ไม่พบรายการที่ต่ำกว่าเกณฑ์
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent & Usage */}
          <Card className="lg:col-span-2 border-none shadow-premium bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
              <CardTitle className="text-base font-bold text-slate-800">กิจกรรมล่าสุดในระบบ</CardTitle>
              <CardDescription>ความเคลื่อนไหวล่าสุดจากทุกจุดปฏิบัติงาน</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Inbound */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                  <Truck className="h-3 w-3" /> รับเข้าล่าสุด
                </h4>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => <Skeleton key={`sk-in-${idx}`} className="h-16 w-full rounded-xl" />)
                ) : recentInbound.length ? (
                  recentInbound.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-700">{item.material}</p>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-bold text-emerald-600">+{formatNumber(item.quantity)} {item.unit}</span>
                        {item.receiptId && <span className="text-slate-300">|</span>}
                        {item.receiptId && <span>RC-{item.receiptId}</span>}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">ยังไม่มีข้อมูลการรับเข้า</p>
                )}
              </div>

              {/* Outbound */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-rose-600 flex items-center gap-2 bg-rose-50 w-fit px-3 py-1 rounded-full">
                  <Route className="h-3 w-3" /> ใช้งานสูงสุด (Top Usage)
                </h4>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => <Skeleton key={`sk-out-${idx}`} className="h-16 w-full rounded-xl" />)
                ) : topConsumptions.length ? (
                  topConsumptions.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-rose-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-slate-700">{item.name}</p>
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-none font-bold">
                          -{formatNumber(item.used)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">ใช้ไปทั้งหมด ({item.unit})</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">ยังไม่มีข้อมูลการใช้งาน</p>
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
  color?: "indigo" | "blue" | "emerald" | "amber" | "rose" | "purple";
};

function StatCard({ icon: Icon, label, value, helper, color = "indigo" }: StatCardProps) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="border-none shadow-premium bg-white hover:shadow-premium-hover transition-all duration-300 group cursor-default">
      <CardContent className="p-6 flex items-start justify-between">
        <div className="space-y-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${colorStyles[color]} transition-transform group-hover:scale-110 duration-300 shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
            {helper && <p className="text-xs text-slate-400 font-medium">{helper}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompanyDashboardPage;
