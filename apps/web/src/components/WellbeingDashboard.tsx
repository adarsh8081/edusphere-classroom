import { useQuery } from "@tanstack/react-query";
import { Heart, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const MOOD_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
    5: { label: "Great", emoji: "😄", color: "#22c55e" },
    4: { label: "Good", emoji: "🙂", color: "#84cc16" },
    3: { label: "Okay", emoji: "😐", color: "#eab308" },
    2: { label: "Low", emoji: "😔", color: "#f97316" },
    1: { label: "Struggling", emoji: "😢", color: "#ef4444" },
};

export function WellbeingDashboard({ classId }: { classId: string }) {
    const { data, isLoading } = useQuery<{
        trends: { date: string; avgMood: number; count: number }[];
        flagged: any[];
        totalCheckins: number;
    }>({
        queryKey: [`/api/wellbeing/analytics/${classId}`],
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground animate-pulse">
                Loading well-being data...
            </div>
        );
    }

    const { trends = [], flagged = [], totalCheckins = 0 } = data ?? {};
    const latestAvgMood = trends.length > 0 ? trends[trends.length - 1].avgMood : null;
    const moodInfo = latestAvgMood != null ? MOOD_LABELS[Math.round(latestAvgMood)] : null;

    const chartData = trends.map((t) => ({
        date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        mood: t.avgMood,
        responses: t.count,
    }));

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            Current Class Mood
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">{moodInfo?.emoji ?? "—"}</span>
                            <div>
                                <p className="text-xl font-bold">{latestAvgMood?.toFixed(1) ?? "—"} / 5</p>
                                <p className="text-xs text-muted-foreground">{moodInfo?.label ?? "No data yet"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Total Check-ins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalCheckins}</p>
                        <p className="text-xs text-muted-foreground">across {trends.length} day{trends.length !== 1 ? "s" : ""}</p>
                    </CardContent>
                </Card>

                <Card className={flagged.length > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${flagged.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                            Students Needing Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-3xl font-bold ${flagged.length > 0 ? "text-destructive" : ""}`}>
                            {flagged.length}
                        </p>
                        <p className="text-xs text-muted-foreground">flagged check-ins</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mood trend chart */}
            {chartData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Class Mood Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs" />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} className="text-xs" />
                                <Tooltip
                                    formatter={(value: any) => [Number(value).toFixed(2), "Avg Mood"]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mood"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground gap-2">
                        <Heart className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No check-ins yet.</p>
                        <p className="text-xs">Students will see a daily mood check-in when they visit the class.</p>
                    </CardContent>
                </Card>
            )}

            {/* Flagged students */}
            {flagged.length > 0 && (
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-base text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Students Who May Need Support
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">These check-ins were automatically flagged by the AI sentiment analysis.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {flagged.slice(0, 10).map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <span>{MOOD_LABELS[f.moodScore]?.emoji ?? "😐"}</span>
                                        <span className="text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                                        {f.notes && <span className="italic truncate max-w-48 text-xs">"{f.notes}"</span>}
                                    </div>
                                    <Badge variant="destructive" className="text-xs">Flagged</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
