import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// Declare liff globally if not already typed
declare const liff: any;

export default function LiffEntryPage() {
    const { loginWithLine } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState("กำลังโหลดข้อมูล LINE...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const main = async () => {
            try {
                // 1. Initialize LIFF
                await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

                // 2. Wait for LIFF ready (sometimes needed)
                if (liff.ready) await liff.ready;

                // 3. Check login status
                if (!liff.isLoggedIn()) {
                    setStatus("กำลังพาไปหน้า Login ของ LINE...");
                    liff.login({ redirectUri: window.location.href });
                    return;
                }

                // 4. Get ID Token for secure backend login
                const idToken = liff.getIDToken();
                if (!idToken) {
                    throw new Error("ไม่พบ ID Token จาก LINE");
                }

                setStatus("กำลังเข้าสู่ระบบ...");

                // 5. Try login to Backend
                try {
                    await loginWithLine(idToken, true);
                    // Login Success -> Redirect to Requisition Page
                    // Mark as LIFF user in local storage if needed
                    localStorage.setItem("liff_only", "1");
                    navigate("/requisitions/create", { replace: true });
                } catch (err: any) {
                    // 6. Login Failed
                    const errMsg = String(err.message || "").toLowerCase();

                    // If "Pending Approval"
                    if (errMsg.includes("pending")) {
                        navigate("/awaiting-approval", { replace: true });
                        return;
                    }

                    // If "User not found" or other login error -> Go to Register
                    // We can check strictly for 404/not found if API returns consistent error
                    // For now, assume any non-pending error means "Needs Registration"
                    console.log("Login failed (likely not registered), redirecting to register...", err);
                    navigate("/liff/register", { replace: true });
                }

            } catch (err: any) {
                console.error("LIFF Entry Error:", err);
                setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
            }
        };

        main();
    }, [loginWithLine, navigate]);

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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">{status}</p>
        </div>
    );
}
