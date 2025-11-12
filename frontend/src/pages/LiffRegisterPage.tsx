// src/pages/LiffRegisterPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Warehouse } from "lucide-react";
import { th } from "../i18n/th";
import { useAuth } from "../context/AuthContext";



interface LiffRegisterFormData {
  UserName: string;
  RoleId: string;
  BranchId: string;
  TelNumber: string;
  Email: string;
  LineId: string;
  Company: string;
}

type SubmitMsg = { type: "success" | "error"; text: string } | null;

const roles = [
  { id: "2", label: th.roles.CENTER },
  { id: "3", label: th.roles.BRANCH },
];

const branches = [
  { id: "1", name: "สาขากลาง (Center A)" },
  { id: "2", name: "สาขา B" },
  { id: "3", name: "สาขา C" },
];

export default function LiffRegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, loginWithLine } = useAuth();

  const [formData, setFormData] = useState<LiffRegisterFormData>({
    UserName: "",
    RoleId: "",
    BranchId: "",
    TelNumber: "",
    Email: "",
    LineId: "",
    Company: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LiffRegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<SubmitMsg>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // In a real scenario, you would import and use the actual liff object.
        // For now, we use a mock.
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          // Try to get ID token (preferred) or access token as fallback
          const gotIdToken = typeof liff.getIDToken === 'function' ? liff.getIDToken() : null;
          const gotAccessToken = !gotIdToken && typeof liff.getAccessToken === 'function' ? liff.getAccessToken() : null;
          if (gotIdToken) setIdToken(gotIdToken);
          else if (gotAccessToken) setIdToken(gotAccessToken);

          setFormData((prev) => ({
            ...prev,
            LineId: profile.userId,
            UserName: profile.displayName,
          }));
          // User needs to complete registration; no auto-login attempt to avoid 404 on /api/login/line
        } else {
          liff.login();
        }
      } catch (error) {
        console.error("LIFF Initialization failed.", error);
        setLiffError("ไม่สามารถเชื่อมต่อกับ LINE ได้");
      }
    };

    initializeLiff();
  }, []);

  const handleChange =
    (field: keyof LiffRegisterFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const validate = () => {
    const next: Partial<Record<keyof LiffRegisterFormData, string>> = {};
    if (!formData.UserName || formData.UserName.trim().length < 3) next.UserName = "กรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร";
    if (!formData.Email) next.Email = "กรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) next.Email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.TelNumber) next.TelNumber = "กรอกเบอร์โทร";
    else if (!/^\d{9,10}$/.test(formData.TelNumber)) next.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
    if (!formData.RoleId) next.RoleId = "เลือกบทบาท";
    if (!formData.BranchId) next.BranchId = "เลือกสาขา";
    if (!formData.LineId) next.LineId = "ไม่พบ LINE ID";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);
    if (!validate()) {
      console.log("Validation failed", errors);
      return;
    }

    setIsSubmitting(true);
      try {
        const payload = {
          UserName: formData.UserName.trim(),
          UserPassword: "", // LIFF registration doesn't use password — send empty string to satisfy API/type
          Company: formData.Company.trim() || undefined,
          RoleId: Number(formData.RoleId),
          // If user typed a numeric id, keep it; otherwise send 0 and include BranchName
          BranchId: Number(formData.BranchId) || 0,
          BranchName: formData.BranchId.trim() || undefined,
          TelNumber: formData.TelNumber.trim(),
          Email: formData.Email.trim().toLowerCase(),
          LineId: formData.LineId.trim(),
        };
        console.log("Registering with payload:", payload);
        
        await registerUser(payload);

        setSubmitMsg({ type: "success", text: "สมัครสมาชิกสำเร็จ! กำลังเข้าระบบ..." });
        // พยายาม login ด้วย id_token (ถ้ามี) หรือ fallback ไปใช้ LineId
        try {
          if (idToken) {
            await loginWithLine(idToken, true);
          } else {
            await loginWithLine(formData.LineId.trim());
          }
          navigate("/user-status", { replace: true });
        } catch (err) {
          // ถ้า login ล้มเหลว ให้ไปหน้ารอการอนุมัติแทน
          console.debug("Auto-login after register failed", err);
          navigate("/awaiting-approval", { replace: true });
        }
      // Maybe close the LIFF window `liff.closeWindow();`
    } catch (err: any) {
      console.error("Register error:", err);
      setSubmitMsg({ type: "error", text: err?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
             <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Warehouse className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{th.dashboard.title}</h1>
                <p className="text-muted-foreground">{th.dashboard.subtitle}</p>
              </div>
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" /> สมัครสมาชิกผ่าน LINE
            </CardTitle>
            <p className="text-muted-foreground">กรอกข้อมูลเพิ่มเติมเพื่อสร้างบัญชี</p>
          </CardHeader>

          <CardContent>
            {liffError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{liffError}</AlertDescription>
                </Alert>
            )}
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
                <Input id="UserName" value={formData.UserName} onChange={handleChange("UserName")} placeholder="ชื่อที่แสดงใน LINE" />
                {errors.UserName && <p className="text-xs text-red-500">{errors.UserName}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="Company">ชื่อบริษัท / หน่วยงาน</Label>
                <Input id="Company" value={formData.Company} onChange={handleChange("Company")} placeholder="ชื่อบริษัทหรือหน่วยงานของคุณ" />
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
                <Label htmlFor="BranchId">สาขา / หน่วยงาน</Label>
                <Input
                  id="BranchId"
                  value={formData.BranchId}
                  onChange={handleChange("BranchId")}
                  placeholder="พิมพ์ชื่อสาขา เช่น สาขากรุงเทพมหานคร"
                />
                {errors.BranchId && <p className="text-xs text-red-500">{errors.BranchId}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting || !!liffError} className="w-full h-12 text-lg mt-2">
                {isSubmitting ? "กำลังสมัคร..." : "ยืนยันการสมัคร"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
