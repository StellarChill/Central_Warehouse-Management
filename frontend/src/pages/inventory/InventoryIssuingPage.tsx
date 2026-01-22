
import { useEffect, useState } from "react";
import {
    getRequisitions,
    approveRequisition,
    rejectRequisition,
    shipRequisition,
    WithdrawnRequest
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast"; // Assuming use-toast is available or similar
import { Loader2, Check, X, PackageCheck, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useStock } from "@/context/StockContext";

export default function InventoryIssuingPage() {
    const [requests, setRequests] = useState<WithdrawnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { refresh: refreshStock } = useStock();

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getRequisitions();
            // Filter out completed ones if we only want to manage pending/approved
            // Or show all sorted by date
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
        if (!confirm("ยืนยันการจ่ายสินค้า? สต็อกจะถูกตัดทันที")) return;
        setProcessingId(id);
        try {
            await shipRequisition(id);
            toast({ title: "บันทึกการจ่ายสินค้าเรียบร้อย" });
            await loadRequests();
            refreshStock(); // Refresh global stock context
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
            case "COMPLETED": // Or whatever status 'shipRequisition' results in effectively (issue created)
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
                <Button variant="outline" onClick={loadRequests} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    รีเฟรช
                </Button>
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
                                        <TableCell>Branch {req.BranchId}</TableCell>
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
