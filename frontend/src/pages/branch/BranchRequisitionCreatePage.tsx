import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMaterials, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Loader2, Search, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Type for Cart Item
type CartItem = {
  id: number;
  name: string;
  qty: number;
  unit: string;
};

export default function BranchRequisitionCreatePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [materials, setMaterials] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchName, setBranchName] = useState<string>("กำลังโหลด...");

  // Fetch Branch Name
  useEffect(() => {
    if (user?.BranchId) {
      import("@/lib/api").then(({ getBranch }) => {
        getBranch(user.BranchId)
          .then(b => setBranchName(b.BranchName))
          .catch(() => setBranchName("ไม่ระบุสาขา"));
      });
    }
  }, [user]);

  // Load Materials
  useEffect(() => {
    async function load() {
      try {
        const res = await getMaterials();
        setMaterials(res || []);
      } catch (e) {
        console.error("Load materials error", e);
        // Fallback
        setMaterials([]);
      }
    }
    load();
  }, []);

  // Handlers
  const handleQuantityChange = (material: any, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === material.MaterialId);
      if (qty <= 0) {
        return prev.filter(p => p.id !== material.MaterialId);
      }
      if (existing) {
        return prev.map(p => p.id === material.MaterialId ? { ...p, qty } : p);
      }
      return [...prev, { id: material.MaterialId, name: material.MaterialName, unit: material.Unit, qty }];
    });
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        WithdrawnRequestCode: `REQ-${Date.now()}`,
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
      toast.success("ส่งคำขอเรียบร้อย", { description: `รหัส: ${res.RequestId}` });
      navigate("/requisitions");
    } catch (e: any) {
      toast.error("ส่งคำขอไม่สำเร็จ", { description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.MaterialName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-slate-50 flex flex-col min-h-screen shadow-2xl relative pb-24">

        {/* Header */}
        <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 text-slate-500" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800">เบิกวัตถุดิบ</h1>
            <p className="text-xs text-primary font-medium">{branchName}</p>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b sticky top-[60px] z-20">
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
            const isSelected = qty > 0;

            return (
              <Card key={m.MaterialId} className={`border-none shadow-sm transition-all ${isSelected ? 'ring-1 ring-indigo-500 bg-indigo-50/10' : 'bg-white'}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{m.MaterialName}</h3>
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

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-700 text-sm">รวมรายการ</span>
            <span className="font-bold text-indigo-600 text-xl">{cart.reduce((s, i) => s + i.qty, 0)} <span className="text-sm font-normal text-slate-500">ชิ้น</span></span>
          </div>

          <Button
            className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-200 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังส่ง...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" /> ยืนยันการเบิก
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
