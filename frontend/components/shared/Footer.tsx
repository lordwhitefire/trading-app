export default function Footer() {
    return (
        <footer className="w-full border-t border-border py-8 bg-black mt-8">
            <div className="max-w-[1280px] mx-auto flex flex-col items-center px-8 text-center gap-4">
                <p className="text-[10px] tracking-widest uppercase text-white/40">
                    © 2024 ALPHADESK TERMINAL. INSTITUTIONAL GRADE STRATEGY BUILDER.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    {['Documentation', 'API Reference', 'Status', 'Privacy'].map((link) => (
                        <a
                            key={link}
                            href="#"
                            className="text-[10px] tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
                        >
                            {link}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
