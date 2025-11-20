import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, Search, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { createWarehouse, deleteWarehouse, getWarehouses, updateWarehouse, type Warehouse } from "@/lib/api";
import { RequireRole, useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type FormState = {
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseAddress: string;
};

const emptyForm: FormState = { WarehouseName: "", WarehouseCode: "", WarehouseAddress: "" };

const WarehouseManagementPage: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.role === "COMPANY_ADMIN" || user?.role === "ADMIN";
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
  });

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((w) =>
      [w.WarehouseName, w.WarehouseCode, w.WarehouseAddress]
        .filter(Boolean)
        .some((v) => v!.toString().toLowerCase().includes(term))
    );
  }, [rows, q]);

  const createMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      toast.success("สร้างคลังเรียบร้อย");
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e?.message || "สร้างคลังไม่สำเร็จ"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormState> }) => updateWarehouse(id, data),
    onSuccess: () => {
      toast.success("บันทึกข้อมูลคลังแล้ว");
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e?.message || "บันทึกไม่สำเร็จ"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      toast.success("ลบคลังแล้ว");
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      setConfirmOpen(false);
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e?.message || "ลบไม่สำเร็จ"),
  });

  const onOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const onOpenEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({
      WarehouseName: w.WarehouseName || "",
      WarehouseCode: w.WarehouseCode || "",
      WarehouseAddress: w.WarehouseAddress || "",
    });
    setOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.WarehouseName?.trim()) return toast.error("กรอกชื่อคลัง");
    if (!form.WarehouseCode?.trim()) return toast.error("กรอกรหัสคลัง");
    if (editing) {
      updateMut.mutate({ id: editing.WarehouseId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const onDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  if (isError) return <div className="p-6 text-red-600">{(error as any)?.message || "โหลดข้อมูลไม่สำเร็จ"}</div>;

  return (
    <RequireRole allow={["COMPANY_ADMIN", "ADMIN", "WAREHOUSE_ADMIN"]}>
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">จัดการคลังสินค้า</h1>
            <p className="text-sm text-muted-foreground">สร้าง แก้ไข และจัดการคลังของบริษัทคุณ</p>
            <CompanyInfoInline />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="ค้นหาชื่อ / รหัส / ที่อยู่"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 w-[220px] sm:w-[260px]"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {canManage ? (
              <Button onClick={onOpenCreate}>
                <Plus className="w-4 h-4 mr-2" /> เพิ่มคลัง
              </Button>
            ) : (
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                ดูคลัง
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>คลังทั้งหมดในบริษัท</CardTitle>
            <Badge variant="secondary">{rows.length} คลัง</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อคลัง</TableHead>
                    <TableHead>รหัสคลัง</TableHead>
                    <TableHead>ที่อยู่</TableHead>
                    <TableHead className="w-[260px] text-right">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-80" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!isLoading && filtered.map((w) => (
                    <TableRow key={w.WarehouseId} className="hover:bg-accent/40">
                      <TableCell className="font-medium">{w.WarehouseName}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1">
                          <span className="font-mono text-sm">{w.WarehouseCode}</span>
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText(w.WarehouseCode || "");
                              toast.success("คัดลอกรหัสแล้ว");
                            }}
                            aria-label="คัดลอกรหัสคลัง"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[520px] truncate">{w.WarehouseAddress || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="hidden sm:flex justify-end gap-2">
                          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link to={`/warehouse/${w.WarehouseId}/dashboard`}>
                              <Eye className="w-4 h-4 mr-1" /> เปิดดู
                            </Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => onOpenEdit(w)}>
                                <Pencil className="w-4 h-4 mr-1" /> แก้ไข
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => onDelete(w.WarehouseId)}>
                                <Trash2 className="w-4 h-4 mr-1" /> ลบ
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="sm:hidden inline-flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/warehouse/${w.WarehouseId}/dashboard`} className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2" /> เปิดดู
                                </Link>
                              </DropdownMenuItem>
                              {canManage && (
                                <>
                                  <DropdownMenuItem onClick={() => onOpenEdit(w)}>
                                    <Pencil className="w-4 h-4 mr-2" /> แก้ไข
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDelete(w.WarehouseId)} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" /> ลบ
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {q ? "ไม่พบรายการที่ตรงกับคำค้น" : "ยังไม่มีคลังในบริษัท"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create / Edit dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "แก้ไขคลัง" : "เพิ่มคลัง"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="wh-name">ชื่อคลัง</Label>
                <Input id="wh-name" value={form.WarehouseName} onChange={(e) => setForm((f) => ({ ...f, WarehouseName: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wh-code">รหัสคลัง</Label>
                <Input id="wh-code" value={form.WarehouseCode} onChange={(e) => setForm((f) => ({ ...f, WarehouseCode: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wh-addr">ที่อยู่ (ถ้ามี)</Label>
                <Input id="wh-addr" value={form.WarehouseAddress} onChange={(e) => setForm((f) => ({ ...f, WarehouseAddress: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? "บันทึก" : "สร้าง"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบคลังนี้?</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">การลบจะไม่สามารถย้อนกลับได้</div>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>
                ลบ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RequireRole>
  );
};

export default WarehouseManagementPage;

// Inline component to show company name/code from auth user (already loaded at login)
function CompanyInfoInline() {
  const { user } = useAuth();
  if (!user?.CompanyName) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary font-medium">
        บริษัท: {user.CompanyName}
      </span>
      {user.CompanyCode && (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-1 text-secondary-foreground font-medium">
          รหัส: {user.CompanyCode}
        </span>
      )}
    </div>
  );
}