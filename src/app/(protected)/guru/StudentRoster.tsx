'use client'

import { useState, useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { logProgress } from '@/app/actions/progress'

type ProgressType = 'iqro' | 'juz30' | 'juz29'

export type StudentWithProgress = {
  id: string
  name: string
  isInactive: boolean
  hasAssessment: boolean
  latestProgress: {
    type: ProgressType
    iqro_level: number | null
    iqro_page: number | null
    juz_page: number | null
    log_date: string | null
  } | null
}

type Filter = 'semua' | 'iqro' | 'quran' | 'tidak_aktif' | 'evaluasi'

const JUZ_RANGE: Record<string, { min: number; max: number; label: string }> = {
  juz30: { min: 582, max: 604, label: 'Juz 30' },
  juz29: { min: 562, max: 582, label: 'Juz 29' },
}

function progressLabel(p: StudentWithProgress['latestProgress']): string {
  if (!p) return 'Belum ada catatan'
  if (p.type === 'iqro') return `Iqro ${p.iqro_level} · Hal. ${p.iqro_page}`
  const juz = JUZ_RANGE[p.type]
  return juz ? `${juz.label} · Hal. ${p.juz_page}` : '—'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

export default function StudentRoster({
  students,
  isReadonly = false,
  isAdmin = false,
}: {
  students: StudentWithProgress[]
  isReadonly?: boolean
  isAdmin?: boolean
}) {
  const [filter, setFilter] = useState<Filter>('semua')
  const [selected, setSelected] = useState<StudentWithProgress | null>(null)
  const [trackType, setTrackType] = useState<ProgressType>('iqro')
  const [murajaah, setMurajaah] = useState(false)
  const [murajaahOutcome, setMurajaahOutcome] = useState<'lanjut' | 'ulang'>('lanjut')
  const [state, formAction, isPending] = useActionState(logProgress, null)
  const prevIsPendingRef = useRef(false)

  useEffect(() => {
    const wasPending = prevIsPendingRef.current
    prevIsPendingRef.current = isPending
    if (wasPending && !isPending && state === null) {
      setSelected(null)
    }
  }, [isPending, state])

  useEffect(() => {
    if (selected) {
      setTrackType(selected.latestProgress?.type ?? 'iqro')
      setMurajaah(false)
      setMurajaahOutcome('lanjut')
    }
  }, [selected])

  const inactiveCount = students.filter((s) => s.isInactive).length
  const assessmentCount = students.filter((s) => s.hasAssessment).length
  const iqroCount = students.filter((s) => s.latestProgress?.type === 'iqro').length
  const quranCount = students.filter(
    (s) => s.latestProgress?.type === 'juz30' || s.latestProgress?.type === 'juz29'
  ).length

  const filtered = students.filter((s) => {
    if (filter === 'tidak_aktif') return s.isInactive
    if (filter === 'evaluasi') return s.hasAssessment
    if (filter === 'iqro') return s.latestProgress?.type === 'iqro'
    if (filter === 'quran') return s.latestProgress?.type === 'juz30' || s.latestProgress?.type === 'juz29'
    return true
  })

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center">
        <p className="text-stone-400 text-sm">Belum ada siswa terdaftar di kelas ini.</p>
      </div>
    )
  }

  const juzRange = trackType !== 'iqro' ? JUZ_RANGE[trackType] : null
  const defaultJuzPage =
    selected?.latestProgress?.type === trackType
      ? (selected.latestProgress.juz_page ?? juzRange?.min ?? 582)
      : (juzRange?.min ?? 582)

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5">
        {(
          [
            { key: 'semua', label: 'Semua', count: students.length },
            { key: 'iqro', label: 'Iqro', count: iqroCount },
            { key: 'quran', label: 'Al-Quran', count: quranCount },
            { key: 'tidak_aktif', label: 'Tidak Aktif', count: inactiveCount },
            { key: 'evaluasi', label: 'Perlu Evaluasi', count: assessmentCount },
          ] as { key: Filter; label: string; count: number }[]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === key
                ? 'bg-green-700 text-white'
                : 'bg-white border border-stone-200 text-stone-500'
            }`}
          >
            {label}
            <span className={`ml-1.5 ${filter === key ? 'opacity-70' : 'text-stone-400'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
          <p className="text-stone-400 text-sm">Tidak ada siswa untuk filter ini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => {
            const info = (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-900 text-sm truncate">{student.name}</p>
                  {student.hasAssessment && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-amber-400" title="Pernah dievaluasi murajaah" />
                  )}
                  {student.isInactive && (
                    <span className="shrink-0 text-xs bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded font-medium">
                      Tidak aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-xs ${student.latestProgress ? 'text-stone-400' : 'text-stone-300'}`}>
                    {progressLabel(student.latestProgress)}
                  </p>
                  {student.latestProgress?.log_date && (
                    <p className="text-xs text-stone-300">
                      · {formatDate(student.latestProgress.log_date)}
                    </p>
                  )}
                </div>
              </div>
            )

            const chevron = (
              <svg className="w-4 h-4 text-stone-300 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )

            if (isAdmin) {
              return (
                <a
                  key={student.id}
                  href={`/siswa?student_id=${student.id}`}
                  className="w-full bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between active:bg-stone-50 transition-colors min-h-[60px]"
                >
                  {info}
                  {chevron}
                </a>
              )
            }

            return (
              <button
                key={student.id}
                onClick={() => !isReadonly && setSelected(student)}
                className={`w-full bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between transition-colors min-h-[60px] text-left ${
                  isReadonly ? 'cursor-default' : 'active:bg-stone-50 cursor-pointer'
                }`}
              >
                {info}
                {!isReadonly && chevron}
              </button>
            )
          })}
        </div>
      )}

      {/* Backdrop */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => !isPending && setSelected(null)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-30 bg-white rounded-t-3xl px-4 pt-5 pb-10 max-w-lg mx-auto transition-transform duration-300 overflow-y-auto max-h-[90vh] ${
          selected ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {selected && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-stone-400 font-medium">Catat Progres</p>
                <h3 className="font-bold text-stone-900 text-base">{selected.name}</h3>
              </div>
              <button
                onClick={() => !isPending && setSelected(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-600 cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Track toggle */}
            <div className="flex rounded-xl bg-stone-100 p-1 mb-4">
              {(['iqro', 'juz30', 'juz29'] as ProgressType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTrackType(t); setMurajaah(false) }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    trackType === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  {t === 'iqro' ? 'Iqro' : t === 'juz30' ? 'Juz 30' : 'Juz 29'}
                </button>
              ))}
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="student_id" value={selected.id} />
              <input type="hidden" name="type" value={trackType} />
              <input type="hidden" name="murajaah" value={murajaah ? 'true' : 'false'} />

              {trackType === 'iqro' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">
                      Level Iqro
                    </label>
                    <select
                      name="iqro_level"
                      defaultValue={selected.latestProgress?.iqro_level ?? 1}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 min-h-[44px] cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6].map((l) => (
                        <option key={l} value={l}>Iqro {l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">
                      Halaman
                    </label>
                    <input
                      name="iqro_page"
                      type="number"
                      min={1}
                      max={64}
                      defaultValue={selected.latestProgress?.iqro_page ?? 1}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {(trackType === 'juz30' || trackType === 'juz29') && juzRange && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">
                      Halaman {juzRange.label} ({juzRange.min}–{juzRange.max})
                    </label>
                    <input
                      name="juz_page"
                      type="number"
                      min={juzRange.min}
                      max={juzRange.max}
                      defaultValue={defaultJuzPage}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 min-h-[44px]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-stone-100">
                    <div>
                      <p className="text-sm font-medium text-stone-700">Tandai untuk Murajaah</p>
                      <p className="text-xs text-stone-400">Evaluasi bacaan siswa</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMurajaah((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        murajaah ? 'bg-amber-500' : 'bg-stone-200'
                      }`}
                      aria-label="Toggle murajaah"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          murajaah ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {murajaah && (
                    <div className="space-y-3 bg-amber-50 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        Hasil Murajaah
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMurajaahOutcome('lanjut')}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                            murajaahOutcome === 'lanjut'
                              ? 'bg-green-700 text-white border-green-700'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          Lanjut
                        </button>
                        <button
                          type="button"
                          onClick={() => setMurajaahOutcome('ulang')}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                            murajaahOutcome === 'ulang'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          Ulang
                        </button>
                      </div>
                      <input type="hidden" name="murajaah_outcome" value={murajaahOutcome} />
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1.5">
                          Catatan Murajaah{murajaahOutcome === 'ulang' ? ' *' : ' (opsional)'}
                        </label>
                        <textarea
                          name="murajaah_reason"
                          placeholder={
                            murajaahOutcome === 'ulang'
                              ? 'Mis: Halaman 585–588 belum lancar...'
                              : 'Mis: Bacaan sudah lancar, lanjut ke halaman berikutnya...'
                          }
                          rows={2}
                          required={murajaahOutcome === 'ulang'}
                          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">
                  Catatan untuk orang tua (opsional)
                </label>
                <textarea
                  name="notes"
                  placeholder="Mis: Bacaan sudah lancar, perlu latihan tajwid..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 resize-none"
                />
              </div>

              {state && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{state}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-green-700 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </form>

            <a
              href={`/api/export/pdf?student_id=${selected.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-2 border border-stone-200 text-stone-500 font-medium py-2.5 rounded-2xl text-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ekspor Laporan PDF
            </a>
          </>
        )}
      </div>
    </>
  )
}
