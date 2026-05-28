import { useState } from "react";
import { Loader2, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/auth";

export default function SignIn() {
  const [stage, setStage] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSendCode = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStage("code");
    } catch (err) {
      setError(err?.body?.message || err.message || "Could not send code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const result = await db.auth.signInWithMagicCode({
        email: email.trim(),
        code: code.trim(),
      });
      // Idempotent profile bootstrap on first login.
      if (result?.user) {
        await ensureProfile(result.user);
      }
    } catch (err) {
      setError(err?.body?.message || err.message || "Invalid code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">
            <span className="text-primary">Drop</span>
            <span className="text-foreground">Radar</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pokémon Go for creator drops
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6">
          {stage === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="bg-secondary border-none h-11 pl-9"
                  />
                </div>
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                disabled={!email.trim() || submitting}
                className="w-full h-11 rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send magic code"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                We&apos;ll email you a 6-digit code. No password.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Sent a code to <span className="text-foreground font-medium">{email}</span>
                </p>
                <Input
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="bg-secondary border-none h-12 text-center font-mono text-lg tracking-widest"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                disabled={code.length < 6 || submitting}
                className="w-full h-11 rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-[10px] text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
