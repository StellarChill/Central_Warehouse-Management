import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ensureLiffReady, getAccessToken } from '../lib/liff';

export default function LiffEntryPage() {
  const navigate = useNavigate();
  const { lineLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLiffLogin = async () => {
      try {
        const isLiffReady = await ensureLiffReady();
        if (isLiffReady) {
          const lineToken = getAccessToken();
          if (lineToken) {
            const result = await lineLogin(lineToken);
            if (result.isNewUser) {
              navigate('/line-register', { state: { lineProfile: result.lineProfile } });
            } else {
              // Existing user, redirect to dashboard
              navigate('/');
            }
          } else {
            setError('ไม่สามารถดึงข้อมูลจาก LINE ได้');
          }
        }
      } catch (err: any) {
        setError(err?.message || 'LINE Login ไม่สำเร็จ กรุณาลองใหม่');
      }
    };

    handleLiffLogin();
  }, [lineLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      )}
    </div>
  );
}
