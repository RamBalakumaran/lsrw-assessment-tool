import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { UserPlus, Search, Users, ChevronLeft, Trash2, Edit2, ShieldAlert, X, Plus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const UserManagement = () => {
    const currentUser = readStoredUser();
    const [activeTab, setActiveTab] = useState('STUDENTS');
    const [searchQuery, setSearchQuery] = useState('');

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null); // Drilldown view state

    // Form States
    const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'STUDENT', password: '123456', groupId: '' });
    const [groupForm, setGroupForm] = useState({ name: '' });
    
    // Group Add Member/Admin States
    const [addMemberForm, setAddMemberForm] = useState('');
    const [addAdminForm, setAddAdminForm] = useState('');

    const USER_TABS = [
        { key: 'STUDENTS', label: 'Students' },
        { key: 'TEACHERS', label: 'Teachers' },
        { key: 'ADMINS', label: 'Admins' },
        { key: 'GROUPS', label: 'Groups (Departments)' },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, gRes] = await Promise.all([
                api.get('/users'),
                api.get('/groups')
            ]);
            setUsers(uRes.data);
            setGroups(gRes.data);
            
            // Update selected group if active
            if (selectedGroup) {
                const updatedGroup = gRes.data.find(g => g.id === selectedGroup.id);
                if (updatedGroup) {
                    const detailedGroup = await api.get(`/groups/${updatedGroup.id}`);
                    setSelectedGroup(detailedGroup.data);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInviteUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/invite', inviteForm);
            setShowInviteModal(false);
            setInviteForm({ firstName: '', lastName: '', email: '', role: 'STUDENT', password: '123456', groupId: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error inviting user");
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${selectedUser.id}`, { status: selectedUser.status, role: selectedUser.role });
            // Add or change group logic if we are editing groups from here. 
            // For now, group manipulation is better done via the group drilldown or invite.
            setShowEditUserModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error updating user");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error deleting user");
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups', groupForm);
            setShowGroupModal(false);
            setGroupForm({ name: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error creating group");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!addMemberForm) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/members`, { userId: addMemberForm });
            setAddMemberForm('');
            fetchData(); // updates selectedGroup inside
        } catch (error) {
            alert(error.response?.data?.error || "Error adding member");
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);
            fetchData();
        } catch (error) {
            alert("Error removing member");
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!addAdminForm) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/admins`, { userId: addAdminForm });
            setAddAdminForm('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error adding admin");
        }
    };

    const handleRemoveAdmin = async (userId) => {
        try {
            await api.delete(`/groups/${selectedGroup.id}/admins/${userId}`);
            fetchData();
        } catch (error) {
            alert("Error removing admin");
        }
    };

    const openGroupDetails = async (groupId) => {
        try {
            const res = await api.get(`/groups/${groupId}`);
            setSelectedGroup(res.data);
        } catch (error) {
            alert("Error loading group details");
        }
    };

    const filteredUsers = users.filter(u => {
        if (activeTab !== 'GROUPS') {
            const roleMatch = u.role === (activeTab === 'ADMINS' ? 'ADMIN' : activeTab.slice(0, -1));
            const searchMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
            return roleMatch && searchMatch;
        }
        return false;
    });

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={currentUser?.role || 'ADMIN'} />

            <main className="flex-1 p-10 overflow-y-auto">
                {selectedGroup ? (
                    // GROUP DRILLDOWN VIEW
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <button onClick={() => setSelectedGroup(null)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-bold transition">
                            <ChevronLeft size={20} className="mr-1" /> Back to Access Control
                        </button>
                        
                        <header className="mb-10">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{selectedGroup.name} Department</h1>
                            <p className="text-gray-500 font-medium">Manage admins, members, and view activity for this group.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Admins Section */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-black text-gray-900 mb-6">Group Admins</h3>
                                <form onSubmit={handleAddAdmin} className="flex gap-2 mb-6">
                                    <select value={addAdminForm} onChange={e => setAddAdminForm(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-100">
                                        <option value="">Select a Teacher or Admin...</option>
                                        {users.filter(u => ['TEACHER', 'ADMIN'].includes(u.role) && !selectedGroup.admins?.some(a => a.id === u.id)).map(u => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition">Add</button>
                                </form>
                                <div className="space-y-3">
                                    {selectedGroup.admins?.map(admin => (
                                        <div key={admin.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50">
                                            <div>
                                                <div className="font-bold text-gray-900">{admin.firstName} {admin.lastName}</div>
                                                <div className="text-xs text-gray-500">{admin.email}</div>
                                            </div>
                                            <button onClick={() => handleRemoveAdmin(admin.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedGroup.admins || selectedGroup.admins.length === 0) && <p className="text-gray-400 text-sm">No admins assigned.</p>}
                                </div>
                            </div>

                            {/* Members Section */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-black text-gray-900 mb-6">Students</h3>
                                <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                                    <select value={addMemberForm} onChange={e => setAddMemberForm(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-100">
                                        <option value="">Select a Student...</option>
                                        {users.filter(u => u.role === 'STUDENT' && !selectedGroup.members?.some(m => m.id === u.id)).map(u => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">Add</button>
                                </form>
                                <div className="space-y-3">
                                    {selectedGroup.members?.map(member => (
                                        <div key={member.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50">
                                            <div>
                                                <div className="font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-xs text-gray-500">{member.email}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{member.status}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedGroup.members || selectedGroup.members.length === 0) && <p className="text-gray-400 text-sm">No students assigned.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Activity Section Placeholder */}
                        <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Group Activity</h3>
                            <div className="p-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                <p className="text-gray-500 font-medium">Activity aggregation mapping to tasks completed by members in this group goes here.</p>
                                <p className="text-sm text-gray-400 mt-2">({selectedGroup.tasks?.length || 0} tasks globally assigned to this group)</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // MAIN LIST VIEW
                    <>
                        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Access Control</h1>
                                <p className="text-gray-500 font-medium">Manage students, teachers, admins, and department groups for NEC.</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => setShowGroupModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm">
                                    <Users size={18} />
                                    <span>Create Group</span>
                                </button>
                                <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg">
                                    <UserPlus size={18} />
                                    <span>Invite User</span>
                                </button>
                            </div>
                        </header>

                        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 mb-8">
                            <div className="flex flex-wrap gap-3">
                                {USER_TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.key
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 mb-8">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${activeTab.toLowerCase()}...`}
                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium"
                                />
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <p className="text-gray-400 p-5">Loading...</p>
                                ) : activeTab === 'GROUPS' ? (
                                    filteredGroups.map(group => (
                                        <div key={group.id} onClick={() => openGroupDetails(group.id)} className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-md cursor-pointer transition">
                                            <div>
                                                <div className="font-bold text-lg text-gray-900">{group.name}</div>
                                                <div className="text-gray-500 text-sm">{group.admins?.length || 0} Admins</div>
                                            </div>
                                            <div className="text-primary-600 font-bold bg-primary-50 px-4 py-2 rounded-xl">
                                                {group.members?.length || 0} Members
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    filteredUsers.map(user => (
                                        <div key={user.id} className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-md transition">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${user.status === 'ACTIVE' ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {user.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                        {user.firstName} {user.lastName} 
                                                        {user.status === 'INACTIVE' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 uppercase tracking-wider">Inactive</span>}
                                                    </div>
                                                    <div className="text-gray-500 text-sm">{user.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-gray-400 font-bold px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs uppercase tracking-widest hidden sm:block">
                                                    {user.role}
                                                </div>
                                                <button onClick={() => { setSelectedUser(user); setShowEditUserModal(true); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* Invite User Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
                            <button onClick={() => setShowInviteModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Invite User</h2>
                            <form onSubmit={handleInviteUser} className="space-y-4 mt-6">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">First Name</label>
                                        <input type="text" required value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Last Name</label>
                                        <input type="text" required value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                                    <input type="email" required value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Role</label>
                                    <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100">
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Assign to Group (Optional)</label>
                                    <select value={inviteForm.groupId} onChange={e => setInviteForm({...inviteForm, groupId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100">
                                        <option value="">None</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="w-full mt-4 py-4 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition">Send Invitation</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditUserModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditUserModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10">
                            <button onClick={() => setShowEditUserModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Edit User</h2>
                            <p className="text-gray-500 mb-6 font-medium">{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</p>
                            <form onSubmit={handleEditUser} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Account Status</label>
                                    <select value={selectedUser.status || 'ACTIVE'} onChange={e => setSelectedUser({...selectedUser, status: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100">
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive (Suspended)</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-black hover:bg-black transition mt-4">Save Changes</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Create Group Modal */}
                {showGroupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowGroupModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10">
                            <button onClick={() => setShowGroupModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Create Group</h2>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Department Name</label>
                                    <input type="text" required value={groupForm.name} onChange={e => setGroupForm({name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition mt-4">Create</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
