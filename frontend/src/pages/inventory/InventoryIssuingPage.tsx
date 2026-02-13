
import { useEffect, useState } from "react";
import {
    getRequisitions,
    approveRequisition,
    rejectRequisition,
    shipRequisition,
    WithdrawnRequest,
    getBranches,
    getMaterials,
    createWithdrawnRequest,
    Branch,
    Material,
    deleteRequisition,
    getRequisition
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Check, X, PackageCheck, RefreshCw, Plus, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useStock } from "@/context/StockContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/context/AuthContext";

export default function InventoryIssuingPage() {
    const [requests, setRequests] = useState<WithdrawnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { refresh: refreshStock } = useStock();
    const [createOpen, setCreateOpen] = useState(false);
    const [viewItem, setViewItem] = useState<WithdrawnRequest | null>(null);
    const { user } = useAuth();

    const getSelectedWarehouseId = () => {
        if (user?.WarehouseId) return user.WarehouseId;
        const stored = localStorage.getItem('selected_warehouse_id');
        return stored && stored !== 'all' ? Number(stored) : null;
    };

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getRequisitions();
            setRequests(data.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()));
        } catch (e) {
            console.error("Failed to load requests", e);
            toast({ variant: "destructive", title: "โหลดรายการไม่สำเร็จ" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: number) => {
        if (!confirm("ยืนยันการอนุมัติ?")) return;
        setProcessingId(id);
        try {
            await approveRequisition(id);
            toast({ title: "อนุมัติเรียบร้อย" });
            loadRequests();
        } catch (e: any) {
            toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: e.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm("ยืนยันการปฏิเสธ?")) return;
        setProcessingId(id);
        try {
            await rejectRequisition(id);
            toast({ title: "ปฏิเสธเรียบร้อย" });
            loadRequests();
        } catch (e: any) {
            toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: e.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleIssue = async (id: number) => {
        const whId = getSelectedWarehouseId();
        if (!whId) {
            toast({ variant: "destructive", title: "กรุณาเลือกคลังสินค้าก่อน (มุมซ้ายบน)" });
            return;
        }

        if (!confirm("ยืนยันการจ่ายสินค้า? สต็อกจะถูกตัดทันที")) return;
        setProcessingId(id);
        try {
            await shipRequisition(id);
            toast({ title: "บันทึกการจ่ายสินค้าเรียบร้อย" });
            await loadRequests();
            refreshStock();
        } catch (e: any) {
            toast({ variant: "destructive", title: "ทำรายการไม่สำเร็จ", description: e.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("ยืนยันการลบรายการนี้?")) return;
        setProcessingId(id);
        try {
            await deleteRequisition(id);
            toast({ title: "ลบรายการเรียบร้อย" });
            loadRequests();
        } catch (e: any) {
            toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: e.message });
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">รอดำเนินการ</Badge>;
            case "APPROVED":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">อนุมัติแล้ว</Badge>;
            case "COMPLETED":
                return <Badge variant="default" className="bg-green-600">จ่ายแล้ว</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">ปฏิเสธ</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">การเบิกจ่ายสินค้า (Issuing)</h1>
                    <p className="text-muted-foreground mt-1">จัดการคำขอเบิกสินค้าจากสาขา</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        จำลองคำขอ (Test)
                    </Button>
                    <Button variant="outline" onClick={loadRequests} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        รีเฟรช
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>รายการคำขอเบิก</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>เลขที่เอกสาร</TableHead>
                                    <TableHead>สาขา</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            ไม่พบรายการคำขอ
                                        </TableCell>
                                    </TableRow>
                                )}
                                {requests.map((req) => (
                                    <TableRow key={req.RequestId}>
                                        <TableCell>{format(new Date(req.RequestDate), "dd/MM/yyyy")}</TableCell>
                                        <TableCell className="font-medium">{req.WithdrawnRequestCode}</TableCell>
                                        <TableCell>
                                            {req.BranchId ? `Branch ${req.BranchId}` : '-'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(req.WithdrawnRequestStatus)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {req.WithdrawnRequestStatus === "PENDING" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(req.RequestId)}
                                                        disabled={!!processingId}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" /> อนุมัติ
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(req.RequestId)}
                                                        disabled={!!processingId}
                                                    >
                                                        <X className="h-4 w-4 mr-1" /> ปฏิเสธ
                                                    </Button>
                                                </>
                                            )}
                                            {req.WithdrawnRequestStatus === "APPROVED" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleIssue(req.RequestId)}
                                                    disabled={!!processingId}
                                                >
                                                    <PackageCheck className="h-4 w-4 mr-1" /> จ่ายสินค้า
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewItem(req)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(req.RequestId)}
                                                disabled={!!processingId}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <CreateRequestDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={() => {
                    loadRequests();
                    toast({ title: "สร้างคำขอจำลองเรียบร้อย" });
                }}
            />

            <ViewRequestDialog
                request={viewItem}
                open={!!viewItem}
                onOpenChange={(v) => !v && setViewItem(null)}
            />
        </div>
    );
}

function ViewRequestDialog({ request: initialRequest, open, onOpenChange }: { request: WithdrawnRequest | null, open: boolean, onOpenChange: (v: boolean) => void }) {
    const [data, setData] = useState<WithdrawnRequest | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && initialRequest?.RequestId) {
            setLoading(true);
            getRequisition(initialRequest.RequestId)
                .then((res) => setData(res))
                .catch((e) => console.error(e))
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [open, initialRequest]);

    const req = data || initialRequest;

    if (!req) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>รายละเอียดคำขอเบิก ({req.WithdrawnRequestCode})</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <span className="font-semibold">วันที่:</span> {req.RequestDate ? format(new Date(req.RequestDate), "dd/MM/yyyy HH:mm") : '-'}
                        </div>
                        <div>
                            <span className="font-semibold">สาขา:</span> Branch {req.BranchId}
                        </div>
                        <div>
                            <span className="font-semibold">สถานะ:</span> {req.WithdrawnRequestStatus}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>รหัสสินค้า</TableHead>
                                    <TableHead>ชื่อสินค้า</TableHead>
                                    <TableHead className="text-right">จำนวนที่ขอ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {req.WithdrawnRequestDetails?.map((d, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{d.Material?.MaterialCode || '-'}</TableCell>
                                        <TableCell>{d.Material?.MaterialName || `Material ${d.MaterialId}`}</TableCell>
                                        <TableCell className="text-right">{d.WithdrawnQuantity}</TableCell>
                                    </TableRow>
                                ))}
                                {(!req.WithdrawnRequestDetails || req.WithdrawnRequestDetails.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">ไม่มีรายการสินค้า</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CreateRequestDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (v: boolean) => void, onSuccess: () => void }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [branchId, setBranchId] = useState<string>("");
    const [details, setDetails] = useState<{ MaterialId: number; WithdrawnQuantity: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            getBranches().then(setBranches);
            getMaterials().then(setMaterials);
            setBranchId("");
            setDetails([]);
        }
    }, [open]);

    const addDetail = () => {
        if (materials.length > 0) {
            setDetails([...details, { MaterialId: materials[0].MaterialId, WithdrawnQuantity: 1 }]);
        }
    };

    const removeDetail = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const updateDetail = (index: number, field: keyof typeof details[0], value: number) => {
        const newDetails = [...details];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setDetails(newDetails);
    };

    const handleSubmit = async () => {
        if (!branchId) return alert("เลือกสาขาด้วยครับ");
        if (details.length === 0) return alert("เพิ่มรายการอย่างน้อย 1 รายการ");
        setLoading(true);
        try {
            await createWithdrawnRequest({
                BranchId: Number(branchId),
                details
            });
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            alert("Error creating request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>สร้างคำขอเบิก (จำลอง LINE LIFF)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>สาขาที่ขอเบิก</Label>
                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกสาขา" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map(b => (
                                    <SelectItem key={b.BranchId} value={String(b.BranchId)}>{b.BranchName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border rounded p-4">
                        <div className="flex justify-between items-center mb-2">
                            <Label>รายการสินค้า</Label>
                            <Button size="sm" variant="outline" onClick={addDetail}><Plus className="h-4 w-4 mr-1" /> เพิ่ม</Button>
                        </div>
                        {details.map((d, i) => (
                            <div key={i} className="flex gap-2 mb-2 items-center">
                                <Select value={String(d.MaterialId)} onValueChange={(v) => updateDetail(i, 'MaterialId', Number(v))}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materials.map(m => (
                                            <SelectItem key={m.MaterialId} value={String(m.MaterialId)}>{m.MaterialName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    className="w-[100px]"
                                    value={d.WithdrawnQuantity}
                                    onChange={(e) => updateDetail(i, 'WithdrawnQuantity', Number(e.target.value))}
                                />
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeDetail(i)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
                    <Button onClick={handleSubmit} disabled={loading}>บันทึก</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

