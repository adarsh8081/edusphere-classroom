import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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
        <div className="space-y-8 max-w-5xl mx-auto pb-12 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="text-primary" size={24} />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Activity</p>
                                <p className="text-2xl font-black">{engagement?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-blue-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <BookOpen className="text-blue-500" size={24} />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Lessons</p>
                                <p className="text-2xl font-black">{assignments?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engagement Chart */}
                <Card className="shadow-xl bg-background/50 border-muted/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <TrendingUp className="text-primary" />
                            Engagement Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                <Card className="shadow-xl bg-background/50 border-muted/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <Award className="text-amber-500" />
                            Submission Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
            <Card className="shadow-xl bg-background/50 border-muted/20">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-tight opacity-50">Engagement Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
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
