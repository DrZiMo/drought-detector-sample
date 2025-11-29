import React from 'react'
import { MapSection } from './MapSection'
import { GraphGrid } from './GraphGrid'
import { useGetData } from '@/lib/hooks/data.hooks'

export const Dashboard: React.FC = () => {
  const lat = '9.5612'
  const lon = '44.0669'
  const { data, isLoading, error } = useGetData(lat, lon)

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin'></div>
          <p className='text-slate-400 font-mono animate-pulse'>
            Initializing System...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <div className='bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center max-w-md'>
          <h3 className='text-red-400 font-bold mb-2'>System Error</h3>
          <p className='text-slate-400 mb-4'>{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors'
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30'>
      <header className='bg-slate-900 border-b border-slate-800 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-linear-to-br from-teal-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='w-5 h-5 text-white'
              >
                <path d='M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z' />
                <circle cx='12' cy='9' r='3' />
              </svg>
            </div>
            <h1 className='text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-teal-400 to-blue-400'>
              Drought Detection System
            </h1>
          </div>
          <nav className='flex gap-6 text-sm font-medium text-slate-400'>
            <a href='#' className='hover:text-teal-400 transition-colors'>
              Dashboard
            </a>
            <a href='#' className='hover:text-teal-400 transition-colors'>
              Analysis
            </a>
            <a href='#' className='hover:text-teal-400 transition-colors'>
              Reports
            </a>
            <a href='#' className='hover:text-teal-400 transition-colors'>
              Settings
            </a>
          </nav>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        <section>
          <h2 className='text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2'>
            <span className='w-1 h-8 bg-teal-500 rounded-full'></span>
            Geospatial Analysis
          </h2>
          <MapSection />
        </section>

        <section>
          <h2 className='text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2'>
            <span className='w-1 h-8 bg-blue-500 rounded-full'></span>
            Environmental Parameters
          </h2>
          <GraphGrid data={data} />
        </section>
      </main>

      <footer className='bg-slate-900 border-t border-slate-800 mt-12 py-8'>
        <div className='max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm'>
          &copy; 2025 Drought Detection System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
