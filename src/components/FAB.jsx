import React from 'react';
import { Droplet, Coffee, Plus, X } from 'lucide-react';

export function FAB({
  theme, isFabMenuOpen, setIsFabMenuOpen,
  handleAddWater, openNewEntryModal,
}) {
  return (
    <>
      {/* Desktop FAB — hidden on mobile (bottom nav handles it) */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 flex-col items-center gap-4">
        
        {/* Speed Dial */}
        <div className={`flex flex-col items-center gap-3 transition-all duration-300 ${isFabMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
            <div className="flex items-center gap-3 group">
                <span className="px-3 py-1 rounded-lg bg-black/80 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">Quick Water (+8oz)</span>
                <button 
                    onClick={() => { handleAddWater(8); setIsFabMenuOpen(false); }}
                    className="w-12 h-12 rounded-2xl bg-blue-500 text-white shadow-xl hover:scale-110 active:scale-90 transition-all flex items-center justify-center"
                >
                    <Droplet size={20} />
                </button>
            </div>
            <div className="flex items-center gap-3 group">
                <span className="px-3 py-1 rounded-lg bg-black/80 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">Log New Meal</span>
                <button 
                    onClick={() => { openNewEntryModal(); setIsFabMenuOpen(false); }}
                    className={`w-12 h-12 rounded-2xl ${theme.secondary} text-white shadow-xl hover:scale-110 active:scale-90 transition-all flex items-center justify-center`}
                >
                    <Coffee size={20} />
                </button>
            </div>
        </div>

        {/* Main Toggle */}
        <button 
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
          className="relative group w-16 h-16 transition-all duration-500 active:scale-90 hover:scale-105"
        >
          <div className={`relative w-full h-full ${theme.primary} rounded-[2rem] shadow-xl flex items-center justify-center overflow-hidden border border-white/20`}>
            <Plus size={28} strokeWidth={2.5} className={`text-white transition-transform duration-500 ${isFabMenuOpen ? 'rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Action Sheet — slides up from bottom nav */}
      {isFabMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFabMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 animate-in slide-in-from-bottom duration-300">
            <div className={`${theme.card} rounded-3xl shadow-2xl p-4 space-y-2`}>
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.textMain}`}>Quick Actions</h3>
                <button onClick={() => setIsFabMenuOpen(false)} className="p-1 opacity-40 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
              <button 
                onClick={() => { openNewEntryModal(); setIsFabMenuOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl ${theme.primary} text-white active:scale-[0.98] transition-all shadow-lg`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coffee size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Log a Meal</p>
                  <p className="text-[10px] opacity-70">Track what you're eating</p>
                </div>
              </button>
              <button 
                onClick={() => { handleAddWater(8); setIsFabMenuOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl ${theme.inputBg} ${theme.textMain} active:scale-[0.98] transition-all`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center">
                  <Droplet size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Quick Water</p>
                  <p className="text-[10px] opacity-50">Add 8oz of water</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
