import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, Users, Loader2, Search, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import StudentPerformanceModal from '../components/StudentPerformanceModal';

const ITEMS_PER_PAGE = 10;

const GroupStudentsPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const role = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'TEACHER';

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Search and Pagination States
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/groups/${groupId}`);
                setGroup(res.data);
            } catch (error) {
                console.error("Error loading group details:", error);
                alert("Error loading group details");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId, navigate]);

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

    // Get list of group members
    const groupMembers = group.members || [];

    // Filter Enrolled Students List by Search Query
    const filteredMembers = groupMembers.filter(member => 
        `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
    );

    // Calculate pagination slices
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    const displayedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={role} />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0 font-sans">
                {/* Back button & Header */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition"
                >
                    <ChevronLeft size={20} /> Back
                </button>

                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{group.name} - Students</h1>
                        <p className="text-gray-500 font-medium mt-1">View student performance reports for this group</p>
                    </div>
                </header>

                {/* Enrolled Students list */}
                <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[500px]">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 font-sans">
                                Student List 
                                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-bold">
                                    {groupMembers.length} enrolled
                                </span>
                            </h3>
                            
                            {/* Search Bar */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={memberSearchQuery}
                                    onChange={e => {
                                        setMemberSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search students..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {displayedMembers.map(member => (
                                <div 
                                    key={member.id} 
                                    className="flex flex-col sm:flex-row justify-between sm:items-center p-6 border border-gray-100 bg-gray-50/50 hover:bg-gray-50 rounded-3xl cursor-pointer transition-all gap-4 group"
                                    onClick={() => setSelectedStudentId(member.id)}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 font-black flex items-center justify-center font-sans shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {member.firstName ? member.firstName[0].toUpperCase() : 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors font-sans flex flex-wrap items-center gap-2">
                                                <span className="truncate">{member.firstName} {member.lastName}</span>
                                                {member.registrationNumber && (
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono shrink-0">
                                                        {member.registrationNumber}
                                                    </span>
                                                )}
                                                {member.yearOfStudy && (
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                                                        Year {member.yearOfStudy}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-medium mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                        <span className="text-xs font-black text-primary-600 group-hover:text-white bg-primary-50 group-hover:bg-primary-600 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1">
                                            <span>View Report</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {displayedMembers.length === 0 && (
                                <div className="p-16 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 font-black font-sans">No students found matching your search.</p>
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
                                className="px-5 py-2.5 border border-gray-200 hover:border-gray-900 rounded-xl text-xs font-black disabled:border-gray-100 disabled:text-gray-300 transition"
                            >
                                Previous
                            </button>
                            <span className="text-xs font-bold text-gray-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-5 py-2.5 border border-gray-200 hover:border-gray-900 rounded-xl text-xs font-black disabled:border-gray-100 disabled:text-gray-300 transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
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
