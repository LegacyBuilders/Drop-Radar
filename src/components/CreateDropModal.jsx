import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  MapPin,
  Lock,
  Eye,
  Globe,
  DollarSign,
  Loader2,
  Package,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { getExpirationDate, metersToRadiusLabel } from "@/lib/geo";
import { encodeBoth } from "@/lib/geohash";
import { uploadFile, getFileType } from "@/lib/storage";
import { useTier, commissionFor } from "@/lib/tier";

const EXPIRATION_OPTIONS = [
  { value: "15min", label: "15 min" },
  { value: "1hr", label: "1 hr" },
  { value: "24hr", label: "24 hr" },
  { value: "permanent", label: "∞" },
];

const TEMPLATES = [
  { value: "standard", label: "Standard", icon: "📦" },
  { value: "digital_product", label: "Product", icon: "💿" },
  { value: "exclusive_content", label: "Exclusive", icon: "🔒" },
  { value: "event_drop", label: "Event", icon: "🎪" },
  { value: "treasure_hunt", label: "Hunt", icon: "🗺️" },
  { value: "portfolio", label: "Portfolio", icon: "🎨" },
];

export default function CreateDropModal({ isOpen, onClose, position, profile }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [radius, setRadius] = useState([200]);
  const [expiration, setExpiration] = useState("24hr");
  const [visibility, setVisibility] = useState("public");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isGeoLocked, setIsGeoLocked] = useState(true);
  const [price, setPrice] = useState("");
  const [quantityLimit, setQuantityLimit] = useState("");
  const [template, setTemplate] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { user } = db.useAuth();
  const { limits } = useTier(profile);
  const creatorShare = (1 - commissionFor(profile?.tier)).toFixed(2);

  const handleSubmit = async () => {
    if (!file || !title || !position || !user) return;
    setError(null);
    setSubmitting(true);
    try {
      const token = user?.refresh_token;

      const [main, preview] = await Promise.all([
        uploadFile(file, { token }),
        previewFile ? uploadFile(previewFile, { token }) : Promise.resolve(null),
      ]);

      const { geohash7, geohash5 } = encodeBoth(position.lat, position.lng);
      const priceNum = parseFloat(price) || 0;
      const qtyLimit = parseInt(quantityLimit, 10) || null;
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Phase 0 unlock_rules: simple structured rules derived from the
      // toggles in the form. Phase 1 surfaces these as a real builder
      // (vision / quiz / chain).
      const unlockRules = [];
      if (isGeoLocked) unlockRules.push({ type: "gps", radius_meters: radius[0] });
      if (priceNum > 0) unlockRules.push({ type: "payment", price: priceNum });

      const dropId = id();
      const now = Date.now();

      await db.transact(
        db.tx.drops[dropId]
          .update({
            title,
            description: description || undefined,
            file_url: main.url,
            preview_url: preview?.url,
            file_type: main.type,
            file_name: file.name,
            file_size: file.size,
            storage_backend: "r2",
            latitude: position.lat,
            longitude: position.lng,
            radius_meters: radius[0],
            geohash7,
            geohash5,
            is_geo_locked: isGeoLocked,
            expiration,
            expires_at: getExpirationDate(expiration) || undefined,
            visibility,
            template_type: template,
            unlock_rules: unlockRules,
            owner_name: isAnonymous ? "Anonymous" : profile?.full_name || profile?.username || "User",
            owner_username: isAnonymous ? undefined : profile?.username,
            is_anonymous: isAnonymous,
            creator_email: user.email,
            is_paid: priceNum > 0,
            price: priceNum,
            currency: "usd",
            quantity_limit: qtyLimit || undefined,
            quantity_remaining: qtyLimit || undefined,
            view_count: 0,
            like_count: 0,
            download_count: 0,
            unlock_count: 0,
            total_revenue: 0,
            referral_code: referralCode,
            status: "active",
            is_featured: false,
            created_at: now,
          })
          .link({ creator: profile.id })
      );

      setTitle("");
      setDescription("");
      setFile(null);
      setPreviewFile(null);
      setPrice("");
      setQuantityLimit("");
      setRadius([200]);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create drop");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card border-t border-border rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-1 pb-3">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">New Drop</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {position
                    ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                    : "Getting location..."}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTemplate(t.value)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                        template === t.value
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size <= limits.max_upload_bytes) setFile(f);
                  }}
                  accept="image/*,video/*,audio/*,.pdf,.zip"
                />
                {file ? (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-primary mx-auto mb-1.5" />
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB · {getFileType(file)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">
                      Tap to upload (max {Math.round(limits.max_upload_bytes / 1024 / 1024)}MB)
                    </p>
                  </div>
                )}
              </label>

              <label className="flex items-center gap-3 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPreviewFile(f);
                  }}
                  accept="image/*"
                />
                <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {previewFile ? previewFile.name : "Add Preview Image (optional)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Shown before unlock / purchase
                  </p>
                </div>
              </label>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Drop title..."
                className="bg-secondary border-none h-11"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="bg-secondary border-none h-11"
              />

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Price (leave empty for free)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00 — free"
                    className="bg-secondary border-none h-11 pl-9"
                  />
                </div>
                {price > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    You earn{" "}
                    <span className="text-primary font-medium">
                      ${(parseFloat(price) * creatorShare).toFixed(2)}
                    </span>{" "}
                    · Platform fee: $
                    {(parseFloat(price) * commissionFor(profile?.tier)).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Quantity limit (optional)
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={quantityLimit}
                    onChange={(e) => setQuantityLimit(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="bg-secondary border-none h-11 pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">Geo-Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Require physical proximity to unlock
                  </p>
                </div>
                <Switch checked={isGeoLocked} onCheckedChange={setIsGeoLocked} />
              </div>

              {isGeoLocked && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Unlock Radius
                    </label>
                    <span className="text-xs font-mono text-primary">
                      {metersToRadiusLabel(radius[0])}
                    </span>
                  </div>
                  <Slider
                    value={radius}
                    onValueChange={setRadius}
                    min={10}
                    max={8047}
                    step={10}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-0.5">
                    <span>10m</span>
                    <span>5mi</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Expires
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiration(opt.value)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${
                        expiration === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVisibility("public")}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                    visibility === "public"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Public
                </button>
                <button
                  onClick={() => setVisibility("private")}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                    visibility === "private"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Private
                </button>
              </div>

              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs transition-all ${
                  isAnonymous
                    ? "bg-accent/20 text-accent border border-accent/20"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isAnonymous ? "border-accent bg-accent" : "border-muted-foreground"
                  }`}
                >
                  {isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                Drop anonymously
              </button>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button
                onClick={handleSubmit}
                disabled={!file || !title || !position || submitting || !profile}
                className="w-full h-12 rounded-2xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />{" "}
                    {price > 0 ? `Drop for $${parseFloat(price).toFixed(2)}` : "Drop It"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
