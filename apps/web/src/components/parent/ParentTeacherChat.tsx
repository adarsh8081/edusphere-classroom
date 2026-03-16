import { useState, useRef, useEffect } from "react";
import { useParentMessages, useSendParentMessage } from "@/hooks/use-parent";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export function ParentTeacherChat({
    teacherId,
    studentId,
    studentName,
    isOpen,
    onClose
}: {
    teacherId: string;
    studentId: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading } = useParentMessages(user?.id || "", teacherId, studentId);
    const sendMutation = useSendParentMessage();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            await sendMutation.mutateAsync({ receiverId: teacherId, studentId, content });
            setContent("");
        } catch (err) { }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-white/10 z-[101] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <MessageSquare className="text-primary w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">Teacher Communication</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Regarding {studentName}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
                                <X size={20} />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages?.map((msg: any) => {
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${isMe
                                                        ? "bg-primary text-primary-foreground rounded-br-none shadow-lg shadow-primary/20"
                                                        : "bg-white/5 border border-white/10 rounded-bl-none"
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] mt-1 font-black uppercase opacity-40">
                                                    {format(new Date(msg.createdAt), "h:mm a")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            )}
                        </ScrollArea>

                        <form onSubmit={handleSend} className="p-6 bg-primary/5 border-t border-white/10">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Ask about progress..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="rounded-xl bg-background/50 border-white/10 h-12"
                                />
                                <Button
                                    type="submit"
                                    disabled={sendMutation.isPending || !content.trim()}
                                    className="rounded-xl w-12 h-12 p-0 shadow-lg shadow-primary/20"
                                >
                                    {sendMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
