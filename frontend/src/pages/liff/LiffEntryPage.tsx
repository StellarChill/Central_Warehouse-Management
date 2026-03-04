// src/pages/liff/LiffEntryPage.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Unified LIFF Entry: handle all steps in ONE page
// Flow:
//   1. liff.init() → liff.login() if not logged in
//   2. GET LINE profile + id_token
//   3. POST /api/login/line
//      ✅ approved  → navigate /liff/create
//      ⏳ pending   → navigate /awaiting-approval
//      ❌ not found → show register form
//   4. Submit register form → POST /api/users → navigate /awaiting-approval
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

declare const liff: any;

// ─── types ────────────────────────────────────
type Step = "loading" | "register" | "error";

interface LineProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface RegForm {
    UserName: string;
    Email: string;
    TelNumber: string;
    Company: string;
}

// ─── component ────────────────────────────────
export default function LiffEntryPage() {
    const { loginWithLine, register: registerUser } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>("loading");
    const [statusText, setStatusText] = useState("กำลังเชื่อมต่อ LINE...");
    const [errorText, setErrorText] = useState<string | null>(null);

    // LINE profile (filled after liff.getProfile)
    const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
    const lineIdTokenRef = useRef<string | null>(null);

    // Register form
    const [form, setForm] = useState<RegForm>({
        UserName: "",
        Email: "",
        TelNumber: "",
        Company: "",
    });
    const [formErrors, setFormErrors] = useState<Partial<RegForm>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ─── Step 1: LIFF init on mount ───────────────
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                setStatusText("กำลังเชื่อมต่อ LINE...");
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
                if (liff.ready) await liff.ready;

                // ── Not logged in to LINE ──
                if (!liff.isLoggedIn()) {
                    setStatusText("กำลังพาไปหน้า Login ของ LINE...");
                    // redirect back here after login
                    liff.login({ redirectUri: window.location.href });
                    return; // page will reload after LINE redirects back
                }

                // ── Logged in to LINE — get profile ──
                setStatusText("กำลังดึงข้อมูลโปรไฟล์...");
                const [profile, idToken] = await Promise.all([
                    liff.getProfile() as Promise<LineProfile>,
                    Promise.resolve(liff.getIDToken?.() ?? null as string | null),
                ]);

                if (cancelled) return;

                lineIdTokenRef.current = idToken;
                setLineProfile(profile);

                // ── Try login to backend ──
                setStatusText(`สวัสดีคุณ ${profile.displayName} กำลังเข้าสู่ระบบ...`);

                let loginSuccess = false;

                // ── ลอง id_token ก่อน (ปลอดภัยกว่า) ──
                if (idToken) {
                    try {
                        await loginWithLine(idToken, true);
                        loginSuccess = true;
                    } catch (idTokenErr: any) {
                        const msg = String(idTokenErr?.message ?? "").toLowerCase();
                        if (msg.includes("pending")) {
                            navigate("/awaiting-approval", { replace: true });
                            return;
                        }
                        // id_token ล้มเหลว (เช่น server misconfiguration, audience mismatch)
                        // → fallback ใช้ profile.userId แทน
                        console.warn("id_token login failed, falling back to userId:", idTokenErr?.message);
                    }
                }

                // ── Fallback: ลอง login ด้วย userId โดยตรง ──
                if (!loginSuccess) {
                    try {
                        await loginWithLine(profile.userId, false);
                        loginSuccess = true;
                    } catch (userIdErr: any) {
                        const msg = String(userIdErr?.message ?? "").toLowerCase();
                        if (msg.includes("pending")) {
                            navigate("/awaiting-approval", { replace: true });
                            return;
                        }
                        // ❌ ไม่มี user ในฐานข้อมูลจริงๆ → แสดงฟอร์มสมัคร
                        console.warn("userId login also failed:", userIdErr?.message);
                    }
                }

                if (loginSuccess) {
                    // ✅ Login สำเร็จ
                    localStorage.setItem("liff_only", "1");
                    navigate("/liff/create", { replace: true });
                } else {
                    // ❌ User ไม่มีในระบบ → แสดงฟอร์มสมัคร
                    if (cancelled) return;
                    setForm(prev => ({ ...prev, UserName: profile.displayName }));
                    setStep("register");
                }

            } catch (err: any) {
                console.error("LIFF init error", err);
                if (!cancelled) {
                    setErrorText(err?.message ?? "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่าน LINE App");
                    setStep("error");
                }
            }
        };

        run();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Step 2: Submit registration form ─────────
    const validateForm = (): boolean => {
        const errors: Partial<RegForm> = {};
        if (!form.UserName || form.UserName.trim().length < 2)
            errors.UserName = "กรอกชื่ออย่างน้อย 2 ตัวอักษร";
        if (!form.Email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email))
            errors.Email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.TelNumber || !/^\d{9,10}$/.test(form.TelNumber))
            errors.TelNumber = "กรอกเป็นตัวเลข 9-10 หลัก";
        if (!form.Company || form.Company.trim().length < 2)
            errors.Company = "กรอกชื่อบริษัท/หน่วยงาน";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await registerUser({
                UserName: form.UserName.trim(),
                UserPassword: "", // LIFF users have no password
                Email: form.Email.trim().toLowerCase(),
                TelNumber: form.TelNumber.trim(),
                Company: form.Company.trim(),
                LineId: lineProfile?.userId ?? "",
            });
            navigate("/awaiting-approval", { replace: true });
        } catch (err: any) {
            setSubmitError(err?.message ?? "สมัครไม่สำเร็จ กรุณาลองใหม่");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Logout (switch LINE account) ─────────────
    const handleLogout = async () => {
        if (!window.confirm("ต้องการออกจากระบบและเข้าด้วยบัญชี LINE อื่นหรือไม่?")) return;
        if (liff.isLoggedIn()) liff.logout();
        // Reload — liff.logout clears the token, liff.isLoggedIn() will be false after reload
        window.location.reload();
    };

    // ─── Render: Loading ──────────────────────────
    if (step === "loading") {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 p-6">
                <div className="w-16 h-16 rounded-2xl bg-[#06C755] flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                        <path d="M22 10.5C22 5.25 17.5 1 12 1S2 5.25 2 10.5c0 4.75 3.75 8.75 9 9.35v3.4c-0.55 0.2-1.25 0.35-1.25 0.35s0.25 1.45 1.5 1.4c0.85 0 2.45-0.1 4.35-1.35 3.9-1.8 6.4-5.7 6.4-10.15z" />
                    </svg>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-[#06C755] animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse text-center px-8">{statusText}</p>
                </div>

                {/* Dev Mode Skip Button (Only visible on localhost) */}
                {window.location.hostname === "localhost" && (
                    <div className="mt-8 p-4 border border-dashed border-slate-300 rounded-lg text-center">
                        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">Development Tools</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLineProfile({ userId: "DEV_USER_" + Date.now(), displayName: "Local Developer" });
                                setStep("register");
                            }}
                            className="text-xs text-slate-500"
                        >
                            Skip LINE Login (Test Form)
                        </Button>
                        <p className="text-[10px] text-slate-400 mt-2 italic">
                            *ใช้สำหรับทดสอบหน้ากรอกข้อมูลเมื่อยังไม่ได้ตั้งค่า LINE Console
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ─── Render: Error ────────────────────────────
    if (step === "error") {
        return (
            <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <h1 className="text-xl font-bold text-red-800">เกิดข้อผิดพลาด</h1>
                <p className="text-red-600 text-sm">{errorText}</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-700 hover:bg-red-100">
                    ลองใหม่อีกครั้ง
                </Button>
            </div>
        );
    }

    // ─── Render: Registration Form ────────────────
    return (
        <div className="min-h-screen bg-slate-100 flex justify-center">
            <div className="w-full max-w-md bg-white flex flex-col min-h-screen shadow-xl">

                {/* Header */}
                <div className="bg-[#06C755] px-5 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {lineProfile?.pictureUrl && (
                            <img
                                src={lineProfile.pictureUrl}
                                alt="LINE profile"
                                className="w-11 h-11 rounded-full border-2 border-white/50 shadow"
                            />
                        )}
                        <div>
                            <p className="text-white/70 text-xs">เข้าสู่ระบบด้วย LINE</p>
                            <p className="text-white font-bold text-base leading-tight">{lineProfile?.displayName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-white/70 hover:text-white flex items-center gap-1 text-xs"
                    >
                        <LogOut className="h-4 w-4" />
                        เปลี่ยนบัญชี
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 px-5 py-6 space-y-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">กรอกข้อมูลเพิ่มเติม</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            กรุณากรอกข้อมูลเพื่อสมัครใช้งานระบบ หลังจากส่งแล้วผู้ดูแลระบบจะตรวจสอบและอนุมัติ
                        </p>
                    </div>

                    {submitError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* ชื่อ-นามสกุล */}
                        <div className="space-y-1.5">
                            <Label htmlFor="liff-username">ชื่อ-นามสกุล (หรือชื่อที่ใช้งาน)</Label>
                            <Input
                                id="liff-username"
                                value={form.UserName}
                                onChange={e => setForm(p => ({ ...p, UserName: e.target.value }))}
                                placeholder="เช่น สมชาย ใจดี"
                                className={formErrors.UserName ? "border-red-400" : ""}
                            />
                            {formErrors.UserName && <p className="text-xs text-red-500">{formErrors.UserName}</p>}
                        </div>

                        {/* บริษัท / หน่วยงาน */}
                        <div className="space-y-1.5">
                            <Label htmlFor="liff-company">บริษัท / หน่วยงาน</Label>
                            <Input
                                id="liff-company"
                                value={form.Company}
                                onChange={e => setForm(p => ({ ...p, Company: e.target.value }))}
                                placeholder="เช่น สาขากรุงเทพฯ หรือ MK Suki เซ็นทรัล"
                                className={formErrors.Company ? "border-red-400" : ""}
                            />
                            {formErrors.Company && <p className="text-xs text-red-500">{formErrors.Company}</p>}
                        </div>

                        {/* อีเมล */}
                        <div className="space-y-1.5">
                            <Label htmlFor="liff-email">อีเมล</Label>
                            <Input
                                id="liff-email"
                                type="email"
                                value={form.Email}
                                onChange={e => setForm(p => ({ ...p, Email: e.target.value }))}
                                placeholder="you@example.com"
                                className={formErrors.Email ? "border-red-400" : ""}
                            />
                            {formErrors.Email && <p className="text-xs text-red-500">{formErrors.Email}</p>}
                        </div>

                        {/* เบอร์โทร */}
                        <div className="space-y-1.5">
                            <Label htmlFor="liff-tel">เบอร์โทรศัพท์</Label>
                            <Input
                                id="liff-tel"
                                type="tel"
                                value={form.TelNumber}
                                onChange={e => setForm(p => ({ ...p, TelNumber: e.target.value.replace(/\D/g, "") }))}
                                placeholder="0801234567"
                                maxLength={10}
                                className={formErrors.TelNumber ? "border-red-400" : ""}
                            />
                            {formErrors.TelNumber && <p className="text-xs text-red-500">{formErrors.TelNumber}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 text-base font-bold bg-[#06C755] hover:bg-[#05b54c] text-white shadow-lg shadow-green-500/20 rounded-xl"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังส่งข้อมูล...</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> ยืนยันการสมัคร</>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-slate-400 pb-4">
                        หลังจากส่งข้อมูล ผู้ดูแลระบบจะตรวจสอบและแจ้งกลับผ่าน LINE
                    </p>
                </div>
            </div>
        </div>
    );
}
