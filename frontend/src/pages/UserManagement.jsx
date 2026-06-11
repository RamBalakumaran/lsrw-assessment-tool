import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
    UserPlus,
    Search,
    Loader2,
    X,
    UserCircle,
    Mail,
    GraduationCap,
    Building2,
    UserCheck,
    Layers,
    Plus,
    Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const USER_TABS = [
    { key: 'STUDENTS', label: 'Students' },
    { key: 'TEACHERS', label: 'Teachers' },
    { key: 'ADMINS', label: 'Admin Roles' },
    { key: 'DEPARTMENTS', label: 'Departments' },
];

const ROLE_OPTIONS = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'TEACHER', label: 'Teacher / Staff' },
    { value: 'DEPT_ADMIN', label: 'Department Admin' },
    { value: 'ADMIN', label: 'Organization Admin' },
];

const USER_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'INVITED'];
const DEPARTMENT_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];

const emptyInviteData = () => ({
    email: '',
    firstName: '',
    lastName: '',
    organizationId: '',
    role: 'STUDENT',
    departmentId: '',
    teacherId: '',
    groupMemberships: '',
    managedDepartmentId: '',
    password: '',
});

const emptyUserForm = () => ({
    role: 'STUDENT',
    status: 'ACTIVE',
    departmentId: '',
    teacherId: '',
    managedDepartmentId: '',
    groupMemberships: [],
});

const emptyDepartmentForm = () => ({
    id: null,
    name: '',
    status: 'ACTIVE',
    organizationId: '',
    adminId: '',
    staffMemberIds: [],
    studentIds: [],
});

const createGroupDraft = () => ({
    name: '',
    role: '',
    status: 'ACTIVE',
    description: '',
});

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Organization Admin',
    DEPT_ADMIN: 'Department Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
};

