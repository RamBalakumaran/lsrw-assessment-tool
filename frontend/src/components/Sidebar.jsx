import React from 'react';
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
    Upload
} from 'lucide-react';

const Sidebar = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/login');
    };

    const adminLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/admin/dashboard" },
        { title: "User Management", icon: <Users />, link: "/admin/users" },
        { title: "Bulk Import", icon: <Upload />, link: "/admin/bulk-import" },
        { title: "Global Tasks", icon: <BookOpen />, link: "/admin/tasks" },
        { title: "System Health", icon: <Activity />, link: "/admin/health" },
    ];

    const teacherLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/teacher/dashboard" },
        { title: "My Groups", icon: <Layers />, link: "/teacher/groups" },
        { title: "Bulk Import", icon: <Upload />, link: "/teacher/bulk-import" },
        { title: "LSRW Tasks", icon: <BookOpen />, link: "/teacher/tasks" },
        { title: "Performance", icon: <BarChart />, link: "/teacher/performance" },
    ];

    const studentLinks = [
        { title: "Overview", icon: <LayoutDashboard />, link: "/dashboard" },
        { title: "My Progress", icon: <BarChart />, link: "/history" },
        { title: "LSRW Modules", icon: <Layers />, link: "/dashboard" },
    ];

    const links = role === 'ADMIN'
        ? adminLinks
        : role === 'TEACHER'
            ? teacherLinks
            : studentLinks;

    return (
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
            <div className="p-8">
                <div className="text-3xl font-black gradient-text tracking-tighter mb-2">FluentPro</div>
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
                <Link to="/profile" className="flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-900 transition-colors">
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
    );
};

export default Sidebar;
