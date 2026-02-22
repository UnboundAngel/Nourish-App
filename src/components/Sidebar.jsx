import React from 'react';
import { 
  Leaf, ChevronLeft, Calendar as CalendarIcon, Flame, Check, Settings, Bell, X,
  Coffee, Droplet, Award, Info, CheckCheck, BarChart3
} from 'lucide-react';
import { NourishGarden, GardenBadge } from './NourishGarden';

const NOTIF_ICONS = {
  meal: Coffee,
  hydration: Droplet,
  milestone: Award,
  reminder: Bell,
  system: Info,
  info: Info,
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Sidebar({
  theme, isSidebarCollapsed, setIsSidebarCollapsed,
  setViewDate, setIsHistoryOpen, setIsCalendarOpen, setIsSettingsOpen,
  setIsTrendsOpen,
  dailyStreak, getEntriesForDate,
  isNotificationsOpen, setIsNotificationsOpen,
  handleMarkAllAsRead, notifications, handleNotificationClick,
  unreadCount,
}) {
  return (
    <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-[72px]' : 'w-72'} min-h-screen ${theme.sidebar} ${isSidebarCollapsed ? 'px-3 py-4' : 'p-6'} border-r ${theme.border} theme-transition shadow-xl relative backdrop-blur-md z-30`}>
      
      {/* Logo and Title */}
      <div className={`${isSidebarCollapsed ? 'mb-6 flex-col items-center gap-2' : 'mb-10 items-center justify-between'} ${theme.primaryText} theme-transition flex`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className={`p-2 rounded-2xl ${theme.primary} text-white shadow-md`}>
                  <Leaf size={isSidebarCollapsed ? 20 : 24} />
              </div>
              {!isSidebarCollapsed && <h1 className="text-2xl font-black tracking-tight whitespace-nowrap">Nourish</h1>}
          </div>
          <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`${isSidebarCollapsed ? 'w-full flex justify-center mt-2' : ''} p-1.5 rounded-full ${theme.inputBg} ${theme.textMain} hover:bg-black/10 transition-all duration-300 clickable`}
          >
              <ChevronLeft size={16} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
      </div>
      
      {/* Navigation/Actions */}
      <nav className="flex-grow space-y-6">
          <div>
              <p className={`text-[10px] font-black ${theme.accent} uppercase tracking-[0.2em] mb-4 opacity-50 ${isSidebarCollapsed ? 'hidden' : ''}`}>Overview</p>
              <div className="space-y-1">
                  {[0, 1, 2].map((offset) => {
                      const d = new Date();
                      d.setDate(d.getDate() - offset);
                      const isToday = offset === 0;
                      return (
                          <button
                              key={offset}
                              onClick={() => {
                                  if (!isToday) {
                                      setViewDate(d);
                                      setIsHistoryOpen(true);
                                  }
                              }}
                              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} py-3 px-4 rounded-2xl transition-all group ${
                                  isToday 
                                  ? `${theme.primary} text-white shadow-md` 
                                  : `hover:bg-black/5 hover:scale-[1.02] active:scale-[0.98] ${theme.textMain} opacity-80`
                              } theme-transition clickable`}
                          >
                              {isSidebarCollapsed ? (
                                  <div className="relative">
                                      <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-current'}`}>{d.getDate()}</span>
                                      {isToday && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-white"></div>}
                                  </div>
                              ) : (
                                  <>
                                      <div className="flex items-center gap-3">
                                          <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-current opacity-20'}`}></div>
                                          <span className="text-sm font-bold">
                                              {isToday ? "Today" : d.toLocaleDateString('en-US', { weekday: 'long' })}
                                          </span>
                                      </div>
                                      <span className={`text-xs font-black ${isToday ? 'opacity-60' : 'opacity-30'}`}>{d.getDate()}</span>
                                  </>
                              )}
                          </button>
                      );
                  })}
              </div>
          </div>
  
          <div>
              <p className={`text-[10px] font-black ${theme.accent} uppercase tracking-[0.2em] mb-4 opacity-50 ${isSidebarCollapsed ? 'hidden' : ''}`}>Insights</p>
              <div className={`space-y-2 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                  <button 
                      onClick={() => setIsCalendarOpen(true)}
                      className={`w-full ${isSidebarCollapsed ? 'py-2.5' : 'py-4'} rounded-2xl flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4 px-4'} ${theme.card} ${theme.textMain} hover:scale-[1.02] active:scale-[0.98] transition-all theme-transition clickable shadow-sm`}
                  >
                      <div className={`${isSidebarCollapsed ? 'p-1.5' : 'p-2'} rounded-xl ${theme.inputBg}`}>
                          <CalendarIcon size={isSidebarCollapsed ? 16 : 18} className="opacity-70" />
                      </div>
                      {!isSidebarCollapsed && <span className="text-sm font-bold">Calendar</span>}
                  </button>
                  
                  <button 
                      onClick={() => setIsTrendsOpen(true)}
                      className={`w-full ${isSidebarCollapsed ? 'py-2.5' : 'py-4'} rounded-2xl flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4 px-4'} ${theme.card} ${theme.textMain} hover:scale-[1.02] active:scale-[0.98] transition-all theme-transition clickable shadow-sm`}
                  >
                      <div className={`${isSidebarCollapsed ? 'p-1.5' : 'p-2'} rounded-xl ${theme.inputBg}`}>
                          <BarChart3 size={isSidebarCollapsed ? 16 : 18} className="opacity-70" />
                      </div>
                      {!isSidebarCollapsed && <span className="text-sm font-bold">Trends</span>}
                  </button>

                  {isSidebarCollapsed ? (
                      <div className={`w-full p-2 rounded-2xl ${theme.card} theme-transition shadow-sm flex items-center justify-center`}>
                          <GardenBadge dailyStreak={dailyStreak} size="sm" />
                      </div>
                  ) : (
                      <NourishGarden 
                          theme={theme} 
                          dailyStreak={dailyStreak} 
                          getEntriesForDate={getEntriesForDate} 
                      />
                  )}
              </div>
          </div>
      </nav>
  
      {/* Settings and Notifications (Bottom) */}
      <div className={`pt-4 border-t border-black/5 space-y-1 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button onClick={() => setIsSettingsOpen(true)} className={`w-full flex ${isSidebarCollapsed ? 'justify-center py-2.5' : 'items-center gap-4 px-4 py-3'} rounded-2xl hover:bg-black/5 hover:scale-[1.02] active:scale-[0.98] transition-colors ${theme.textMain} theme-transition clickable group`}>
              <Settings size={isSidebarCollapsed ? 18 : 20} className='opacity-40 group-hover:opacity-100 transition-opacity'/>
              {!isSidebarCollapsed && <span className="font-bold text-sm">Settings</span>}
          </button>
          <div className="relative w-full">
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`w-full flex ${isSidebarCollapsed ? 'justify-center py-2.5' : 'items-center justify-between px-4 py-3'} rounded-2xl hover:bg-black/5 hover:scale-[1.02] active:scale-[0.98] transition-colors ${theme.textMain} theme-transition clickable group relative`}>
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
                      <div className="relative">
                          <Bell size={isSidebarCollapsed ? 18 : 20} className='opacity-40 group-hover:opacity-100 transition-opacity' />
                          {unreadCount > 0 && isSidebarCollapsed && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                          )}
                      </div>
                      {!isSidebarCollapsed && <span className="font-bold text-sm">Inbox</span>}
                  </div>
                  {unreadCount > 0 && !isSidebarCollapsed && (
                      <span className="min-w-[20px] h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full px-1">
                          {unreadCount}
                      </span>
                  )}
              </button>
              {isNotificationsOpen && (
                  <div className={`absolute left-full ml-4 bottom-0 w-80 ${theme.card} rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 theme-transition overflow-hidden`}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                          <h4 className={`text-xs font-black ${theme.textMain} uppercase tracking-widest`}>Notifications</h4>
                          {unreadCount > 0 && (
                              <button 
                                  onClick={handleMarkAllAsRead}
                                  className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 active:scale-95 transition-all"
                              >
                                  <CheckCheck size={12} /> Mark all read
                              </button>
                          )}
                      </div>
                      {notifications.length === 0 ? (
                          <div className="text-center py-8 px-4">
                              <Bell size={24} className="mx-auto mb-2 opacity-20" />
                              <p className={`text-sm font-bold opacity-40 ${theme.textMain}`}>All caught up!</p>
                          </div>
                      ) : (
                          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-black/5">
                              {notifications.map(n => {
                                  const Icon = NOTIF_ICONS[n.type] || Info;
                                  return (
                                      <div 
                                          key={n.id} 
                                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                              !n.isRead ? `${theme.inputBg}` : 'hover:bg-black/[0.02]'
                                          }`}
                                      >
                                          <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-blue-100 text-blue-500' : 'bg-black/5 opacity-40'}`}>
                                              <Icon size={14} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-medium leading-snug ${!n.isRead ? theme.textMain : `${theme.textMain} opacity-50`}`}>{n.text}</p>
                                              <span className="text-[10px] font-bold opacity-30 mt-0.5 block">{timeAgo(n.timestamp)}</span>
                                          </div>
                                          <button 
                                              onClick={() => handleNotificationClick(n.id)}
                                              className="p-1 opacity-30 hover:opacity-100 flex-shrink-0 active:scale-90 transition-all"
                                          >
                                              <X size={14} />
                                          </button>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </aside>
  );
}

