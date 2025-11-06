import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { apiGet, apiPut } from "../lib/api";

type User = {
  UserId: number;
  UserName: string;
  Email: string;
  TelNumber: string;
  LineId: string;
  UserStatus: "PENDING" | "ACTIVE" | "INACTIVE";
  RoleId: number;
  BranchId: number;
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiGet("/admin/users");
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      [u.UserName, u.Email, u.TelNumber].some((v) =>
        String(v).toLowerCase().includes(s)
      )
    );
  }, [q, users]);

  const approve = async (userId: number) => {
    try {
      await apiPut(`/admin/users/${userId}/status`, { status: "ACTIVE" });
      setUsers((prev) =>
        prev.map((u) => (u.UserId === userId ? { ...u, UserStatus: "ACTIVE" } : u))
      );
    } catch (error) {
      console.error("Failed to approve user", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการผู้ใช้</h1>
          <p className="text-muted-foreground mt-1">อนุมัติผู้ใช้ที่ลงทะเบียนใหม่</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายชื่อผู้ใช้</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 w-80" placeholder="ค้นหา ชื่อ/อีเมล/เบอร์โทร" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.UserId}>
                  <TableCell className="font-medium">{u.UserId}</TableCell>
                  <TableCell>{u.UserName}</TableCell>
                  <TableCell>{u.Email}</TableCell>
                  <TableCell>{u.UserStatus}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {u.UserStatus === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={() => approve(u.UserId)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                          <ShieldCheck className="h-4 w-4 mr-1" /> อนุมัติ
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


