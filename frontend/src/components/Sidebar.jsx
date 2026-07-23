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
    Upload,
    Menu,
    X
} from 'lucide-react';

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
    ];

    const teacherLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/teacher/dashboard" },
        { title: "My Groups", icon: <Layers />, link: "/teacher/groups" },
        { title: "LSRW Tasks", icon: <BookOpen />, link: "/teacher/tasks" },
        { title: "Performance", icon: <BarChart />, link: "/teacher/performance" },
    ];

    const studentLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/student/dashboard" },
        { title: "My Progress", icon: <BarChart />, link: "/student/history" },
        { title: "LSRW Modules", icon: <Layers />, link: "/student/dashboard" },
    ];

    const links = ['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(role)
        ? adminLinks
        : role === 'TEACHER'
            ? teacherLinks
            : studentLinks;

    return (
        <>
            {/* Mobile floating toggle button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl shadow-xl border border-gray-100 transition-all flex items-center justify-center hover:scale-105"
                    aria-label="Open Sidebar"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] transition-all duration-300"
                />
            )}

            <div className={`w-72 bg-white border-r border-gray-100 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8">
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
                        <span>AI Powered Assessment</span>
                    </div>
                </div>

                <nav className="flex-grow px-4 pb-8 space-y-2 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Navigation</div>
                    {links.map((item) => {
                        const isActive = location.pathname === item.link;
                        return (
                            <Link
                                key={item.title}
                                to={item.link}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'
                                    }`}
                            >
                                {React.cloneElement(item.icon, { size: 20 })}
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-gray-50 space-y-4">
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-900 transition-colors">
                        <User size={20} />
                        <span>Profile</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
