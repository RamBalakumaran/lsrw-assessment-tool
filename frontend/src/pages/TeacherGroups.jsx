import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Layers, Plus, Search, ChevronRight, Users, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const TeacherGroups = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupForm, setGroupForm] = useState({ name: '' });
    const [selectedGroup, setSelectedGroup] = useState(null);
    
    // Member management
    const [allUsers, setAllUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [addMemberForm, setAddMemberForm] = useState('');
    const [addAdminForm, setAddAdminForm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gRes, sRes] = await Promise.all([
                api.get('/groups/my-groups'),
                api.get('/users')
            ]);
            setGroups(gRes.data);
            setAllUsers(sRes.data);
            setStudents(sRes.data.filter(u => u.role === 'STUDENT'));

            if (selectedGroup) {
                const updatedGroup = gRes.data.find(g => g.id === selectedGroup.id);
                if (updatedGroup) setSelectedGroup(updatedGroup);
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

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups', { ...groupForm, creatorId: currentUser.id });
            setShowGroupModal(false);
            setGroupForm({ name: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error creating group");
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Are you sure you want to delete this group?")) return;
        try {
            await api.delete(`/groups/${id}`);
            setSelectedGroup(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error deleting group");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!addMemberForm) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/members`, { userId: addMemberForm });
            setAddMemberForm('');
            fetchData();
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

    const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', password: 'password123' });
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/invite', {
                ...inviteForm,
                role: 'STUDENT',
                groupId: selectedGroup.id
            });
            setInviteForm({ firstName: '', lastName: '', email: '', password: 'password123' });
            setIsInviting(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error inviting student");
        }
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar role="TEACHER" />

            <main className="flex-1 p-10 overflow-y-auto">
                {selectedGroup ? (
                    // GROUP DRILLDOWN
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <button onClick={() => setSelectedGroup(null)} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-bold transition">
                            <span className="mr-2">←</span> Back to My Groups
                        </button>
                        
                        <header className="mb-10 flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{selectedGroup.name}</h1>
                                <p className="text-gray-500 font-medium">Manage students assigned to this group.</p>
                            </div>
                            <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition flex items-center gap-2">
                                <Trash2 size={18} /> Delete Group
                            </button>
                        </header>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900">Group Students</h3>
                                <button 
                                    onClick={() => setIsInviting(!isInviting)}
                                    className="text-sm font-bold text-primary-600 hover:text-primary-700 transition"
                                >
                                    {isInviting ? 'Cancel Invite' : '+ Invite New Student'}
                                </button>
                            </div>

                            {isInviting ? (
                                <form onSubmit={handleInviteStudent} className="mb-6 p-6 bg-primary-50 rounded-2xl border border-primary-100">
                                    <h4 className="text-sm font-black text-primary-900 mb-4">Create & Assign New Student</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input type="text" required value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} placeholder="First Name" className="px-4 py-3 bg-white border border-primary-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        <input type="text" required value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} placeholder="Last Name" className="px-4 py-3 bg-white border border-primary-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        <input type="email" required value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} placeholder="Email Address" className="px-4 py-3 bg-white border border-primary-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 col-span-2" />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition shadow-md">Invite & Add to Group</button>
                                </form>
                            ) : (
                                <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                                    <select value={addMemberForm} onChange={e => setAddMemberForm(e.target.value)} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition">
                                        <option value="">Select an Existing Student...</option>
                                        {students.filter(s => !selectedGroup.members?.some(m => m.id === s.id)).map(s => (
                                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="px-6 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">Add</button>
                                </form>
                            )}

                            <div className="space-y-3">
                                {selectedGroup.members?.map(member => (
                                    <div key={member.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-gray-50 hover:border-gray-200 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black flex items-center justify-center">
                                                {member.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                                                <div className="text-xs text-gray-500 font-medium">{member.email}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Users size={32} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-500 font-medium">No students in this group yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GROUP ADMINS SECTION */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl mt-6">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Group Admins</h3>
                            <p className="text-sm font-medium text-gray-500 mb-6">Assign other teachers or trusted students to help manage this group.</p>
                            
                            <form onSubmit={handleAddAdmin} className="flex gap-2 mb-6">
                                <select value={addAdminForm} onChange={e => setAddAdminForm(e.target.value)} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition">
                                    <option value="">Select a User to Make Admin...</option>
                                    {allUsers.filter(u => !selectedGroup.admins?.some(a => a.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email} - {u.role})</option>
                                    ))}
                                </select>
                                <button type="submit" className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition shadow-lg">Make Admin</button>
                            </form>

                            <div className="space-y-3">
                                {selectedGroup.admins?.map(admin => (
                                    <div key={admin.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-gray-50 hover:border-gray-200 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-900 text-white font-black flex items-center justify-center">
                                                {admin.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {admin.firstName} {admin.lastName}
                                                    {admin.id === currentUser.id && <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">{admin.email} • {admin.role}</div>
                                            </div>
                                        </div>
                                        {admin.email !== 'admin@nec.edu.in' && (
                                            <button onClick={() => handleRemoveAdmin(admin.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // MAIN GROUPS LIST
                    <>
                        <header className="flex justify-between items-center mb-10">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Groups</h1>
                                <p className="text-gray-500 font-medium">Create custom groups to organize your students.</p>
                            </div>
                            <button onClick={() => setShowGroupModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex items-center gap-2">
                                <Plus size={20} />
                                <span>Create Group</span>
                            </button>
                        </header>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                            <div className="relative mb-8">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search your groups..."
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                />
                            </div>

                            {loading ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="p-10 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                    <Layers size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium text-lg">No groups found.</p>
                                    <p className="text-gray-400">Click "Create Group" to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredGroups.map(group => (
                                        <div key={group.id} onClick={() => setSelectedGroup(group)} className="p-6 border-2 border-gray-100 rounded-[2rem] hover:border-primary-500 hover:shadow-xl cursor-pointer transition-all group/card relative overflow-hidden">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                                                <Layers size={24} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2 group-hover/card:text-primary-600 transition-colors">{group.name}</h3>
                                            <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Users size={16} /> {group.members?.length || 0} Students
                                                </div>
                                            </div>
                                            <div className="absolute right-6 bottom-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover/card:bg-primary-600 group-hover/card:text-white transition-colors">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showGroupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowGroupModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10">
                            <button onClick={() => setShowGroupModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Create Group</h2>
                            <p className="text-gray-500 font-medium mb-6">Organize your students into custom sections or batches.</p>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Group Name *</label>
                                    <input type="text" required value={groupForm.name} onChange={e => setGroupForm({name: e.target.value})} placeholder="e.g. Morning Batch" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition shadow-xl mt-4 flex items-center justify-center gap-2">
                                    <Plus size={20} /> Create Group
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherGroups;
