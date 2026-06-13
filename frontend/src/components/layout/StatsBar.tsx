import { Database, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatsBarProps {
  stats: { total: number; success: number; failed: number };
  selectedCount: number;
}

export default function StatsBar({ stats, selectedCount }: StatsBarProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 mt-[120px] sm:mt-[140px] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">

      <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-primary/10 rounded-xl text-primary border border-primary/15 shrink-0">
          <Database className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Tổng số lead cào</p>
          <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">{stats.total}</p>
        </div>
      </div>

      <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-primary-to/10 rounded-xl text-primary-to border border-primary-to/15 shrink-0">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Đang chọn gửi</p>
          <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">{selectedCount}</p>
        </div>
      </div>

      <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/15 shrink-0">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Đã gửi thành công</p>
          <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">
            {stats.success}
          </p>
        </div>
      </div>

      <div className="glass-panel p-3 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/15 shrink-0">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans truncate">Gửi thất bại</p>
          <p className="text-lg sm:text-2xl font-mono font-bold text-white mt-0.5">
            {stats.failed}
          </p>
        </div>
      </div>

    </section>
  );
}
