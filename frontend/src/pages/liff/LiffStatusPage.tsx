import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw, Package, CheckCircle2, Truck, RotateCcw, XCircle, Clock, MapPin, Box } from "lucide-react";

type WithdrawnRequest = {
    RequestId: number;
    WithdrawnRequestCode: string;
    WithdrawnRequestStatus: string;
    RequestDate: string;
    CreatedAt: string;
    Issues?: { IssueStatus: string; IssueDate: string }[];
    WithdrawnRequestDetails?: { Material: { MaterialName: string }; WithdrawnQuantity: number }[];
};

const STATUS_STEPS = [
    { key: 'PENDING', label: 'ส่งคำขอ', sub: 'ได้รับคำขอแล้ว', icon: Clock },
    { key: 'APPROVED', label: 'อนุมัติ', sub: 'ผ่านการอนุมัติ', icon: CheckCircle2 },
    { key: 'PACKING', label: 'เตรียมของ', sub: 'กำลังบรรจุสินค้า', icon: Box },
    { key: 'SHIPPING', label: 'จัดส่ง', sub: 'กำลังเดินทาง', icon: Truck },
    { key: 'DELIVERED', label: 'สำเร็จ', sub: 'ได้รับสินค้าแล้ว', icon: MapPin },
];

function getProgressState(req: WithdrawnRequest) {
    const status = req.WithdrawnRequestStatus?.toUpperCase();
    if (status === 'REJECTED') return -1;
    if (status === 'PENDING') return 0;
    
    // Approved state
    const issue = req.Issues?.[0];
    if (!issue) return 1; // Approved but no issue yet
    
    const issueStatus = issue.IssueStatus?.toUpperCase();
    if (issueStatus === 'PENDING') return 2; // Packing
    
    // If Issue is COMPLETED, we show as Shipping/Delivered
    // In many cases COMPLETED means it's out for delivery or delivered.
    // Let's split it: 3 (Shipping) if very recent, 4 (Delivered) if older than 1 min? 
    // Or just 4 if COMPLETED.
    if (issueStatus === 'COMPLETED') return 4;
    
    return 1;
}

