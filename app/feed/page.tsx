import Link from "next/link";
import { getServerSession } from "next-auth";
import { MessageSquare, ThumbsUp, Trash2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { deletePost, getFeed, toggleLike } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { CommentForm } from "@/components/CommentForm";
import { LiveTimeAgo } from "@/components/LiveTimeAgo";
import { PostComposer } from "@/components/PostComposer";
import { ReadMore } from "@/components/ReadMore";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Person = { id: string; name: string; role: string; companyName: string | null };

function displayName(p: Person) {
  return p.role === "COMPANY" ? p.companyName || p.name : p.name;
}

// Students have a public profile page; companies don't, so only link students.
function PersonName({ p, className }: { p: Person; className?: string }) {
  if (p.role === "STUDENT") {
    return (
      <Link href={`/profile/${p.id}`} className={cn("hover:text-signal hover:underline", className)}>
        {displayName(p)}
      </Link>
    );
  }
  return <span className={className}>{displayName(p)}</span>;
}

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  const { userId, role, posts } = await getFeed();
  const isStudent = role === "STUDENT";
  const name = session?.user?.name ?? "You";

  return (
    <>
      <TopBar
        who={name}
        context="Feed"
        profileHref={isStudent ? "/student/profile" : undefined}
        networkHref={isStudent ? "/student/network" : undefined}
      />

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[22px] font-semibold tracking-tight">Feed</h1>
          <Link
            href={isStudent ? "/student" : "/company"}
            className="inline-flex items-center gap-1 rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-[13px] font-medium text-signal hover:bg-signal/20"
          >
            {isStudent ? "Job hub" : "Dashboard"} →
          </Link>
        </div>

        <PostComposer name={name} />

        {posts.length === 0 ? (
          <p className="panel p-5 text-[14px] text-mist">Nothing here yet — be the first to post.</p>
        ) : (
          posts.map((post, i) => {
            const liked = post.likes.length > 0;
            const author = post.author as Person & { headline: string | null };

            return (
              <article
                key={post.id}
                className="panel animate-fade-up p-5"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <header className="flex items-start gap-3">
                  <Avatar name={displayName(author)} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">
                      <PersonName p={author} />
                      {author.role === "COMPANY" && (
                        <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] font-normal text-mist">
                          Company
                        </span>
                      )}
                    </p>
                    {author.headline && <p className="truncate text-[13px] text-mist">{author.headline}</p>}
                    <p className="text-[12px] text-mist">
                      <LiveTimeAgo date={post.createdAt} />
                    </p>
                  </div>
                  {post.authorId === userId && (
                    <form action={deletePost}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button
                        type="submit"
                        aria-label="Delete post"
                        className="rounded-md p-1.5 text-mist transition-colors hover:text-stop"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </form>
                  )}
                </header>

                {post.title && <h2 className="mt-4 font-display text-[18px] font-semibold leading-snug">{post.title}</h2>}
                <ReadMore text={post.content} limit={post.title ? 360 : 280} />

                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-[13px]">
                  <form action={toggleLike}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      aria-pressed={liked}
                      className={cn(
                        "inline-flex items-center gap-1.5 font-medium transition-colors",
                        liked ? "text-signal" : "text-mist hover:text-paper",
                      )}
                    >
                      <ThumbsUp className={cn("h-4 w-4", liked && "fill-signal/30")} aria-hidden />
                      {post._count.likes > 0 ? post._count.likes : ""} {liked ? "Liked" : "Like"}
                    </button>
                  </form>
                  <span className="inline-flex items-center gap-1.5 text-mist">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    {post._count.comments} {post._count.comments === 1 ? "comment" : "comments"}
                  </span>
                </div>

                {post.comments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {post.comments.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <Avatar name={displayName(c.author as Person)} size={28} />
                        <div className="min-w-0 flex-1 rounded-md bg-ink/60 px-3 py-2">
                          <p className="text-[13px] font-medium">
                            <PersonName p={c.author as Person} />
                          </p>
                          <p className="whitespace-pre-line break-words text-[13px] text-paper/80">{c.content}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <CommentForm postId={post.id} />
              </article>
            );
          })
        )}
      </main>
    </>
  );
}
