/**
 * DistributeReceiptDialog
 * Dialog สำหรับ "รับของจาก PO หนึ่งใบ แล้วกระจายสินค้าไปหลายคลัง"
 */

import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Trash2,
    Building2,
    Package2,
    ArrowRight,
    Loader2,
    CheckCircle2,
    WarehouseIcon,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
    distributeReceipt,
    getMaterials,
    getWarehouses,
    getPurchaseOrder,
    getReceipts,
    getReceipt,
    type Material,
    type Warehouse,
    type WarehouseDistribution,
} from "@/lib/api";

// =================== Types ===================

type POItem = {
    MaterialId: number;
    MaterialName: string;
    Unit: string;
    PurchaseOrderQuantity: number;
    PurchaseOrderPrice: number;
    PurchaseOrderUnit: string;
    remaining: number; // คงเหลือที่ยังรับไม่ครบ
};

type DistributionRow = {
    id: string; // unique key
    WarehouseId: number;
    WarehouseName: string;
    items: {
        MaterialId: number;
        MaterialName: string;
        Unit: string;
        MaterialQuantity: number;
        maxQty: number;
    }[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    purchaseOrderId: number | null;
    purchaseOrderCode?: string;
    supplierName?: string;
    /** จำนวนที่รับแล้วต่อ materialId (เพื่อคำนวณ remaining) */
    receivedSoFar?: Record<number, number>;
};

// =================== Component ===================

export function DistributeReceiptDialog({
    open,
    onClose,
    onSuccess,
    purchaseOrderId,
    purchaseOrderCode,
    supplierName,
    receivedSoFar = {},
}: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [poItems, setPoItems] = useState<POItem[]>([]);

    // Distribution rows: แต่ละ row = คลังหนึ่งพร้อมรายการสินค้า
    const [distributions, setDistributions] = useState<DistributionRow[]>([]);

    // โหลดข้อมูลเมื่อ open — ดึงยอดรับจริงจาก API เสมอ
    useEffect(() => {
        if (!open || !purchaseOrderId) return;
        setDistributions([]);

        (async () => {
            setLoading(true);
            try {
                const [mats, whs, poFull, allReceipts] = await Promise.all([
                    getMaterials(),
                    getWarehouses(),
                    getPurchaseOrder(purchaseOrderId),
                    getReceipts(),
                ]);
                setMaterials(mats);
                setWarehouses(whs);

                // ======== คำนวณ receivedSoFar จาก API จริง ========
                // หา receipts ที่ผูกกับ PO นี้
                const relatedReceipts = allReceipts.filter(
                    (r: any) => r.PurchaseOrderId === purchaseOrderId
                );

                // ดึง detail ของแต่ละ receipt แล้วรวมยอดต่อ MaterialId
                const actualReceived: Record<number, number> = {};
                if (relatedReceipts.length > 0) {
                    const detailLists = await Promise.all(
                        relatedReceipts.map((r: any) => getReceipt(r.ReceiptId))
                    );
                    for (const rec of detailLists) {
                        for (const d of rec.ReceiptDetails) {
                            actualReceived[d.MaterialId] =
                                (actualReceived[d.MaterialId] || 0) + Number(d.MaterialQuantity || 0);
                        }
                    }
                }

                // Map materials สำหรับ lookup
                const matMap = new Map<number, Material>(mats.map((m) => [m.MaterialId, m]));

                // สร้าง poItems พร้อม remaining (ใช้ยอดจาก API จริง)
                const items: POItem[] = (poFull.PurchaseOrderDetails || []).map((d: any) => {
                    const mat = matMap.get(d.MaterialId);
                    const received = actualReceived[d.MaterialId] ?? 0;
                    return {
                        MaterialId: d.MaterialId,
                        MaterialName: mat?.MaterialName ?? `MAT-${d.MaterialId}`,
                        Unit: mat?.Unit ?? d.PurchaseOrderUnit ?? "",
                        PurchaseOrderQuantity: d.PurchaseOrderQuantity,
                        PurchaseOrderPrice: d.PurchaseOrderPrice,
                        PurchaseOrderUnit: d.PurchaseOrderUnit,
                        remaining: Math.max(0, d.PurchaseOrderQuantity - received),
                    };
                });
                setPoItems(items);

                // เพิ่ม distribution แรกอัตโนมัติ (เฉพาะสินค้าที่ยังเหลือ)
                const hasRemaining = items.some((item) => item.remaining > 0);
                if (whs.length > 0 && hasRemaining) {
                    setDistributions([buildEmptyDist(whs[0], items)]);
                }
            } catch (e: any) {
                toast.error("โหลดข้อมูลไม่สำเร็จ", { description: e.message });
            } finally {
                setLoading(false);
            }
        })();
    }, [open, purchaseOrderId]);

    // ========= Helpers =========

    function buildEmptyDist(wh: Warehouse, items: POItem[]): DistributionRow {
        return {
            id: crypto.randomUUID(),
            WarehouseId: wh.WarehouseId,
            WarehouseName: wh.WarehouseName,
            items: items
                .filter((item) => item.remaining > 0)
                .map((item) => ({
                    MaterialId: item.MaterialId,
                    MaterialName: item.MaterialName,
                    Unit: item.Unit,
                    MaterialQuantity: 0,
                    maxQty: item.remaining,
                })),
        };
    }

    // จำนวนที่จัดสรรไปแล้วต่อ MaterialId จากทุก distribution
    const allocatedByMaterial = useMemo(() => {
        const map = new Map<number, number>();
        for (const dist of distributions) {
            for (const item of dist.items) {
                map.set(item.MaterialId, (map.get(item.MaterialId) ?? 0) + item.MaterialQuantity);
            }
        }
        return map;
    }, [distributions]);

    // จำนวนคงเหลือที่ยังแบ่งได้ต่อ Material
    const remainingToDistribute = useMemo(() => {
        const map = new Map<number, number>();
        for (const item of poItems) {
            const allocated = allocatedByMaterial.get(item.MaterialId) ?? 0;
            map.set(item.MaterialId, Math.max(0, item.remaining - allocated));
        }
        return map;
    }, [poItems, allocatedByMaterial]);

    // Grand total ที่จะรับทั้งหมด
    const grandTotal = useMemo(() => {
        let total = 0;
        for (const dist of distributions) {
            for (const item of dist.items) {
                const poItem = poItems.find((p) => p.MaterialId === item.MaterialId);
                total += item.MaterialQuantity * (poItem?.PurchaseOrderPrice ?? 0);
            }
        }
        return total;
    }, [distributions, poItems]);

    // ========= Actions =========

    const addWarehouse = () => {
        const usedWh = new Set(distributions.map((d) => d.WarehouseId));
        const available = warehouses.find((w) => !usedWh.has(w.WarehouseId));
        if (!available) {
            toast.error("ไม่มีคลังสินค้าเหลือแล้ว");
            return;
        }
        setDistributions((prev) => [...prev, buildEmptyDist(available, poItems)]);
    };

    const removeWarehouse = (distId: string) => {
        setDistributions((prev) => prev.filter((d) => d.id !== distId));
    };

    const changeWarehouse = (distId: string, whId: number) => {
        const wh = warehouses.find((w) => w.WarehouseId === whId);
        if (!wh) return;
        setDistributions((prev) =>
            prev.map((d) =>
                d.id === distId
                    ? { ...d, WarehouseId: whId, WarehouseName: wh.WarehouseName }
                    : d
            )
        );
    };

    const updateQty = (distId: string, materialId: number, qty: number) => {
        setDistributions((prev) =>
            prev.map((d) => {
                if (d.id !== distId) return d;
                return {
                    ...d,
                    items: d.items.map((item) =>
                        item.MaterialId === materialId
                            ? { ...item, MaterialQuantity: Math.max(0, qty) }
                            : item
                    ),
                };
            })
        );
    };

    // กรอก "ที่เหลือทั้งหมด" ให้อัตโนมัติสำหรับ distribution นี้
    const autoFillRemaining = (distId: string) => {
        setDistributions((prev) =>
            prev.map((d) => {
                if (d.id !== distId) return d;
                return {
                    ...d,
                    items: d.items.map((item) => {
                        const currentInOtherDists = distributions
                            .filter((od) => od.id !== distId)
                            .reduce((sum, od) => {
                                const found = od.items.find((i) => i.MaterialId === item.MaterialId);
                                return sum + (found?.MaterialQuantity ?? 0);
                            }, 0);
                        const poItem = poItems.find((p) => p.MaterialId === item.MaterialId);
                        const fill = Math.max(0, (poItem?.remaining ?? 0) - currentInOtherDists);
                        return { ...item, MaterialQuantity: fill };
                    }),
                };
            })
        );
    };

    // Validate & Submit
    const handleSubmit = async () => {
        if (!purchaseOrderId) return;

        // Validate: ต้องมีอย่างน้อย 1 distribution
        if (distributions.length === 0) {
            toast.error("กรุณาเพิ่มคลังสินค้าอย่างน้อย 1 คลัง");
            return;
        }

        // Validate: ต้องไม่มีซ้ำ Warehouse
        const whIds = distributions.map((d) => d.WarehouseId);
        if (new Set(whIds).size !== whIds.length) {
            toast.error("คลังสินค้าไม่สามารถซ้ำกันได้");
            return;
        }

        // Validate: ต้องกรอกจำนวนอย่างน้อย 1 รายการต่อคลัง
        for (const dist of distributions) {
            const hasQty = dist.items.some((i) => i.MaterialQuantity > 0);
            if (!hasQty) {
                toast.error(`คลัง "${dist.WarehouseName}" ต้องมีจำนวนรับอย่างน้อย 1 รายการ`);
                return;
            }
        }

        // Validate: รวมไม่เกิน remaining ต่อ Material
        for (const [matId, allocated] of allocatedByMaterial) {
            const poItem = poItems.find((p) => p.MaterialId === matId);
            if (!poItem) continue;
            if (allocated > poItem.remaining) {
                toast.error(
                    `จำนวนรวมของ "${poItem.MaterialName}" (${allocated}) เกินกว่าคงเหลือที่สั่ง (${poItem.remaining})`
                );
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload: WarehouseDistribution[] = distributions.map((dist) => ({
                WarehouseId: dist.WarehouseId,
                items: dist.items
                    .filter((i) => i.MaterialQuantity > 0)
                    .map((i) => ({ MaterialId: i.MaterialId, MaterialQuantity: i.MaterialQuantity })),
            }));

            const result = await distributeReceipt({
                PurchaseOrderId: purchaseOrderId,
                distributions: payload,
            });

            toast.success(`${result.message}`, {
                description: result.receipts
                    .map((r) => {
                        const wh = warehouses.find((w) => w.WarehouseId === r.WarehouseId);
                        return `${wh?.WarehouseName ?? `คลัง ${r.WarehouseId}`}: ${r.ReceiptCode}`;
                    })
                    .join(", "),
                duration: 6000,
            });

            onSuccess();
            onClose();
        } catch (e: any) {
            toast.error("บันทึกไม่สำเร็จ", { description: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    const usedWhIds = new Set(distributions.map((d) => d.WarehouseId));
    const availableWarehouses = (whId: number) =>
        warehouses.filter((w) => w.WarehouseId === whId || !usedWhIds.has(w.WarehouseId));

    // ========= Render =========

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-5xl max-h-[92vh] p-0 flex flex-col overflow-hidden rounded-2xl border-none shadow-2xl">
                {/* Header */}
                <div className="px-8 py-5 border-b bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <WarehouseIcon className="h-5 w-5 text-white" />
                            </div>
                            กระจายสินค้าสู่คลัง
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 mt-1 flex items-center gap-3">
                            <span>PO: <strong className="text-white font-mono">{purchaseOrderCode}</strong></span>
                            {supplierName && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-indigo-300" />
                                    <span>ผู้จำหน่าย: <strong className="text-white">{supplierName}</strong></span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-slate-500">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : (
                        <>
                            {/* PO Summary */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Package2 className="h-4 w-4" /> รายการสินค้าใน PO
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {poItems.map((item) => {
                                        const allocated = allocatedByMaterial.get(item.MaterialId) ?? 0;
                                        const leftover = remainingToDistribute.get(item.MaterialId) ?? 0;
                                        const isDone = leftover === 0 && allocated > 0;
                                        return (
                                            <div
                                                key={item.MaterialId}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${isDone
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                    : leftover === 0
                                                        ? "bg-slate-100 border-slate-200 text-slate-400"
                                                        : "bg-white border-slate-200 text-slate-700"
                                                    }`}
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Package2 className="h-3.5 w-3.5 text-slate-400" />
                                                )}
                                                <span className="font-medium">{item.MaterialName}</span>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {allocated}/{item.remaining}
                                                </span>
                                                {leftover > 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 bg-amber-50">
                                                        เหลือ {leftover}
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Distribution Cards */}
                            {distributions.map((dist, distIdx) => (
                                <div
                                    key={dist.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {distIdx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-xs text-slate-500 mb-1 block">คลังสินค้าปลายทาง</Label>
                                                <Select
                                                    value={String(dist.WarehouseId)}
                                                    onValueChange={(v) => changeWarehouse(dist.id, Number(v))}
                                                >
                                                    <SelectTrigger className="h-9 bg-white border-slate-200 font-semibold text-slate-800 focus:ring-indigo-200">
                                                        <Building2 className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableWarehouses(dist.WarehouseId).map((w) => (
                                                            <SelectItem key={w.WarehouseId} value={String(w.WarehouseId)}>
                                                                {w.WarehouseName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                                onClick={() => autoFillRemaining(dist.id)}
                                            >
                                                เติมที่เหลือทั้งหมด
                                            </Button>
                                            {distributions.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                    onClick={() => removeWarehouse(dist.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/30 border-slate-100">
                                                <TableHead className="pl-5 py-2 text-xs">สินค้า</TableHead>
                                                <TableHead className="py-2 text-xs text-right">สั่งซื้อ/คงเหลือ</TableHead>
                                                <TableHead className="py-2 text-xs text-center w-36">จำนวนที่รับเข้าคลังนี้</TableHead>
                                                <TableHead className="py-2 text-xs text-right pr-5">มูลค่า</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dist.items.map((item) => {
                                                const poItem = poItems.find((p) => p.MaterialId === item.MaterialId);
                                                const remaining = remainingToDistribute.get(item.MaterialId) ?? 0;
                                                const valueForRow = item.MaterialQuantity * (poItem?.PurchaseOrderPrice ?? 0);
                                                const isOver = item.MaterialQuantity > (poItem?.remaining ?? 0);

                                                return (
                                                    <TableRow key={item.MaterialId} className="border-slate-50 hover:bg-slate-50/50">
                                                        <TableCell className="pl-5 py-3">
                                                            <div className="font-semibold text-slate-800 text-sm">{item.MaterialName}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">หน่วย: {item.Unit}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3">
                                                            <span className="font-mono text-slate-600 text-sm">{poItem?.remaining ?? 0}</span>
                                                            {remaining > 0 && (
                                                                <div className="text-xs text-amber-500 font-medium mt-0.5">
                                                                    แบ่งได้อีก {remaining}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-2">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={poItem?.remaining ?? 0}
                                                                value={item.MaterialQuantity === 0 ? "" : item.MaterialQuantity}
                                                                placeholder="0"
                                                                className={`h-9 text-center font-bold text-sm border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 ${isOver ? "border-rose-400 bg-rose-50 text-rose-600" : "bg-slate-50 focus:bg-white"
                                                                    }`}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                                    updateQty(dist.id, item.MaterialId, val);
                                                                }}
                                                            />
                                                            {isOver && (
                                                                <div className="flex items-center gap-1 mt-1 text-rose-500 text-[10px]">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    เกิน PO
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-5 py-3 font-mono text-slate-700 text-sm">
                                                            {valueForRow > 0 ? `฿${valueForRow.toLocaleString()}` : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}

                            {/* Add Warehouse Button */}
                            {distributions.length < warehouses.length && (
                                <button
                                    type="button"
                                    onClick={addWarehouse}
                                    className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/50 transition-all text-sm font-semibold group"
                                >
                                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    เพิ่มคลังสินค้า
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-white flex-shrink-0 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-800 text-lg mr-1">
                            ฿{grandTotal.toLocaleString()}
                        </span>
                        มูลค่ารวม • {distributions.length} คลัง
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="rounded-xl px-6" disabled={submitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || loading || distributions.length === 0}
                            className="rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4" />
                                    บันทึกรับ & กระจายสินค้า
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
