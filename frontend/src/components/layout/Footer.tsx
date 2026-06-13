export default function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-white/5 py-6 text-center text-xs tracking-wider text-slate-500 font-mono bg-slate-950/20 backdrop-blur-md z-10 relative">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 max-w-7xl mx-auto px-4">
        <span className="font-bold text-slate-400">LEADCRAWLER PLATFORM</span>
        <span className="hidden sm:inline text-white/10">|</span>
        <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1.5">
          Crafted with ❤️ by 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-to font-bold tracking-wider hover:opacity-80 transition-opacity">
            TINI TEAM
          </span>
        </span>
      </div>
    </footer>
  );
}
