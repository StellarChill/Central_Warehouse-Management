import liff from "@line/liff";
import Swal from "sweetalert2";
import { VITE_LIFF_ID } from "../config";

const LIFF_ID = VITE_LIFF_ID;
let initialized = false;

/* ============================================================
   ✅ เริ่มต้น LIFF และตรวจสอบสถานะล็อกอิน
============================================================ */
export async function ensureLiffReady(): Promise<boolean> {
  try {
    if (!initialized) {
      await liff.init({
        liffId: LIFF_ID,
        withLoginOnExternalBrowser: true,
      });
      initialized = true;
    }

    if (!liff.isLoggedIn()) {
      liff.login();
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ LIFF init error:", err);
    return false;
  }
}

/* ============================================================
   ✅ ดึง Access Token สำหรับส่งไป Backend
============================================================ */
export function getAccessToken(): string | null {
  try {
    return liff.getAccessToken() || null;
  } catch (err) {
    console.error("❌ getAccessToken error:", err);
    return null;
  }
}

/* ============================================================
   ✅ รีเฟรช Access Token อัตโนมัติ (กรณี token หาย)
============================================================ */
export async function refreshLiffToken(): Promise<string | null> {
  try {
    await ensureLiffReady();
    let token = liff.getAccessToken();

    if (!token) {
      console.warn("⚠️ AccessToken หาย → re-init LIFF...");
      await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });
      token = liff.getAccessToken();
    }

    if (!token) {
      console.error("❌ Token หมดอายุ → ล็อกอินใหม่");
      await logoutLiff(false);
      liff.login();
      return null;
    }

    return token;
  } catch (err) {
    console.error("❌ refreshLiffToken error:", err);
    return null;
  }
}

/* ============================================================
   ✅ ดึงข้อมูลโปรไฟล์ผู้ใช้ (ชื่อ, userId)
============================================================ */
export async function getUserProfile() {
  try {
    return await liff.getProfile();
  } catch (err) {
    console.error("❌ getUserProfile error:", err);
    return null;
  }
}

/* ============================================================
   🚪 ออกจากระบบ (รองรับทั้งใน LINE และ Browser)
============================================================ */
export async function logoutLiff(showAlert = true) {
  try {
    if (liff.isLoggedIn()) liff.logout();
    localStorage.clear();
    sessionStorage.clear();

    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      if (showAlert) {
        await Swal.fire({
          toast: true,
          position: "top-end",
          title: "ออกจากระบบสำเร็จ",
          text: "ขอบคุณที่ใช้บริการ SmartDorm!",
          icon: "success",
        });
      }
      window.location.href = "/";
    }

    console.log("✅ ออกจากระบบสำเร็จ");
  } catch (err) {
    console.error("❌ logoutLiff error:", err);
  }
}
