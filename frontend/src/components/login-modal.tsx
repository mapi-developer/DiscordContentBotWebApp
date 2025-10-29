"use client";
import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    // Close on ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Basic focus trap into first button
    useEffect(() => {
        if (open) {
            const first = panelRef.current?.querySelector<HTMLButtonElement>("button[data-primary]");
            first?.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            ref={backdropRef}
            aria-hidden={!open}
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose();
            }}
        >
            <div
                ref={panelRef}
                className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1420] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]"
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#b9c2d3] hover:bg-white/10"
                    aria-label="Close"
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold">Sign in to Albion Content Bot</h2>
                <p className="mt-2 text-sm text-[#9fb0c9]">
                    Choose a provider to continue. We’ll only use your basic profile info.
                </p>

                <div className="mt-6 space-y-3">
                    <button
                        data-primary
                        onClick={() => signIn("google")}
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition"
                    >
                        Continue with Google
                    </button>
                    <button
                        onClick={() => signIn("github")}
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition"
                    >
                        Continue with GitHub
                    </button>
                </div>

                <div className="mt-5 text-xs text-[#7f8ba0]">
                    By continuing you agree to our <a href="/terms" className="underline">Terms</a> and{" "}
                    <a href="/privacy" className="underline">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
}
