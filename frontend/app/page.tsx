"use client"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0b0f17] text-[#e6ebf5]">
            <main className="mx-auto max-w-6xl px-6 pt-20 pb-32">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 md:p-16 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)]">
                    <GradientGlow />
                    <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold tracking-tight">
                        Albion Content Bot
                    </h1>
                    <p className="relative z-10 mt-5 max-w-2xl text-lg md:text-xl text-[#b9c2d3]">
                        A modern toolkit for managing creators, roles, and content groups for your Discord community — fast, secure, and simple.
                    </p>

                    <div className="relative z-10 mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FeatureCard title="OAuth ready" desc="Google & GitHub sign-in prepared for plug‑and‑play." />
                        <FeatureCard title="Role applications" desc="Users can apply for Content Caller or Admin — review in one click." />
                        <FeatureCard title="Content groups" desc="Create and manage public/private groups with owners & moderators." />
                    </div>
                </section>

                <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Callout
                        title="Built for speed"
                        desc="FastAPI backend + MongoDB + Next.js frontend, optimized for quick iteration."
                    />
                    <Callout
                        title="Dark by default"
                        desc="Elegant, accessible dark theme with subtle glass and glow accents."
                    />
                </section>
            </main>
            <style jsx global>{`
        * { box-sizing: border-box; }
        .mask-fade { mask-image: radial-gradient(60% 50% at 50% 40%, rgba(0,0,0,1), rgba(0,0,0,0)); }
      `}</style>
        </div>
    );
}

function GradientGlow() {
    return (
        <div className="pointer-events-none absolute inset-0">
            <div className="mask-fade absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[60rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,155,255,0.25),rgba(124,155,255,0)_60%)]" />
            <div className="mask-fade absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(166,255,234,0.18),rgba(166,255,234,0)_60%)]" />
        </div>
    );
}


function FeatureCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[#9fb0c9]">{desc}</p>
        </div>
    );
}


function Callout({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-6">
            <h4 className="text-base font-semibold">{title}</h4>
            <p className="mt-2 text-sm text-[#9fb0c9]">{desc}</p>
        </div>
    );
}
