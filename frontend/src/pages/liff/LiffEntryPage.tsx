import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// Declare liff globally if not already typed
declare const liff: any;

export default function LiffEntryPage() {
    const { loginWithLine } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("กำลังโหลดข้อมูล LINE...");
    const [error, setError] = useState<string | null>(null);

    // Check if logout triggered
    const isLogout = searchParams.get("logout") === "true";

    useEffect(() => {
        const main = async () => {
            try {
                // 1. Initialize LIFF
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

                // 2. Wait for LIFF ready (sometimes needed)
                if (liff.ready) await liff.ready;

                // 3. Check login status
                if (!liff.isLoggedIn()) {
                    if (isLogout) {
                        setStatus("ออกจากระบบแล้ว");
                        return;
                    }
                    setStatus("กำลังพาไปหน้า Login ของ LINE...");
                    liff.login({ redirectUri: window.location.href });
                    return;
                }

                // If user somehow has session but we just logged out, force logout logic?
                // No, if liff.isLoggedIn() is true, it means even after liff.logout(), the browser cookie persists.
                // But typically liff.logout() clears the ID token from storage.

                // 4. Get ID Token and/or Profile
                const idToken = liff.getIDToken();
                const profile = await liff.getProfile();

                setStatus(`สวัสดีคุณ ${profile.displayName || 'User'} กำลังเข้าสู่ระบบ...`);

                // 5. Try login to Backend
                try {
                    // Try Secure Login (ID Token) first
                    if (idToken) {
                        try {
                            await loginWithLine(idToken, true);
                        } catch (e) {
                            console.warn("ID Token login failed, trying fallback...", e);
                            // Fallback: Try Legacy Login (LineUserId)
                            await loginWithLine(profile.userId, false);
                        }
                    } else {
                        // No ID Token, use Profile ID directly
                        await loginWithLine(profile.userId, false);
                    }

                    // Login Success -> Redirect to Requisition Page
                    localStorage.setItem("liff_only", "1");
                    navigate("/liff/create", { replace: true });

                } catch (err: any) {
                    // 6. Login Failed (Likely user not found in DB)
                    const errMsg = String(err.message || "").toLowerCase();

                    // If "Pending Approval"
                    if (errMsg.includes("pending")) {
                        navigate("/awaiting-approval", { replace: true });
                        return;
                    }

                    // If "User not found" -> Go to Register
                    console.log("User not found, redirecting to register...", err);
                    navigate("/liff/register", { replace: true });
                }

            } catch (err: any) {
                console.error("LIFF Entry Error:", err);
                setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
            }
        };

        main();
    }, [loginWithLine, navigate, isLogout]);

    const handleLogin = () => {
        // Clear logout param when logging in again
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("logout");

        liff.login({ redirectUri: currentUrl.toString() });
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-red-50 text-red-800">
                <h1 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-white border border-red-200 rounded shadow-sm hover:bg-red-100"
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        );
    }

    // Show manual login button if triggered by logout
    if (isLogout && status === "ออกจากระบบแล้ว") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-6">
                <div className="h-20 w-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg viewBox="0 0 24 24" fill="white" className="w-12 h-12">
                        <path d="M22 10.5C22 5.25 17.5 1 12 1S2 5.25 2 10.5c0 4.75 3.75 8.75 9 9.35v3.4c-0.55 0.2-1.25 0.35-1.25 0.35s0.25 1.45 1.5 1.4c0.85 0 2.45-0.1 4.35-1.35 3.9-1.8 6.4-5.7 6.4-10.15z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h1>
                    <p className="text-slate-500 mt-2">เพื่อเริ่มใช้งานระบบเบิกวัตถุดิบ</p>
                </div>

                <button
                    onClick={() => navigate("/liff/register")}
                    className="w-full max-w-xs py-3.5 bg-[#06C755] hover:bg-[#05b54c] text-white font-bold rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    เข้าสู่ระบบ / ลงทะเบียน
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">{status}</p>
        </div>
    );
}
