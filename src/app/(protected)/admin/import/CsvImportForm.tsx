'use client'

import { useActionState, useRef, useState } from 'react'
import { previewCsvImport, commitCsvImport, type ImportPreview, type ImportResult } from '@/app/actions/import'

export default function CsvImportForm() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, previewAction, isPreviewing] = useActionState<ImportPreview | null, FormData>(
    previewCsvImport,
    null
  )
  const [result, commitAction, isCommitting] = useActionState<ImportResult | null, FormData>(
    commitCsvImport,
    null
  )
  const [fileName, setFileName] = useState<string | null>(null)

  const hasErrors = preview && preview.errorCount > 0
  const canCommit = preview && preview.validCount > 0 && !result

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
        <p className="text-sm font-semibold text-stone-800">Pratinjau CSV</p>

        <form action={previewAction} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-stone-500 block mb-1.5">Pilih File CSV</span>
            <div
              className="border-2 border-dashed border-stone-200 rounded-xl p-5 text-center cursor-pointer hover:border-green-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <svg className="w-8 h-8 text-stone-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-stone-500">
                {fileName ? (
                  <span className="text-green-700 font-medium">{fileName}</span>
                ) : (
                  'Ketuk untuk pilih file .csv'
                )}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              name="csv_file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isPreviewing || !fileName}
            className="w-full bg-stone-800 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-40 min-h-[44px] cursor-pointer"
          >
            {isPreviewing ? 'Membaca file…' : 'Pratinjau Data'}
          </button>
        </form>
      </div>

      {/* Preview results */}
      {preview && preview.rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-800">
              Hasil pratinjau: {preview.rows.length} baris
            </p>
            <div className="flex gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {preview.validCount} siap diimpor
              </span>
              {preview.errorCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {preview.errorCount} perlu diperbaiki
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {preview.rows.map((row) => (
              <div
                key={row.rowNum}
                className={`px-5 py-3 ${row.errors.length > 0 ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      <span className="text-stone-400 text-xs mr-1">#{row.rowNum}</span>
                      {row.nama_siswa || '(nama kosong)'}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {row.email_akun} · {row.kelas} · {row.track}
                      {row.track === 'iqro' && row.iqro_level
                        ? ` · Iqro ${row.iqro_level} Hal. ${row.iqro_halaman}`
                        : ''}
                    </p>
                  </div>
                  {row.errors.length === 0 ? (
                    <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Siap
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Perlu diperbaiki
                    </span>
                  )}
                </div>
                {row.errors.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {row.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600">
                        · {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commit section */}
      {canCommit && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
          {hasErrors && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
              {preview.errorCount} baris memiliki error dan akan dilewati. Hanya {preview.validCount} baris valid yang akan diimpor.
            </div>
          )}

          <form action={commitAction}>
            <p className="text-xs text-stone-500 mb-3">
              Hanya {preview.validCount} baris yang siap akan disimpan. Baris bertanda merah dilewati; perbaiki di file CSV lalu impor ulang.
            </p>
            <input
              type="hidden"
              name="preview_json"
              value={JSON.stringify(preview.rows.filter((r) => r.errors.length === 0))}
            />
            <CommitButton isCommitting={isCommitting} validCount={preview.validCount} />
          </form>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            result.ok
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {result.ok ? (
            <>
              <p className="font-semibold mb-1">Impor selesai</p>
              <p>{result.created} siswa baru dibuat, {result.matched} siswa sudah terdaftar dan diperbarui.</p>
            </>
          ) : (
            <>
              <p className="font-semibold mb-1">Impor belum berhasil</p>
              <p>{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CommitButton({ isCommitting, validCount }: { isCommitting: boolean; validCount: number }) {
  return (
    <button
      type="submit"
      disabled={isCommitting}
      className="w-full bg-green-700 text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-40 min-h-[44px] cursor-pointer"
    >
      {isCommitting ? 'Mengimpor…' : `Impor Sekarang (${validCount} siswa)`}
    </button>
  )
}
