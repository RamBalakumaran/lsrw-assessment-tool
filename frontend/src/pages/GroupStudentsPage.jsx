import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, Users, Trash2, Loader2, Search, CheckSquare, Square } from 'lucide-react';
import api from '../utils/api';
import MultiSelectSearchList from '../components/MultiSelectSearchList';
import StudentPerformanceModal from '../components/StudentPerformanceModal';

const ITEMS_PER_PAGE = 10;

const GroupStudentsPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const role = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'TEACHER';

    const [group, setGroup] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Search and Pagination States
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Multiple Select Checkbox States
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    const fetchData = async () => {
        try {
            const [gRes, uRes] = await Promise.all([
                api.get(`/groups/${groupId}`),
                api.get('/users')
            ]);
            setGroup(gRes.data);
            setAllUsers(uRes.data);
        } catch (error) {
            console.error("Error loading group details:", error);
            alert("Error loading group details");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [groupId]);

    const handleAddMembersBulk = async (userIds) => {
        try {
            await api.post(`/groups/${groupId}/members`, { userIds });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error adding members");
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this student from the group?")) return;
        try {
            await api.delete(`/groups/${groupId}/members/${userId}`);
            // Clear from selection if present
            setSelectedMemberIds(prev => prev.filter(id => id !== userId));
            fetchData();
        } catch (error) {
            alert("Error removing member");
        }
    };

    const handleRemoveSelectedMembers = async () => {
        if (selectedMemberIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to remove the ${selectedMemberIds.length} selected students from this group?`)) return;
        
        setLoading(true);
        try {
            await Promise.all(selectedMemberIds.map(userId => 
                api.delete(`/groups/${groupId}/members/${userId}`)
            ));
            setSelectedMemberIds([]);
            setCurrentPage(1);
            await fetchData();
        } catch (error) {
            console.error("Bulk remove error:", error);
            alert("An error occurred while removing some members.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role={role} />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    if (!group) return null;

    // Filter students out of all users
    const studentRoleUsers = allUsers.filter(u => u.role === 'STUDENT');
    // Get list of group members
    const groupMembers = group.members || [];

    // Filter out students who are not in the group
    const assignableStudents = studentRoleUsers.filter(u => !groupMembers.some(m => m.id === u.id));

    // Filter Enrolled Students List by Search Query
    const filteredMembers = groupMembers.filter(member => 
        `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
    );

    // Calculate pagination slices
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    const displayedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Select All logic for current displayed page
    const isAllPageSelected = displayedMembers.length > 0 && displayedMembers.every(m => selectedMemberIds.includes(m.id));

    const toggleSelectAllPage = () => {
        if (isAllPageSelected) {
            // Deselect all on current page
            const displayedIds = displayedMembers.map(m => m.id);
            setSelectedMemberIds(prev => prev.filter(id => !displayedIds.includes(id)));
        } else {
            // Select all on current page
            const displayedIds = displayedMembers.map(m => m.id);
            setSelectedMemberIds(prev => [...new Set([...prev, ...displayedIds])]);
        }
    };

    const toggleSelectMember = (userId) => {
        if (selectedMemberIds.includes(userId)) {
            setSelectedMemberIds(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedMemberIds(prev => [...prev, userId]);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={role} />

            <main className="flex-1 p-10 overflow-y-auto font-sans">
                {/* Back button & Header */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition"
                >
                    <ChevronLeft size={20} /> Back to Group Detail
                </button>

                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{group.name} - Students</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage students assigned to this group</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Add Students Section */}
                    <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
                        <h3 className="text-xl font-black text-gray-900 mb-6 font-sans">Add Existing Students</h3>
                        <MultiSelectSearchList 
                            items={assignableStudents}
                            placeholder="Search students to add..."
                            buttonText="Add Selected Students"
                            buttonColor="bg-primary-600 hover:bg-primary-700"
                            onAddSelected={handleAddMembersBulk}
                        />
                    </div>

                    {/* Enrolled Students list */}
                    <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[500px]">
                        <div>
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 font-sans">
                                    Enrolled Student List 
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-bold">
                                        {groupMembers.length} students
                                    </span>
                                </h3>
                                
                                <div className="flex items-center gap-2">
                                    {/* Enrolled Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="text"
                                            value={memberSearchQuery}
                                            onChange={e => {
                                                setMemberSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Search enrolled..."
                                            className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-100 transition w-44"
                                        />
                                    </div>
                                    
                                    {/* Bulk Remove Actions */}
                                    {selectedMemberIds.length > 0 && (
                                        <button
                                            onClick={handleRemoveSelectedMembers}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-black rounded-xl transition flex items-center gap-1.5"
                                        >
                                            <Trash2 size={14} /> Remove Selected ({selectedMemberIds.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Select All on Page Checkbox */}
                            {displayedMembers.length > 0 && (
                                <div 
                                    onClick={toggleSelectAllPage}
                                    className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl cursor-pointer select-none transition"
                                >
                                    <div className="text-primary-600 flex items-center justify-center">
                                        {isAllPageSelected ? (
                                            <CheckSquare size={18} className="fill-primary-50 text-primary-600" />
                                        ) : (
                                            <Square size={18} className="text-gray-300" />
                                        )}
                                    </div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                        Select All on Page
                                    </span>
                                </div>
                            )}

                            <div className="space-y-3">
                                {displayedMembers.map(member => {
                                    const isSelected = selectedMemberIds.includes(member.id);
                                    return (
                                        <div 
                                            key={member.id} 
                                            className={`flex justify-between items-center p-4 border rounded-2xl cursor-pointer transition-all ${
                                                isSelected ? 'border-primary-100 bg-primary-50/10' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setSelectedStudentId(member.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Individual Checkbox */}
                                                <div 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        toggleSelectMember(member.id); 
                                                    }}
                                                    className="text-primary-600 flex items-center justify-center hover:scale-105 active:scale-95 transition"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={18} className="fill-primary-50 text-primary-600" />
                                                    ) : (
                                                        <Square size={18} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black flex items-center justify-center font-sans">
                                                    {member.firstName ? member.firstName[0].toUpperCase() : 'S'}
                                                </div>
                                                 <div>
                                                     <div className="font-bold text-gray-900 hover:text-primary-600 transition-colors font-sans flex items-center gap-2">
                                                         {member.firstName} {member.lastName}
                                                         {member.registrationNumber && (
                                                             <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                                                 {member.registrationNumber}
                                                             </span>
                                                         )}
                                                         {member.yearOfStudy && (
                                                             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                                 {member.yearOfStudy}
                                                             </span>
                                                         )}
                                                     </div>
                                                     <div className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-3">
                                                         <span>{member.email}</span>
                                                         {group.name && (
                                                             <>
                                                                 <span className="text-gray-300">•</span>
                                                                 <span>{group.name}</span>
                                                             </>
                                                         )}
                                                     </div>
                                                 </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleRemoveMember(member.id); 
                                                }} 
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {displayedMembers.length === 0 && (
                                    <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <Users size={36} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-500 font-black font-sans">No students found matching query.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination Selector Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 hover:border-gray-900 rounded-xl text-xs font-black disabled:border-gray-100 disabled:text-gray-300 transition"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold text-gray-500">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-200 hover:border-gray-900 rounded-xl text-xs font-black disabled:border-gray-100 disabled:text-gray-300 transition"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance details modal overlay */}
                {selectedStudentId && (
                    <StudentPerformanceModal 
                        studentId={selectedStudentId} 
                        onClose={() => setSelectedStudentId(null)} 
                    />
                )}
            </main>
        </div>
    );
};

export default GroupStudentsPage;
