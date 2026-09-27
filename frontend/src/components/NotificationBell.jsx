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
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex justify-between">
                        Notifications
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{unreadCount}</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleRead(n.id, n.link)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
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
