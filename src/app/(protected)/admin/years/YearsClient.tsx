'use client'

import { useActionState } from 'react'
import { createYear, activateYear, rolloverEnrollments, type RolloverResult } from '@/app/actions/years'

type Year = {
  id: string
  label: string
  is_active: boolean
  created_at: string
}

export default function YearsClient({ years }: { years: Year[] }) {
  const [createError, createAction, isCreating] = useActionState<string | null, FormData>(createYear, null)
  const [activateError, activateAction, isActivating] = useActionState<string | null, FormData>(activateYear, null)
  const [rollover, rolloverAction, isRolling] = useActionState<RolloverResult | null, FormData>(rolloverEnrollments, null)

  const activeYear = years.find(y => y.is_active)
  const inactiveYears = years.filter(y => !y.is_active)

  return (
    <div className="space-y-4">

      {/* Year list */}
      {years.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-800">Daftar Tahun Ajaran</p>
          </div>
          <div className="divide-y divide-stone-100">
            {years.map(year => (
              <div key={year.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{year.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {year.is_active ? (
                      <span className="text-green-700 font-medium">Aktif</span>
                    ) : 'Tidak aktif'}
                  </p>
                </div>
                {!year.is_active && (
                  <form action={activateAction}>
                    <input type="hidden" name="year_id" value={year.id} />
                    <button
                      type="submit"
                      disabled={isActivating}
                      className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors min-h-[36px] disabled:opacity-40"
                    >
                      Aktifkan
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activateError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {activateError}
        </p>
      )}

      {/* Create new year */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
        <p className="text-sm font-semibold text-stone-800">Buat Tahun Ajaran Baru</p>
        <form action={createAction} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-stone-500 block mb-1.5">
              Label (contoh: 2026/2027)
            </span>
            <input
              type="text"
              name="label"
              placeholder="2026/2027"
              pattern="\d{4}/\d{4}"
              required
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </label>
          {createError && (
            <p className="text-xs text-red-600">{createError}</p>
          )}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-40 min-h-[44px]"
          >
            {isCreating ? 'Menyimpan...' : 'Buat Tahun Ajaran'}
          </button>
        </form>
      </div>

      {/* Rollover */}
      {years.length >= 2 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-stone-800">Rollover Siswa</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Salin kelas dan daftar siswa dari satu tahun ke tahun lainnya.
            </p>
          </div>
          <form action={rolloverAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-stone-500 block mb-1.5">Dari tahun</span>
                <select
                  name="from_year_id"
                  required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Pilih…</option>
                  {years.map(y => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-stone-500 block mb-1.5">Ke tahun</span>
                <select
                  name="to_year_id"
                  required
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Pilih…</option>
                  {years.map(y => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {rollover && !rollover.ok && (
              <p className="text-xs text-red-600">{rollover.error}</p>
            )}
            {rollover?.ok && (
              <p className="text-xs text-green-700">
                Berhasil: {rollover.classes} kelas baru, {rollover.students} siswa dipindahkan.
              </p>
            )}
            <button
              type="submit"
              disabled={isRolling}
              className="w-full bg-green-700 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-40 min-h-[44px]"
            >
              {isRolling ? 'Memproses...' : 'Rollover Siswa'}
            </button>
          </form>
        </div>
      )}

      {years.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center">
          <p className="text-stone-500 text-sm">Belum ada tahun ajaran. Buat yang pertama di atas.</p>
        </div>
      )}
    </div>
  )
}
