import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw, Package, CheckCircle2, Truck, RotateCcw, XCircle, Clock } from "lucide-react";

type WithdrawnRequest = {
    RequestId: number;
    WithdrawnRequestCode: string;
    WithdrawnRequestStatus: string;
    RequestDate: string;
    CreatedAt: string;
    Issues?: { IssueStatus: string; IssueDate: string }[];
    WithdrawnRequestDetails?: { Material: { MaterialName: string }; WithdrawnQuantity: number }[];
};

// Status flow definition
const STATUS_STEPS = [
    { key: 'PENDING', label: 'รอดำเนินการ', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'APPROVED', label: 'อนุมัติแล้ว', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'ISSUE_PENDING', label: 'กำลังจัดเตรียม', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { key: 'ISSUE_COMPLETED', label: 'จัดส่งสำเร็จ', icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

function getStepIndex(req: WithdrawnRequest): number {
    const reqStatus = req.WithdrawnRequestStatus?.toUpperCase();
    if (reqStatus === 'REJECTED') return -1;
    if (reqStatus === 'PENDING') return 0;
    if (reqStatus === 'APPROVED') {
        const issueStatus = req.Issues?.[0]?.IssueStatus?.toUpperCase();
        if (!issueStatus || issueStatus === 'PENDING') return 2;
        if (issueStatus === 'COMPLETED') return 3;
    }
    return 1;
}

function StatusTracker({ req }: { req: WithdrawnRequest }) {
    const stepIndex = getStepIndex(req);
    const isRejected = req.WithdrawnRequestStatus?.toUpperCase() === 'REJECTED';

    if (isRejected) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <XCircle className="h-16 w-16 text-rose-400" />
                <p className="font-bold text-lg text-rose-600">คำขอถูกปฏิเสธ</p>
                <p className="text-sm text-slate-400">กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
        );
    }

    const truckPercent = stepIndex === 0 ? 0 : stepIndex === 1 ? 33 : stepIndex === 2 ? 66 : 100;

    return (
        <div className="px-4 py-6">
            {/* Truck Animation Track */}
            <div className="relative mb-10">
                <div className="h-2 bg-slate-200 rounded-full mx-4" />
                <div
                    className="absolute top-0 left-4 h-2 bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-1000 ease-in-out"
                    style={{ width: `calc(${truckPercent}% - 8px)` }}
                />
                {/* Truck Icon */}
                <div
                    className="absolute -top-4 transition-all duration-1000 ease-in-out"
                    style={{ left: `calc(${truckPercent}% - 8px)` }}
                >
                    <div className="text-2xl drop-shadow-md animate-bounce">🚚</div>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between gap-1 mt-2">
                {STATUS_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === stepIndex;
                    const isDone = idx < stepIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isDone
                                        ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300'
                                        : isActive
                                        ? `${step.bg} ${step.color} ring-2 ring-offset-1 ring-current scale-110 shadow-md`
                                        : 'bg-slate-100 text-slate-300'
                                }`}
                            >
                                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <p className={`text-[10px] text-center leading-tight font-medium ${isActive ? 'text-slate-800' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function LiffStatusPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<WithdrawnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await apiRequest('/request/my');
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [user]);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStatusBadge = (req: WithdrawnRequest) => {
        const status = req.WithdrawnRequestStatus?.toUpperCase();
        if (status === 'REJECTED') return { text: 'ถูกปฏิเสธ', color: 'bg-rose-100 text-rose-700' };
        if (status === 'PENDING') return { text: 'รอดำเนินการ', color: 'bg-amber-100 text-amber-700' };
        const issueStatus = req.Issues?.[0]?.IssueStatus?.toUpperCase();
        if (!issueStatus || issueStatus === 'PENDING') return { text: 'กำลังจัดเตรียม', color: 'bg-indigo-100 text-indigo-700' };
        return { text: 'จัดส่งสำเร็จ ✓', color: 'bg-emerald-100 text-emerald-700' };
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center">
            <div className="w-full max-w-md bg-slate-50 flex flex-col min-h-screen shadow-xl">
                {/* Header */}
                <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/liff')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-slate-800">ติดตามใบเบิก</h1>
                        <p className="text-xs text-slate-500">ดูสถานะคำขอเบิกของคุณ</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-20">
                            <RotateCcw className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold">ยังไม่มีใบเบิก</p>
                            <p className="text-sm text-slate-400 mt-1">กดปุ่มด้านล่างเพื่อสร้างใบเบิกใหม่</p>
                            <Button className="mt-4" onClick={() => navigate('/liff')}>สร้างใบเบิก</Button>
                        </div>
                    ) : (
                        requests.map((req) => {
                            const badge = getStatusBadge(req);
                            const isExpanded = expandedId === req.RequestId;
                            return (
                                <div key={req.RequestId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    {/* Card Header */}
                                    <button
                                        className="w-full text-left px-4 py-3 flex items-start gap-3"
                                        onClick={() => setExpandedId(isExpanded ? null : req.RequestId)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-800 text-sm">{req.WithdrawnRequestCode}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                                                    {badge.text}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(req.CreatedAt)}</p>
                                        </div>
                                        <ChevronLeft className={`h-4 w-4 text-slate-400 mt-1 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                                    </button>

                                    {/* Expanded Tracker */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100">
                                            <StatusTracker req={req} />
                                            {/* Item list */}
                                            {req.WithdrawnRequestDetails && req.WithdrawnRequestDetails.length > 0 && (
                                                <div className="px-4 pb-4">
                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">รายการสินค้า</p>
                                                    <div className="space-y-1.5">
                                                        {req.WithdrawnRequestDetails.map((d, i) => (
                                                            <div key={i} className="flex justify-between items-center text-sm">
                                                                <span className="text-slate-700">{d.Material?.MaterialName}</span>
                                                                <span className="font-semibold text-slate-800">{d.WithdrawnQuantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
