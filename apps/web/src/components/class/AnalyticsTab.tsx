import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Loader2, TrendingUp, Users, Award, BookOpen } from "lucide-react";

export function AnalyticsTab({ classId }: { classId: string }) {
    const { data: engagement, isLoading: loadingEngagement } = useQuery<any[]>({
        queryKey: [buildUrl(api.analytics.engagement.path, { classId })],
    });

    const { data: assignments } = useQuery<any[]>({
        queryKey: [api.assignments.list.path, classId],
    });

    if (loadingEngagement) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Process engagement data for heatmap/chart
    const activityByDate = engagement?.reduce((acc: any, act: any) => {
        const date = new Date(act.timestamp).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(activityByDate || {}).map(([date, count]) => ({
        date,
        count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 p-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-white/10 shadow-lg bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner border border-primary/30 text-primary">
                                <Users size={28} className="drop-shadow-sm" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-90 drop-shadow-sm">Activity</p>
                                <p className="text-3xl font-black drop-shadow-sm text-foreground">{engagement?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-white/10 shadow-lg bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-inner border border-blue-500/30 text-blue-500">
                                <BookOpen size={28} className="drop-shadow-sm" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-90 drop-shadow-sm">Lessons</p>
                                <p className="text-3xl font-black drop-shadow-sm text-foreground">{assignments?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engagement Chart */}
                <Card className="shadow-2xl glossy-panel border-white/20 rounded-3xl backdrop-blur-md overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-50"></div>
                    <CardHeader className="relative z-10 border-b border-white/10 bg-white/5">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-tight drop-shadow-sm">
                            <TrendingUp className="text-primary drop-shadow-sm w-6 h-6" />
                            Engagement Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
                                    />
                                    <YAxis stroke="#888888" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignment Stats */}
                <Card className="shadow-2xl glossy-panel border-white/20 rounded-3xl backdrop-blur-md overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none opacity-50"></div>
                    <CardHeader className="relative z-10 border-b border-white/10 bg-white/5">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-tight drop-shadow-sm">
                            <Award className="text-amber-500 drop-shadow-sm w-6 h-6" />
                            Submission Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assignments?.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                    <XAxis dataKey="title" stroke="#888888" fontSize={10} hide />
                                    <YAxis stroke="#888888" fontSize={10} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="maxPoints" radius={[6, 6, 0, 0]}>
                                        {assignments?.slice(0, 5).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4 justify-center">
                            {assignments?.slice(0, 5).map((a: any, i: number) => (
                                <div key={a.id} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate max-w-[80px]">{a.title}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap Placeholder */}
            <Card className="shadow-2xl glossy-panel border-white/20 rounded-3xl backdrop-blur-md overflow-hidden relative">
                <CardHeader className="border-b border-white/10 bg-white/5">
                    <CardTitle className="text-lg font-bold uppercase tracking-tight drop-shadow-sm opacity-80 pl-2">Engagement Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 relative z-10">
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {Array.from({ length: 35 }).map((_, i) => {
                            const opacity = Math.random() * 0.8 + 0.1;
                            return (
                                <div
                                    key={i}
                                    className="aspect-square rounded-sm md:rounded-md transition-all duration-500"
                                    style={{ backgroundColor: `rgba(var(--primary-rgb), ${opacity})` }}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] font-bold opacity-40 uppercase tracking-[0.2em]">
                        <span>Less Active</span>
                        <span>Highly Engaged</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
