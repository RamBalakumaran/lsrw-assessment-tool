import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Users, AlertCircle, CheckCircle2, X, Upload, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const GroupManagement = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        academicYear: new Date().getFullYear().toString(),
        section: '',
        departmentId: '',
        status: 'ACTIVE'
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);

    // Bulk Import state
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkGroup, setBulkGroup] = useState(null);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkPreview, setBulkPreview] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState('');
    const fileInputRef = useRef(null);

    // Fetch data on component mount
    useEffect(() => {
        fetchGroups();
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/groups');
            setGroups(res.data || []);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data || []);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setAvailableUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            academicYear: new Date().getFullYear().toString(),
            section: '',
            departmentId: '',
            status: 'ACTIVE'
        });
        setErrors({});
        setSelectedMembers([]);
    };

    const handleOpenCreateModal = () => {
        setEditingGroup(null);
        resetForm();
        setShowModal(true);
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
            academicYear: group.academicYear || '',
            section: group.section || '',
            departmentId: group.departmentId,
            status: group.status
        });
        setShowModal(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Group name is required';
        if (!formData.departmentId) newErrors.departmentId = 'Department is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitGroup = async () => {
        if (!validateForm()) return;

        try {
            if (editingGroup) {
                await api.put(`/api/groups/${editingGroup.id}`, formData);
                setSuccess('Group updated successfully');
            } else {
                await api.post('/api/groups', formData);
                setSuccess('Group created successfully');
            }
            setShowModal(false);
            fetchGroups();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setErrors({
                submit: err.response?.data?.error || 'Failed to save group'
            });
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;

        try {
            await api.delete(`/api/groups/${groupId}`);
            setSuccess('Group deleted successfully');
            fetchGroups();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setErrors({
                submit: err.response?.data?.error || 'Failed to delete group'
            });
        }
    };

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) {
            setErrors({ members: 'Select at least one member' });
            return;
        }

        try {
            await api.post(`/api/groups/${selectedGroupForMembers.id}/members`, {
                userIds: selectedMembers,
                role: 'COLLABORATOR'
            });
            setSuccess('Members added successfully');
            setShowAddMembersModal(false);
            setSelectedMembers([]);
            fetchGroups();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setErrors({
                members: err.response?.data?.error || 'Failed to add members'
            });
        }
    };

    const handleRemoveMember = async (groupId, memberId) => {
        if (!window.confirm('Remove this member?')) return;

        try {
            await api.delete(`/api/groups/${groupId}/members/${memberId}`);
            fetchGroups();
        } catch (err) {
            setErrors({ submit: 'Failed to remove member' });
        }
    };

    // Bulk Import Handlers
    const openBulkModal = (group) => {
        setBulkGroup(group);
        setBulkFile(null);
        setBulkPreview(null);
        setBulkError('');
        setBulkSuccess('');
        setShowBulkModal(true);
    };

    const handleBulkFileChange = (e) => {
        setBulkFile(e.target.files[0] || null);
        setBulkPreview(null);
        setBulkError('');
    };

    const handleBulkValidate = async () => {
        if (!bulkFile) { setBulkError('Please select an Excel file.'); return; }
        setBulkLoading(true); setBulkError('');
        try {
            const fd = new FormData();
            fd.append('file', bulkFile);
            const res = await api.post(`/api/groups/${bulkGroup.id}/bulk-validate`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBulkPreview(res.data);
        } catch (err) {
            setBulkError(err.response?.data?.error || 'Validation failed.');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkConfirm = async () => {
        if (!bulkPreview) return;
        const validRows = bulkPreview.preview.filter(r => r.valid);
        if (validRows.length === 0) { setBulkError('No valid rows to import.'); return; }
        setBulkLoading(true); setBulkError('');
        try {
            const res = await api.post(`/api/groups/${bulkGroup.id}/bulk-confirm`, { students: validRows });
            setBulkSuccess(res.data.message);
            setBulkPreview(null);
            fetchGroups();
            setTimeout(() => { setShowBulkModal(false); setBulkSuccess(''); }, 2500);
        } catch (err) {
            setBulkError(err.response?.data?.error || 'Import failed.');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get('/api/groups/bulk-template', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'bulk_students_template.xlsx'; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Template download failed', err);
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Loading groups...</div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Group Management</h2>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                    <Plus size={20} className="mr-2" /> Create Group
                </button>
            </div>

            {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
                    <CheckCircle2 className="mr-2" />
                    {success}
                </div>
            )}

            {errors.submit && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                    <AlertCircle className="mr-2" />
                    {errors.submit}
                </div>
            )}

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                                {group.section && (
                                    <p className="text-sm text-gray-600">Section: {group.section}</p>
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${
                                group.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {group.status}
                            </span>
                        </div>

                        {group.description && (
                            <p className="text-gray-700 text-sm mb-4">{group.description}</p>
                        )}

                        <div className="mb-4">
                            <div className="flex items-center text-gray-600 mb-2">
                                <Users size={16} className="mr-2" />
                                <span className="font-semibold">{group.members.length} Members</span>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {group.members.slice(0, 3).map(member => (
                                    <div key={member.id} className="text-sm text-gray-700">
                                        <span className="font-medium">{member.user.email}</span>
                                        <span className="text-gray-500 ml-2">({member.role})</span>
                                    </div>
                                ))}
                                {group.members.length > 3 && (
                                    <div className="text-sm text-gray-500 italic">
                                        +{group.members.length - 3} more...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                            {group.ownerId === JSON.parse(localStorage.getItem('user') || '{}').id && (
                                <>
                                    <button
                                        onClick={() => {
                                            setSelectedGroupForMembers(group);
                                            setShowAddMembersModal(true);
                                            setSelectedMembers([]);
                                        }}
                                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-semibold"
                                    >
                                        <Users size={14} className="inline mr-1" /> Add Members
                                    </button>
                                    <button
                                        onClick={() => openBulkModal(group)}
                                        className="flex-1 px-3 py-2 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 text-sm font-semibold"
                                        title="Bulk Import Students"
                                    >
                                        <Upload size={14} className="inline mr-1" /> Bulk Import
                                    </button>
                                    <button
                                        onClick={() => handleEditGroup(group)}
                                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        <Edit2 size={14} className="inline mr-1" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                        <Trash2 size={14} className="inline mr-1" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No groups yet. Create one to get started!</p>
                </div>
            )}

            {/* Create/Edit Group Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {editingGroup ? 'Edit Group' : 'Create Group'}
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold mb-1">Group Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., Class A1 - 2024"
                                />
                                {errors.name && <span className="text-red-600 text-sm">{errors.name}</span>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Department *</label>
                                <select
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                                    className={`w-full p-2 border rounded ${errors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                {errors.departmentId && <span className="text-red-600 text-sm">{errors.departmentId}</span>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Optional description..."
                                    rows="2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-1">Academic Year</label>
                                    <input
                                        type="text"
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                                        placeholder="e.g., 2024-2025"
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">Section</label>
                                    <input
                                        type="text"
                                        value={formData.section}
                                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                                        placeholder="e.g., A1"
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                    {errors.submit}
                                </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitGroup}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {editingGroup ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Members Modal */}
            {showAddMembersModal && selectedGroupForMembers && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add Members</h3>
                            <button onClick={() => setShowAddMembersModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            {availableUsers.map(user => (
                                <label key={user.id} className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(user.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMembers([...selectedMembers, user.id]);
                                            } else {
                                                setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="flex-1">{user.email}</span>
                                    <span className="text-sm text-gray-600">{user.role}</span>
                                </label>
                            ))}
                        </div>

                        {errors.members && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm mb-4">
                                {errors.members}
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                            <button
                                onClick={() => setShowAddMembersModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMembers}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Add Members
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== BULK IMPORT MODAL ===== */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileSpreadsheet size={22} className="text-violet-600" />
                                    Bulk Import Students
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">Group: <span className="font-semibold text-gray-700">{bulkGroup?.name}</span></p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Step 1 – File picker */}
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Excel File (.xlsx)</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleBulkFileChange}
                                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                    />
                                </div>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                                >
                                    <Download size={14} /> Template
                                </button>
                                <button
                                    onClick={handleBulkValidate}
                                    disabled={bulkLoading || !bulkFile}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                                >
                                    {bulkLoading ? 'Validating…' : 'Validate'}
                                </button>
                            </div>

                            {/* Error / Success */}
                            {bulkError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} /> {bulkError}
                                </div>
                            )}
                            {bulkSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
                                    <CheckCircle2 size={16} /> {bulkSuccess}
                                </div>
                            )}

                            {/* Preview Table */}
                            {bulkPreview && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-gray-700">
                                            Preview: <span className="text-emerald-600">{bulkPreview.validCount} valid</span> / {bulkPreview.totalRows} rows
                                        </p>
                                        {bulkPreview.validCount < bulkPreview.totalRows && (
                                            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                                <AlertTriangle size={13} /> {bulkPreview.totalRows - bulkPreview.validCount} rows have errors — only valid rows will be imported
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Row</th>
                                                    <th className="px-3 py-2 text-left">Reg No.</th>
                                                    <th className="px-3 py-2 text-left">Name</th>
                                                    <th className="px-3 py-2 text-left">Year</th>
                                                    <th className="px-3 py-2 text-left">Section</th>
                                                    <th className="px-3 py-2 text-left">Email</th>
                                                    <th className="px-3 py-2 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkPreview.preview.map((row, i) => (
                                                    <tr key={i} className={row.valid ? 'bg-white' : 'bg-rose-50'}>
                                                        <td className="px-3 py-2 text-gray-500">{row.rowIndex}</td>
                                                        <td className="px-3 py-2 font-mono font-semibold">{row.registrationNumber || '—'}</td>
                                                        <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                                                        <td className="px-3 py-2">{row.academicYear}</td>
                                                        <td className="px-3 py-2">{row.section || '—'}</td>
                                                        <td className="px-3 py-2 text-gray-500">{row.derivedEmail}</td>
                                                        <td className="px-3 py-2">
                                                            {row.valid
                                                                ? <span className="text-emerald-600 font-bold">✓ OK</span>
                                                                : <span className="text-rose-600 font-bold" title={row.errors.join('\n')}>✗ {row.errors[0]}</span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t flex gap-3">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                Cancel
                            </button>
                            {bulkPreview && bulkPreview.validCount > 0 && (
                                <button
                                    onClick={handleBulkConfirm}
                                    disabled={bulkLoading}
                                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold disabled:opacity-50"
                                >
                                    {bulkLoading ? 'Importing…' : `Import ${bulkPreview.validCount} Students`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupManagement;
