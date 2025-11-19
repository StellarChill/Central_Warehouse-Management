import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Pencil, Trash2, Plus, Search, Eye, Package, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

type WarehouseItem = {
  id: string;
  name: string;
  items?: number;
  managers?: number;
};

const WarehouseOverviewPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([
    { id: "1", name: "Central Warehouse", items: 1240, managers: 3 },
    { id: "2", name: "East Hub", items: 560, managers: 2 },
    { id: "3", name: "West Depot", items: 320, managers: 1 },
  ]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const openWarehouse = (warehouseId: string) => {
    navigate(`/warehouse/${warehouseId}/dashboard`);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setNameInput("");
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    const w = warehouses.find((x) => x.id === id);
    if (!w) return;
    setEditingId(id);
    setNameInput(w.name);
    setDialogOpen(true);
  };

  const saveWarehouse = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (editingId) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === editingId ? { ...w, name: trimmed } : w))
      );
    } else {
      setWarehouses((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: trimmed,
          items: Math.floor(Math.random() * 500) + 50,
          managers: Math.floor(Math.random() * 3) + 1,
        },
      ]);
    }
    setDialogOpen(false);
  };

  const confirmDelete = (id: string) => setPendingDelete(id);
  const handleDeleteWarehouse = () => {
    if (!pendingDelete) return;
    setWarehouses((prev) => prev.filter((w) => w.id !== pendingDelete));
    setPendingDelete(null);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return warehouses.filter(
      (w) => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
    );
  }, [warehouses, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            คลังสินค้า (Warehouse Overview)
          </h1>
          <p className="text-slate-500">
            จัดการรายชื่อคลัง ค้นหา แก้ไข ลบ และเข้าใช้งานตามบทบาท
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาคลังหรือรหัส..."
              className="pl-9"
            />
          </div>
          <div className="flex-1" />
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" /> สร้างคลังใหม่
          </Button>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <Building2 className="h-10 w-10 text-slate-300 mb-3" />
              <div className="text-slate-700 font-medium">ไม่พบคลังสินค้าที่ตรงกับคำค้นหา</div>
              <div className="text-slate-500 text-sm mt-1">
                ลองเปลี่ยนคำค้นหา หรือสร้างคลังใหม่
              </div>
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> สร้างคลังใหม่
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((warehouse) => (
              <Card key={warehouse.id} className="transition hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">
                        {warehouse.name}
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        <span className="text-slate-500">ID:</span>{" "}
                        <Badge variant="secondary" className="align-middle">
                          {warehouse.id}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(warehouse.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => confirmDelete(warehouse.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span>จำนวนรายการ: </span>
                      <span className="font-medium text-slate-800">
                        {warehouse.items ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>ผู้ดูแล: </span>
                      <span className="font-medium text-slate-800">
                        {warehouse.managers ?? "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={() => openWarehouse(warehouse.id)} className="gap-2">
                    <Eye className="h-4 w-4" /> เปิดดู
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "แก้ไขชื่อคลัง" : "สร้างคลังใหม่"}</DialogTitle>
            <DialogDescription>
              {editingId ? "แก้ไขชื่อคลังสินค้า แล้วกดบันทึก" : "ระบุชื่อคลังสินค้าใหม่ แล้วกดบันทึก"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="warehouse-name">ชื่อคลัง</Label>
            <Input
              id="warehouse-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="เช่น Central Warehouse"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveWarehouse}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบคลังสินค้า?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบนี้ไม่สามารถย้อนกลับได้ คุณต้องการลบคลังนี้หรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteWarehouse}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WarehouseOverviewPage;
