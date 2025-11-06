import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Warehouse, UserPlus, CheckCircle } from "lucide-react";
import { th } from "../i18n/th";
import { useAuth } from "../context/AuthContext";

interface RegisterFormData {
  UserName: string;
  RoleId: string;
  BranchId: string;
  TelNumber: string;
  Email: string;
  LineId: string;
}

type SubmitMsg = { type: "success" | "error"; text: string } | null;

const roles = [
  { id: "1", label: th.roles.ADMIN },
  { id: "2", label: th.roles.CENTER },
  { id: "3", label: th.roles.BRANCH },
];

const branches = [
  { id: "1", name: "สาขากลาง (Center A)" },
  { id: "2", name: "สาขา B" },
  { id: "3", name: "สาขา C" },
];

export default function LineRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimerRef = useRef<number | null>(null);
  const { register: registerUser, user } = useAuth();

  const lineProfile = location.state?.lineProfile;

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
    if (!lineProfile) {
        // If no line profile, redirect to login
        navigate("/login");
    }
  }, [user, navigate, lineProfile]);

  const [formData, setFormData] = useState<RegisterFormData>({
    UserName: lineProfile?.UserName || "",
    RoleId: "",
    BranchId: "",
    TelNumber: "",
    Email: "",
    LineId: lineProfile?.LineId || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<SubmitMsg>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleChange =
    (field: keyof RegisterFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const validate = () => {
    const next: Partial<Record<keyof RegisterFormData, string>> = {};
    if (!formData.UserName || formData.UserName.trim().length < 3) next.UserName = "กรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร";
    if (!formData.Email) next.Email = "กรอกอีเมล";
    else if (!/^[^S@]+@[^S@]+\.[^S@]+$/.test(formData.Email)) next.Email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.TelNumber) next.TelNumber = "กรอกเบอร์โทร";
    else if (!/^\d{9,10}$/.test(formData.TelNumber)) next.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
    if (!formData.RoleId) next.RoleId = "เลือกบทบาท";
    if (!formData.BranchId) next.BranchId = "เลือกสาขา";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registerUser({
        UserName: formData.UserName.trim(),
        UserPassword: 'password_placeholder', // Not used in LINE register
        RoleId: Number(formData.RoleId),
        BranchId: Number(formData.BranchId),
        TelNumber: formData.TelNumber.trim(),
        Email: formData.Email.trim().toLowerCase(),
        LineId: formData.LineId.trim(),
      });

      setSubmitMsg({ type: "success", text: "ลงทะเบียนสำเร็จ! โปรดรอการอนุมัติจากผู้ดูแลระบบ" });
      redirectTimerRef.current = window.setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setSubmitMsg({ type: "error", text: err?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <Warehouse className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{th.dashboard.title}</h1>
                        <p className="text-muted-foreground">{th.dashboard.subtitle}</p>
                    </div>
                </div>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6" /> ลงทะเบียนผ่าน LINE
              </CardTitle>
              <p className="text-muted-foreground">กรอกข้อมูลเพิ่มเติมเพื่อใช้งาน</p>
            </CardHeader>

            <CardContent>
              {submitMsg && (
                <Alert variant={submitMsg.type === "error" ? "destructive" : "default"} className="mb-4">
                  <AlertDescription className={submitMsg.type === "error" ? "" : "text-green-600"}>
                    {submitMsg.text}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="UserName">ชื่อผู้ใช้ (จาก LINE)</Label>
                  <Input id="UserName" value={formData.UserName} onChange={handleChange("UserName")} />
                  {errors.UserName && <p className="text-xs text-red-500">{errors.UserName}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="Email">อีเมล</Label>
                  <Input id="Email" type="email" value={formData.Email} onChange={handleChange("Email")} placeholder="you@example.com" />
                  {errors.Email && <p className="text-xs text-red-500">{errors.Email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="TelNumber">เบอร์โทร</Label>
                  <Input id="TelNumber" value={formData.TelNumber} onChange={handleChange("TelNumber")} placeholder="0801234567" />
                  {errors.TelNumber && <p className="text-xs text-red-500">{errors.TelNumber}</p>}
                </div>

                <div className="space-y-1">
                  <Label>บทบาท</Label>
                  <Select value={formData.RoleId} onValueChange={(v) => setFormData((p) => ({ ...p, RoleId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.RoleId && <p className="text-xs text-red-500">{errors.RoleId}</p>}
                </div>

                <div className="space-y-1">
                  <Label>สาขา</Label>
                  <Select value={formData.BranchId} onValueChange={(v) => setFormData((p) => ({ ...p, BranchId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.BranchId && <p className="text-xs text-red-500">{errors.BranchId}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg mt-2">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังสมัครสมาชิก...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      ยืนยันการลงทะเบียน
                    </div>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-3">
                  ต้องการใช้บัญชีอื่น?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    กลับไปหน้าเข้าสู่ระบบ
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}