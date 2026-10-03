import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Layers, Plus, Search, ChevronRight, Users, Edit2, Trash2, X, Loader2, Upload, UserPlus, FileText, Target, Download, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import BulkImportModal from '../components/BulkImportModal';
import MultiSelectSearchList from '../components/MultiSelectSearchList';
import StudentPerformanceModal from '../components/StudentPerformanceModal';
import * as XLSX from 'xlsx';

const TeacherGroups = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
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
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showStudentList, setShowStudentList] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Task management
    const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [assignTaskLoading, setAssignTaskLoading] = useState(false);

    // Reports Tab
    const [activeTab, setActiveTab] = useState('STUDENTS');
    const [reportConfig, setReportConfig] = useState({
        taskIds: [],
        includeData: 'FINAL_ONLY',
        consolidation: 'BEST'
    });
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [reportError, setReportError] = useState(null);

    // Compute rowspans for preview
    const processedPreview = React.useMemo(() => {
        if (!reportPreview) return [];
        const processed = [];
        let i = 0;
        while (i < reportPreview.length) {
            const studentName = reportPreview[i]["Student Name"];
            let studentRowCount = 0;
            while (i + studentRowCount < reportPreview.length && reportPreview[i + studentRowCount]["Student Name"] === studentName) {
                studentRowCount++;
            }
            
            let j = 0;
            while (j < studentRowCount) {
                const taskName = reportPreview[i + j]["Task"];
                let taskRowCount = 0;
                while (j + taskRowCount < studentRowCount && reportPreview[i + j + taskRowCount]["Task"] === taskName) {
                    taskRowCount++;
                }
                
                for (let k = 0; k < taskRowCount; k++) {
                    processed.push({
                        ...reportPreview[i + j + k],
                        _studentRowSpan: (j === 0 && k === 0) ? studentRowCount : 0,
                        _taskRowSpan: (k === 0) ? taskRowCount : 0
                    });
                }
                j += taskRowCount;
            }
            i += studentRowCount;
        }
        return processed;
    }, [reportPreview]);

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

    const handleAddMembersBulk = async (userIds) => {
        try {
            await api.post(`/groups/${selectedGroup.id}/members`, { userIds });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error adding members");
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

    const handleAddAdminsBulk = async (userIds) => {
        try {
            await api.post(`/groups/${selectedGroup.id}/admins`, { userIds });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error adding admins");
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

    const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', registrationNumber: '', academicYear: '', password: '123456' });
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/invite', {
                ...inviteForm,
                role: 'STUDENT',
                groupId: selectedGroup.id
            });
            setInviteForm({ firstName: '', lastName: '', email: '', registrationNumber: '', academicYear: '', password: '123456' });
            setIsInviting(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error inviting student");
        }
    };

    const handleToggleGroupStatus = async () => {
        if (!selectedGroup) return;
        const newStatus = selectedGroup.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
        try {
            await api.put(`/groups/${selectedGroup.id}`, { status: newStatus });
            setSelectedGroup(prev => ({ ...prev, status: newStatus }));
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error updating group status");
        }
    };

    const handleOpenAssignTaskModal = async () => {
        setShowAssignTaskModal(true);
        setAssignTaskLoading(true);
        try {
            const res = await api.get('/tasks');
            setAllTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        } finally {
            setAssignTaskLoading(false);
        }
    };

    const handleAssignTask = async (taskId) => {
        try {
            await api.post(`/groups/${selectedGroup.id}/tasks/${taskId}`);
            setShowAssignTaskModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Error assigning task");
        }
    };

    const handleGenerateCustomReport = async () => {
        setIsGeneratingReport(true);
        setReportError(null);
        setReportPreview(null);
        try {
            const res = await api.post(`/reports/group/${selectedGroup.id}/custom`, reportConfig);
            const data = res.data;
            if (!data || data.length === 0) {
                setReportError("No data available for the selected configuration.");
                return;
            }
            setReportPreview(data);
        } catch (error) {
            console.error("Error generating report:", error);
            setReportError(error.response?.data?.error || "Failed to generate report.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDownloadReport = () => {
        if (!reportPreview || reportPreview.length === 0) return;
        
        // 1. Prepare data for Excel
        const excelData = [];
        
        // Add Titles
        excelData.push(["NATIONAL ENGINEERING COLLEGE KOVILPATTI , 628 503"]);
        excelData.push([`Group Name : ${selectedGroup.name}`]);
        
        // Headers
        const dataHeaders = ["Student Name", "Reg No", "Email", "Task", "Attempt Type", "Score", "Submitted At"];
        excelData.push(dataHeaders);
        
        // Add Data
        reportPreview.forEach(row => {
            excelData.push([
                row["Student Name"],
                row["Reg No"] || '',
                row["Email"],
                row["Task"],
                row["Attempt Type"],
                row["Score"],
                row["Submitted At"]
            ]);
        });

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Merge Cells Configuration
        const merges = [];
        
        // Title merges
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); // Row 1 across all 7 cols
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }); // Row 2 across all 7 cols
        
        // Data row merges
        let i = 0;
        const dataStartRow = 3; // 0, 1 are titles, 2 is header
        
        while (i < reportPreview.length) {
            const studentName = reportPreview[i]["Student Name"];
            let studentRowCount = 0;
            while (i + studentRowCount < reportPreview.length && reportPreview[i + studentRowCount]["Student Name"] === studentName) {
                studentRowCount++;
            }
            
            if (studentRowCount > 1) {
                merges.push({ s: { r: dataStartRow + i, c: 0 }, e: { r: dataStartRow + i + studentRowCount - 1, c: 0 } });
                merges.push({ s: { r: dataStartRow + i, c: 1 }, e: { r: dataStartRow + i + studentRowCount - 1, c: 1 } });
                merges.push({ s: { r: dataStartRow + i, c: 2 }, e: { r: dataStartRow + i + studentRowCount - 1, c: 2 } });
            }

            let j = 0;
            while (j < studentRowCount) {
                const taskName = reportPreview[i + j]["Task"];
                let taskRowCount = 0;
                while (j + taskRowCount < studentRowCount && reportPreview[i + j + taskRowCount]["Task"] === taskName) {
                    taskRowCount++;
                }
                
                if (taskRowCount > 1) {
                    merges.push({ s: { r: dataStartRow + i + j, c: 3 }, e: { r: dataStartRow + i + j + taskRowCount - 1, c: 3 } });
                }
                j += taskRowCount;
            }
            i += studentRowCount;
        }
        
        ws['!merges'] = merges;
        
        // Apply column widths
        ws['!cols'] = [
            { wch: 20 }, // Student Name
            { wch: 15 }, // Reg No
            { wch: 25 }, // Email
            { wch: 40 }, // Task
            { wch: 20 }, // Attempt Type
            { wch: 10 }, // Score
            { wch: 20 }  // Submitted At
        ];

        // Style alignments (optional, handled automatically mostly)

        // Create Workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        
        // Save File
        XLSX.writeFile(wb, `${selectedGroup.name}_Task_Report.xlsx`);
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar role="TEACHER" />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0">
                {selectedGroup ? (
                    // GROUP DRILLDOWN
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <button onClick={() => { setSelectedGroup(null); setActiveTab('STUDENTS'); }} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-bold transition">
                            <span className="mr-2">←</span> Back to My Groups
                        </button>
                        
                        <header className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex flex-wrap items-center gap-3">
                                    {selectedGroup.name}
                                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                        selectedGroup.status === 'INACTIVE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {selectedGroup.status || 'ACTIVE'}
                                    </span>
                                </h1>
                                <p className="text-gray-500 font-medium mt-1">Manage students assigned to this group.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={handleToggleGroupStatus} 
                                    className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                                        selectedGroup.status === 'INACTIVE' 
                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    }`}
                                >
                                    {selectedGroup.status === 'INACTIVE' ? 'Activate Group' : 'Deactivate Group'}
                                </button>
                                <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition flex items-center gap-2">
                                    <Trash2 size={18} /> Delete Group
                                </button>
                            </div>
                        </header>

                        <div className="flex space-x-2 mb-8 bg-gray-50 p-1.5 rounded-2xl w-max border border-gray-100">
                            <button 
                                onClick={() => setActiveTab('STUDENTS')} 
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'STUDENTS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <Users size={16} /> Students
                            </button>
                            <button 
                                onClick={() => setActiveTab('ADMINS')} 
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'ADMINS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <UserPlus size={16} /> Admins
                            </button>
                            <button 
                                onClick={() => setActiveTab('TASKS')} 
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <FileText size={16} /> Tasks
                            </button>
                            <button 
                                onClick={() => setActiveTab('REPORTS')} 
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'REPORTS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <BarChart2 size={16} /> Reports
                            </button>
                        </div>

                        {activeTab === 'STUDENTS' && (
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 font-sans">Group Students</h3>
                                    <p className="text-xs text-gray-400 font-bold mt-1">
                                        {selectedGroup.members?.length || 0} students enrolled
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                                    <button 
                                        onClick={() => setIsInviting(!isInviting)}
                                        className="text-xs font-black text-gray-700 hover:text-black flex items-center gap-1 transition uppercase tracking-wider bg-gray-100 px-3 py-2 rounded-xl"
                                    >
                                        <UserPlus size={14} /> Add Single Student
                                    </button>
                                    <button 
                                        onClick={() => setShowBulkImport(true)}
                                        className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-1 transition uppercase tracking-wider bg-primary-50 px-3 py-2 rounded-xl"
                                    >
                                        <Upload size={14} /> Bulk Import
                                    </button>
                                </div>
                            </div>

                            {/* Inline Single Student Add Form */}
                            {isInviting && (
                                <form onSubmit={handleInviteStudent} className="mb-6 p-6 bg-gray-50 border border-gray-100 rounded-3xl space-y-4">
                                    <h4 className="font-black text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <UserPlus size={16} className="text-primary-600" />
                                        Add Single Student (One-by-One)
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Registration Number *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={inviteForm.registrationNumber || ''} 
                                                onChange={e => setInviteForm({ ...inviteForm, registrationNumber: e.target.value })} 
                                                placeholder="e.g. 21CS001" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Academic Year *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={inviteForm.academicYear || ''} 
                                                onChange={e => setInviteForm({ ...inviteForm, academicYear: e.target.value })} 
                                                placeholder="e.g. III" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">First Name</label>
                                            <input 
                                                type="text" 
                                                value={inviteForm.firstName || ''} 
                                                onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} 
                                                placeholder="First name" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Last Name</label>
                                            <input 
                                                type="text" 
                                                value={inviteForm.lastName || ''} 
                                                onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} 
                                                placeholder="Last name" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setIsInviting(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                                        <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white font-black text-xs rounded-xl hover:bg-primary-700">Add Student</button>
                                    </div>
                                </form>
                            )}

                            {/* Search & Add Existing Students One-by-One or Multi-Select */}
                            <div className="mb-6">
                                <MultiSelectSearchList 
                                    items={students.filter(s => !selectedGroup.members?.some(m => m.id === s.id))}
                                    placeholder="Search existing students by name or email to add..."
                                    buttonText="Add Selected Students"
                                    buttonColor="bg-primary-600 hover:bg-primary-700"
                                    onAddSelected={handleAddMembersBulk}
                                />
                            </div>

                            <div className="space-y-3">
                                {(selectedGroup.members || []).slice(0, 3).map(member => {
                                    return (
                                        <div 
                                            key={member.id} 
                                            className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-all gap-4"
                                            onClick={() => setSelectedStudentId(member.id)}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black flex items-center justify-center shrink-0">
                                                    {member.firstName ? member.firstName[0].toUpperCase() : 'S'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 hover:text-primary-600 transition-colors font-sans truncate">
                                                        {member.firstName} {member.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5 truncate">{member.email}</div>
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
                                {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Users size={32} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-500 font-medium">No students in this group yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                                <button 
                                    onClick={() => navigate(`/groups/${selectedGroup.id}/students`)}
                                    className="text-xs font-black text-gray-700 hover:text-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-2xl transition w-full text-center"
                                >
                                    {selectedGroup.members?.length > 3 ? "Show More / Manage" : "Manage Group Students"}
                                </button>
                            </div>
                        </div>
                        )}

                        {/* GROUP ADMINS SECTION */}
                        {activeTab === 'ADMINS' && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Group Admins</h3>
                            <p className="text-sm font-medium text-gray-500 mb-6">Assign other teachers or trusted students to help manage this group.</p>
                            
                            <div className="mb-6">
                                <MultiSelectSearchList 
                                    items={allUsers.filter(u => ['TEACHER', 'ADMIN'].includes(u.role) && !selectedGroup.admins?.some(a => a.id === u.id))}
                                    placeholder="Search teachers or admins..."
                                    buttonText="Make Selected Admins"
                                    buttonColor="bg-gray-900 hover:bg-black"
                                    onAddSelected={handleAddAdminsBulk}
                                />
                            </div>

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
                        )}

                        {/* GROUP TASKS SECTION */}
                        {activeTab === 'TASKS' && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 font-sans">Group Tasks</h3>
                                    <p className="text-sm font-medium text-gray-500">Tasks assigned specifically to this group.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={handleOpenAssignTaskModal}
                                        className="text-xs font-black text-gray-700 hover:text-black flex items-center gap-1 transition uppercase tracking-wider bg-gray-100 px-3 py-2 rounded-xl"
                                    >
                                        <FileText size={14} /> Assign Existing Task
                                    </button>
                                    <button 
                                        onClick={() => navigate('/teacher/tasks', { state: { prefillGroupId: selectedGroup.id } })}
                                        className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-1 transition uppercase tracking-wider bg-primary-50 px-3 py-2 rounded-xl"
                                    >
                                        <Target size={14} /> Create New Task
                                    </button>
                                </div>
                            </div>
                            
                            {selectedGroup.tasks && selectedGroup.tasks.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedGroup.tasks.map(task => (
                                        <div key={task.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-gray-50 hover:border-gray-200 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 font-black flex items-center justify-center text-lg">
                                                    {(task.type || 'T')[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 flex items-center gap-2">
                                                        {task.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">{task.type} • {task.difficultyLevel}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-400">
                                    No tasks assigned to this group yet.
                                </div>
                            )}
                        </div>
                        )}

                        {activeTab === 'REPORTS' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl">
                                <h3 className="text-2xl font-black text-gray-900 mb-6">Group Reports & Analytics</h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Tasks to Include</label>
                                        <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-2xl bg-gray-50 p-4 space-y-2">
                                            {selectedGroup.tasks && selectedGroup.tasks.length > 0 ? (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={reportConfig.taskIds.length === selectedGroup.tasks.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setReportConfig({...reportConfig, taskIds: selectedGroup.tasks.map(t => t.id)});
                                                                else setReportConfig({...reportConfig, taskIds: []});
                                                            }}
                                                            className="w-5 h-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                        />
                                                        <span className="font-bold text-gray-700">Select All Tasks</span>
                                                    </div>
                                                    <hr className="border-gray-200 my-3" />
                                                    {selectedGroup.tasks.map(task => (
                                                        <div key={task.id} className="flex items-center gap-3">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={reportConfig.taskIds.includes(task.id)}
                                                                onChange={(e) => {
                                                                    const newIds = e.target.checked 
                                                                        ? [...reportConfig.taskIds, task.id]
                                                                        : reportConfig.taskIds.filter(id => id !== task.id);
                                                                    setReportConfig({...reportConfig, taskIds: newIds});
                                                                }}
                                                                className="w-5 h-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                            />
                                                            <span className="font-medium text-gray-900">{task.title}</span>
                                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">({task.type})</span>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <p className="text-gray-400 font-medium">No tasks assigned to this group yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Data to Include</label>
                                            <select 
                                                value={reportConfig.includeData}
                                                onChange={(e) => setReportConfig({...reportConfig, includeData: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition text-sm text-gray-900 cursor-pointer"
                                            >
                                                <option value="FINAL_ONLY">Final Score Only</option>
                                                <option value="ALL_ATTEMPTS">All Attempts Details</option>
                                                <option value="BOTH">Both (Final + All Attempts)</option>
                                            </select>
                                        </div>
                                        
                                        {(reportConfig.includeData === 'FINAL_ONLY' || reportConfig.includeData === 'BOTH') && (
                                            <div>
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Consolidation Method</label>
                                                <select 
                                                    value={reportConfig.consolidation}
                                                    onChange={(e) => setReportConfig({...reportConfig, consolidation: e.target.value})}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition text-sm text-gray-900 cursor-pointer"
                                                >
                                                    <option value="BEST">Best Score (Max)</option>
                                                    <option value="AVERAGE">Average of Attempts</option>
                                                    <option value="FIRST">First Attempt</option>
                                                    <option value="LAST">Last Attempt</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {reportError && (
                                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold">
                                            {reportError}
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleGenerateCustomReport}
                                        disabled={reportConfig.taskIds.length === 0 || isGeneratingReport}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {isGeneratingReport ? <Loader2 className="animate-spin" size={20} /> : <BarChart2 size={20} />}
                                        {isGeneratingReport ? 'Generating Preview...' : 'Generate Report Preview'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'REPORTS' && reportPreview && reportPreview.length > 0 && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-full mt-6 overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Report Preview</h3>
                                        <p className="text-sm font-medium text-gray-500">Showing top {Math.min(reportPreview.length, 50)} rows.</p>
                                    </div>
                                    <button 
                                        onClick={handleDownloadReport}
                                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download Full Excel
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-black">
                                            <tr>
                                                <th className="px-6 py-4">Student Name</th>
                                                <th className="px-6 py-4">Reg No</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Task</th>
                                                <th className="px-6 py-4">Attempt Type</th>
                                                <th className="px-6 py-4">Score</th>
                                                <th className="px-6 py-4">Submitted At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-900 font-medium">
                                            {processedPreview.slice(0, 50).map((row, idx) => {
                                                const shouldRenderStudent = row._studentRowSpan > 0;
                                                const shouldRenderTask = row._taskRowSpan > 0;
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition border-b border-gray-100">
                                                        {shouldRenderStudent && (
                                                            <>
                                                                <td rowSpan={row._studentRowSpan} className="px-6 py-4 border-r border-gray-100 align-top bg-white font-bold">{row["Student Name"]}</td>
                                                                <td rowSpan={row._studentRowSpan} className="px-6 py-4 border-r border-gray-100 align-top bg-white">{row["Reg No"] || '-'}</td>
                                                                <td rowSpan={row._studentRowSpan} className="px-6 py-4 border-r border-gray-100 align-top bg-white">{row["Email"]}</td>
                                                            </>
                                                        )}
                                                        {shouldRenderTask && (
                                                            <td rowSpan={row._taskRowSpan} className="px-6 py-4 border-r border-gray-100 align-top max-w-[250px] whitespace-normal bg-white">
                                                                {row["Task"]}
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 truncate max-w-[150px] text-gray-500">{row["Attempt Type"]}</td>
                                                        <td className="px-6 py-4 font-bold">{row["Score"]}</td>
                                                        <td className="px-6 py-4 text-gray-500">{row["Submitted At"]}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    // MAIN GROUPS LIST
                    <>
                        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-10">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Groups</h1>
                                <p className="text-gray-500 font-medium">Create custom groups to organize your students.</p>
                            </div>
                            <button onClick={() => setShowGroupModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex items-center gap-2 self-start sm:self-auto">
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
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <Layers size={24} />
                                                </div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                                    group.status === 'INACTIVE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                    {group.status || 'ACTIVE'}
                                                </span>
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

            {/* Assign Task Modal */}
            <AnimatePresence>
                {showAssignTaskModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAssignTaskModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 flex flex-col max-h-[90vh]">
                            <button onClick={() => setShowAssignTaskModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Assign Task</h2>
                            <p className="text-gray-500 font-medium mb-6">Select an existing task to assign to {selectedGroup?.name}.</p>
                            
                            <div className="overflow-y-auto flex-1">
                                {assignTaskLoading ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
                                ) : allTasks.filter(t => !selectedGroup?.tasks?.some(st => st.id === t.id)).length === 0 ? (
                                    <div className="p-10 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No available tasks to assign.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {allTasks.filter(t => !selectedGroup?.tasks?.some(st => st.id === t.id)).map(task => (
                                            <div key={task.id} onClick={() => handleAssignTask(task.id)} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-white hover:border-primary-500 hover:shadow-md cursor-pointer transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 font-black flex items-center justify-center text-lg">
                                                        {(task.type || 'T')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{task.title}</div>
                                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">{task.type} • {task.difficultyLevel}</div>
                                                    </div>
                                                </div>
                                                <div className="text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider">
                                                    Assign
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Bulk Import Modal */}
                {showBulkImport && selectedGroup && (
                    <BulkImportModal 
                        groupId={selectedGroup.id} 
                        onSuccess={fetchData} 
                        onClose={() => setShowBulkImport(false)} 
                    />
                )}

                {/* Student Performance Details Modal */}
                {selectedStudentId && (
                    <StudentPerformanceModal 
                        studentId={selectedStudentId} 
                        onClose={() => setSelectedStudentId(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherGroups;
