import { FileText, Music, Film, FileArchive } from "lucide-react";

export default function FileViewer({ fileUrl, fileType, fileName }) {
  if (!fileUrl) return null;

  switch (fileType) {
    case "image":
      return (
        <div className="rounded-2xl overflow-hidden bg-secondary">
          <img src={fileUrl} alt={fileName} className="w-full max-h-80 object-contain" />
        </div>
      );
    case "video":
      return (
        <div className="rounded-2xl overflow-hidden bg-secondary">
          <video src={fileUrl} controls className="w-full max-h-80" />
        </div>
      );
    case "audio":
      return (
        <div className="rounded-2xl bg-secondary p-6 flex flex-col items-center gap-3">
          <Music className="w-10 h-10 text-primary" />
          <p className="text-xs text-muted-foreground">{fileName}</p>
          <audio src={fileUrl} controls className="w-full" />
        </div>
      );
    case "pdf":
      return (
        <div className="rounded-2xl bg-secondary p-6 flex flex-col items-center gap-3">
          <FileText className="w-10 h-10 text-neon-pink" />
          <p className="text-sm font-medium">{fileName}</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
            Open PDF
          </a>
        </div>
      );
    default:
      return (
        <div className="rounded-2xl bg-secondary p-6 flex flex-col items-center gap-3">
          <FileArchive className="w-10 h-10 text-neon-yellow" />
          <p className="text-sm font-medium">{fileName}</p>
        </div>
      );
  }
}