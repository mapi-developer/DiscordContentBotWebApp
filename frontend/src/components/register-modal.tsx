"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { SiGoogle, SiGithub } from "react-icons/si";

type Props = { open: boolean; onClose: () => void };

export default function RegisterModal({ open, onClose }: Props) {
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const startedOnBackdrop = useRef(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");         // Set Password
    const [confirm, setConfirm] = useState("");           // Confirm Password
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            panelRef.current?.querySelector<HTMLElement>("[data-focus]")?.focus();
        }
    }, [open]);

    if (!open) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password || !confirm) return setError("Please fill in all fields.");
        if (password !== confirm) return setError("Passwords do not match.");

        try {
            setSubmitting(true);
            // TODO: call your backend /api/auth/register then sign in
            // const r = await fetch(`${process.env.NEXT_PUBLIC_API}/api/auth/register`, { ... })
            onClose();
        } catch {
            setError("Registration failed. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onPointerDown={(e) => (startedOnBackdrop.current = e.target === backdropRef.current)}
            onPointerUp={(e) => {
                if (startedOnBackdrop.current && e.target === backdropRef.current) onClose();
                startedOnBackdrop.current = false;
            }}
        >
            <div
                ref={panelRef}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1420] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]"
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#b9c2d3] hover:bg-white/10"
                    aria-label="Close"
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold">Create your account</h2>
                <p className="mt-2 text-sm text-[#9fb0c9]">Join Albion Content Bot in a few seconds.</p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-xs mb-1 text-[#9fb0c9]">Email</label>
                        <input
                            data-focus
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="w-full h-11 rounded-lg bg-[#0b0f17] border border-white/10 px-3 outline-none focus:border-white/20"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {/* Set Password */}
                    <PasswordField
                        label="Set Password"
                        value={password}
                        onChange={setPassword}
                        show={showPw}
                        setShow={setShowPw}
                        placeholder="At least 8 characters"
                    />

                    {/* Confirm Password */}
                    <PasswordField
                        label="Confirm Password"
                        value={confirm}
                        onChange={setConfirm}
                        show={showConfirm}
                        setShow={setShowConfirm}
                        placeholder="Repeat your password"
                    />

                    {error && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition disabled:opacity-60"
                    >
                        {submitting ? "Creating account…" : "Create account"}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3 text-xs text-[#7f8ba0]">
                    <div className="h-px flex-1 bg-white/10" />
                    <span>or continue with</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* OAUTH BUTTONS */}
                <div className="space-y-3">
                    <button
                        onClick={() => signIn("google")}
                        className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition"
                        aria-label="Continue with Google"
                    >
                        <SiGoogle size={18} className="shrink-0" aria-hidden />
                        <span className="leading-none">Continue with Google</span>
                    </button>

                    <button
                        onClick={() => signIn("github")}
                        className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition"
                        aria-label="Continue with GitHub"
                    >
                        <SiGithub size={18} className="shrink-0" aria-hidden />
                        <span className="leading-none">Continue with GitHub</span>
                    </button>
                </div>

                <p className="mt-4 text-xs text-[#7f8ba0]">
                    By continuing you agree to our <a href="/terms" className="underline">Terms</a> and{" "}
                    <a href="/privacy" className="underline">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}

/* ---------- Reusable, zero-dup password input with centered eye ---------- */
function PasswordField(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    placeholder?: string;
}) {
    const { label, value, onChange, show, setShow, placeholder } = props;
    return (
        <div>
            <label className="block text-xs mb-1 text-[#9fb0c9]">{label}</label>

            {/* fixed wrapper height -> exact vertical centering */}
            <div className="relative h-11">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete="new-password"
                    className="absolute inset-0 w-full h-11 rounded-lg bg-[#0b0f17] border border-white/10 px-3 pr-12 outline-none focus:border-white/20"
                    placeholder={placeholder || "••••••••"}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                    aria-pressed={show}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 text-[#9fb0c9] hover:text-[#c7d2e6] focus:outline-none"
                >
                    <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
                    {show ? <EyeOffIcon className="block" /> : <EyeIcon className="block" />}
                </button>
            </div>
        </div>
    );
}

function EyeIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}
function EyeOffIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" />
            <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M9 5.5A11.7 11.7 0 0112 5c6.5 0 10 7 10 7a18.5 18.5 0 01-3.3 4.3" stroke="currentColor" strokeWidth="1.7" />
            <path d="M6.1 7.3C4.5 8.7 3.4 10.4 3 12c0 0 3.5 7 10 7 1.2 0 2.4-.2 3.5-.6" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}
