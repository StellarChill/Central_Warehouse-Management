// frontend/src/pages/LiffRegisterPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [errors, setErrors] = useState<
    Partial<Record<keyof LiffRegisterFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<SubmitMsg>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  useEffect(() => {
    const initializeLiffAndLogin = async () => {
      try {
        // ใช้ liff จริง (ต้องมี script ใน index.html)
        // @ts-ignore
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        // ถ้ายังไม่ login กับ LINE ให้เด้งไป login ก่อน
        // @ts-ignore
        if (!liff.isLoggedIn()) {
          // @ts-ignore
          liff.login();
          return;
        }

        // @ts-ignore
        const profile = await liff.getProfile();
        const lineId = profile.userId as string;

        // เติมค่า default ในฟอร์ม (ใช้ตอนสมัคร)
        setFormData((prev) => ({
          ...prev,
          LineId: lineId,
          UserName: profile.displayName || prev.UserName,
        }));

        // พยายาม auto-login ด้วย LineId
        try {
          await loginWithLine(lineId);
          localStorage.setItem("liff_only", "1");

          // ถ้า login สำเร็จ แสดงว่า admin approve แล้ว → เด้งไปหน้าเบิก
          navigate("/requisitions/create", { replace: true });
          return;
        } catch (err: any) {
          console.info("LINE auto-login failed", err?.message || err);

          // ถ้า message มีคำว่า pending → ให้ไปหน้า waiting
          if (
            typeof err?.message === "string" &&
            err.message.toLowerCase().includes("pending")
          ) {
            navigate("/awaiting-approval", { replace: true });
            return;
          }

          // ถ้า user ไม่เจอ / ยังไม่เคยสมัคร → ให้แสดงฟอร์มต่อ
          // ไม่ต้องทำอะไรเพิ่ม
        }
      } catch (error) {
        console.error("LIFF Initialization failed.", error);
        setLiffError("ไม่สามารถเชื่อมต่อกับ LINE ได้");
      } finally {
        setIsCheckingUser(false);
      }
    };

    initializeLiffAndLogin();
  }, [loginWithLine, navigate]);

  const handleChange =
    (field: keyof LiffRegisterFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const validate = () => {
    const next: Partial<Record<keyof LiffRegisterFormData, string>> = {};
    if (!formData.UserName || formData.UserName.trim().length < 3)
      next.UserName = "กรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร";
    if (!formData.Email) next.Email = "กรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email))
      next.Email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.TelNumber) next.TelNumber = "กรอกเบอร์โทร";
    else if (!/^\d{9,10}$/.test(formData.TelNumber))
      next.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
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
        UserPassword: "", // LIFF registration ไม่ใช้ password
        Company: formData.Company.trim() || undefined,
        RoleId: Number(formData.RoleId),
        BranchId: Number(formData.BranchId) || 0,
        BranchName: formData.BranchId.trim() || undefined,
        TelNumber: formData.TelNumber.trim(),
        Email: formData.Email.trim().toLowerCase(),
        LineId: formData.LineId.trim(),
      };
      console.log("Registering with payload:", payload);

      await registerUser(payload);

      setSubmitMsg({
        type: "success",
        text: "สมัครสมาชิกสำเร็จ! กรุณารอแอดมินอนุมัติก่อนใช้งาน",
      });

      // หลังสมัครเสร็จ → ให้ไปหน้ารออนุมัติ
      navigate("/awaiting-approval", { replace: true });
    } catch (err: any) {
      console.error("Register error:", err);
      setSubmitMsg({
        type: "error",
        text: err?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // จะมี isCheckingUser แต่ถ้าอยากแสดง loading ก็ทำเพิ่มได้
  // ถ้ายังไม่ต้องก็ปล่อยเฉย ๆ แบบนี้ได้

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
                <p className="text-muted-foreground">
                  {th.dashboard.subtitle}
                </p>
              </div>
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" /> สมัครสมาชิกผ่าน LINE
            </CardTitle>
            <p className="text-muted-foreground">
              กรอกข้อมูลเพิ่มเติมเพื่อสร้างบัญชี
            </p>
          </CardHeader>

          <CardContent>
            {liffError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{liffError}</AlertDescription>
              </Alert>
            )}
            {submitMsg && (
              <Alert
                variant={
                  submitMsg.type === "error" ? "destructive" : "default"
                }
                className="mb-4"
              >
                <AlertDescription
                  className={submitMsg.type === "error" ? "" : "text-green-600"}
                >
                  {submitMsg.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="UserName">ชื่อผู้ใช้</Label>
                <Input
                  id="UserName"
                  value={formData.UserName}
                  onChange={handleChange("UserName")}
                  placeholder="ชื่อที่แสดงใน LINE"
                />
                {errors.UserName && (
                  <p className="text-xs text-red-500">{errors.UserName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="Company">ชื่อบริษัท / หน่วยงาน</Label>
                <Input
                  id="Company"
                  value={formData.Company}
                  onChange={handleChange("Company")}
                  placeholder="ชื่อบริษัทหรือหน่วยงานของคุณ"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="Email">อีเมล</Label>
                <Input
                  id="Email"
                  type="email"
                  value={formData.Email}
                  onChange={handleChange("Email")}
                  placeholder="you@example.com"
                />
                {errors.Email && (
                  <p className="text-xs text-red-500">{errors.Email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="TelNumber">เบอร์โทร</Label>
                <Input
                  id="TelNumber"
                  value={formData.TelNumber}
                  onChange={handleChange("TelNumber")}
                  placeholder="0801234567"
                />
                {errors.TelNumber && (
                  <p className="text-xs text-red-500">{errors.TelNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="BranchId">สาขา / หน่วยงาน</Label>
                <Input
                  id="BranchId"
                  value={formData.BranchId}
                  onChange={handleChange("BranchId")}
                  placeholder="พิมพ์ชื่อสาขา เช่น สาขากรุงเทพมหานคร"
                />
                {errors.BranchId && (
                  <p className="text-xs text-red-500">{errors.BranchId}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !!liffError || isCheckingUser}
                className="w-full h-12 text-lg mt-2"
              >
                {isSubmitting ? "กำลังสมัคร..." : "ยืนยันการสมัคร"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
