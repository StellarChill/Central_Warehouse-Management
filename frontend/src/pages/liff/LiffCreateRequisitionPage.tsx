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

    // Selection State
    const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null); // For dialog
    const [tempQty, setTempQty] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // 1. Robust Auth Check & LIFF Init
    useEffect(() => {
        const initLiffDoc = async () => {
            // If already authenticated via localStorage, we are good
            if (user) {
                setIsLiffInitializing(false);
                return;
            }

            // Perform LIFF Login Sequence
            try {
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

                // Wait for ready (optional but safe)
                if (liff.ready) await liff.ready;

                if (!liff.isLoggedIn()) {
                    liff.login({ redirectUri: `${window.location.origin}/liff` });
                    return;
                }

                // Try to login to backend
                const idToken = liff.getIDToken();
                const profile = await liff.getProfile();

                try {
                    // Prefer ID Token
                    if (idToken) await loginWithLine(idToken, true);
                    else await loginWithLine(profile.userId, false);

                    // Login Success - Stay on this page
                    localStorage.setItem("liff_only", "1");
                    setIsLiffInitializing(false);

                } catch (backendErr: any) {
                    // Login Failed -> User likely not registered
                    console.warn("Backend Login Failed:", backendErr);

                    if (String(backendErr.message).includes("pending")) {
                        navigate("/awaiting-approval", { replace: true });
                        return;
                    }

                    // Redirect to Register
                    navigate("/liff/register", { replace: true });
                }

            } catch (err) {
                console.error("LIFF Init Error:", err);
                toast.error("ไม่สามารถเชื่อมต่อ LINE ได้");
                setIsLiffInitializing(false); // Stop loading to show error or empty state
            }
        };

        if (!isAuthLoading) {
            initLiffDoc();
        }
    }, [user, isAuthLoading, loginWithLine, navigate]);

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
    const openAddDialog = (material: any) => {
        setSelectedMaterial(material);
        setTempQty(1);
        setIsDialogOpen(true);
    };

    const addToCart = () => {
        if (!selectedMaterial) return;

        setCart((prev) => {
            // Check if exists
            const existing = prev.find((p) => p.id === selectedMaterial.MaterialId);
            if (existing) {
                return prev.map((p) =>
                    p.id === selectedMaterial.MaterialId
                        ? { ...p, qty: p.qty + tempQty }
                        : p
                );
            }
            return [
                ...prev,
                {
                    id: selectedMaterial.MaterialId,
                    name: selectedMaterial.MaterialName,
                    unit: selectedMaterial.Unit,
                    qty: tempQty,
                },
            ];
        });

        setIsDialogOpen(false);
        toast.success("เพิ่มลงรายการแล้ว");
    };

    const updateQty = (id: number, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(1, item.qty + delta);
                    return { ...item, qty: newQty };
                }
                return item;
            })
        );
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const payload = {
                WithdrawnRequestCode: `REQ-LIFF-${Date.now()}`,
                BranchId: user?.BranchId || 1,
                RequestDate: new Date().toISOString(),
                WithdrawnRequestStatus: "REQUESTED",
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

        } catch (e: any) {
            console.error(e);
            toast.error("ส่งใบเบิกไม่สำเร็จ", { description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout(); // Clear local context
        try {
            // Check if liff is initialized before calling isLoggedIn
            // Safety check for liff object
            if (typeof liff !== 'undefined' && liff.id) {
                if (liff.isLoggedIn()) {
                    liff.logout();
                }
            }
        } catch (e) {
            // ignore liff errors
            console.warn("LIFF logout warning", e);
        }
        navigate("/liff"); // Go to LIFF Entry
    };

    // Safe area padding
    const safeAreaBottom = "pb-24";

    const filteredMaterials = materials.filter(m =>
        m.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading Screen
    if (isAuthLoading || (isLiffInitializing && !user)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 animate-pulse">กำลังตรวจสอบข้อมูลสมาชิก...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col ${safeAreaBottom}`}>
            {/* Header */}
            <div className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">เบิกวัตถุดิบ</h1>
                    {branchName && <p className="text-xs text-primary font-medium">{branchName}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-700">{user?.UserName}</span>
                        <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                            {user?.role}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 bg-white border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ค้นหาวัตถุดิบ..."
                        className="pl-9 bg-slate-100 border-none"
                    />
                </div>
            </div>

            {/* Materials List */}
            <div className="flex-1 p-4 grid gap-3">
                {filteredMaterials.map((m) => {
                    const inCart = cart.find(c => c.id === m.MaterialId);
                    return (
                        <Card key={m.MaterialId} className="border-none shadow-sm active:scale-[0.98] transition-transform" onClick={() => openAddDialog(m)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{m.MaterialName}</h3>
                                    <p className="text-sm text-slate-500">หน่วย: {m.Unit}</p>
                                </div>
                                {inCart ? (
                                    <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                                        x {inCart.qty}
                                    </div>
                                ) : (
                                    <Button size="icon" variant="ghost" className="text-primary bg-primary/10 rounded-full h-8 w-8 hover:bg-primary/20">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                )}
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
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-700">รายการในตะกร้า</span>
                        <span className="font-bold text-primary text-lg">{cart.reduce((s, i) => s + i.qty, 0)} รายการ</span>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setCart([])}>
                            ล้าง
                        </Button>
                        <Button className="flex-[3]" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "กำลังส่ง..." : "ยืนยันการเบิก"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Item Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[90%] rounded-xl">
                    <DialogHeader>
                        <DialogTitle>ระบุจำนวน</DialogTitle>
                    </DialogHeader>

                    {selectedMaterial && (
                        <div className="py-4 flex flex-col items-center gap-4">
                            <h3 className="text-xl font-semibold">{selectedMaterial.MaterialName}</h3>
                            <div className="flex items-center gap-4">
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={() => setTempQty(Math.max(1, tempQty - 1))}>
                                    <Minus />
                                </Button>
                                <span className="text-3xl font-bold w-16 text-center">{tempQty}</span>
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={() => setTempQty(tempQty + 1)}>
                                    <Plus />
                                </Button>
                            </div>
                            <p className="text-slate-500">หน่วย: {selectedMaterial.Unit}</p>
                        </div>
                    )}

                    <DialogFooter className="flex-row gap-2 sm:justify-center">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                        <Button className="flex-1" onClick={addToCart}>ยืนยัน</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
