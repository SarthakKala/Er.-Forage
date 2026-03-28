export default function Footer() {
  return (
    <footer
      className="flex flex-col items-center justify-between gap-4 bg-[#050505] px-10 py-6 md:flex-row"
      style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "24px 40px" }}
    >
      <div className="text-[14px] text-white/25">
        <span className="text-white/40">Er</span>
        <span style={{ color: "#3ECF8E" }}>.</span>
        <span className="text-white/40">Forge</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-6 text-[13px] text-white/25">
        <a href="#features" className="transition-colors hover:text-white/40">
          Features
        </a>
        <a href="#how-it-works" className="transition-colors hover:text-white/40">
          How it works
        </a>
        <a href="#pricing" className="transition-colors hover:text-white/40">
          Pricing
        </a>
      </nav>
      <p className="text-[12px] text-white/25">© 2026 Er. Forge. Built for engineers.</p>
    </footer>
  );
}
