import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMaterials, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Loader2, Search, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Declare LIFF gloablly
declare const liff: any;

// Type for Cart Item
type CartItem = {
    id: number;
    name: string;
    qty: number;
    unit: string;
};

export default function LiffCreateRequisitionPage() {
    const { user, loginWithLine, logout, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // State
    const [materials, setMaterials] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLiffInitializing, setIsLiffInitializing] = useState(true);
    const [branchName, setBranchName] = useState<string | null>(null);
    const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

    // Selection State
    const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null); // For dialog
    const [tempQty, setTempQty] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [lineProfile, setLineProfile] = useState<any>(null);
    const [status, setStatus] = useState("กำลังตรวจสอบข้อมูลสมาชิก...");
    const [error, setError] = useState<string | null>(null);

    // 1. Robust Auth Check & LIFF Init
    useEffect(() => {
        if (hasCheckedProfile) return;

        const initLiffDoc = async () => {
            // Perform LIFF Login Sequence
            try {
                setStatus("กำลังเชื่อมต่อ LINE...");
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

                // Wait for ready (optional but safe)
                if (liff.ready) await liff.ready;

                if (!liff.isLoggedIn()) {
                    setStatus("กำลังเข้าสู่ระบบ LINE...");
                    // ... login logic ...
                    if (!user) {
                        liff.login({ redirectUri: `${window.location.origin}/liff` });
                    } else {
                        setIsLiffInitializing(false);
                        setHasCheckedProfile(true);
                    }
                    return;
                }

                // Get Profile
                setStatus("กำลังดึงข้อมูลโปรไฟล์...");
                const profile = await liff.getProfile();
                setLineProfile(profile);

                // Try to login/refresh to backend
                setStatus("กำลังยืนยันตัวตนกับระบบ...");
                const idToken = liff.getIDToken();

                try {
                    // Prefer ID Token
                    if (idToken) await loginWithLine(idToken, true);
                    else await loginWithLine(profile.userId, false);

                    localStorage.setItem("liff_only", "1");

                } catch (backendErr: any) {
                    console.warn("Backend Login Failed:", backendErr);
                    if (String(backendErr.message).includes("pending")) {
                        navigate("/awaiting-approval", { replace: true });
                    } else if (!user) {
                        navigate("/liff/register", { replace: true });
                    }
                }

            } catch (err) {
                console.error("LIFF Init Error:", err);
                if (!user) toast.error("ไม่สามารถเชื่อมต่อ LINE ได้");
            } finally {
                setIsLiffInitializing(false);
                setHasCheckedProfile(true);
            }
        };

        if (!isAuthLoading) {
            initLiffDoc();
        }
    }, [isAuthLoading, hasCheckedProfile, loginWithLine, navigate, user]);

    // Fetch Branch Name
    useEffect(() => {
        if (user?.BranchId) {
            import("@/lib/api").then(({ getBranch }) => {
                getBranch(user.BranchId)
                    .then(b => setBranchName(b.BranchName))
                    .catch(() => setBranchName("สาขาไม่ระบุ"));
            });
        }
    }, [user]);

    // 2. Load Materials (Only if Auth is clear)
    useEffect(() => {
        async function load() {
            if (!user) return; // Wait for user to be logged in
            try {
                const res = await getMaterials();
                setMaterials(res || []);
            } catch (e) {
                console.error("Load materials error", e);
                // Fallback for dev/demo
                setMaterials([
                    { MaterialId: 1, MaterialName: "เนื้อหมูหมัก", Unit: "kg" },
                    { MaterialId: 2, MaterialName: "ผักกาดหอม", Unit: "kg" },
                    { MaterialId: 3, MaterialName: "ซอสปรุงรส", Unit: "ขวด" },
                    { MaterialId: 4, MaterialName: "น้ำมันพืช", Unit: "ลิตร" },
                    { MaterialId: 5, MaterialName: "ข้าวหอมมะลิ", Unit: "kg" },
                ]);
            }
        }
        load();
    }, [user]);

    // Handlers
    const handleQuantityChange = (material: any, qty: number) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.id === material.MaterialId);
            if (qty <= 0) {
                // Remove from cart
                return prev.filter(p => p.id !== material.MaterialId);
            }
            if (existing) {
                // Update qty
                return prev.map(p => p.id === material.MaterialId ? { ...p, qty } : p);
            }
            // Add new
            return [
                ...prev,
                {
                    id: material.MaterialId,
                    name: material.MaterialName,
                    unit: material.Unit,
                    qty: qty
                }
            ];
        });
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const payload = {
                WithdrawnRequestCode: `REQ-LIFF-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
                BranchId: user?.BranchId || 1,
                RequestDate: new Date().toISOString(),
                WithdrawnRequestStatus: "PENDING",
                details: cart.map((i) => ({
                    MaterialId: i.id,
                    WithdrawnQuantity: i.qty,
                })),
                CreatedBy: user?.UserId,
            };

            const res = await apiPost("/request", payload);

            toast.success("ส่งใบเบิกสำเร็จ!", {
                description: `เลขที่ใบเบิก: ${res.RequestId || 'N/A'}`,
                duration: 3000,
            });

            setCart([]);
            // Optional: Close LIFF or redirect
            // liff.closeWindow(); 

        } catch (e: any) {
            console.error(e);
            toast.error("ส่งใบเบิกไม่สำเร็จ", { description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Safe area padding
    const safeAreaBottom = "pb-6";

    const filteredMaterials = materials.filter(m =>
        m.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading Screen
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-4 text-center">
                <LogOut className="h-10 w-10 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-800">เข้าสู่ระบบไม่สำเร็จ</h3>
                <p className="text-slate-500 text-sm">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">ลองใหม่อีกครั้ง</Button>
            </div>
        );
    }

    if (isAuthLoading || (isLiffInitializing && !user)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 animate-pulse">{status}</p>
            </div>
        );
    }

    // If initialization done but no user (and no error caught yet), show fallback
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-4 text-center">
                <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                <p className="text-slate-500">กำลังยืนยันข้อมูล...</p>
                <Button onClick={() => window.location.reload()} variant="link" className="text-slate-400">รีโหลดหน้าเว็บ</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center">
            <div className={`w-full max-w-md bg-slate-50 flex flex-col min-h-screen shadow-xl relative ${safeAreaBottom}`}>
                {/* Header */}
                {/* Header */}
                <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="-ml-2 text-slate-500" onClick={() => {
                        if (window.confirm('ต้องการออกจากระบบหรือไม่?')) {
                            // Clear App Auth
                            logout();
                            // Clear LIFF Auth if applicable
                            if (liff.isLoggedIn()) {
                                liff.logout();
                            }
                            // Force reload to clear any memory states / re-run entry logic
                            window.location.href = "/liff/register";
                        }
                    }}>
                        <LogOut className="h-5 w-5 rotate-180" />
                    </Button>
                    <div className="flex-1 ml-2">
                        <h1 className=" text-lg font-bold text-slate-800">เบิกวัตถุดิบ</h1>
                        {branchName && <p className="text-xs text-slate-500 font-medium">สาขา: <span className="text-primary">{branchName}</span></p>}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-700">
                                {lineProfile?.displayName || user?.UserName}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                                {user?.role}
                            </span>
                        </div>
                        {lineProfile?.pictureUrl && (
                            <img src={lineProfile.pictureUrl} alt="Profile" className="h-8 w-8 rounded-full border border-slate-200" />
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 bg-white border-b sticky top-[60px] z-20 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาวัตถุดิบ..."
                            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-10 rounded-xl"
                        />
                    </div>
                </div>

                {/* Materials List */}
                <div className="flex-1 p-3 grid gap-3 content-start">
                    {filteredMaterials.map((m) => {
                        const inCart = cart.find(c => c.id === m.MaterialId);
                        const qty = inCart ? inCart.qty : 0;

                        return (
                            <Card key={m.MaterialId} className={`border-none shadow-sm transition-all ${qty > 0 ? 'ring-2 ring-primary/20 bg-primary/5' : 'bg-white'}`}>
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 text-sm truncate">{m.MaterialName}</h3>
                                        <p className="text-xs text-slate-500">หน่วย: {m.Unit}</p>
                                    </div>

                                    <div className="flex items-center bg-slate-100 rounded-lg p-1 h-9 shadow-inner">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-md hover:bg-white hover:text-red-500 transition-colors"
                                            onClick={() => handleQuantityChange(m, Math.max(0, qty - 1))}
                                            disabled={qty === 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>

                                        <input
                                            type="number"
                                            className="w-12 h-full text-center bg-transparent border-none text-sm font-bold text-slate-800 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={qty === 0 ? '' : qty}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                if (!isNaN(val)) handleQuantityChange(m, Math.max(0, val));
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-md hover:bg-white hover:text-green-600 transition-colors"
                                            onClick={() => handleQuantityChange(m, qty + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {filteredMaterials.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            ไม่พบรายการวัตถุดิบ
                        </div>
                    )}
                </div>

                {/* Bottom Cart Bar */}
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-700 text-sm">รวมรายการ</span>
                        <span className="font-bold text-primary text-xl">{cart.reduce((s, i) => s + i.qty, 0)} <span className="text-sm font-normal text-slate-500">ชิ้น</span></span>
                    </div>

                    <div className="flex gap-3">
                        {cart.length > 0 && (
                            <Button variant="outline" className="px-3 border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50" onClick={() => setCart([])}>
                                <LogOut className="h-4 w-4 rotate-180" />
                            </Button>
                        )}
                        <Button
                            className="flex-1 h-12 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                            onClick={handleSubmit}
                            disabled={isSubmitting || cart.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังส่ง...
                                </>
                            ) : "ยืนยันการเบิก"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
