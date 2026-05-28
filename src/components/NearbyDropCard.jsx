import { MapPin, Lock, Unlock, Eye, Clock, Image, Film, Music, FileText, File } from "lucide-react";
import { haversineDistance, formatDistance, isExpired } from "@/lib/geo";

const FILE_ICONS = {
  image: Image,
  video: Film,
  audio: Music,
  pdf: FileText,
  other: File,
};

export default function NearbyDropCard({ drop, userPosition, onClick }) {
  const distance = userPosition
    ? haversineDistance(userPosition.lat, userPosition.lng, drop.latitude, drop.longitude)
    : Infinity;
  const isUnlocked = distance <= drop.radius_meters;
  const expired = isExpired(drop.expires_at);
  const FileIcon = FILE_ICONS[drop.file_type] || File;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUnlocked ? "bg-primary/10" : "bg-secondary"
      }`}>
        {isUnlocked ? (
          <FileIcon className="w-5 h-5 text-primary" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${expired ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {drop.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {formatDistance(distance)}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            {drop.view_count || 0}
          </span>
          {expired && (
            <span className="text-[10px] text-destructive flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> Expired
            </span>
          )}
        </div>
      </div>

      <div className={`text-[10px] font-mono px-2 py-1 rounded-lg ${
        isUnlocked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
      }`}>
        {isUnlocked ? "OPEN" : formatDistance(distance - drop.radius_meters)}
      </div>
    </button>
  );
}