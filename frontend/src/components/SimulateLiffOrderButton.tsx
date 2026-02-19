
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone } from "lucide-react";
import { apiPost, getMaterials, getBranches } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function SimulateLiffOrderButton({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const simulateOrder = async () => {
        setLoading(true);
        try {
            // 1. Get random data
            const branches = await getBranches();
            const materials = await getMaterials();

            if (branches.length === 0 || materials.length === 0) {
                throw new Error("No branches or materials found");
            }

            // Pick random branch (or use current user's branch if available, but for simulation let's mix it up or prefer one)
            // If user is from a branch, use their branch. If not, pick random.
            const targetBranch = user?.BranchId
                ? branches.find(b => b.BranchId === user.BranchId) || branches[0]
                : branches[Math.floor(Math.random() * branches.length)];

            // Pick 1-3 random materials
            const numItems = Math.floor(Math.random() * 3) + 1;
            const shuffled = [...materials].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, numItems);

            const items = selected.map(m => ({
                MaterialId: m.MaterialId,
                WithdrawnQuantity: Math.floor(Math.random() * 10) + 1 // 1-10 qty
            }));

            // 2. Construct payload matching LiffCreateRequisitionPage
            const payload = {
                WithdrawnRequestCode: `REQ-SIM-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
                BranchId: targetBranch.BranchId,
                RequestDate: new Date().toISOString(),
                WithdrawnRequestStatus: "PENDING",
                details: items,
                CreatedBy: user?.UserId, // Or maybe null to simulate external user? But Liff usually has a user.
            };

            // 3. Send request
            const res = await apiPost("/request", payload);

            toast.success("จำลองคำสั่งซื้อสำเร็จ!", {
                description: `สาขา: ${targetBranch.BranchName}, รหัส: ${res.RequestId}`,
            });

            onSuccess?.();
        } catch (e: any) {
            console.error(e);
            toast.error("การจำลองล้มเหลว", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={simulateOrder}
            disabled={loading}
            className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            Test LIFF Order
        </Button>
    );
}
