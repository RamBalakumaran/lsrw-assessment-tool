import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import {
    User,
    Mail,
    Shield,
    Building2,
    Calendar,
    GraduationCap,
    UserCheck,
    Users,
    Loader2,
    Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const formatDate = (value) => {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const Profile = () => {
    const [user, setUser] = useState(readStoredUser);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/me');
                const nextUser = res.data.user;
                setUser(nextUser);
                localStorage.setItem('user', JSON.stringify(nextUser));
                if (nextUser?.organizationId) {
                    localStorage.setItem('organizationId', nextUser.organizationId);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Unable to load your profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading && !user) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role="STUDENT" />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role="STUDENT" />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-lg text-center">
                        <h1 className="text-3xl font-black text-gray-900 mb-3">Profile Unavailable</h1>
                        <p className="text-gray-500 font-medium">{error || 'We could not find an active profile for this session.'}</p>
                    </div>
                </main>
            </div>
        );
    }

    const universityName = user.university?.name || user.organization?.name || 'Not assigned';
    const groupMemberships = Array.isArray(user.groupMemberships) ? user.groupMemberships : [];
    const cards = [
        {
            title: 'University',
            value: universityName,
            helper: user.university?.subdomain ? `${user.university.subdomain}.portal` : 'Organization linked to this login',
            icon: <Building2 size={18} className="text-primary-500" />,
        },
        {
            title: 'Department',
            value: user.department || 'Not assigned',
            helper: 'Academic unit for this account',
            icon: <GraduationCap size={18} className="text-primary-500" />,
        },
        // Only show "Assigned Teacher" card for non-teacher roles
        ...(user.role !== 'TEACHER' ? [{
            title: 'Assigned Teacher',
            value: user.assignedTeacher?.profileName || 'Not assigned',
            helper: user.assignedTeacher?.email || 'No teacher has been linked yet',
            icon: <UserCheck size={18} className="text-primary-500" />,
        }] : []),
        {
            title: 'Member Since',
            value: formatDate(user.createdAt),
            helper: `Account status: ${user.status || 'ACTIVE'}`,
            icon: <Calendar size={18} className="text-primary-500" />,
        },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={user.role} />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Profile</h1>
                        <p className="text-gray-500 font-medium">Essential account details for your current login.</p>
                    </div>
                    <Link
                        to="/reset-password"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-[1.5rem] font-bold hover:bg-primary-700 transition"
                    >
                        <Lock size={18} />
                        <span>Reset Password</span>
                    </Link>
                </header>

                <div className="max-w-6xl mx-auto space-y-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden"
                    >
                        <div className="h-40 bg-gradient-to-r from-primary-600 via-sky-600 to-emerald-500" />

                        <div className="px-10 pb-10 -mt-14">
                            <div className="w-28 h-28 rounded-[2rem] bg-white p-2 shadow-2xl mb-6">
                                <div className="w-full h-full rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <User size={42} />
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.profileName}</h2>
                                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-medium text-gray-500">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 font-black text-xs uppercase tracking-widest">
                                            <Shield size={14} />
                                            {user.role}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Mail size={15} />
                                            {user.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-[2rem] border border-gray-100 px-6 py-5 min-w-[260px]">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Summary</div>
                                    <div className="text-lg font-bold text-gray-900">{universityName}</div>
                                    <div className="text-sm text-gray-500 font-medium mt-1">
                                        {user.department || 'Department pending'}{user.assignedTeacher?.profileName ? ` | Mentored by ${user.assignedTeacher.profileName}` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {cards.map((card) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm"
                            >
                                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                    {card.icon}
                                    <span>{card.title}</span>
                                </div>
                                <div className="text-xl font-black text-gray-900 leading-snug">{card.value}</div>
                                <div className="text-sm text-gray-500 font-medium mt-2">{card.helper}</div>
                            </motion.div>
                        ))}
                    </section>

                    <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Group Memberships</h3>
                                    <p className="text-gray-500 font-medium">All groups currently linked to this account.</p>
                                </div>
                            </div>

                            {groupMemberships.length === 0 ? (
                                <div className="p-6 rounded-[2rem] bg-gray-50 border border-dashed border-gray-200 text-gray-500 font-medium">
                                    No groups have been assigned yet for this login.
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {groupMemberships.map((group, index) => (
                                        <div key={`${group.name}-${index}`} className="p-5 rounded-[1.75rem] bg-gray-50 border border-gray-100">
                                            <div className="text-lg font-black text-gray-900">{group.name}</div>
                                            <div className="text-sm text-primary-600 font-semibold mt-1">{group.role || 'Member'}</div>
                                            <p className="text-sm text-gray-500 font-medium mt-3">
                                                {group.description || 'Group membership recorded for this account.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl"
                        >
                            <div className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-4">Profile Checklist</div>
                            <div className="space-y-5">
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">Profile Name</div>
                                    <div className="text-xl font-black">{user.profileName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">University</div>
                                    <div className="text-lg font-bold">{universityName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">Department</div>
                                    <div className="text-lg font-bold">{user.department || 'Not assigned'}</div>
                                </div>
                                {/* Only show "Assigned Teacher" in checklist for non-teacher roles */}
                                {user.role !== 'TEACHER' && (
                                    <div>
                                        <div className="text-sm text-gray-400 font-medium mb-1">Assigned Teacher</div>
                                        <div className="text-lg font-bold">{user.assignedTeacher?.profileName || 'Not assigned'}</div>
                                        {user.assignedTeacher?.email && (
                                            <div className="text-sm text-primary-300 font-medium mt-1">{user.assignedTeacher.email}</div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">Groups Linked</div>
                                    <div className="text-lg font-bold">{groupMemberships.length}</div>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {error && (
                        <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-[1.5rem] px-6 py-4 font-medium">
                            {error}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;
