import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    User,
    LogOut,
    Shield,
    BarChart,
    Layers,
    Activity,
    Menu,
    X,
    BookOpenCheck
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const Sidebar = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/login');
    };

    const adminLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/admin/dashboard" },
        { title: "User Management", icon: <Users />, link: "/admin/users" },
        { title: "Global Tasks", icon: <BookOpen />, link: "/admin/tasks" },
        { title: "Compare", icon: <Activity />, link: "/comparison" },
        { title: "User Manual", icon: <BookOpenCheck />, link: "/admin/guide" },
    ];

    const teacherLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/teacher/dashboard" },
        { title: "My Groups", icon: <Layers />, link: "/teacher/groups" },
        { title: "LSRW Tasks", icon: <BookOpen />, link: "/teacher/tasks" },
        { title: "Performance", icon: <BarChart />, link: "/teacher/performance" },
        { title: "Compare", icon: <Activity />, link: "/comparison" },
        { title: "User Manual", icon: <BookOpenCheck />, link: "/teacher/guide" },
    ];

    const studentLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/student/dashboard" },
        { title: "My Progress", icon: <BarChart />, link: "/student/history" },
        { title: "LSRW Modules", icon: <Layers />, link: "/student/dashboard" },
        { title: "Compare", icon: <Activity />, link: "/comparison" },
        { title: "User Manual", icon: <BookOpenCheck />, link: "/student/guide" },
    ];

    const links = ['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(role)
        ? adminLinks
        : role === 'TEACHER'
            ? teacherLinks
            : studentLinks;

    const roleLabel = ['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(role)
        ? 'Admin'
        : role === 'TEACHER'
            ? 'Faculty'
            : 'Student';

    return (
        <>
            {/* Sleek Dedicated Mobile App Header Bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-4 shadow-sm no-print">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-all active:scale-95 flex items-center justify-center shadow-xs"
                        aria-label="Open Navigation Menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div>
                        <div className="text-xl font-black gradient-text tracking-tighter leading-none">FluentPro</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                            {roleLabel} Portal
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <NotificationBell />
                    <Link
                        to="/profile"
                        className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center font-black text-xs hover:bg-primary-50 hover:text-primary-600 transition"
                        title="Profile"
                    >
                        <User size={16} />
                    </Link>
                </div>
            </header>

            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-all duration-300"
                />
            )}

            {/* Sliding Drawer / Desktop Sidebar */}
            <aside className={`w-72 sm:w-80 bg-white border-r border-gray-100 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-transform duration-300 ease-out shadow-2xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-3xl font-black gradient-text tracking-tighter">FluentPro</div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
                            aria-label="Close Sidebar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <Shield size={10} className="text-primary-500" />
                        <span>AI Powered Assessment • {roleLabel}</span>
                    </div>
                    <div className="mt-6 hidden lg:block">
                        <NotificationBell />
                    </div>
                </div>

                <nav className="flex-grow px-4 pb-6 space-y-1.5 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Navigation</div>
                    {links.map((item) => {
                        const isActive = location.pathname === item.link;
                        return (
                            <Link
                                key={item.title}
                                to={item.link}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center space-x-3.5 px-5 py-3.5 rounded-2xl font-bold transition-all duration-200 text-sm ${isActive
                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                                    : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'
                                    }`}
                            >
                                {React.cloneElement(item.icon, { size: 18 })}
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 sm:p-6 border-t border-gray-50 space-y-2">
                    <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3.5 px-5 py-3.5 rounded-2xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors text-sm"
                    >
                        <User size={18} />
                        <span>Profile Settings</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3.5 px-5 py-3.5 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
