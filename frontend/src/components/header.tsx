"use client";
import Link from "next/link";
import LoginModal from "./login-modal";
import RegisterModal from "./register-modal";
import LogInDiscordButton from "@/src/components/login-discord-button";
import { useState } from "react";

export default function Header() {
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const openRegisterFromLogin = () => {
        setLoginOpen(false);
        setRegisterOpen(true);
    };

    return (
        <>
            <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-[#0b0f17]/70">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="group inline-flex items-center gap-2">
                            <Logo />
                            <span className="font-semibold tracking-tight group-hover:opacity-90">
                                Albion Content Bot
                            </span>
                        </Link>
                        <div></div>
                        <button
                            onClick={() => {
                                window.location.href = `/groups`;
                            }}
                            className="rounded-md px-3 py-1.5 text-sm font-semibold bg-[#101730] hover:bg-[#1d2852] border border-[#131b38] transition"
                        >
                            Groups
                        </button>
                    </div>

                    <nav className="flex items-center gap-2">
                        {/*
                        <button
                            onClick={() => setRegisterOpen(true)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/10 transition"
                        >
                            Sign up
                        </button>
                        <button
                            onClick={() => setLoginOpen(true)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold bg-[#7c9bff] hover:bg-[#6a85e0] text-black transition"
                        >
                            Sign in
                        </button>
                        */}
                        <LogInDiscordButton />
                    </nav>
                </div>
            </header>


            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onOpenRegister={openRegisterFromLogin}
            />
            <RegisterModal
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
            />

        </>
    );
}

function Logo() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
                    <stop stopColor="#8ea8ff" />
                    <stop offset="1" stopColor="#a6ffea" />
                </linearGradient>
            </defs>
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="url(#g)" strokeWidth="2" fill="none" />
            <path d="M8 16l4-8 4 8" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}
