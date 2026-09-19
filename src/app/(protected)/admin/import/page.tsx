import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CsvImportForm from './CsvImportForm'

export default async function ImportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('label')
    .eq('is_active', true)
    .single()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4 max-w-lg mx-auto">
          <a
            href="/admin"
            className="text-stone-400 hover:text-stone-600 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Admin</p>
            <h1 className="text-base font-bold text-stone-900">Import CSV Siswa</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {activeYear ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-800">
            Tahun ajaran aktif: <span className="font-semibold">{activeYear.label}</span>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
            Tidak ada tahun ajaran aktif. Buat tahun ajaran terlebih dahulu.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-2">
          <p className="text-sm font-semibold text-stone-800">Format CSV</p>
          <p className="text-xs text-stone-500">
            File CSV harus memiliki kolom berikut (baris pertama sebagai header):
          </p>
          <div className="bg-stone-50 rounded-xl px-3 py-2.5 font-mono text-xs text-stone-600 overflow-x-auto">
            nama_siswa, kelas, email_akun, iqro_level, iqro_halaman, track
          </div>
          <p className="text-xs text-stone-400">
            Nilai <code className="bg-stone-100 px-1 rounded">track</code>: <code className="bg-stone-100 px-1 rounded">iqro</code> atau <code className="bg-stone-100 px-1 rounded">quran</code>.
            Kolom <code className="bg-stone-100 px-1 rounded">iqro_level</code> dan <code className="bg-stone-100 px-1 rounded">iqro_halaman</code> wajib diisi jika track adalah iqro.
          </p>
          <p className="text-xs text-stone-400">
            Akun email harus sudah dibuat di Supabase Auth sebelum import.
            Kelas harus sudah ada di tahun ajaran aktif.
          </p>
        </div>

        {activeYear && <CsvImportForm />}
      </main>
    </div>
  )
}
