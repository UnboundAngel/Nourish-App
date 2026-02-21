import React from 'react';
import { Bell, Calendar as CalendarIcon, X, Coffee, Droplet, Award, Info, CheckCheck } from 'lucide-react';

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

export function Header({
  theme, userName, greetingTime,
  setIsCalendarOpen,
  isNotificationsOpen, setIsNotificationsOpen,
  handleMarkAllAsRead, notifications, handleNotificationClick,
  unreadCount,
}) {
  return (
    <header className={`sticky top-0 z-20 backdrop-blur-xl shadow-sm px-4 md:px-8 py-3 md:py-4 flex items-center justify-between theme-transition`}>
        <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
                <h2 className={`text-base md:text-xl font-black ${theme.textMain} theme-transition leading-tight truncate`}>
                    {greetingTime}, <span className={theme.primaryText}>{userName || 'Friend'}</span>
                </h2>
                <p className="text-[9px] md:text-[10px] font-black opacity-30 uppercase tracking-[0.15em] md:tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button onClick={() => setIsCalendarOpen(true)} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl ${theme.inputBg} ${theme.textMain} text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all theme-transition`}>
                <CalendarIcon size={14} /> View History
            </button>
            
            {/* Notifications Bell */}
            <div className="relative">
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`p-2.5 rounded-xl ${theme.inputBg} relative hover:scale-105 active:scale-95 transition-all`}>
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                </button>
                {isNotificationsOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-80 ${theme.card} rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 theme-transition overflow-hidden`}>
                        {/* Header */}
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

                        {/* List */}
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
                                          <span className={`text-[10px] font-bold opacity-30 mt-0.5 block`}>{timeAgo(n.timestamp)}</span>
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
    </header>
  );
}
