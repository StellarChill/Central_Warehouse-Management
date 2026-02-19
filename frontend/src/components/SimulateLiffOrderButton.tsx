
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, Plus, Trash2, ShoppingCart } from "lucide-react";
import { apiPost, getMaterials, getBranches } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CartItem = {
    MaterialId: number;
    MaterialName: string;
    WithdrawnQuantity: number;
    Unit: string;
};

export function SimulateLiffOrderButton({ onSuccess }: { onSuccess?: () => void }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [branches, setBranches] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    // Form State
    const [targetBranchId, setTargetBranchId] = useState<string>("");
    const [cart, setCart] = useState<CartItem[]>([]);

    // Item Input State
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);

    // Load Initial Data
    useEffect(() => {
        if (open) {
            setLoading(true);
            Promise.all([getBranches(), getMaterials()])
                .then(([b, m]) => {
                    setBranches(b);
                    setMaterials(m);

                    // Default branch selection
                    if (user?.BranchId) {
                        setTargetBranchId(String(user.BranchId));
                    } else if (b.length > 0) {
                        setTargetBranchId(String(b[0].BranchId));
                    }
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to load data");
                })
                .finally(() => setLoading(false));
        }
    }, [open, user]);

    const addToCart = () => {
        if (!selectedMaterialId) return;

        const mat = materials.find(m => String(m.MaterialId) === selectedMaterialId);
        if (!mat) return;

        if (quantity <= 0) {
            toast.error("Quantity must be greater than 0");
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.MaterialId === mat.MaterialId);
            if (existing) {
                return prev.map(item =>
                    item.MaterialId === mat.MaterialId
                        ? { ...item, WithdrawnQuantity: item.WithdrawnQuantity + quantity }
                        : item
                );
            }
            return [...prev, {
                MaterialId: mat.MaterialId,
                MaterialName: mat.MaterialName,
                WithdrawnQuantity: quantity,
                Unit: mat.Unit
            }];
        });

        // Reset input
        setSelectedMaterialId("");
        setQuantity(1);
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.MaterialId !== id));
    };

    const submitOrder = async () => {
        if (!targetBranchId) {
            toast.error("Please select a branch");
            return;
        }
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        setSubmitting(true);
        try {
            const branchName = branches.find(b => String(b.BranchId) === targetBranchId)?.BranchName;

            const payload = {
                WithdrawnRequestCode: `REQ-SIM-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
                BranchId: Number(targetBranchId),
                RequestDate: new Date().toISOString(),
                WithdrawnRequestStatus: "PENDING",
                details: cart.map(item => ({
                    MaterialId: item.MaterialId,
                    WithdrawnQuantity: item.WithdrawnQuantity
                })),
                CreatedBy: user?.UserId,
            };

            const res = await apiPost("/request", payload);

            toast.success("Simulation Successful", {
                description: `Order ${res.WithdrawnRequestCode} created for ${branchName}`,
            });

            setCart([]);
            setOpen(false);
            onSuccess?.();
        } catch (e: any) {
            console.error(e);
            toast.error("Simulation Failed", { description: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                >
                    <Smartphone className="h-4 w-4" />
                    Test LIFF Order
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Simulate LIFF Order</DialogTitle>
                    <DialogDescription>
                        Create a test order as if it came from the LINE LIFF app.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">



                        {/* Add Item Section */}
                        <div className="space-y-2 p-4 bg-muted/40 rounded-lg border">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Add Products</Label>
                            <div className="flex gap-2">
                                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                    <SelectTrigger className="flex-1 bg-background">
                                        <SelectValue placeholder="Select product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materials.map(m => (
                                            <SelectItem key={m.MaterialId} value={String(m.MaterialId)}>
                                                {m.MaterialName} ({m.Unit})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min={1}
                                    className="w-20 bg-background"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                                <Button size="icon" onClick={addToCart} disabled={!selectedMaterialId}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Cart List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Cart Items ({cart.length})</Label>
                                {cart.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setCart([])} className="h-auto p-0 text-xs text-destructive">
                                        Clear
                                    </Button>
                                )}
                            </div>

                            <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                        <ShoppingCart className="h-8 w-8 opacity-20" />
                                        No items selected
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.MaterialId} className="flex justify-between items-center p-2 text-sm">
                                            <div>
                                                <div className="font-medium">{item.MaterialName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.WithdrawnQuantity} {item.Unit}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFromCart(item.MaterialId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={submitOrder} disabled={submitting || cart.length === 0 || !targetBranchId}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
