
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, PackageCheck, RefreshCw, Plus, Trash2, Eye, ClipboardList, MoveRight, Building2, Package, Search, AlertCircle, Clock, ShieldBan, FileText, CheckCircle2, Timer, XCircle, ArrowUpRight, Filter } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useStock } from "@/context/StockContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function InventoryIssuingPage() {
    const [requests, setRequests] = useState<WithdrawnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { refresh: refreshStock } = useStock();
    const [createOpen, setCreateOpen] = useState(false);
    const [viewItem, setViewItem] = useState<WithdrawnRequest | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    // Dialog States
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'APPROVE' | 'REJECT' | 'ISSUE' | 'DELETE', id: number } | null>(null);

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
            toast({ variant: "destructive", title: "โหลดรายการไม่สำเร็จ" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleActionClick = (type: 'APPROVE' | 'REJECT' | 'ISSUE' | 'DELETE', id: number) => {
        if (type === 'ISSUE') {
            const whId = getSelectedWarehouseId();
            if (!whId) {
                toast({ variant: "destructive", title: "กรุณาเลือกคลังสินค้าก่อน (มุมซ้ายบน)" });
                return;
            }
        }
        setConfirmAction({ type, id });
        setConfirmOpen(true);
    };

    const executeConfirmedAction = async () => {
        if (!confirmAction) return;
        const { type, id } = confirmAction;
        setProcessingId(id);
        setConfirmOpen(false);

        try {
            switch (type) {
                case 'APPROVE':
                    await approveRequisition(id);
                    toast({ title: "อนุมัติเรียบร้อย" });
                    break;
                case 'REJECT':
                    await rejectRequisition(id);
                    toast({ title: "ปฏิเสธเรียบร้อย" });
                    break;
                case 'ISSUE':
                    await shipRequisition(id);
                    toast({ title: "บันทึกการจ่ายสินค้าเรียบร้อย" });
                    refreshStock();
                    break;
                case 'DELETE':
                    await deleteRequisition(id);
                    toast({ title: "ลบรายการเรียบร้อย" });
                    break;
            }
            await loadRequests();
        } catch (e: any) {
            toast({ variant: "destructive", title: "ทำรายการไม่สำเร็จ", description: e.message });
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 px-3 py-1 rounded-full font-bold">รอดำเนินการ</Badge>;
            case "APPROVED":
                return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 rounded-full font-bold">อนุมัติแล้ว</Badge>;
            case "COMPLETED":
                return <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full font-bold shadow-md shadow-emerald-500/20">จ่ายแล้ว</Badge>;
            case "REJECTED":
                return <Badge variant="destructive" className="px-3 py-1 rounded-full font-bold shadow-md shadow-rose-500/20">ปฏิเสธ</Badge>;
            default:
                return <Badge variant="secondary" className="px-3 py-1 rounded-full">{status}</Badge>;
        }
    };

    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.WithdrawnRequestStatus === 'PENDING').length,
        approved: requests.filter(r => r.WithdrawnRequestStatus === 'APPROVED').length,
        completed: requests.filter(r => r.WithdrawnRequestStatus === 'COMPLETED').length,
    };

    const filteredRequests = requests.filter(req => {
        const matchesStatus = filterStatus === "ALL" || req.WithdrawnRequestStatus === filterStatus;
        const matchesSearch =
            req.WithdrawnRequestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.BranchId && `Branch ${req.BranchId}`.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">การเบิกจ่ายสินค้า (Issuing)</h1>
                    <p className="text-slate-500 mt-2 text-lg">จัดการคำขอเบิกสินค้าจากสาขาและควบคุมการตัดสต็อก</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={loadRequests}
                        disabled={loading}
                        className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        รีเฟรช
                    </Button>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 font-semibold"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        สร้างคำขอจำลอง
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">คำขอทั้งหมด</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">รอดำเนินการ</p>
                            <h3 className="text-3xl font-bold text-amber-600">{stats.pending}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                            <Timer className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">อนุมัติแล้ว</p>
                            <h3 className="text-3xl font-bold text-blue-600">{stats.approved}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-premium bg-white/70 backdrop-blur-sm hover:shadow-premium-hover transition-all duration-300 group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500">จ่ายสำเร็จ</p>
                            <h3 className="text-3xl font-bold text-emerald-600">{stats.completed}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <PackageCheck className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="border-none shadow-premium bg-white pb-6 overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
                            <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full md:w-auto grid grid-cols-5 md:flex gap-1">
                                <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-medium">ทั้งหมด</TabsTrigger>
                                <TabsTrigger value="PENDING" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm font-medium">รออนุมัติ</TabsTrigger>
                                <TabsTrigger value="APPROVED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium">รอจ่าย</TabsTrigger>
                                <TabsTrigger value="COMPLETED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-medium">สำเร็จ</TabsTrigger>
                                <TabsTrigger value="REJECTED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm font-medium">ปฏิเสธ</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                placeholder="ค้นหาเลขที่เอกสาร, สาขา..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/60 sticky top-0 backdrop-blur-sm z-10">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="py-4 pl-6 font-semibold text-slate-600 w-[140px]">วันที่</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-600">เลขที่เอกสาร</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-600">สาขา</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-600 text-center">สถานะ</TableHead>
                                    <TableHead className="py-4 pr-6 text-right font-semibold text-slate-600">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequests.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                    <ClipboardList className="h-8 w-8 opacity-20" />
                                                </div>
                                                <p className="font-medium">ไม่พบรายการคำขอเบิก</p>
                                                <Button variant="link" className="mt-2 text-indigo-600" onClick={() => { setFilterStatus("ALL"); setSearchQuery("") }}>
                                                    ล้างตัวกรอง
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredRequests.map((req) => (
                                    <TableRow key={req.RequestId} className="border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {format(new Date(req.RequestDate), "dd MMM yy", { locale: th })}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {format(new Date(req.RequestDate), "HH:mm")} น.
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-indigo-500" />
                                                </div>
                                                <span className="font-bold text-slate-800 tracking-tight font-mono text-sm">{req.WithdrawnRequestCode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Building2 className="h-3 w-3 text-slate-500" />
                                                </div>
                                                <span className="font-medium text-slate-700 text-sm">{req.BranchId ? `สาขา ${req.BranchId}` : '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <div className="flex justify-center">
                                                {getStatusBadge(req.WithdrawnRequestStatus)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {req.WithdrawnRequestStatus === "PENDING" && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm"
                                                            onClick={() => handleActionClick('APPROVE', req.RequestId)}
                                                            disabled={!!processingId}
                                                            title="อนุมัติ"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg bg-rose-50/50"
                                                            onClick={() => handleActionClick('REJECT', req.RequestId)}
                                                            disabled={!!processingId}
                                                            title="ปฏิเสธ"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {req.WithdrawnRequestStatus === "APPROVED" && (
                                                    <Button
                                                        size="sm"
                                                        className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm px-4 font-medium"
                                                        onClick={() => handleActionClick('ISSUE', req.RequestId)}
                                                        disabled={!!processingId}
                                                    >
                                                        <PackageCheck className="h-4 w-4 mr-2" /> จ่ายสินค้าออก
                                                    </Button>
                                                )}
                                                <div className="w-[1px] h-8 bg-slate-200 mx-1" />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-indigo-600"
                                                    onClick={() => setViewItem(req)}
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    onClick={() => handleActionClick('DELETE', req.RequestId)}
                                                    disabled={!!processingId}
                                                    title="ลบรายการ"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="max-w-[420px] rounded-[2rem] border-none shadow-premium p-0 overflow-hidden">
                    <div className="p-8 space-y-6 text-center">
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto border-4 ${confirmAction?.type === 'DELETE' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                            confirmAction?.type === 'REJECT' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                'bg-indigo-50 border-indigo-100 text-indigo-600'
                            }`}>
                            {confirmAction?.type === 'DELETE' && <Trash2 className="h-10 w-10" />}
                            {confirmAction?.type === 'REJECT' && <ShieldBan className="h-10 w-10" />}
                            {confirmAction?.type === 'APPROVE' && <Check className="h-10 w-10" />}
                            {confirmAction?.type === 'ISSUE' && <Package className="h-10 w-10" />}
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-bold text-slate-800">
                                {confirmAction?.type === 'APPROVE' && "ยืนยันการอนุมัติ?"}
                                {confirmAction?.type === 'REJECT' && "ยืนยันการปฏิเสธ?"}
                                {confirmAction?.type === 'ISSUE' && "ยืนยันการจ่ายสินค้า?"}
                                {confirmAction?.type === 'DELETE' && "ยืนยันการลบ?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 text-base">
                                {confirmAction?.type === 'APPROVE' && "คุณต้องการอนุมัติรายการเบิกนี้ใช่หรือไม่?"}
                                {confirmAction?.type === 'REJECT' && "คุณต้องการปฏิเสธรายการเบิกนี้ใช่หรือไม่?"}
                                {confirmAction?.type === 'ISSUE' && "สต็อกจะถูกตัดออกจากระบบทันทีหลังจากที่กดยืนยัน"}
                                {confirmAction?.type === 'DELETE' && "การกระทำนี้ไม่สามารถย้อนคืนได้ คุณต้องการลบข้อมูลนี้ใช่หรือไม่?"}
                            </AlertDialogDescription>
                        </div>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3">
                        <AlertDialogCancel className="w-full h-12 rounded-xl border-slate-200 hover:bg-white hover:text-slate-900">ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeConfirmedAction}
                            className={`w-full h-12 rounded-xl font-bold text-white shadow-lg ${confirmAction?.type === 'DELETE' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' :
                                confirmAction?.type === 'REJECT' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' :
                                    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                        >
                            ยืนยัน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
            <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-premium p-0 overflow-hidden">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">รายละเอียดคำขอเบิก</DialogTitle>
                                <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">{req.WithdrawnRequestCode}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Clock className="h-5 w-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วันที่</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">{req.RequestDate ? format(new Date(req.RequestDate), "dd MMM yyyy") : '-'}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><Building2 className="h-5 w-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สาขาที่เบิก</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">Branch {req.BranchId}</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><AlertCircle className="h-5 w-5 text-slate-400" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สถานะ</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">{req.WithdrawnRequestStatus}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-500" />
                            รายการวัสดุ (Materials)
                        </h4>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
                            {loading ? (
                                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-200" /><p className="mt-2 text-slate-400 text-sm italic">กำลังดึงข้อมูลวัสดุ...</p></div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100">
                                            <TableHead className="font-bold text-slate-500">รหัส</TableHead>
                                            <TableHead className="font-bold text-slate-500">ชื่อสินค้า</TableHead>
                                            <TableHead className="text-right font-bold text-slate-500">จำนวนที่ขอ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {req.WithdrawnRequestDetails?.map((d, i) => (
                                            <TableRow key={i} className="border-slate-50">
                                                <TableCell className="font-mono text-xs text-slate-400">{d.Material?.MaterialCode || '-'}</TableCell>
                                                <TableCell className="font-bold text-slate-700">{d.Material?.MaterialName || `Material ${d.MaterialId}`}</TableCell>
                                                <TableCell className="text-right font-black text-indigo-600">{d.WithdrawnQuantity}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!req.WithdrawnRequestDetails || req.WithdrawnRequestDetails.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">ไม่มีรายการสินค้าในคำคขอ</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100">
                    <Button className="w-full h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold" onClick={() => onOpenChange(false)}>ปิดหน้าต่าง</Button>
                </DialogFooter>
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
    const { toast } = useToast();

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
        if (!branchId) return toast({ variant: "destructive", title: "ไม่สารถส่งได้", description: "กรุณาเลือกสาขา" });
        if (details.length === 0) return toast({ variant: "destructive", title: "ไม่สารถส่งได้", description: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ" });
        setLoading(true);
        try {
            await createWithdrawnRequest({
                BranchId: Number(branchId),
                details
            });
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: e.message || "ไม่สามารถสร้างคำขอได้" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-premium p-0 overflow-hidden">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800">สร้างคำขอเบิกสินค้า</DialogTitle>
                        <p className="text-slate-500 italic">จำลองเหตุการณ์เบิกสินค้าจากสาขา (LINE LIFF)</p>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700">สาขาที่ขอเบิก</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="เลือกสาขาปลายทาง" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {branches.map(b => (
                                        <SelectItem key={b.BranchId} value={String(b.BranchId)}>{b.BranchName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-bold text-slate-700">รายการพัสดุ</Label>
                                <Button size="sm" variant="outline" onClick={addDetail} className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Plus className="h-4 w-4 mr-1" /> เพิ่มรายการ</Button>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {details.map((d, i) => (
                                    <div key={i} className="flex gap-2 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className="flex-1">
                                            <Select value={String(d.MaterialId)} onValueChange={(v) => updateDetail(i, 'MaterialId', Number(v))}>
                                                <SelectTrigger className="h-10 bg-white border-slate-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                    {materials.map(m => (
                                                        <SelectItem key={m.MaterialId} value={String(m.MaterialId)}>{m.MaterialName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                className="h-10 bg-white border-slate-200 rounded-xl text-center font-bold"
                                                value={d.WithdrawnQuantity}
                                                min={1}
                                                onChange={(e) => updateDetail(i, 'WithdrawnQuantity', Math.max(1, Number(e.target.value)))}
                                            />
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => removeDetail(i)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {details.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 italic">ยังไม่มีการเพิ่มรายการสินค้า</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-3">
                    <Button variant="ghost" className="h-12 px-6 rounded-xl flex-1" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex-[2] shadow-lg shadow-indigo-500/20">{loading ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอเบิกสินค้า'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


