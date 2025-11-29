import React from 'react'
import { Layers, Map as MapIcon, Crosshair, Activity, Wifi } from 'lucide-react'

export const MapSection: React.FC = () => {
  return (
    <div className='relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 group'>
      {/* HUD Grid Overlay */}
      <div
        className='absolute inset-0 pointer-events-none z-10 opacity-20'
        style={{
          backgroundImage:
            'linear-gradient(rgba(51, 65, 85, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 65, 85, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Top Bar */}
      <div className='absolute top-0 left-0 right-0 h-16 bg-linear-to-b from-slate-900/90 to-transparent z-20 pointer-events-none'></div>

      {/* Header Overlay */}
      <div className='absolute top-6 left-6 z-30 flex items-center gap-4'>
        <div className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 rounded-lg shadow-lg flex items-center gap-3'>
          <div className='bg-teal-500/20 p-2 rounded-md'>
            <MapIcon className='text-teal-400' size={20} />
          </div>
          <div>
            <h3 className='text-slate-100 font-bold text-sm tracking-wide'>
              GLOBAL MONITOR
            </h3>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
              <span className='text-xs text-slate-400 font-mono'>
                LIVE FEED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className='absolute top-6 right-6 z-30 flex flex-col gap-3'>
        <div className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-lg shadow-lg w-64'>
          <div className='flex items-center gap-2 text-slate-200 mb-3 font-semibold text-sm border-b border-slate-700/50 pb-2'>
            <Layers size={16} className='text-teal-400' />
            <span>DATA LAYERS</span>
          </div>
          <div className='space-y-3'>
            {[
              {
                name: 'Drought Severity',
                color: 'accent-red-500',
                checked: true,
              },
              {
                name: 'Soil Moisture',
                color: 'accent-blue-500',
                checked: false,
              },
              {
                name: 'Vegetation Index',
                color: 'accent-green-500',
                checked: false,
              },
            ].map((layer, i) => (
              <label
                key={i}
                className='flex items-center justify-between group/item cursor-pointer'
              >
                <span className='text-xs text-slate-400 group-hover/item:text-slate-200 transition-colors'>
                  {layer.name}
                </span>
                <input
                  type='checkbox'
                  defaultChecked={layer.checked}
                  className={`w-4 h-4 bg-slate-800 border-slate-600 rounded ${layer.color}`}
                />
              </label>
            ))}
          </div>
        </div>

        <div className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 rounded-lg shadow-lg'>
          <div className='flex justify-between items-center text-xs text-slate-400 font-mono mb-1'>
            <span>LAT</span>
            <span className='text-slate-200'>09.5612° N</span>
          </div>
          <div className='flex justify-between items-center text-xs text-slate-400 font-mono'>
            <span>LON</span>
            <span className='text-slate-200'>44.0669° E</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className='absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end pointer-events-none'>
        <div className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-full shadow-lg flex items-center gap-6 pointer-events-auto'>
          <div className='flex items-center gap-2'>
            <Activity size={14} className='text-blue-400' />
            <span className='text-xs text-slate-300 font-medium'>
              System Normal
            </span>
          </div>
          <div className='w-px h-4 bg-slate-700'></div>
          <div className='flex items-center gap-2'>
            <Wifi size={14} className='text-green-400' />
            <span className='text-xs text-slate-300 font-medium'>
              Connected
            </span>
          </div>
        </div>

        <div className='bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-2 rounded-lg shadow-lg pointer-events-auto hover:bg-slate-800 transition-colors cursor-pointer'>
          <Crosshair size={20} className='text-slate-400 hover:text-white' />
        </div>
      </div>

      {/* Map Iframe with improved styling */}
      <iframe
        width='100%'
        height='100%'
        frameBorder='0'
        scrolling='no'
        marginHeight={0}
        marginWidth={0}
        src='https://www.openstreetmap.org/export/embed.html?bbox=30.0,0.0,60.0,30.0&amp;layer=mapnik'
        style={{
          border: 0,
          filter:
            'grayscale(100%) invert(92%) contrast(85%) brightness(90%) hue-rotate(180deg)',
          opacity: 0.8,
        }}
        className='transition-opacity duration-500'
      ></iframe>

      {/* Vignette */}
      <div className='absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.7)]'></div>
    </div>
  )
}
