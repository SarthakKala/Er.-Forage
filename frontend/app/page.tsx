export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">Er. Forge</h1>
        <p className="text-white/70">
          Sprint 1 foundation is ready. Continue to login and test Google OAuth.
        </p>
        <a
          href="/login"
          className="inline-flex rounded-md bg-[#3ECF8E] text-[#050505] px-5 py-3 font-semibold"
        >
          Go to Login
        </a>
      </div>
    </main>
  );
}
