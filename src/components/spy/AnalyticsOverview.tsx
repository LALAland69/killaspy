import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Users, Globe, Clock, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AnalyticsOverview() {
  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['spy-analytics-stats'],
    queryFn: async () => {
      const [adsResult, advertisersResult, countriesResult] = await Promise.all([
        supabase.from('ads').select('id, media_type, status, countries, created_at', { count: 'exact' }),
        supabase.from('advertisers').select('id', { count: 'exact' }),
        supabase.from('ads').select('countries'),
      ]);

      // Count by media type
      const mediaTypeCounts: Record<string, number> = {};
      adsResult.data?.forEach(ad => {
        const type = ad.media_type || 'image';
        mediaTypeCounts[type] = (mediaTypeCounts[type] || 0) + 1;
      });

      // Count by status
      const statusCounts: Record<string, number> = {};
      adsResult.data?.forEach(ad => {
        const status = ad.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Count by country
      const countryCounts: Record<string, number> = {};
      countriesResult.data?.forEach(ad => {
        ad.countries?.forEach((country: string) => {
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
      });

      // Ads over time (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const adsOverTime: Record<string, number> = {};
      
      adsResult.data?.forEach(ad => {
        const date = new Date(ad.created_at).toISOString().split('T')[0];
        if (new Date(date) >= thirtyDaysAgo) {
          adsOverTime[date] = (adsOverTime[date] || 0) + 1;
        }
      });

      return {
        totalAds: adsResult.count || 0,
        totalAdvertisers: advertisersResult.count || 0,
        mediaTypes: Object.entries(mediaTypeCounts).map(([name, value]) => ({ name, value })),
        statuses: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        countries: Object.entries(countryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value })),
        adsOverTime: Object.entries(adsOverTime)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({ date: date.slice(5), count })),
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Anúncios</p>
                <p className="text-2xl font-bold">{stats?.totalAds?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anunciantes</p>
                <p className="text-2xl font-bold">{stats?.totalAdvertisers?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Países</p>
                <p className="text-2xl font-bold">{stats?.countries?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipos de Mídia</p>
                <p className="text-2xl font-bold">{stats?.mediaTypes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ads over time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Anúncios nos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.adsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Media type distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Mídia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.mediaTypes || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats?.mediaTypes?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top countries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top 10 Países
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.countries || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={40} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
