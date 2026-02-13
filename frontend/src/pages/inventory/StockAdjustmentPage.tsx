import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getStocks, getStockAdjustments, createStockAdjustment, getWarehouses, type Stock, type Warehouse, type StockAdjustment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, History, PackageCheck, ArrowUpDown } from "lucide-react";

export default function StockAdjustmentPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State for Warehouse Selection
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(() => {
        const stored = localStorage.getItem('selected_warehouse_id');
        return stored && stored !== 'all' ? Number(stored) : null;
    });

    // Fetch Warehouses if user can select multiple
    const { data: warehouses } = useQuery({
        queryKey: ["warehouses"],
        queryFn: getWarehouses,
        enabled: ["COMPANY_ADMIN", "ADMIN", "WH_MANAGER"].includes(user?.role || ""),
    });

    // Helper to handle warehouse change
    const handleWarehouseChange = (val: string) => {
        const id = Number(val);
        setSelectedWarehouseId(id);
        localStorage.setItem('selected_warehouse_id', val);
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
    };

    // Ensure we have a warehouse selected to operate
    // If user is WH_MANAGER but hasn't selected a warehouse, and warehouses are loaded, pick first?
    // Or force them to select. Let's show a prompt if null.

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ปรับปรุงยอดสต็อก (Stock Adjustment)</h1>
                    <p className="text-muted-foreground">แก้ไขจำนวนสินค้าในคลัง กรณีชำรุด สูญหาย หรือนับไม่ตรง</p>
                </div>

                {warehouses && warehouses.length > 0 && (
                    <div className="w-[250px]">
                        <Label>เลือกคลังสินค้า</Label>
                        <Select
                            value={selectedWarehouseId ? String(selectedWarehouseId) : undefined}
                            onValueChange={handleWarehouseChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกคลังสินค้า" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => (
                                    <SelectItem key={w.WarehouseId} value={String(w.WarehouseId)}>
                                        {w.WarehouseName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {!selectedWarehouseId ? (
                <div className="border rounded-lg p-10 text-center bg-muted/20">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">กรุณาเลือกคลังสินค้า</h3>
                    <p className="text-muted-foreground">คุณต้องเลือกคลังสินค้าก่อนทำการปรับปรุงยอด</p>
                </div>
            ) : (
                <MainContent
                    warehouseId={selectedWarehouseId}
                    warehouseName={warehouses?.find(w => w.WarehouseId === selectedWarehouseId)?.WarehouseName || ""}
                />
            )}
        </div>
    );
}

function MainContent({ warehouseId, warehouseName }: { warehouseId: number, warehouseName: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    // Queries
    const stocksQuery = useQuery({
        queryKey: ["stocks", warehouseId],
        queryFn: () => getStocks({ warehouseId }),
    });

    const historyQuery = useQuery({
        queryKey: ["stock-adjustments", warehouseId],
        queryFn: () => getStockAdjustments({ warehouseId }),
    });

    // Mutation
    const adjustMutation = useMutation({
        mutationFn: createStockAdjustment,
        onSuccess: () => {
            toast({ title: "บันทึกสำเร็จ", description: "ยอดสต็อกถูกปรับปรุงแล้ว" });
            setAdjustDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["stocks", warehouseId] });
            queryClient.invalidateQueries({ queryKey: ["stock-adjustments", warehouseId] });
            setSelectedStock(null);
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "เกิดข้อผิดพลาด",
                description: err?.error || "ไม่สามารถปรับปรุงยอดได้"
            });
        }
    });

    return (
        <Tabs defaultValue="stocks" className="space-y-4">
            <TabsList>
                <TabsTrigger value="stocks" className="gap-2"><PackageCheck className="h-4 w-4" /> สินค้าคงเหลือ</TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> ประวัติการปรับปรุง</TabsTrigger>
            </TabsList>

            <TabsContent value="stocks">
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>รหัสสินค้า</TableHead>
                                <TableHead>ชื่อสินค้า</TableHead>
                                <TableHead className="text-right">คงเหลือปัจจุบัน</TableHead>
                                <TableHead>หน่วย</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stocksQuery.isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                            ) : stocksQuery.data?.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">ไม่มีสินค้าในคลังนี้</TableCell></TableRow>
                            ) : (
                                stocksQuery.data?.map((stock) => (
                                    <TableRow key={stock.StockId}>
                                        <TableCell className="font-mono">{stock.Material?.MaterialCode || stock.Barcode}</TableCell>
                                        <TableCell className="font-medium">{stock.MaterialName || stock.Material?.MaterialName}</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{stock.Remain}</TableCell>
                                        <TableCell>{stock.Unit}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSelectedStock(stock);
                                                setAdjustDialogOpen(true);
                                            }}>
                                                <ArrowUpDown className="h-4 w-4 mr-1" /> ปรับยอด
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>สินค้า</TableHead>
                                <TableHead className="text-right">จำนวนที่ปรับ</TableHead>
                                <TableHead>เหตุผล</TableHead>
                                <TableHead>ทำโดย</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historyQuery.isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                            ) : historyQuery.data?.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">ยังไม่มีประวัติการปรับปรุงยอด</TableCell></TableRow>
                            ) : (
                                historyQuery.data?.map((log) => (
                                    <TableRow key={log.AdjustmentId}>
                                        <TableCell>{new Date(log.CreatedAt).toLocaleString('th-TH')}</TableCell>
                                        <TableCell>{log.Material?.MaterialName}</TableCell>
                                        <TableCell className={`text-right font-bold ${log.Quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.Quantity > 0 ? `+${log.Quantity}` : log.Quantity}
                                        </TableCell>
                                        <TableCell>{log.Reason || '-'}</TableCell>
                                        <TableCell>{log.CreatedByUser?.UserName || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <AdjustDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                stock={selectedStock}
                warehouseId={warehouseId}
                warehouseName={warehouseName}
                onSubmit={(qty, reason) => adjustMutation.mutate({
                    WarehouseId: warehouseId,
                    MaterialId: selectedStock!.MaterialId,
                    Quantity: qty,
                    Reason: reason
                })}
                loading={adjustMutation.isPending}
            />
        </Tabs>
    );
}

function AdjustDialog({ open, onOpenChange, stock, warehouseId, warehouseName, onSubmit, loading }: {
    open: boolean,
    onOpenChange: (v: boolean) => void,
    stock: Stock | null,
    warehouseId: number,
    warehouseName: string,
    onSubmit: (qty: number, reason: string) => void,
    loading: boolean
}) {
    const [adjustQty, setAdjustQty] = useState<string>("");
    const [reason, setReason] = useState("");

    if (!stock) return null;

    const current = stock.Remain || 0;
    const adj = Number(adjustQty);
    const newBalance = Number.isNaN(adj) ? current : current + adj;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adj || adj === 0) return;
        onSubmit(adj, reason);
        setAdjustQty("");
        setReason("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ปรับปรุงยอดสินค้า</DialogTitle>
                    <DialogDescription>
                        สินค้า: <span className="font-bold text-foreground">{stock.MaterialName}</span> <br />
                        คลัง: {warehouseName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ยอดปัจจุบัน</Label>
                            <div className="text-2xl font-mono">{current}</div>
                        </div>
                        <div className="space-y-2 bg-slate-50 p-2 rounded border text-center">
                            <Label className="text-muted-foreground">ยอดคงเหลือใหม่</Label>
                            <div className={`text-2xl font-bold ${newBalance < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                {newBalance}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>จำนวนที่ต้องการปรับ (+ เพิ่ม / - ลด)</Label>
                        <Input
                            type="number"
                            placeholder="เช่น -2 หรือ 5"
                            value={adjustQty}
                            onChange={e => setAdjustQty(e.target.value)}
                            autoFocus
                            className="text-lg font-mono"
                        />
                        <p className="text-xs text-muted-foreground">ใส่เครื่องหมายลบ (-) เพื่อลดสต็อก</p>
                    </div>

                    <div className="space-y-2">
                        <Label>เหตุผลการปรับปรุง</Label>
                        <Input
                            placeholder="ระบุเหตุผล เช่น ของชำรุด, นับผิด, พบของเกิน"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
                        <Button type="submit" disabled={loading || !adj || adj === 0 || newBalance < 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
