import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Warehouse as WarehouseIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    // Determine target path by role
    const role = user?.role;
    let target: string | null = null;
    if (!role) return; // no user yet
    // Admin / company level roles
    if (["COMPANY_ADMIN", "PLATFORM_ADMIN", "PLATFORM_STAFF", "ADMIN", "WAREHOUSE_ADMIN"].includes(role)) {
      target = `/admin-company/${id}`;
    } else if (["BRANCH_MANAGER", "BRANCH_USER", "CENTER", "BRANCH", "VIEWER"].includes(role)) {
      target = `/warehouse-manager/${id}`;
    }
    if (target) {
      navigate(target, { replace: true });
    }
  }, [id, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center space-y-4">
        <div className="inline-flex h-14 w-14 rounded-xl bg-blue-50 text-blue-600 items-center justify-center shadow-sm">
          <WarehouseIcon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-medium text-slate-800">กำลังนำทางไปหน้าที่เหมาะสม...</h2>
        {id && <p className="text-sm text-slate-500">คลัง: <span className="font-medium">{id}</span></p>}
        {user?.CompanyName && (
          <p className="text-xs text-slate-500">บริษัท: <span className="font-medium">{user.CompanyName}</span>{user.CompanyCode ? ` (${user.CompanyCode})` : ''}</p>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> กลับ
        </Button>
      </div>
    </div>
  );
};

export default WarehouseDetailPage;
