import { useEffect, useState, useMemo } from 'react';
import { apiGet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, Building2, UserPlus, Clock, Activity, ArrowUpRight, ArrowRight, ChevronRight, ClipboardList, Factory, HardHat } from 'lucide-react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ companies: 0, users: 0, pendingCompanies: 0, pendingUsers: 0 });
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [co, us] = await Promise.all([apiGet('/company'), apiGet('/admin/users?status=ALL')]);
        const validCo = (co || []).filter((c: any) => c.CompanyCode !== 'PLATFORM');
        setCompanies(validCo);
        setUsers(us || []);

        setStats({
          companies: validCo.length,
          users: (us || []).length,
          pendingCompanies: validCo.filter((c: any) => c.CompanyStatus === 'PENDING').length,
          pendingUsers: (us || []).filter((u: any) => u.UserStatus === 'PENDING').length
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Prepare Chart Data
  const companyStatusData = useMemo(() => {
    const counts = { ACTIVE: 0, PENDING: 0, INACTIVE: 0 };
    companies.forEach(c => {
      const s = (c.CompanyStatus || 'INACTIVE').toUpperCase();
      if (s in counts) counts[s as keyof typeof counts]++;
    });
    return [
      { name: 'Active', value: counts.ACTIVE, color: '#10b981' }, // emerald-500
      { name: 'Pending', value: counts.PENDING, color: '#f59e0b' }, // amber-500
      { name: 'Inactive', value: counts.INACTIVE, color: '#64748b' }, // slate-500
    ].filter(d => d.value > 0);
  }, [companies]);

  const userRoleData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const r = u.Role?.RoleName || 'Unknown';
      counts[r] = (counts[r] || 0) + 1;
    });

    // Sort and take top 5
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'][index % 5]
      }));
  }, [users]);

  const recentActivity = useMemo(() => {
    const allEvents = [
      ...companies.map(c => ({
        type: 'COMPANY',
        date: new Date(c.CreatedAt),
        title: `New Company: ${c.CompanyName} `,
        desc: c.CompanyCode,
        status: c.CompanyStatus,
        id: c.CompanyId
      })),
      ...users.map(u => ({
        type: 'USER',
        date: new Date(u.CreatedAt),
        title: `New User: ${u.UserName} `,
        desc: u.Email,
        status: u.UserStatus,
        id: u.UserId
      }))
    ];
    // Sort descending
    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }, [companies, users]);

  if (loading) return (
    <PlatformLayout>
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </PlatformLayout>
  );

  return (
    <PlatformLayout>
      <div className="px-6 py-8 space-y-8 bg-slate-50/50 min-h-screen">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of system performance and waiting tasks.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/platform/companies')}>
              <Building2 size={16} /> Manage Companies
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-md" onClick={() => navigate('/platform/approvals')}>
              <UserPlus size={16} /> Review Approvals
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white/60 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered Companies</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-800">{stats.companies}</h3>
                  {stats.pendingCompanies > 0 && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stats.pendingCompanies} pending</span>}
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Building2 size={24} /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white/60 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                  {stats.pendingUsers > 0 && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stats.pendingUsers} pending</span>}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
            </CardContent>
          </Card>

          {/* Add more metric cards if needed in future */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white md:col-span-2">
            <CardContent className="p-5 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-1"><Activity className="text-blue-400" size={18} /> System Status</h3>
                <p className="text-slate-300 text-sm">All systems operational. Last sync 1 min ago.</p>
              </div>
              <div className="absolute right-[-20px] bottom-[-40px] opacity-10">
                <Activity size={120} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Activity Grid */}
        <div className="grid gap-6 lg:grid-cols-7">

          {/* Charts Section */}
          <Card className="lg:col-span-4 border-none shadow-premium bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Distribution of companies and user roles.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="h-[250px] flex flex-col items-center justify-center">
                <h4 className="text-sm font-medium text-slate-500 mb-2">Company Status</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={companyStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {companyStatusData.map((entry, index) => <Cell key={`cell - ${index} `} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-3 text-xs justify-center mt-2">
                  {companyStatusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[250px] flex flex-col items-center justify-center">
                <h4 className="text-sm font-medium text-slate-500 mb-2">User Roles</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userRoleData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item, idx) => (
                  <div key={`${item.type} -${item.id} `} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`mt - 1 h - 2 w - 2 rounded - full ring - 2 ${item.status === 'PENDING' ? 'bg-amber-400 ring-amber-100' : 'bg-emerald-400 ring-emerald-100'} `} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.desc}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/platform/companies')}>View All Activity</Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-auto py-4 px-6 flex items-center justify-between bg-white text-slate-700 border hover:bg-slate-50 hover:border-blue-300 shadow-sm group"
            onClick={() => navigate('/platform/companies')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Factory className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Manage Companies</div>
                <div className="text-xs text-muted-foreground">Approve, Edit, or Add new tenants</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Button>

          <Button
            size="lg"
            className="h-auto py-4 px-6 flex items-center justify-between bg-white text-slate-700 border hover:bg-slate-50 hover:border-green-300 shadow-sm group"
            onClick={() => navigate('/platform/approvals')} // Assuming approvals is a page, or users
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                <HardHat className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Manage User Approvals</div>
                <div className="text-xs text-muted-foreground">Review incoming signup requests</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-green-500 transition-colors" />
          </Button>
        </div>
      </div>
    </PlatformLayout >
  );
}


