import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-3xl px-6 text-center space-y-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">WMS Cloud – Multi-Tenant Warehouse Management SaaS</h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">ระบบบริหารจัดการคลังสินค้าแบบหลายบริษัท</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/register-company">สมัครใช้งานสำหรับองค์กร</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">เข้าสู่ระบบ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
