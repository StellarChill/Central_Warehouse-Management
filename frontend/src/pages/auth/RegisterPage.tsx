// src/pages/RegisterPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Warehouse, UserPlus, Eye, EyeOff, CheckCircle, Shield } from "lucide-react";
import { th } from "../i18n/th";
import { useAuth } from "../../context/AuthContext";

interface RegisterFormData {
  UserName: string;
  UserPassword: string;
  confirmPassword: string;
  RoleId: string;   // รับจาก Select เป็น string
  BranchId: string; // รับจาก Select เป็น string
  TelNumber: string;
  Email: string;
  LineId: string;   // optional
  Company: string;  // optional
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

const features = [
  { icon: Warehouse, title: "จัดการคลังสินค้า", description: "ติดตามสต็อก การรับ-จ่าย และการเคลื่อนไหวสินค้า" },
  { icon: Shield, title: "ความปลอดภัยสูง", description: "ลงทะเบียนด้วยอีเมล หรือเชื่อม LINE ภายหลัง" },
];

const benefits = [
  "สมัครเร็ว < 1 นาที",
  "โยงบทบาท ↔ สาขา ตั้งแต่แรก",
  "เก็บข้อมูลเท่าที่จำเป็น (PDPA)",
  "เปลี่ยนบทบาท/สาขาภายหลังได้",
];

// จำลองรายการบริษัทที่มีอยู่แล้วในระบบ (ภายหลังดึงจาก API)
const companies = [
  { id: "c1", name: "บริษัท เอ จำกัด" },
  { id: "c2", name: "บริษัท บี เทคโนโลยี" },
  { id: "c3", name: "องค์กรซี โซลูชั่นส์" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);
  const { register: registerUser, user } = useAuth();

  // ถ้า login แล้ว redirect ไปหน้าแรก
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState<RegisterFormData>({
    UserName: "",
    UserPassword: "",
    confirmPassword: "",
    RoleId: "",
    BranchId: "",
    TelNumber: "",
    Email: "",
    LineId: "",
    Company: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<SubmitMsg>(null);
  const [companySelect, setCompanySelect] = useState<string>(""); // c1/c2/.../other

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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) next.Email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.TelNumber) next.TelNumber = "กรอกเบอร์โทร";
    else if (!/^\d{9,10}$/.test(formData.TelNumber)) next.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
    if (!formData.UserPassword || formData.UserPassword.length < 6) next.UserPassword = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (formData.confirmPassword !== formData.UserPassword) next.confirmPassword = "รหัสผ่านยืนยันไม่ตรงกัน";
    if (!formData.RoleId) next.RoleId = "เลือกบทบาท";
    if (!formData.BranchId) next.BranchId = "เลือกสาขา";
    // ต้องเลือกบริษัท (หรือกรอกเอง)
    if (!companySelect) next.Company = "เลือกบริษัทที่มีอยู่ หรือเลือก 'อื่นๆ' แล้วกรอกชื่อ";
    if (companySelect === "other" && !formData.Company.trim()) next.Company = "กรอกชื่อบริษัท/หน่วยงาน";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // map companySelect -> Company field
      if (companySelect && companySelect !== "other") {
        const found = companies.find((c) => c.id === companySelect);
        if (found) {
          formData.Company = found.name;
        }
      }
      await registerUser({
        UserName: formData.UserName.trim(),
        UserPassword: formData.UserPassword,
        Company: formData.Company.trim() || undefined,
        RoleId: Number(formData.RoleId),
        BranchId: Number(formData.BranchId),
        TelNumber: formData.TelNumber.trim(),
        Email: formData.Email.trim().toLowerCase(),
        LineId: formData.LineId.trim() || undefined, // optional
      });

      setSubmitMsg({ type: "success", text: "สมัครสมาชิกสำเร็จ! รอการอนุมัติจากผู้ดูแลระบบ" });
      redirectTimerRef.current = window.setTimeout(() => navigate("/awaiting-approval"), 1500);
    } catch (err: any) {
      setSubmitMsg({ type: "error", text: err?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Warehouse className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{th.dashboard.title}</h1>
                <p className="text-muted-foreground">{th.dashboard.subtitle}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              สมัครสมาชิกใหม่เพื่อใช้งานระบบบริหารสต็อก/สาขา
              <br />
              ใช้อีเมล/รหัสผ่าน หรือเชื่อม LINE ภายหลังได้
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              ทำไมต้องสมัครกับเรา
            </h3>
            <div className="space-y-2">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Register card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6" /> สมัครสมาชิก
              </CardTitle>
              <p className="text-muted-foreground">สร้างบัญชีผู้ใช้ใหม่สำหรับระบบ</p>
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
                  <Label htmlFor="UserName">ชื่อผู้ใช้</Label>
                  <Input id="UserName" value={formData.UserName} onChange={handleChange("UserName")} placeholder="เช่น somchai" />
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
                  <Label>บริษัท / หน่วยงาน</Label>
                  <Select value={companySelect} onValueChange={(v) => setCompanySelect(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบริษัทที่มีอยู่ หรือเลือก 'อื่นๆ'" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="other">อื่นๆ (พิมพ์ชื่อบริษัทเอง)</SelectItem>
                    </SelectContent>
                  </Select>
                  {companySelect === "other" && (
                    <div className="mt-2">
                      <Label htmlFor="Company" className="text-xs">พิมพ์ชื่อบริษัท / หน่วยงาน</Label>
                      <Input id="Company" value={formData.Company} onChange={handleChange("Company")} placeholder="เช่น บริษัท เอ จำกัด" />
                    </div>
                  )}
                  {errors.Company && <p className="text-xs text-red-500">{errors.Company}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="UserPassword">รหัสผ่าน</Label>
                  <div className="relative">
                    <Input
                      id="UserPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.UserPassword}
                      onChange={handleChange("UserPassword")}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.UserPassword && <p className="text-xs text-red-500">{errors.UserPassword}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      aria-label={showConfirm ? "ซ่อนรหัสผ่านยืนยัน" : "แสดงรหัสผ่านยืนยัน"}
                      aria-pressed={showConfirm}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
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

                <div className="space-y-1">
                  <Label htmlFor="LineId">LINE ID (ถ้ามี)</Label>
                  <Input id="LineId" value={formData.LineId} onChange={handleChange("LineId")} placeholder="ใส่เพื่อเชื่อมบัญชีภายหลัง (ออปชันนัล)" />
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
                      สร้างบัญชีใหม่
                    </div>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-3">
                  มีบัญชีอยู่แล้ว?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    เข้าสู่ระบบ
                  </Link>
                </p>

                <div className="text-center p-3 bg-info/10 rounded-lg border border-info/20 mt-4">
                  <p className="text-xs text-info">
                    หากพบปัญหาการเชื่อมต่อ โปรดตรวจสอบการตั้งค่า CORS ที่ Backend หรือเปิด proxy ใน Vite
                  </p>
                </div>
              </form>

              <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-info" />
                  <span className="text-sm font-medium text-info">ปลอดภัยและเชื่อถือได้</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  เราเก็บเฉพาะข้อมูลที่จำเป็นต่อการสร้างบัญชี และเข้ารหัสรหัสผ่านฝั่งเซิร์ฟเวอร์
                </p>
              </div>

              <div className="mt-4 space-y-2 text-center">
                <p className="text-xs text-muted-foreground">บทบาทในระบบ:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="text-xs">{th.roles.ADMIN}</Badge>
                  <Badge variant="outline" className="text-xs">{th.roles.CENTER}</Badge>
                  <Badge variant="outline" className="text-xs">{th.roles.BRANCH}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}