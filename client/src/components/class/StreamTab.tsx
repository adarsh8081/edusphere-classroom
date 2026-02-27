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
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Create Post Input */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-4 sm:p-6 flex gap-4">
          <Avatar className="h-10 w-10 hidden sm:block">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Announce something to your class..."
              className="resize-none min-h-[100px] border-muted bg-muted/30 focus-visible:ring-primary/20"
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

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 rounded-full ${showPollBuilder ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => setShowPollBuilder(!showPollBuilder)}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Poll
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    className="h-9 w-40 text-xs rounded-full"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || createPost.isPending}
                className="hover-elevate rounded-full px-6"
              >
                {createPost.isPending ? "Posting..." : "Post"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts?.length === 0 ? (
        <div className="text-center py-16 px-4 bg-muted/30 rounded-2xl border border-dashed border-border">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">No posts yet</h3>
          <p className="text-muted-foreground mt-1">Be the first to share something with the class.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts?.map((post: any) => (
            <Card key={post.id} className="shadow-sm border-border overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="p-4 sm:p-6 pb-2">
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
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/5 text-xs text-primary">
                            {comment.author?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 px-4 py-2 rounded-2xl rounded-tl-sm flex-1">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="font-medium text-xs sm:text-sm text-foreground">{comment.author?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : ''}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 w-full mt-2">
                  <Avatar className="h-8 w-8 shrink-0 hidden sm:block">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Add class comment..."
                      className="rounded-full bg-background border-muted h-10"
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
                      variant="ghost"
                      className="shrink-0 h-10 w-10 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={() => handleCreateComment(post.id)}
                      disabled={!(commentInputs[post.id]?.trim()) || createComment.isPending}
                    >
                      <Send className="h-4 w-4" />
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
