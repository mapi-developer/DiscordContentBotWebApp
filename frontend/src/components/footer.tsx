"use client";

export default function Footer() {
    return (
        <footer className="border-t border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#92a0b5] flex items-center justify-between">
                <p>© {new Date().getFullYear()} Albion Content Bot</p>
                <div className="flex gap-4">
                    <a href="#" className="hover:underline">Docs</a>
                    <a href="#" className="hover:underline">Privacy</a>
                    <a href="#" className="hover:underline">Terms</a>
                </div>
            </div>
        </footer>
    );
}
