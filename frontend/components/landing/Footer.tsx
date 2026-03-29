export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050505] py-6">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-center gap-4 px-6 text-center sm:px-10 lg:px-12 md:flex-row md:justify-between md:text-left">
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
      </div>
    </footer>
  );
}
