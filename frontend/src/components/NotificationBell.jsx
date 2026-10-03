import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../utils/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };
        fetchNotifications();
        // Option to add interval here for polling
    }, []);

    const handleRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            if (link) {
                window.location.href = link;
            }
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl bg-white shadow transition relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Bell size={16} className="text-primary-500" />
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <span className="text-xs font-black bg-primary-100 text-primary-700 px-3 py-1 rounded-full">{unreadCount} New</span>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm font-medium text-gray-500 flex flex-col items-center">
                                <Bell size={32} className="text-gray-200 mb-2" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleRead(n.id, n.link)}
                                    className={`p-5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-all ${!n.isRead ? 'bg-primary-50/40 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-3">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div 
                                        className="text-xs text-gray-500 leading-relaxed mt-1"
                                        dangerouslySetInnerHTML={{ __html: n.message }}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
