'use client';

import { useState } from 'react';
import { logout } from '@/app/actions/auth';

type ProgressLog = {
  id: string;
  log_date: string;
  type: 'iqro' | 'juz30' | 'juz29';
  iqro_level: number | null;
  iqro_page: number | null;
  juz_page: number | null;
  notes: string | null;
  is_opening_position: boolean;
};

type Assessment = {
  id: string;
  juz_type: 'juz30' | 'juz29';
  juz_page: number;
  outcome: 'lanjut' | 'ulang';
  reason: string;
  assessed_at: string;
};

type Props = {
  studentName: string;
  className?: string | null;
  teacherName?: string | null;
  progressLogs: ProgressLog[];
  assessments: Assessment[];
};

function formatPosition(log: ProgressLog): string {
  if (log.type === 'iqro') return `Iqro ${log.iqro_level} — Halaman ${log.iqro_page}`;
  if (log.type === 'juz30') return `Juz 30 — Halaman ${log.juz_page}`;
  return `Juz 29 — Halaman ${log.juz_page}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysSince(dateStr: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return `${diffDays} hari lalu`;
}

function getWeeklyActiveDays(logs: ProgressLog[]): number {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dates = new Set(
    logs
      .filter((l) => !l.is_opening_position && new Date(l.log_date) >= cutoff)
      .map((l) => l.log_date)
  );
  return dates.size;
}

export default function SiswaView({
  studentName,
  className,
  teacherName,
  progressLogs,
  assessments,
}: Props) {
  const [view, setView] = useState<'siswa' | 'ortu'>('siswa');

  const realLogs = progressLogs.filter((l) => !l.is_opening_position);
  const latestLog = realLogs[0] ?? null;
  const weeklyDays = getWeeklyActiveDays(progressLogs);
  const totalSessions = realLogs.length;

  return (
    <div style={{ background: '#052e16', minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
          style={{ background: '#041c0e', borderBottom: '1px solid #065f46' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #854d0e, #fbbf24)', color: '#041c0e' }}
            >
              ق
            </div>
            <span className="text-sm font-semibold" style={{ color: '#fef9c3' }}>
              Al Bayyinah
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#14532d', color: '#fbbf24', border: '1.5px solid #fbbf24' }}
              title="Keluar"
            >
              {studentName.charAt(0).toUpperCase()}
            </button>
          </form>
        </header>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Greeting */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#6ee7b7' }}>
              Assalamu&apos;alaikum
            </p>
            <h1 className="text-xl font-bold" style={{ color: '#fef9c3' }}>
              {studentName}
            </h1>
            {(className || teacherName) && (
              <p className="text-xs mt-0.5" style={{ color: '#6ee7b7' }}>
                {className}
                {teacherName ? ` · ${teacherName}` : ''}
              </p>
            )}
          </div>

          {/* View toggle */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: '#041c0e', border: '1px solid #065f46' }}
          >
            {(['siswa', 'ortu'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: view === v ? '#fbbf24' : 'transparent',
                  color: view === v ? '#041c0e' : '#6ee7b7',
                }}
              >
                {v === 'siswa' ? 'Tampilan Siswa' : 'Tampilan Orang Tua'}
              </button>
            ))}
          </div>

          {/* Current position card */}
          {latestLog ? (
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #854d0e, #ca8a04, #fbbf24)' }}
            >
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none"
                style={{ opacity: 0.12, color: '#fff', fontSize: 80 }}
                aria-hidden
              >
                ۞
              </span>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Posisi Saat Ini
              </p>
              <p className="text-3xl font-bold mb-0.5" style={{ color: '#fff' }}>
                {latestLog.type === 'iqro'
                  ? `Iqro ${latestLog.iqro_level}`
                  : latestLog.type === 'juz30'
                    ? 'Juz 30'
                    : 'Juz 29'}
              </p>
              <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Halaman {latestLog.type === 'iqro' ? latestLog.iqro_page : latestLog.juz_page}
              </p>
              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Diperbarui {formatDate(latestLog.log_date)}
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 flex items-center justify-center"
              style={{ background: '#064e3b', border: '1px solid #065f46', minHeight: 120 }}
            >
              <p className="text-sm text-center" style={{ color: '#6ee7b7' }}>
                Belum ada data progres yang tercatat
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: String(totalSessions), label: 'Total Sesi' },
              { value: String(weeklyDays), label: 'Aktif Minggu Ini' },
              {
                value: latestLog ? daysSince(latestLog.log_date) : '—',
                label: 'Sesi Terakhir',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-3 flex flex-col items-center text-center"
                style={{ background: '#064e3b', border: '1px solid #065f46' }}
              >
                <span className="text-lg font-bold leading-tight" style={{ color: '#fbbf24' }}>
                  {s.value}
                </span>
                <span className="text-xs leading-tight mt-1" style={{ color: '#6ee7b7' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Recent sessions */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#fef9c3' }}>
              Riwayat Sesi
            </h2>
            {realLogs.length === 0 ? (
              <p className="text-sm" style={{ color: '#6ee7b7' }}>
                Belum ada sesi yang tercatat.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {realLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: '#064e3b', border: '1px solid #065f46' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: '#fef9c3' }}>
                        {formatPosition(log)}
                      </span>
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: '#6ee7b7' }}
                      >
                        {formatDate(log.log_date)}
                      </span>
                    </div>
                    {view === 'ortu' && log.notes && (
                      <p
                        className="text-xs mt-2 leading-relaxed"
                        style={{ color: '#a7f3d0' }}
                      >
                        Catatan: {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment history — parent view only */}
          {view === 'ortu' && assessments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#fef9c3' }}>
                Riwayat Evaluasi
              </h2>
              <div className="flex flex-col gap-2">
                {assessments.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: '#064e3b', border: '1px solid #065f46' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#fef9c3' }}>
                        {a.juz_type === 'juz30' ? 'Juz 30' : 'Juz 29'} — Hal. {a.juz_page}
                      </span>
                      <span
                        className="text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0"
                        style={
                          a.outcome === 'lanjut'
                            ? { background: '#14532d', color: '#34d399' }
                            : { background: '#854d0e', color: '#fbbf24' }
                        }
                      >
                        {a.outcome === 'lanjut' ? 'Lanjut ✓' : 'Ulang'}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#6ee7b7' }}>
                      {new Date(a.assessed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {a.outcome === 'ulang' && a.reason ? ` · ${a.reason}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom safe-area padding */}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
