import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Download,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Clock,
  Loader2,
  DollarSign,
  Share2,
  CheckCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { haversineDistance, formatDistance, isExpired } from "@/lib/geo";
import FileViewer from "./FileViewer";

export default function DropDetail({ drop, onClose, userPosition }) {
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [copied, setCopied] = useState(false);

  const { user, profile } = useAuth();

  const commentsQuery = drop
    ? {
        comments: {
          $: {
            where: { drop_id: drop.id },
            order: { created_at: "desc" },
            limit: 50,
          },
        },
      }
    : null;
  const { data: commentsData } = db.useQuery(commentsQuery);
  const comments = commentsData?.comments ?? [];

  const isPaid = drop?.is_paid && drop?.price > 0;

  const txQuery =
    drop && user && isPaid
      ? {
          transactions: {
            $: {
              where: {
                drop_id: drop.id,
                buyer_email: user.email,
                status: "completed",
              },
              limit: 1,
            },
          },
        }
      : null;
  const { data: txData } = db.useQuery(txQuery);
  const hasPurchased =
    (txData?.transactions?.length ?? 0) > 0 ||
    new URLSearchParams(window.location.search).get("payment") === "success";

  const distance =
    userPosition && drop
      ? haversineDistance(
          userPosition.lat,
          userPosition.lng,
          drop.latitude,
          drop.longitude
        )
      : Infinity;

  const geoOk = !drop?.is_geo_locked || distance <= drop?.radius_meters;
  const expired = isExpired(drop?.expires_at);
  const soldOut =
    drop?.status === "sold_out" ||
    (drop?.quantity_remaining != null && drop.quantity_remaining <= 0);
  const isUnlocked = geoOk && (!isPaid || hasPurchased);

  useEffect(() => {
    if (isUnlocked && !viewCounted && drop) {
      setViewCounted(true);
      db.transact(
        db.tx.drops[drop.id].update({ view_count: (drop.view_count || 0) + 1 })
      ).catch(() => {});
    }
  }, [isUnlocked, viewCounted, drop?.id]);

  if (!drop) return null;

  const handleLike = async () => {
    if (liked || !user || !profile) return;
    setLiked(true);
    const reactionId = id();
    await db.transact([
      db.tx.reactions[reactionId]
        .update({
          drop_id: drop.id,
          user_email: user.email,
          kind: "like",
          created_at: Date.now(),
        })
        .link({ drop: drop.id, user: profile.id }),
      db.tx.drops[drop.id].update({ like_count: (drop.like_count || 0) + 1 }),
    ]);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user || !profile) return;
    const commentId = id();
    const text = newComment;
    setNewComment("");
    await db.transact(
      db.tx.comments[commentId]
        .update({
          drop_id: drop.id,
          user_email: user.email,
          author_name: profile.username || profile.full_name || "User",
          text,
          created_at: Date.now(),
        })
        .link({ drop: drop.id, user: profile.id })
    );
  };

  const handlePurchase = async () => {
    if (!user) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.refresh_token}`,
        },
        body: JSON.stringify({
          drop_id: drop.id,
          success_url: `${window.location.origin}/drop/${drop.id}?payment=success`,
          cancel_url: `${window.location.origin}/drop/${drop.id}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Checkout failed");
      }
      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (e) {
      setPaymentError(e.message);
      setPaymentLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/drop/${drop.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border-t border-border rounded-t-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-5 pt-2 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold truncate">{drop.title}</h2>
                  {drop.is_paid && (
                    <span className="text-[10px] bg-chart-3/10 text-chart-3 border border-chart-3/20 px-2 py-0.5 rounded-full font-mono font-medium">
                      ${drop.price}
                    </span>
                  )}
                  {drop.is_featured && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                  {drop.is_geo_locked && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{" "}
                      {userPosition ? formatDistance(distance) : "??"} away
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {drop.view_count || 0}
                  </span>
                  {drop.quantity_limit && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {drop.quantity_remaining ?? drop.quantity_limit}/{drop.quantity_limit}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-secondary">
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {drop.description && (
              <p className="text-sm text-muted-foreground mb-3">{drop.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <span>
                by{" "}
                {drop.is_anonymous
                  ? "Anonymous"
                  : drop.owner_username
                  ? `@${drop.owner_username}`
                  : drop.owner_name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  isUnlocked ? "bg-primary/10 text-primary" : "bg-secondary"
                }`}
              >
                {isUnlocked ? "Unlocked" : "Locked"}
              </span>
            </div>

            {expired ? (
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <Clock className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">This drop has expired</p>
              </div>
            ) : soldOut ? (
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <Package className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm font-medium">Sold Out</p>
                <p className="text-xs text-muted-foreground">All copies have been claimed</p>
              </div>
            ) : isUnlocked ? (
              <div>
                <FileViewer
                  fileUrl={drop.file_url}
                  fileType={drop.file_type}
                  fileName={drop.file_name}
                />
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`gap-1.5 ${
                      liked ? "text-rose-400" : "text-muted-foreground"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    {(drop.like_count || 0) + (liked ? 1 : 0)}
                  </Button>
                  <a
                    href={drop.file_url}
                    download={drop.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                    >
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </a>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">
                    Comments
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="bg-secondary border-none h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    />
                    <Button size="sm" onClick={handleComment} className="h-9 px-3">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-secondary rounded-xl px-3 py-2">
                        <p className="text-xs">{c.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {c.author_name || "User"}
                        </p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : isPaid && geoOk ? (
              <div className="flex flex-col items-center py-10 text-center gap-4">
                {drop.preview_url && (
                  <div className="relative w-full mb-2">
                    <img
                      src={drop.preview_url}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-2xl"
                      style={{ filter: "blur(12px)" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                <div className="bg-chart-3/10 border border-chart-3/20 rounded-2xl px-6 py-4 w-full">
                  <p className="text-2xl font-bold font-mono text-chart-3">${drop.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">One-time unlock</p>
                </div>
                {paymentError && (
                  <p className="text-xs text-destructive">{paymentError}</p>
                )}
                <Button
                  onClick={handlePurchase}
                  disabled={paymentLoading}
                  className="w-full h-12 rounded-2xl bg-chart-3 hover:bg-chart-3/90 text-background font-semibold"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" /> Unlock for ${drop.price}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center py-10 text-center gap-3"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 radar-pulse" />
                </div>
                <p className="text-sm font-medium">Move closer to unlock</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(distance - drop.radius_meters)} remaining
                </p>
                <div className="w-full max-w-[200px] bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (drop.radius_meters / distance) * 100)}%`,
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
