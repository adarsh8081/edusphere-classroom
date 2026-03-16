import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@edusphere/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: prefs, isLoading } = useQuery<any>({
        queryKey: [api.notifications.preferences.path],
    });

    const updatePrefs = useMutation({
        mutationFn: async (newPrefs: any) => {
            const res = await fetch(api.notifications.preferences.path, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPrefs),
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to update preferences");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.notifications.preferences.path] });
            toast({ title: "Preferences updated" });
        }
    });

    const [localPrefs, setLocalPrefs] = useState<any>(null);

    if (isLoading) return <Loader2 className="animate-spin mx-auto mt-20" />;

    const defaultPrefs = {
        newPost: { inApp: true, email: false, push: false },
        newComment: { inApp: true, email: false, push: false },
        assignmentCreated: { inApp: true, email: true, push: false },
        gradePublished: { inApp: true, email: true, push: false },
        attendanceMarked: { inApp: true, email: false, push: false }
    };

    const currentPrefs = localPrefs || prefs || defaultPrefs;

    const handleToggle = (category: string, channel: string) => {
        const updated = {
            ...currentPrefs,
            [category]: {
                ...(currentPrefs[category] || defaultPrefs[category as keyof typeof defaultPrefs]),
                [channel]: !currentPrefs[category]?.[channel]
            }
        };
        setLocalPrefs(updated);
        updatePrefs.mutate(updated);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-4xl font-black uppercase tracking-tight">Notifications</h1>
                <p className="text-muted-foreground font-medium">Manage how and when you receive updates.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Email Notifications */}
                <Card className="border-none shadow-xl bg-violet-500/5 transition-all hover:bg-violet-500/10 h-full">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
                            <Mail className="text-white" size={24} />
                        </div>
                        <CardTitle className="font-bold">Email</CardTitle>
                        <CardDescription className="font-medium">Direct to your inbox</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <div className="space-y-0.5">
                                <Label className="font-bold text-sm tracking-tight opacity-70">Assignments</Label>
                                <p className="text-[10px] text-muted-foreground">New posts & due dates</p>
                            </div>
                            <Switch
                                checked={!!currentPrefs.assignmentCreated?.email}
                                onCheckedChange={() => handleToggle('assignmentCreated', 'email')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="font-bold text-sm tracking-tight opacity-70">Grades</Label>
                                <p className="text-[10px] text-muted-foreground">Feedback published</p>
                            </div>
                            <Switch
                                checked={!!currentPrefs.gradePublished?.email}
                                onCheckedChange={() => handleToggle('gradePublished', 'email')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* In-App Notifications */}
                <Card className="border-none shadow-xl bg-primary/5 transition-all hover:bg-primary/10 h-full">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                            <Bell className="text-white" size={24} />
                        </div>
                        <CardTitle className="font-bold">In-App</CardTitle>
                        <CardDescription className="font-medium">Within the portal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="font-bold text-sm tracking-tight opacity-70">Stream Updates</Label>
                                <p className="text-[10px] text-muted-foreground">Announcements & comments</p>
                            </div>
                            <Switch
                                checked={!!currentPrefs.newPost?.inApp}
                                onCheckedChange={() => handleToggle('newPost', 'inApp')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="font-bold text-sm tracking-tight opacity-70">Comments</Label>
                                <p className="text-[10px] text-muted-foreground">Peer responses</p>
                            </div>
                            <Switch
                                checked={!!currentPrefs.newComment?.inApp}
                                onCheckedChange={() => handleToggle('newComment', 'inApp')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Push Notifications (Simulated) */}
                <Card className="border-none shadow-xl bg-sky-500/5 transition-all hover:bg-sky-500/10 h-full">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
                            <Smartphone className="text-white" size={24} />
                        </div>
                        <CardTitle className="font-bold">Push</CardTitle>
                        <CardDescription className="font-medium">Mobile devices</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="font-bold text-sm tracking-tight opacity-70">Assignments</Label>
                                <p className="text-[10px] text-muted-foreground">Mobile alerts</p>
                            </div>
                            <Switch
                                checked={!!currentPrefs.assignmentCreated?.push}
                                onCheckedChange={() => handleToggle('assignmentCreated', 'push')}
                            />
                        </div>
                        <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20">
                            <div className="flex items-center gap-2 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                                <ShieldCheck size={14} />
                                Requires App
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-md bg-muted/30">
                <CardContent className="p-4 flex items-center gap-4 text-xs font-medium text-muted-foreground leading-relaxed">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">?</div>
                    Changes made to your notification settings are saved automatically and synced across all your devices. Critical system alerts cannot be disabled.
                </CardContent>
            </Card>
        </div>
    );
}