const roleBadgeClass = {
    SUPER_ADMIN: 'bg-rose-50 text-rose-700 border-rose-100',
    ADMIN: 'bg-sky-50 text-sky-700 border-sky-100',
    DEPT_ADMIN: 'bg-violet-50 text-violet-700 border-violet-100',
    TEACHER: 'bg-amber-50 text-amber-700 border-amber-100',
    STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const statusBadgeClass = {
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    INACTIVE: 'bg-gray-50 text-gray-500 border-gray-100',
    INVITED: 'bg-blue-50 text-blue-600 border-blue-100',
};

const formatGroupDrafts = (groups = []) => {
    if (!Array.isArray(groups)) {
        return [];
    }

    return groups.map((group) => ({
        name: group.name || '',
        role: group.role || '',
        status: group.status || 'ACTIVE',
        description: group.description || '',
    }));
};

const normalizeUserCardDepartment = (user) => {
    return user.departmentInfo?.name || user.department || 'Department not assigned';
};

const UserManagement = () => {
    const currentUser = readStoredUser();
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingUser, setSavingUser] = useState(false);
    const [savingDepartment, setSavingDepartment] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [activeTab, setActiveTab] = useState('STUDENTS');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState('ALL');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [creatingDepartment, setCreatingDepartment] = useState(false);
    const [inviteData, setInviteData] = useState(emptyInviteData);
    const [userForm, setUserForm] = useState(emptyUserForm);
    const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);

    const fetchAccessControlData = useCallback(async (options = {}) => {
        try {
            const requests = [
                api.get('/admin/users'),
                api.get('/admin/departments'),
            ];

            if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
                requests.push(api.get('/admin/organizations'));
            }

            const responses = await Promise.all(requests);
            const [userRes, departmentRes, organizationRes] = responses;

            setUsers(userRes.data);
            setDepartments(departmentRes.data);
            setOrganizations(organizationRes?.data || []);

            if (options.userId !== undefined) {
                setSelectedUserId(options.userId);
            }

            if (options.departmentId !== undefined) {
                setSelectedDepartmentId(options.departmentId);
            }
        } catch (error) {
            console.error('Access control fetch error:', error);
            setUsers([]);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.role]);

    useEffect(() => {
        fetchAccessControlData();
    }, [fetchAccessControlData]);

    const selectedUser = useMemo(() => {
        return users.find((user) => user.id === selectedUserId) || null;
    }, [selectedUserId, users]);

    const selectedDepartment = useMemo(() => {
        return departments.find((department) => department.id === selectedDepartmentId) || null;
    }, [departments, selectedDepartmentId]);

    const selectedUserOrganizationId = selectedUser?.organizationId || currentUser?.organizationId || '';
    const selectedDepartmentOrganizationId = departmentForm.organizationId || selectedDepartment?.organizationId || currentUser?.organizationId || '';
    const inviteOrganizationId = currentUser?.role === 'SUPER_ADMIN'
        ? (inviteData.organizationId || currentUser?.organizationId || '')
        : currentUser?.organizationId || '';

    const selectedUserTeacherOptions = useMemo(() => {
        return users.filter((user) => {
            if (user.role !== 'TEACHER') {
                return false;
            }

            if (!selectedUserOrganizationId) {
                return true;
            }

            return user.organizationId === selectedUserOrganizationId;
        });
    }, [selectedUserOrganizationId, users]);

    const selectedUserDepartmentOptions = useMemo(() => {
        return departments.filter((department) => {
            if (!selectedUserOrganizationId) {
                return true;
            }

            return department.organizationId === selectedUserOrganizationId;
        });
    }, [departments, selectedUserOrganizationId]);

    const inviteTeacherOptions = useMemo(() => {
        return users.filter((user) => {
            if (user.role !== 'TEACHER') {
                return false;
            }

            if (!inviteOrganizationId) {
                return true;
            }

            return user.organizationId === inviteOrganizationId;
        });
    }, [inviteOrganizationId, users]);

    const departmentAdminOptions = useMemo(() => {
        return users.filter((user) => {
            if (!['ADMIN', 'DEPT_ADMIN', 'TEACHER'].includes(user.role)) {
                return false;
            }

            if (!selectedDepartmentOrganizationId) {
                return true;
            }

            return user.organizationId === selectedDepartmentOrganizationId;
        });
    }, [selectedDepartmentOrganizationId, users]);

    const availableStaff = useMemo(() => {
        return users.filter((user) => {
            if (!['ADMIN', 'DEPT_ADMIN', 'TEACHER'].includes(user.role)) {
                return false;
            }

            if (!selectedDepartmentOrganizationId) {
                return true;
            }

            return user.organizationId === selectedDepartmentOrganizationId;
        });
    }, [selectedDepartmentOrganizationId, users]);

    const availableStudents = useMemo(() => {
        return users.filter((user) => {
            if (user.role !== 'STUDENT') {
                return false;
            }

            if (!selectedDepartmentOrganizationId) {
                return true;
            }

            return user.organizationId === selectedDepartmentOrganizationId;
        });
    }, [selectedDepartmentOrganizationId, users]);

    const availableRoleOptions = useMemo(() => {
        if (currentUser?.role === 'SUPER_ADMIN') {
            return ROLE_OPTIONS;
        }

        if (currentUser?.role === 'ADMIN') {
            return ROLE_OPTIONS.filter((option) => option.value !== 'SUPER_ADMIN');
        }

        return ROLE_OPTIONS.filter((option) => option.value === 'TEACHER' || option.value === 'STUDENT');
    }, [currentUser?.role]);

    const inviteDepartmentOptions = useMemo(() => {
        return departments.filter((department) => {
            if (!inviteOrganizationId) {
                return true;
            }

            return department.organizationId === inviteOrganizationId;
        });
    }, [departments, inviteOrganizationId]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const matchesTab = (user) => {
            if (activeTab === 'STUDENTS') {
                return user.role === 'STUDENT';
            }

            if (activeTab === 'TEACHERS') {
                return user.role === 'TEACHER';
            }

            if (activeTab === 'ADMINS') {
                return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'DEPT_ADMIN';
            }

            return false;
        };

        return users.filter((user) => {
            if (!matchesTab(user)) {
                return false;
            }

            if (!normalizedSearch) {
                return selectedOrganizationFilter === 'ALL' || user.organizationId === selectedOrganizationFilter;
            }

            const matchesOrganization = selectedOrganizationFilter === 'ALL' || user.organizationId === selectedOrganizationFilter;
            return matchesOrganization && [
                user.profileName,
                user.email,
                normalizeUserCardDepartment(user),
                user.assignedTeacher?.profileName,
                user.university?.name,
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [activeTab, searchQuery, selectedOrganizationFilter, users]);

    const filteredDepartments = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        return departments.filter((department) => {
            if (selectedOrganizationFilter !== 'ALL' && department.organizationId !== selectedOrganizationFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            return [
                department.name,
                department.admin?.profileName,
                department.universityName,
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [departments, searchQuery, selectedOrganizationFilter]);

    useEffect(() => {
        if (activeTab === 'DEPARTMENTS') {
            if (creatingDepartment) {
                return;
            }

            if (!filteredDepartments.length) {
                setSelectedDepartmentId(null);
                return;
            }

            if (!selectedDepartmentId || !filteredDepartments.some((department) => department.id === selectedDepartmentId)) {
                setSelectedDepartmentId(filteredDepartments[0].id);
            }

            return;
        }

        if (!filteredUsers.length) {
            setSelectedUserId(null);
            return;
        }

        if (!selectedUserId || !filteredUsers.some((user) => user.id === selectedUserId)) {
            setSelectedUserId(filteredUsers[0].id);
        }
    }, [activeTab, creatingDepartment, filteredDepartments, filteredUsers, selectedDepartmentId, selectedUserId]);

    useEffect(() => {
        if (!selectedUser) {
            setUserForm(emptyUserForm());
            return;
        }

        const matchingDepartment = departments.find((department) => department.name === selectedUser.departmentInfo?.name);
        setUserForm({
            role: selectedUser.role,
            status: selectedUser.status || 'ACTIVE',
            departmentId: selectedUser.departmentId || matchingDepartment?.id || '',
            teacherId: selectedUser.assignedTeacher?.id || '',
            managedDepartmentId: selectedUser.managedDepartments?.[0]?.id || '',
            groupMemberships: formatGroupDrafts(selectedUser.groupMemberships),
        });
    }, [departments, selectedUser]);

    useEffect(() => {
        if (creatingDepartment) {
            setDepartmentForm(emptyDepartmentForm());
            return;
        }

        if (!selectedDepartment) {
            setDepartmentForm(emptyDepartmentForm());
            return;
        }

        setDepartmentForm({
            id: selectedDepartment.id,
            name: selectedDepartment.name,
            status: selectedDepartment.status,
            organizationId: selectedDepartment.organizationId || '',
            adminId: selectedDepartment.admin?.id || '',
            staffMemberIds: (selectedDepartment.staffMembers || []).map((member) => member.id),
            studentIds: (selectedDepartment.studentMembers || []).map((member) => member.id),
        });
    }, [creatingDepartment, selectedDepartment]);

    useEffect(() => {
        setInviteData((current) => {
            const nextDepartmentId = inviteDepartmentOptions.some((department) => department.id === current.departmentId)
                ? current.departmentId
                : '';
            const nextManagedDepartmentId = inviteDepartmentOptions.some((department) => department.id === current.managedDepartmentId)
                ? current.managedDepartmentId
                : '';
            const nextTeacherId = inviteTeacherOptions.some((teacher) => teacher.id === current.teacherId)
                ? current.teacherId
                : '';

            if (
                nextDepartmentId === current.departmentId
                && nextManagedDepartmentId === current.managedDepartmentId
                && nextTeacherId === current.teacherId
            ) {
                return current;
            }

            return {
                ...current,
                departmentId: nextDepartmentId,
                managedDepartmentId: nextManagedDepartmentId,
                teacherId: nextTeacherId,
            };
        });
    }, [inviteDepartmentOptions, inviteTeacherOptions]);

    const summaryCards = [
        {
            label: 'Students',
            value: users.filter((user) => user.role === 'STUDENT').length,
        },
        {
            label: 'Teachers',
            value: users.filter((user) => user.role === 'TEACHER').length,
        },
        {
            label: 'Admin Roles',
            value: users.filter((user) => ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN'].includes(user.role)).length,
        },
        {
            label: 'Departments',
            value: departments.length,
        },
        {
            label: 'Organizations',
            value: organizations.length || (currentUser?.organizationId ? 1 : 0),
        },
    ];

    const handleInvite = async (event) => {
        event.preventDefault();
        setInviting(true);

        try {
            const payload = {
                ...inviteData,
                organizationId: currentUser?.role === 'SUPER_ADMIN'
                    ? inviteData.organizationId || currentUser?.organizationId || ''
                    : currentUser?.organizationId,
            };

            await api.post('/admin/users/invite', payload);
            setShowInviteModal(false);
            setInviteData(emptyInviteData());
            await fetchAccessControlData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleSaveUser = async () => {
        if (!selectedUser) {
            return;
        }

        setSavingUser(true);

        try {
            const payload = {
                role: userForm.role,
                status: userForm.status,
                departmentId: userForm.departmentId || null,
                teacherId: userForm.role === 'STUDENT' ? userForm.teacherId || null : null,
                managedDepartmentId: userForm.role === 'DEPT_ADMIN' ? userForm.managedDepartmentId || null : null,
                groupMemberships: userForm.groupMemberships
                    .map((group) => ({
                        name: group.name.trim(),
                        role: group.role.trim() || null,
                        status: group.status || 'ACTIVE',
                        description: group.description.trim() || null,
                    }))
                    .filter((group) => group.name),
            };

            await api.patch(`/admin/users/${selectedUser.id}/access`, payload);
            await fetchAccessControlData({ userId: selectedUser.id, departmentId: selectedDepartmentId });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update user access');
        } finally {
            setSavingUser(false);
        }
    };

    const handleSaveDepartment = async () => {
        setSavingDepartment(true);

        try {
            const payload = {
                name: departmentForm.name.trim(),
                status: departmentForm.status,
                organizationId: currentUser?.role === 'SUPER_ADMIN'
                    ? departmentForm.organizationId || currentUser?.organizationId || ''
                    : currentUser?.organizationId,
                adminId: departmentForm.adminId || null,
                staffMemberIds: departmentForm.staffMemberIds,
                studentIds: departmentForm.studentIds,
            };

            if (!payload.name) {
                alert('Department name is required');
                setSavingDepartment(false);
                return;
            }

            if (!payload.organizationId) {
                alert('Organization is required');
                setSavingDepartment(false);
                return;
            }

            if (creatingDepartment || !departmentForm.id) {
                const res = await api.post('/admin/departments', payload);
                setCreatingDepartment(false);
                await fetchAccessControlData({ departmentId: res.data?.id || null });
                setSelectedDepartmentId(res.data?.id || null);
            } else {
                await api.patch(`/admin/departments/${departmentForm.id}`, payload);
                await fetchAccessControlData({ departmentId: departmentForm.id, userId: selectedUserId });
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save department');
        } finally {
            setSavingDepartment(false);
        }
    };

    const updateGroupField = (index, field, value) => {
        setUserForm((current) => ({
            ...current,
            groupMemberships: current.groupMemberships.map((group, groupIndex) => (
                groupIndex === index ? { ...group, [field]: value } : group
            )),
        }));
    };

    const removeGroup = (index) => {
        setUserForm((current) => ({
            ...current,
            groupMemberships: current.groupMemberships.filter((_, groupIndex) => groupIndex !== index),
        }));
    };

    const toggleDepartmentStaffMember = (userId) => {
        setDepartmentForm((current) => ({
            ...current,
            staffMemberIds: current.staffMemberIds.includes(userId)
                ? current.staffMemberIds.filter((id) => id !== userId)
                : [...current.staffMemberIds, userId],
        }));
    };

    const toggleDepartmentStudentMember = (userId) => {
        setDepartmentForm((current) => ({
            ...current,
            studentIds: current.studentIds.includes(userId)
                ? current.studentIds.filter((id) => id !== userId)
                : [...current.studentIds, userId],
        }));
    };

    const openCreateDepartment = () => {
        setActiveTab('DEPARTMENTS');
        setCreatingDepartment(true);
        setSelectedDepartmentId(null);
        setDepartmentForm({
            ...emptyDepartmentForm(),
            organizationId: currentUser?.role === 'SUPER_ADMIN'
                ? (selectedOrganizationFilter !== 'ALL' ? selectedOrganizationFilter : currentUser?.organizationId || '')
                : currentUser?.organizationId || '',
        });
    };

    const openInviteModal = () => {
        setInviteData({
            ...emptyInviteData(),
            organizationId: currentUser?.role === 'SUPER_ADMIN'
                ? (selectedOrganizationFilter !== 'ALL' ? selectedOrganizationFilter : currentUser?.organizationId || '')
                : currentUser?.organizationId || '',
        });
        setShowInviteModal(true);
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteData(emptyInviteData());
    };

    const renderUserCards = () => {
        if (!filteredUsers.length) {
            return (
                <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 px-6 py-12 text-center text-gray-500 font-medium">
                    No users match this filter yet.
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredUsers.map((user) => (
                    <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full text-left bg-white rounded-[2rem] border px-6 py-5 shadow-sm transition-all ${selectedUserId === user.id
                            ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black">
                                    {user.profileName?.[0] || 'U'}
                                </div>
                                <div>
                                    <div className="text-lg font-black text-gray-900">{user.profileName}</div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1">
                                        <Mail size={14} />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 font-medium mt-3">
                                        {normalizeUserCardDepartment(user)}
                                    </div>
                                    <div className="text-sm text-gray-400 font-medium mt-1">
                                        {user.university?.name || 'No organization assigned'}
                                    </div>
                                    {user.assignedTeacher?.profileName && (
                                        <div className="text-sm text-primary-600 font-semibold mt-1">
                                            Teacher: {user.assignedTeacher.profileName}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${roleBadgeClass[user.role] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                    {roleLabel[user.role] || user.role}
                                </span>
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[user.status] || statusBadgeClass.ACTIVE}`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderDepartmentCards = () => {
        if (!filteredDepartments.length) {
            return (
                <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 px-6 py-12 text-center text-gray-500 font-medium">
                    No departments exist yet.
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredDepartments.map((department) => (
                    <button
                        key={department.id}
                        type="button"
                        onClick={() => {
                            setCreatingDepartment(false);
                            setSelectedDepartmentId(department.id);
                        }}
                        className={`w-full text-left bg-white rounded-[2rem] border px-6 py-5 shadow-sm transition-all ${!creatingDepartment && selectedDepartmentId === department.id
                            ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-lg font-black text-gray-900">{department.name}</div>
                                <div className="text-sm text-gray-500 font-medium mt-2">
                                    University: {department.universityName || 'Current organization'}
                                </div>
                                <div className="text-sm text-primary-600 font-semibold mt-1">
                                    Admin: {department.admin?.profileName || 'Not assigned'}
                                </div>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    Staff assigned: {department.staffCount} • Students assigned: {department.studentCount}
                                </div>
                            </div>

                            <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[department.status] || statusBadgeClass.ACTIVE}`}>
                                {department.status}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderUserDetails = () => {
        if (!selectedUser) {
            return (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 text-center text-gray-500 font-medium">
                    Select a user card to review profile essentials and assignments.
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                        <div>
                            <div className="text-3xl font-black text-gray-900">{selectedUser.profileName}</div>
                            <div className="flex items-center gap-2 text-gray-500 font-medium mt-2">
                                <Mail size={16} />
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <span className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${roleBadgeClass[selectedUser.role] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                    {roleLabel[selectedUser.role] || selectedUser.role}
                                </span>
                                <span className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass[selectedUser.status] || statusBadgeClass.ACTIVE}`}>
                                    {selectedUser.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 min-w-[320px]">
                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                    <Building2 size={12} />
                                    <span>University</span>
                                </div>
                                <div className="text-lg font-black text-gray-900">{selectedUser.university?.name || 'Not assigned'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                    <GraduationCap size={12} />
                                    <span>Department</span>
                                </div>
                                <div className="text-lg font-black text-gray-900">{normalizeUserCardDepartment(selectedUser)}</div>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    {selectedUser.departmentInfo?.status ? `Department status: ${selectedUser.departmentInfo.status}` : 'Department status not set'}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                    <UserCheck size={12} />
                                    <span>Assigned Teacher</span>
                                </div>
                                <div className="text-lg font-black text-gray-900">{selectedUser.assignedTeacher?.profileName || 'Not assigned'}</div>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    {selectedUser.assignedTeacher?.email || 'No teacher linked yet'}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                    <Layers size={12} />
                                    <span>Managed Department</span>
                                </div>
                                <div className="text-lg font-black text-gray-900">{selectedUser.managedDepartments?.[0]?.name || 'None assigned'}</div>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    {selectedUser.managedDepartments?.[0]?.status ? `Status: ${selectedUser.managedDepartments[0].status}` : 'No department admin assignment'}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                                    <Building2 size={12} />
                                    <span>Organization</span>
                                </div>
                                <div className="text-lg font-black text-gray-900">{selectedUser.university?.name || 'Not assigned'}</div>
                                <div className="text-sm text-gray-500 font-medium mt-1">
                                    {selectedUser.university?.subdomain || 'No subdomain available'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Assignments And Role Control</h2>
                            <p className="text-gray-500 font-medium">Update the user role, department access, teacher mapping, and organization responsibilities.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSaveUser}
                            disabled={savingUser}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition disabled:opacity-60"
                        >
                            {savingUser ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Save User</span>
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">System Role</label>
                            <select
                                value={userForm.role}
                                onChange={(event) => setUserForm((current) => ({
                                    ...current,
                                    role: event.target.value,
                                    teacherId: event.target.value === 'STUDENT' ? current.teacherId : '',
                                    managedDepartmentId: event.target.value === 'DEPT_ADMIN' ? current.managedDepartmentId : '',
                                }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                            >
                                {availableRoleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Status</label>
                            <select
                                value={userForm.status}
                                onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                            >
                                {USER_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Department</label>
                            <select
                                value={userForm.departmentId}
                                onChange={(event) => setUserForm((current) => ({ ...current, departmentId: event.target.value }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                            >
                                <option value="">No department</option>
                                {selectedUserDepartmentOptions.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name} ({department.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">University</label>
                            <div className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700">
                                {selectedUser.university?.name || 'Current organization'}
                            </div>
                        </div>

                        {userForm.role === 'STUDENT' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned Teacher</label>
                                <select
                                    value={userForm.teacherId}
                                    onChange={(event) => setUserForm((current) => ({ ...current, teacherId: event.target.value }))}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                >
                                    <option value="">No teacher</option>
                                    {selectedUserTeacherOptions.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>{teacher.profileName}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {userForm.role === 'DEPT_ADMIN' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Managed Department</label>
                                <select
                                    value={userForm.managedDepartmentId}
                                    onChange={(event) => setUserForm((current) => ({ ...current, managedDepartmentId: event.target.value }))}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                >
                                    <option value="">No managed department</option>
                                    {selectedUserDepartmentOptions.map((department) => (
                                        <option key={department.id} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Groups And Membership Status</h2>
                            <p className="text-gray-500 font-medium">Track every group this user belongs to and whether each membership is active or inactive.</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setUserForm((current) => ({
                                ...current,
                                groupMemberships: [...current.groupMemberships, createGroupDraft()],
                            }))}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition"
                        >
                            <Plus size={16} />
                            <span>Add Group</span>
                        </button>
                    </div>

                    {userForm.groupMemberships.length === 0 ? (
                        <div className="bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-200 px-6 py-10 text-center text-gray-500 font-medium">
                            No groups assigned yet for this user.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userForm.groupMemberships.map((group, index) => (
                                <div key={`${selectedUser.id}-group-${index}`} className="bg-gray-50 rounded-[1.75rem] border border-gray-100 p-5">
                                    <div className="grid lg:grid-cols-[1.3fr_1fr_180px_auto] gap-4 items-start">
                                        <input
                                            type="text"
                                            value={group.name}
                                            onChange={(event) => updateGroupField(index, 'name', event.target.value)}
                                            placeholder="Group name"
                                            className="px-4 py-3 rounded-2xl bg-white border border-gray-100 font-bold"
                                        />
                                        <input
                                            type="text"
                                            value={group.role}
                                            onChange={(event) => updateGroupField(index, 'role', event.target.value)}
                                            placeholder="Membership role"
                                            className="px-4 py-3 rounded-2xl bg-white border border-gray-100 font-bold"
                                        />
                                        <select
                                            value={group.status}
                                            onChange={(event) => updateGroupField(index, 'status', event.target.value)}
                                            className="px-4 py-3 rounded-2xl bg-white border border-gray-100 font-bold"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => removeGroup(index)}
                                            className="px-4 py-3 rounded-2xl bg-white border border-rose-100 text-rose-500 font-bold hover:bg-rose-50 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <textarea
                                        value={group.description}
                                        onChange={(event) => updateGroupField(index, 'description', event.target.value)}
                                        rows={2}
                                        placeholder="Short description for this membership"
                                        className="mt-4 w-full px-4 py-3 rounded-2xl bg-white border border-gray-100 font-medium resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDepartmentDetails = () => {
        if (!creatingDepartment && !selectedDepartment) {
            return (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 text-center text-gray-500 font-medium">
                    Select a department card or create a new department to manage admins and available staff.
                </div>
            );
        }

        const currentDepartment = creatingDepartment ? null : selectedDepartment;
        const assignedStaffIds = new Set(departmentForm.staffMemberIds);
        const assignedStudentIds = new Set(departmentForm.studentIds);
        const currentOrganizationName = currentDepartment?.universityName
            || organizations.find((organization) => organization.id === departmentForm.organizationId)?.name
            || currentUser?.university?.name
            || currentUser?.organization?.name
            || 'Current organization';

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between gap-6 mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">
                                {creatingDepartment ? 'Create Department' : currentDepartment?.name || 'Department Details'}
                            </h2>
                            <p className="text-gray-500 font-medium">
                                Assign the department admin, mark the department active or inactive, and attach available staff from this organization.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveDepartment}
                            disabled={savingDepartment}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition disabled:opacity-60"
                        >
                            {savingDepartment ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{creatingDepartment ? 'Create Department' : 'Save Department'}</span>
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Department Name</label>
                            <input
                                type="text"
                                value={departmentForm.name}
                                onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                placeholder="Computer Science"
                            />
                        </div>

                        {currentUser?.role === 'SUPER_ADMIN' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization</label>
                                <select
                                    value={departmentForm.organizationId}
                                    onChange={(event) => setDepartmentForm((current) => ({
                                        ...current,
                                        organizationId: event.target.value,
                                        adminId: '',
                                        staffMemberIds: [],
                                        studentIds: [],
                                    }))}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                >
                                    <option value="">Select organization</option>
                                    {organizations.map((organization) => (
                                        <option key={organization.id} value={organization.id}>{organization.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Department Status</label>
                            <select
                                value={departmentForm.status}
                                onChange={(event) => setDepartmentForm((current) => ({ ...current, status: event.target.value }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                            >
                                {DEPARTMENT_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Department Admin</label>
                            <select
                                value={departmentForm.adminId}
                                onChange={(event) => setDepartmentForm((current) => ({ ...current, adminId: event.target.value }))}
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                            >
                                <option value="">No department admin</option>
                                {departmentAdminOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.profileName} ({roleLabel[user.role] || user.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization</label>
                            <div className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700">
                                {currentOrganizationName}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Available Teachers And Staff</h2>
                            <p className="text-gray-500 font-medium">Select the available organization staff who should belong to this department.</p>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600">
                            {departmentForm.staffMemberIds.length} assigned
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {availableStaff.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => toggleDepartmentStaffMember(user.id)}
                                className={`text-left rounded-[1.75rem] border px-5 py-4 transition-all ${assignedStaffIds.has(user.id)
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-black text-gray-900">{user.profileName}</div>
                                        <div className="text-sm text-gray-500 font-medium mt-1">{user.email}</div>
                                        <div className="text-sm text-primary-600 font-semibold mt-2">{roleLabel[user.role] || user.role}</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${assignedStaffIds.has(user.id)
                                        ? 'bg-white text-primary-600 border-primary-100'
                                        : statusBadgeClass[user.status] || statusBadgeClass.ACTIVE
                                        }`}>
                                        {assignedStaffIds.has(user.id) ? 'ASSIGNED' : user.status}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Available Students</h2>
                            <p className="text-gray-500 font-medium">Assign the students who belong to this department and should inherit this department name.</p>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-600">
                            {departmentForm.studentIds.length} assigned
                        </div>
                    </div>

                    {availableStudents.length === 0 ? (
                        <div className="bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-200 px-6 py-10 text-center text-gray-500 font-medium">
                            No students are available in this organization yet.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {availableStudents.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => toggleDepartmentStudentMember(user.id)}
                                    className={`text-left rounded-[1.75rem] border px-5 py-4 transition-all ${assignedStudentIds.has(user.id)
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="font-black text-gray-900">{user.profileName}</div>
                                            <div className="text-sm text-gray-500 font-medium mt-1">{user.email}</div>
                                            <div className="text-sm text-primary-600 font-semibold mt-2">
                                                Teacher: {user.assignedTeacher?.profileName || 'Not assigned'}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${assignedStudentIds.has(user.id)
                                            ? 'bg-white text-primary-600 border-primary-100'
                                            : statusBadgeClass[user.status] || statusBadgeClass.ACTIVE
                                            }`}>
                                            {assignedStudentIds.has(user.id) ? 'ASSIGNED' : user.status}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role={currentUser?.role || 'ADMIN'} />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={currentUser?.role || 'ADMIN'} />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Access Control</h1>
                        <p className="text-gray-500 font-medium">Separate student, teacher, admin, and department views with detailed assignment control.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={openInviteModal}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg"
                        >
                            <UserPlus size={18} />
                            <span>Invite User</span>
                        </button>
                        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                            <button
                                type="button"
                                onClick={openCreateDepartment}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/20"
                            >
                                <Plus size={18} />
                                <span>Create Department</span>
                            </button>
                        )}
                    </div>
                </header>

                <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
                    {summaryCards.map((card) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm"
                        >
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</div>
                            <div className="text-3xl font-black text-gray-900">{card.value}</div>
                        </motion.div>
                    ))}
                </section>

                <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 mb-8">
                    <div className="flex flex-wrap gap-3">
                        {USER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setSearchQuery('');
                                    if (tab.key !== 'DEPARTMENTS') {
                                        setCreatingDepartment(false);
                                    }
                                }}
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

                <section className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
                            <div className="space-y-4">
                                {currentUser?.role === 'SUPER_ADMIN' && (
                                    <select
                                        value={selectedOrganizationFilter}
                                        onChange={(event) => setSelectedOrganizationFilter(event.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700"
                                    >
                                        <option value="ALL">All organizations</option>
                                        {organizations.map((organization) => (
                                            <option key={organization.id} value={organization.id}>{organization.name}</option>
                                        ))}
                                    </select>
                                )}

                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder={activeTab === 'DEPARTMENTS' ? 'Search departments or admins...' : 'Search users by name, email, department...'}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {activeTab === 'DEPARTMENTS' ? renderDepartmentCards() : renderUserCards()}
                    </div>

                    <div>
                        {activeTab === 'DEPARTMENTS' ? renderDepartmentDetails() : renderUserDetails()}
                    </div>
                </section>
            </main>

            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                            onClick={closeInviteModal}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 70, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 70, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-900 text-white rounded-2xl">
                                        <UserCircle size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900">Invite User</h2>
                                        <p className="text-gray-500 font-medium">Create a new user with the right department and access role.</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeInviteModal}
                                    className="p-2 text-gray-400 hover:text-gray-900 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={inviteData.firstName}
                                            onChange={(event) => setInviteData((current) => ({ ...current, firstName: event.target.value }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                            placeholder="Alex"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={inviteData.lastName}
                                            onChange={(event) => setInviteData((current) => ({ ...current, lastName: event.target.value }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                            placeholder="Learner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteData.email}
                                        onChange={(event) => setInviteData((current) => ({ ...current, email: event.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        placeholder="alex@fluentpro.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Default Password</label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteData.password}
                                        onChange={(event) => setInviteData((current) => ({ ...current, password: event.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        placeholder="Enter a default password for the user"
                                    />
                                </div>

                                <div className={`grid gap-4 ${currentUser?.role === 'SUPER_ADMIN' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                                    {currentUser?.role === 'SUPER_ADMIN' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization</label>
                                            <select
                                                value={inviteData.organizationId}
                                                onChange={(event) => setInviteData((current) => ({
                                                    ...current,
                                                    organizationId: event.target.value,
                                                    departmentId: '',
                                                    teacherId: '',
                                                    managedDepartmentId: '',
                                                }))}
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                            >
                                                <option value="">Select organization</option>
                                                {organizations.map((organization) => (
                                                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Role</label>
                                        <select
                                            value={inviteData.role}
                                            onChange={(event) => setInviteData((current) => ({
                                                ...current,
                                                role: event.target.value,
                                                teacherId: event.target.value === 'STUDENT' ? current.teacherId : '',
                                                managedDepartmentId: event.target.value === 'DEPT_ADMIN' ? current.managedDepartmentId : '',
                                            }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        >
                                            {availableRoleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Department</label>
                                        <select
                                            value={inviteData.departmentId}
                                            onChange={(event) => setInviteData((current) => ({ ...current, departmentId: event.target.value }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        >
                                            <option value="">No department</option>
                                            {inviteDepartmentOptions.map((department) => (
                                                <option key={department.id} value={department.id}>{department.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {inviteData.role === 'STUDENT' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned Teacher</label>
                                        <select
                                            value={inviteData.teacherId}
                                            onChange={(event) => setInviteData((current) => ({ ...current, teacherId: event.target.value }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        >
                                            <option value="">No teacher</option>
                                            {inviteTeacherOptions.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>{teacher.profileName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {inviteData.role === 'DEPT_ADMIN' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Managed Department</label>
                                        <select
                                            value={inviteData.managedDepartmentId}
                                            onChange={(event) => setInviteData((current) => ({ ...current, managedDepartmentId: event.target.value }))}
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        >
                                            <option value="">No managed department</option>
                                            {inviteDepartmentOptions.map((department) => (
                                                <option key={department.id} value={department.id}>{department.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Groups</label>
                                    <input
                                        type="text"
                                        value={inviteData.groupMemberships}
                                        onChange={(event) => setInviteData((current) => ({ ...current, groupMemberships: event.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold"
                                        placeholder="Section A, Debate Club, Presentation Lab"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg hover:bg-black transition disabled:opacity-60"
                                >
                                    {inviting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                    <span>Send Invitation</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