function AnimatedTracker({ stepIndex }: { stepIndex: number }) {
    if (stepIndex === -1) {
        return (
            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-2">
                    <XCircle className="h-10 w-10" />
                </div>
                <p className="font-bold text-rose-600">รายการถูกปฏิเสธ</p>
                <p className="text-xs text-slate-400">กรุณาติดต่อเจ้าหน้าที่เพื่อขอรายละเอียด</p>
            </div>
        );
    }

    const progressPercent = (stepIndex / (STATUS_STEPS.length - 1)) * 100;

    return (
        <div className="py-8 px-2">
            {/* The Track */}
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-visible mb-12">
                {/* Active Path */}
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                    id="progress-bar"
                />
                
                {/* Dots on track */}
                {STATUS_STEPS.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`absolute -top-1 h-3.5 w-3.5 rounded-full border-2 transition-colors duration-500 ${
                            idx <= stepIndex ? 'bg-white border-emerald-500' : 'bg-slate-50 border-slate-200'
                        }`}
                        style={{ left: `calc(${(idx / (STATUS_STEPS.length - 1)) * 100}% - 7px)` }}
                    />
                ))}

                {/* The Truck */}
                <div 
                    className="absolute -top-10 transition-all duration-1000 ease-out z-10"
                    style={{ left: `calc(${progressPercent}% - 22px)` }}
                >
                    <div className="relative">
                        {/* Truck Emoji/Body */}
                        <div className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>🚚</div>
                        {/* Trail effect */}
                        <div className="absolute -left-4 top-4 flex gap-0.5 opacity-40">
                            <div className="h-0.5 w-1 bg-slate-300 rounded-full animate-ping" />
                            <div className="h-0.5 w-2 bg-slate-300 rounded-full animate-ping delay-75" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between -mx-2">
                {STATUS_STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = idx === stepIndex;
                    const isDone = idx < stepIndex;
                    return (
                        <div key={idx} className="flex flex-col items-center flex-1">
                            <div className={`mb-1 p-1 rounded-md transition-colors ${isActive ? 'text-indigo-600' : isDone ? 'text-emerald-500' : 'text-slate-300'}`}>
                                <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                            <span className={`text-[8px] text-center hidden sm:block ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                                {s.sub}
                            </span>
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
                // Expand the first one if it's recent
                if (data.length > 0 && !expandedId) setExpandedId(data[0].RequestId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (user) load(); 
    }, [user]);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('th-TH', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

    const getStatusTheme = (req: WithdrawnRequest) => {
        const step = getProgressState(req);
        if (step === -1) return { text: 'ยกเลิกแล้ว', color: 'bg-rose-50 text-rose-500 border-rose-100' };
        if (step === 0) return { text: 'รอดำเนินการ', color: 'bg-amber-50 text-amber-600 border-amber-100' };
        if (step === 1) return { text: 'อนุมัติแล้ว', color: 'bg-blue-50 text-blue-600 border-blue-100' };
        if (step === 4) return { text: 'สำเร็จ ✓', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
        return { text: 'กำลังดำเนินการ', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center selection:bg-indigo-100">
            <div className="w-full max-w-md bg-white flex flex-col min-h-screen shadow-2xl">
                {/* Fancy Top Header */}
                <div className="bg-white px-4 py-5 sticky top-0 z-30 flex items-center gap-3 border-b border-slate-50">
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-slate-50" onClick={() => navigate('/liff')}>
                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">สถานะการเบิก</h1>
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">แสดงข้อมูลล่าสุด</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 bg-slate-50/50">
                    {loading && requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-sm font-medium text-slate-400">กำลังดึงข้อมูล...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-20 px-8">
                            <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <RotateCcw className="h-10 w-10" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">ไม่มีรายการเบิก</h3>
                            <p className="text-sm text-slate-400 mt-2 mb-8">คุณยังไม่ได้ทำการเบิกของในวันนี้ หรือประวัติของคุณยังไม่ถูกบันทึก</p>
                            <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" onClick={() => navigate('/liff')}>
                                เริ่มต้นเบิกของ
                            </Button>
                        </div>
                    ) : (
                        requests.map((req) => {
                            const theme = getStatusTheme(req);
                            const isExpanded = expandedId === req.RequestId;
                            const step = getProgressState(req);

                            return (
                                <div 
                                    key={req.RequestId} 
                                    className={`bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'ring-4 ring-indigo-50 border-indigo-100 shadow-xl' : 'border-slate-100 shadow-sm'}`}
                                >
                                    {/* Summary Row */}
                                    <button
                                        className="w-full text-left p-6 flex items-start gap-4"
                                        onClick={() => setExpandedId(isExpanded ? null : req.RequestId)}
                                    >
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.color}`}>
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-black text-slate-800 text-sm tracking-tight">{req.WithdrawnRequestCode}</span>
                                                <ChevronLeft className={`h-4 w-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${theme.color} border`}>
                                                    {theme.text}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">{formatDate(req.CreatedAt)}</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="px-6 pb-8 animate-in slide-in-from-top-2 duration-300">
                                            <div className="h-px bg-slate-50 w-full mb-4" />
                                            
                                            {/* Status Steps */}
                                            <AnimatedTracker stepIndex={step} />

                                            {/* Items Container */}
                                            {req.WithdrawnRequestDetails && req.WithdrawnRequestDetails.length > 0 && (
                                                <div className="mt-8 bg-slate-50 rounded-3xl p-5">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">รายการเบิก</h4>
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            {req.WithdrawnRequestDetails.length} รายการ
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {req.WithdrawnRequestDetails.map((d, i) => (
                                                            <div key={i} className="flex justify-between items-center group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                                                                    <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{d.Material?.MaterialName}</span>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-800">{d.WithdrawnQuantity}</span>
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

                {/* Footer Action */}
                <div className="p-6 bg-white border-t border-slate-50">
                   <Button 
                     variant="outline" 
                     className="w-full h-12 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold hover:bg-slate-50 transition-all text-xs"
                     onClick={() => navigate('/liff')}
                   >
                       สร้างใบเบิกใหม่
                   </Button>
                </div>
            </div>
        </div>
    );
}
