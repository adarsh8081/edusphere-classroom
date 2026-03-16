import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { usePosts, useCreatePost, useCreateComment } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageSquare, Send, BarChart2, Languages } from "lucide-react";
import { Poll } from "./Poll";

export function StreamTab({ classId }: { classId: string }) {
  const { user } = useAuth();
  const { data: posts, isLoading } = usePosts(classId);
  const createPost = useCreatePost();
  const createComment = useCreateComment();

  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    const post = await createPost.mutateAsync({
      classId,
      data: {
        content: newPostContent,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        poll: (showPollBuilder && pollQuestion.trim()) ? {
          question: pollQuestion,
          options: pollOptions.filter(o => o.trim()),
          multipleAnswers: false
        } : undefined
      }
    });

    setNewPostContent("");
    setShowPollBuilder(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setScheduledAt("");
  };

  const handleTranslate = async (postId: string) => {
    if (translatedPosts[postId]) {
      // Toggle back to original by removing from translated map
      setTranslatedPosts(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    setIsTranslating(prev => ({ ...prev, [postId]: true }));
    try {
      const targetLanguage = navigator.language?.split('-')[0] || "es";
      const res = await fetch(`/api/posts/${postId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage })
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedPosts(prev => ({ ...prev, [postId]: data.translatedText }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(prev => ({ ...prev, [postId]: false }));
    }
  };


  const handleCreateComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    await createComment.mutateAsync({
      postId,
      classId,
      data: { content, postId }
    });

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted rounded-xl"></div>
      <div className="h-48 bg-muted rounded-xl"></div>
    </div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 relative z-10">
      {/* Create Post Input */}
      <Card className="matte-surface border-white/20 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-3xl">
        <CardContent className="p-4 sm:p-6 flex gap-4">
          <Avatar className="h-12 w-12 hidden sm:block ring-2 ring-primary/20 shadow-inner">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Announce something to your class..."
              className="resize-none min-h-[100px] border-white/10 bg-black/5 dark:bg-white/5 focus-visible:ring-primary/40 rounded-2xl shadow-inner text-base p-4"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />

            {showPollBuilder && (
              <div className="p-4 bg-muted/20 rounded-xl space-y-3 border border-muted/50">
                <Input
                  placeholder="Poll Question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="bg-background"
                />
                <div className="space-y-2">
                  {pollOptions.map((opt, i) => (
                    <Input
                      key={i}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="bg-background h-8 text-sm"
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary text-xs h-6"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                  >
                    + Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-10 rounded-xl px-4 font-bold transition-all ${showPollBuilder ? "bg-primary/20 text-primary shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]" : "hover:bg-primary/10"}`}
                  onClick={() => setShowPollBuilder(!showPollBuilder)}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Poll
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    className="h-10 w-44 text-sm rounded-xl border-white/10 bg-black/5 dark:bg-white/5 shadow-inner"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || createPost.isPending}
                className="hover-elevate rounded-xl px-8 h-10 font-bold shadow-lg shadow-primary/30"
              >
                {createPost.isPending ? "Posting..." : "Post"}
                <Send className="w-5 h-5 ml-2 drop-shadow-sm" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts?.length === 0 ? (
        <div className="text-center py-20 px-4 glossy-panel rounded-3xl border border-white/20 shadow-xl backdrop-blur-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse-glow">
            <MessageSquare className="w-10 h-10 text-primary drop-shadow-md" />
          </div>
          <h3 className="text-2xl font-bold text-foreground drop-shadow-sm">No posts yet</h3>
          <p className="text-muted-foreground mt-2 text-lg">Be the first to share something with the class.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts?.map((post: any) => (
            <Card key={post.id} className="matte-surface border-white/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-3xl">
              <CardHeader className="p-6 pb-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                      {post.author?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">{post.author?.name || 'Unknown User'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Recently'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2">
                <p className="whitespace-pre-wrap text-foreground/90">
                  {translatedPosts[post.id] || post.content}
                </p>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTranslate(post.id)}
                    disabled={isTranslating[post.id]}
                    className="h-6 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    {isTranslating[post.id] ? "Translating..." : (translatedPosts[post.id] ? "Show Original" : "Translate")}
                  </Button>
                </div>
                <Poll postId={post.id} />
              </CardContent>

              {/* Comments Section */}
              <CardFooter className="bg-muted/10 p-4 sm:p-6 flex flex-col items-stretch gap-4 border-t border-border/50">
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-4 w-full">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-4 group">
                        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/10 shadow-sm mt-1 mb-auto">
                          <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">
                            {comment.author?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-black/5 dark:bg-white/5 px-5 py-3 rounded-2xl rounded-tl-sm flex-1 shadow-inner border border-white/5 backdrop-blur-sm relative">
                          {/* Accent line for comments */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <span className="font-bold text-sm text-foreground drop-shadow-sm">{comment.author?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                              {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : ''}
                            </span>
                          </div>
                          <p className="text-[15px] leading-relaxed text-foreground/90">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-4 w-full mt-4 bg-black/5 dark:bg-white/5 p-3 rounded-2xl shadow-inner border border-white/10">
                  <Avatar className="h-10 w-10 shrink-0 hidden sm:block ring-2 ring-white/20 mb-1">
                    <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-3 relative">
                    <Input
                      placeholder="Add class comment..."
                      className="rounded-xl bg-background border-white/10 h-12 px-4 shadow-sm focus:ring-primary/30"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateComment(post.id);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="shrink-0 h-12 w-12 hover-elevate shadow-md shadow-primary/20 rounded-xl"
                      onClick={() => handleCreateComment(post.id)}
                      disabled={!(commentInputs[post.id]?.trim()) || createComment.isPending}
                    >
                      <Send className="h-5 w-5 drop-shadow-sm text-white" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
