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

    const fullName = `${user.firstName} ${user.lastName}`;
    const universityName = 'National Engineering College Kovilpatti (NEC)';
    
    // Combine memberships and administered groups
    const members = Array.isArray(user.groupMemberships) ? user.groupMemberships.map(g => ({ ...g, roleInGroup: 'Member' })) : [];
    const admins = Array.isArray(user.administeredGroups) ? user.administeredGroups.map(g => ({ ...g, roleInGroup: 'Admin' })) : [];
    
    // Remove duplicates if a user is both (they shouldn't be, but just in case)
    const combinedGroupsMap = new Map();
    [...members, ...admins].forEach(g => {
        if (!combinedGroupsMap.has(g.id)) {
            combinedGroupsMap.set(g.id, g);
        } else if (g.roleInGroup === 'Admin') {
            combinedGroupsMap.set(g.id, g); // Prefer 'Admin' label
        }
    });
    const groupMemberships = Array.from(combinedGroupsMap.values());

    const cards = [
        {
            title: 'University',
            value: universityName,
            helper: 'National Engineering College',
            icon: <Building2 size={18} className="text-primary-500" />,
        },
        {
            title: 'Groups Linked',
            value: groupMemberships.length,
            helper: 'Classes or sections you belong to',
            icon: <Users size={18} className="text-primary-500" />,
        },
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

            <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto min-w-0 max-w-full">
                <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Profile</h1>
                        <p className="text-xs sm:text-base text-gray-500 font-medium mt-1">Essential account details for your current login.</p>
                    </div>
                    <Link
                        to="/reset-password"
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-primary-600 text-white rounded-xl sm:rounded-[1.5rem] font-bold hover:bg-primary-700 transition self-start sm:self-auto text-sm"
                    >
                        <Lock size={16} />
                        <span>Reset Password</span>
                    </Link>
                </header>

                <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl sm:rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden"
                    >
                        <div className="h-28 sm:h-40 bg-gradient-to-r from-primary-600 via-sky-600 to-emerald-500" />

                        <div className="px-4 sm:px-6 md:px-10 pb-6 md:pb-10 -mt-10 sm:-mt-14">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] bg-white p-1.5 sm:p-2 shadow-2xl mb-4 sm:mb-6">
                                <div className="w-full h-full rounded-xl sm:rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <User className="w-8 h-8 sm:w-11 sm:h-11" />
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 sm:gap-6">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{fullName}</h2>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-500">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary-50 text-primary-600 font-black text-[11px] sm:text-xs uppercase tracking-widest">
                                            <Shield size={13} />
                                            {user.role}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 break-all">
                                            <Mail size={14} className="shrink-0" />
                                            {user.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl sm:rounded-[2rem] border border-gray-100 p-4 sm:px-6 sm:py-5 w-full lg:w-auto min-w-0 sm:min-w-[260px]">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Organization</div>
                                    <div className="text-base sm:text-lg font-bold text-gray-900">{universityName}</div>
                                    <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                                        Active {user.role.toLowerCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {cards.map((card) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm"
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

                    <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-gray-900">Group Memberships</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium">All groups currently linked to this account.</p>
                                </div>
                            </div>

                            {groupMemberships.length === 0 ? (
                                <div className="p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-gray-50 border border-dashed border-gray-200 text-gray-500 font-medium text-xs sm:text-sm">
                                    No groups have been assigned yet for this login.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {groupMemberships.map((group, index) => (
                                        <div key={`${group.name}-${index}`} className="p-4 sm:p-5 rounded-xl sm:rounded-[1.75rem] bg-gray-50 border border-gray-100">
                                            <div className="text-base sm:text-lg font-black text-gray-900">{group.name}</div>
                                            <div className="text-xs sm:text-sm text-primary-600 font-semibold mt-1">{group.roleInGroup}</div>
                                            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-2 sm:mt-3">
                                                {group.roleInGroup === 'Admin' ? 'Managing this group as an admin.' : 'Member of this specific group.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl"
                        >
                            <div className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-4">Profile Checklist</div>
                            <div className="space-y-5">
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">Profile Name</div>
                                    <div className="text-xl font-black">{fullName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">University</div>
                                    <div className="text-lg font-bold">{universityName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">Role</div>
                                    <div className="text-lg font-bold uppercase">{user.role}</div>
                                </div>
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
