import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CompanyRegisterPage() {
  const { registerCompany } = useAuth();
  const [state, setState] = useState({
    CompanyName: '',
    CompanyAddress: '',
    TaxId: '',
    CompanyEmail: '',
    CompanyTelNumber: '',
    AdminUserName: '',
    AdminUserPassword: '',
    AdminEmail: '',
    AdminTelNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (k: string) => (e: any) => setState((s) => ({ ...s, [k]: e.target.value }));
  const onSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCompany(state as any);
      // After registration, redirect to awaiting approval or login
      window.location.href = '/awaiting-approval';
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Register Company</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Company Name</Label>
              <Input value={state.CompanyName} onChange={onChange('CompanyName')} required />
            </div>
            <div className="md:col-span-2">
              <Label>Company Address</Label>
              <Input value={state.CompanyAddress} onChange={onChange('CompanyAddress')} />
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input value={state.TaxId} onChange={onChange('TaxId')} />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input type="email" value={state.CompanyEmail} onChange={onChange('CompanyEmail')} />
            </div>
            <div>
              <Label>Company Tel</Label>
              <Input value={state.CompanyTelNumber} onChange={onChange('CompanyTelNumber')} />
            </div>
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="font-medium mb-2">Admin User</div>
            </div>
            <div>
              <Label>Username</Label>
              <Input value={state.AdminUserName} onChange={onChange('AdminUserName')} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={state.AdminUserPassword} onChange={onChange('AdminUserPassword')} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={state.AdminEmail} onChange={onChange('AdminEmail')} />
            </div>
            <div>
              <Label>Tel</Label>
              <Input value={state.AdminTelNumber} onChange={onChange('AdminTelNumber')} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Company'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
