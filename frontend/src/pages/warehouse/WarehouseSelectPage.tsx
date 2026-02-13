import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getWarehouses, type Warehouse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse as WarehouseIcon, Search, ArrowRight, BarChart3, Package, MapPin, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const WarehouseSelectPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [q, setQ] = useState("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["warehouses"],
        queryFn: getWarehouses,
    });

    const warehouses = useMemo(() => data ?? [], [data]);
    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return warehouses;
        return warehouses.filter((w) =>
            [w.WarehouseName, w.WarehouseCode, w.WarehouseAddress]
                .filter(Boolean)
                .some((v) => v!.toString().toLowerCase().includes(term))
        );
    }, [warehouses, q]);

    const handleSelect = (warehouse: Warehouse) => {
        // เก็บ warehouse ที่เลือกใน localStorage
        localStorage.setItem("selected_warehouse_id", String(warehouse.WarehouseId));
        localStorage.setItem("selected_warehouse_name", warehouse.WarehouseName || "");
        // ไปหน้า dashboard ของคลังนั้น
        navigate(`/warehouse/${warehouse.WarehouseId}/dashboard`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white items-center justify-center shadow-md">
                            <WarehouseIcon className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                เลือกคลังสินค้า
                            </h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                เลือกคลังที่ต้องการจัดการ เพื่อดูสต๊อก สั่งซื้อ และเบิกจ่าย
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {user?.CompanyName && (
                            <Badge variant="outline" className="text-xs">
                                บริษัท: {user.CompanyName}
                            </Badge>
                        )}
                        {user?.role === 'COMPANY_ADMIN' && (
                            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                                <Link to="/warehouse-management">
                                    <Settings className="h-3.5 w-3.5" />
                                    จัดการคลัง (สร้าง/แก้ไข/ลบ)
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">คลังทั้งหมด</p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-800">
                                    {isLoading ? <Skeleton className="h-9 w-12" /> : warehouses.length}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <WarehouseIcon className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">พร้อมจัดการ</p>
                                <h3 className="text-3xl font-bold mt-1 text-emerald-600">
                                    {isLoading ? <Skeleton className="h-9 w-12" /> : warehouses.length}
                                </h3>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-300">สวัสดี</p>
                                <h3 className="text-lg font-bold mt-1">{user?.UserName || "ผู้จัดการคลัง"}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">เลือกคลังด้านล่างเพื่อเริ่มงาน</p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-xl">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Warehouse Selection Table */}
                <Card className="border-none shadow-lg bg-white/90 backdrop-blur-xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg">คลังสินค้าในบริษัท</CardTitle>
                                <CardDescription>คลิกที่คลังเพื่อเข้าไปจัดการ</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    placeholder="ค้นหาคลัง..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isError ? (
                            <div className="py-12 text-center text-red-600">โหลดข้อมูลคลังไม่สำเร็จ กรุณาลองใหม่</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[200px]">ชื่อคลัง</TableHead>
                                            <TableHead className="min-w-[120px]">รหัสคลัง</TableHead>
                                            <TableHead className="min-w-[200px]">ที่อยู่</TableHead>
                                            <TableHead className="w-[140px] text-right">เลือก</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading &&
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={`sk-${i}`}>
                                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-56" /></TableCell>
                                                    <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))}
                                        {!isLoading && filtered.map((w) => (
                                            <TableRow
                                                key={w.WarehouseId}
                                                className="group hover:bg-blue-50/60 cursor-pointer transition-colors"
                                                onClick={() => handleSelect(w)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <span className="hidden sm:flex h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 items-center justify-center shrink-0">
                                                            <WarehouseIcon className="h-5 w-5" />
                                                        </span>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                                                {w.WarehouseName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">ID: {w.WarehouseId}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {w.WarehouseCode || "-"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate max-w-[300px]">{w.WarehouseAddress || "-"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelect(w);
                                                        }}
                                                    >
                                                        เข้าจัดการ
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!isLoading && filtered.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-12">
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <WarehouseIcon className="h-10 w-10 text-slate-300" />
                                                        <p className="font-medium">
                                                            {q ? "ไม่พบคลังที่ตรงกับคำค้น" : "ยังไม่มีคลังในบริษัท"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WarehouseSelectPage;
