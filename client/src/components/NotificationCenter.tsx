import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Bell, Check, Trash2, Calendar, Award, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
    const queryClient = useQueryClient();
    const { data: notifications } = useQuery<any[]>({
        queryKey: [api.notifications.list.path],
    });

    const markRead = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.notifications.list.path] });
        }
    });

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const getIcon = (type: string) => {
        if (type.includes('assignment')) return <Calendar className="text-primary" size={16} />;
        if (type.includes('grade')) return <Award className="text-amber-500" size={16} />;
        if (type.includes('comment')) return <MessageSquare className="text-blue-500" size={16} />;
        return <Info className="text-muted-foreground" size={16} />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary animate-pulse">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 border-none shadow-2xl bg-background/95 backdrop-blur-sm">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-sm">Notifications</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Latest Updates</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest h-7 px-2 hover:bg-primary/10 text-primary">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                            <Bell className="opacity-20" size={48} />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-muted/50">
                            {notifications?.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 transition-all hover:bg-muted/10 relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shadow-sm ${!n.isRead ? 'bg-primary/10' : 'bg-muted'}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm tracking-tight ${!n.isRead ? 'font-black' : 'font-semibold text-muted-foreground'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-tighter">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 pr-6">
                                                {n.content}
                                            </p>
                                            {n.link && (
                                                <Link href={n.link}>
                                                    <a className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-2 inline-block">
                                                        View Details
                                                    </a>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <Button
                                            onClick={() => markRead.mutate(n.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                                        >
                                            <Check size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/10">
                    <Link href="/settings/notifications">
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest h-8 justify-center gap-2 hover:bg-primary/5">
                            Notification Settings
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
