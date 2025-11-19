import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

type SubmitMsg = { type: "success" | "error"; text: string } | null;

const roles = [
  { id: "1", label: "ผู้ดูแล (Admin)" },
  { id: "2", label: "คลังกลาง (Center)" },
  { id: "3", label: "สาขา (Branch)" },
];

const branches = [
  { id: "1", name: "สาขากลาง (Center A)" },
  { id: "2", name: "สาขา B" },
  { id: "3", name: "สาขา C" },
];

const companies = [
  { id: "c1", name: "บริษัท เอ จำกัด" },
  { id: "c2", name: "บริษัท บี เทคโนโลยี" },
  { id: "c3", name: "องค์กรซี โซลูชั่นส์" },
];

export default function AuthPage() {
  const { user, login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, go home
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Tabs control (default to login)
  const [tab, setTab] = useState("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state
  const redirectTimerRef = useRef<number | null>(null);
  const [formData, setFormData] = useState({
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
  const [companySelect, setCompanySelect] = useState<string>("");
  const [regErrors, setRegErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regMsg, setRegMsg] = useState<SubmitMsg>(null);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  useEffect(() => () => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
  }, []);

  const onRegChange = (k: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((s) => ({ ...s, [k]: e.target.value }));
  };

  const validateRegister = () => {
    const next: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.UserName || formData.UserName.trim().length < 3) next.UserName = "กรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร";
    if (!formData.Email) next.Email = "กรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) next.Email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.TelNumber) next.TelNumber = "กรอกเบอร์โทร";
    else if (!/^\d{9,10}$/.test(formData.TelNumber)) next.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
    if (!formData.UserPassword || formData.UserPassword.length < 6) next.UserPassword = "รหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (formData.confirmPassword !== formData.UserPassword) next.confirmPassword = "รหัสผ่านยืนยันไม่ตรงกัน";
    if (!formData.RoleId) next.RoleId = "เลือกบทบาท";
    if (!formData.BranchId) next.BranchId = "เลือกสาขา";
    if (!companySelect) next.Company = "เลือกบริษัท หรือเลือก 'อื่นๆ' แล้วกรอกชื่อ";
    if (companySelect === "other" && !formData.Company.trim()) next.Company = "กรอกชื่อบริษัท/หน่วยงาน";
    setRegErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!username || !password) {
      setLoginError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    setLoginSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setLoginError(err?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg(null);
    if (!validateRegister()) return;
    setRegSubmitting(true);
    try {
      if (companySelect && companySelect !== "other") {
        const found = companies.find((c) => c.id === companySelect);
        if (found) formData.Company = found.name;
      }
      await registerUser({
        UserName: formData.UserName.trim(),
        UserPassword: formData.UserPassword,
        Company: formData.Company.trim() || undefined,
        RoleId: Number(formData.RoleId),
        BranchId: Number(formData.BranchId),
        TelNumber: formData.TelNumber.trim(),
        Email: formData.Email.trim().toLowerCase(),
        LineId: formData.LineId.trim() || undefined,
      });
      setRegMsg({ type: "success", text: "สมัครสมาชิกสำเร็จ! รอการอนุมัติจากผู้ดูแลระบบ" });
      redirectTimerRef.current = window.setTimeout(() => navigate("/awaiting-approval"), 1200);
    } catch (err: any) {
      setRegMsg({ type: "error", text: err?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" });
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Intro */}
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="text-3xl font-bold">เข้าสู่ระบบ / สมัครสมาชิก WMS Cloud</h1>
          <p className="text-muted-foreground">เลือกรูปแบบที่ต้องการด้านขวา หากสมัครใหม่ ระบบจะส่งคำขอเพื่อรอการอนุมัติ</p>
        </div>

        {/* Right: Card with Tabs */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">ยินดีต้อนรับ</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="login">เข้าสู่ระบบ</TabsTrigger>
                  <TabsTrigger value="register">สมัครสมาชิก</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-0">
                  {loginError && (
                    <Alert variant="destructive"><AlertDescription>{loginError}</AlertDescription></Alert>
                  )}
                  <form onSubmit={submitLogin} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="login-username">ชื่อผู้ใช้</Label>
                      <Input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="กรอกชื่อผู้ใช้" autoComplete="username" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="login-password">รหัสผ่าน</Label>
                      <div className="relative">
                        <Input id="login-password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="current-password" className="pr-9" />
                        <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-pressed={showPwd}>
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loginSubmitting} className="w-full h-12 text-lg">
                      {loginSubmitting ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังเข้าสู่ระบบ...</div> : "เข้าสู่ระบบ"}
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">ยังไม่มีบริษัท? <Link to="/register-company" className="text-primary hover:underline">สมัครสำหรับองค์กร</Link></div>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-0">
                  {regMsg && (
                    <Alert variant={regMsg.type === "error" ? "destructive" : "default"}><AlertDescription className={regMsg.type === "error" ? undefined : "text-green-600"}>{regMsg.text}</AlertDescription></Alert>
                  )}
                  <form onSubmit={submitRegister} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="reg-username">ชื่อผู้ใช้</Label>
                      <Input id="reg-username" value={formData.UserName} onChange={onRegChange("UserName")} placeholder="เช่น somchai" />
                      {regErrors.UserName && <p className="text-xs text-red-500">{regErrors.UserName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-email">อีเมล</Label>
                      <Input id="reg-email" type="email" value={formData.Email} onChange={onRegChange("Email")} placeholder="you@example.com" />
                      {regErrors.Email && <p className="text-xs text-red-500">{regErrors.Email}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-tel">เบอร์โทร</Label>
                      <Input id="reg-tel" value={formData.TelNumber} onChange={onRegChange("TelNumber")} placeholder="0801234567" />
                      {regErrors.TelNumber && <p className="text-xs text-red-500">{regErrors.TelNumber}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>บริษัท / หน่วยงาน</Label>
                      <Select value={companySelect} onValueChange={setCompanySelect}>
                        <SelectTrigger><SelectValue placeholder="เลือกบริษัทที่มีอยู่ หรือเลือก 'อื่นๆ'" /></SelectTrigger>
                        <SelectContent>
                          {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          <SelectItem value="other">อื่นๆ (พิมพ์ชื่อเอง)</SelectItem>
                        </SelectContent>
                      </Select>
                      {companySelect === "other" && (
                        <div className="mt-2">
                          <Label htmlFor="reg-company" className="text-xs">พิมพ์ชื่อบริษัท / หน่วยงาน</Label>
                          <Input id="reg-company" value={formData.Company} onChange={onRegChange("Company")} placeholder="เช่น บริษัท เอ จำกัด" />
                        </div>
                      )}
                      {regErrors.Company && <p className="text-xs text-red-500">{regErrors.Company}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-password">รหัสผ่าน</Label>
                      <div className="relative">
                        <Input id="reg-password" type={showRegPwd ? "text" : "password"} value={formData.UserPassword} onChange={onRegChange("UserPassword")} placeholder="อย่างน้อย 6 ตัวอักษร" className="pr-9" />
                        <button type="button" onClick={() => setShowRegPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-pressed={showRegPwd}>{showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                      {regErrors.UserPassword && <p className="text-xs text-red-500">{regErrors.UserPassword}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-confirm">ยืนยันรหัสผ่าน</Label>
                      <div className="relative">
                        <Input id="reg-confirm" type={showRegConfirm ? "text" : "password"} value={formData.confirmPassword} onChange={onRegChange("confirmPassword")} className="pr-9" />
                        <button type="button" onClick={() => setShowRegConfirm(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-pressed={showRegConfirm}>{showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                      {regErrors.confirmPassword && <p className="text-xs text-red-500">{regErrors.confirmPassword}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>บทบาท</Label>
                      <Select value={formData.RoleId} onValueChange={(v) => setFormData(s => ({ ...s, RoleId: v }))}>
                        <SelectTrigger><SelectValue placeholder="เลือกบทบาท" /></SelectTrigger>
                        <SelectContent>
                          {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {regErrors.RoleId && <p className="text-xs text-red-500">{regErrors.RoleId}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label>สาขา</Label>
                      <Select value={formData.BranchId} onValueChange={(v) => setFormData(s => ({ ...s, BranchId: v }))}>
                        <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                        <SelectContent>
                          {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {regErrors.BranchId && <p className="text-xs text-red-500">{regErrors.BranchId}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-line">LINE ID (ถ้ามี)</Label>
                      <Input id="reg-line" value={formData.LineId} onChange={onRegChange("LineId")} placeholder="เชื่อมภายหลังได้ (ออปชันนัล)" />
                    </div>

                    <Button type="submit" disabled={regSubmitting} className="w-full h-12 text-lg mt-1">
                      {regSubmitting ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังสมัครสมาชิก...</div> : "สร้างบัญชีใหม่"}
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">สมัครพร้อมบริษัทใหม่แทน? <Link to="/register-company" className="text-primary hover:underline">สมัครสำหรับองค์กร</Link></div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
