import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BulkImportComponent = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [department, setDepartment] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [userRole, setUserRole] = useState('');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Get user role and data from localStorage
        const role = localStorage.getItem('userRole');
        const userDept = localStorage.getItem('userDepartment');
        const userOrg = localStorage.getItem('organizationId');
        
        setUserRole(role);
        setUserData({
            department: userDept,
            organizationId: userOrg,
            role: role
        });

        // Set organization and department based on role
        if (role === 'DEPT_ADMIN') {
            setOrganizationId(userOrg);
            setDepartment(userDept);
        }
    }, []);

    // Check authorization
    useEffect(() => {
        if (userRole && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(userRole)) {
            alert('You do not have permission to access bulk import. Only Super Admin and Department Admin can access this feature.');
            window.location.href = '/admin/dashboard';
        }
    }, [userRole]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResults(null);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        if (organizationId) formData.append('organizationId', organizationId);
        if (department) formData.append('department', department);

        setLoading(true);
        try {
            let endpoint = '';
            
            if (activeTab === 'students') {
                endpoint = '/api/bulk-import/students';
            } else if (activeTab === 'teachers') {
                endpoint = '/api/bulk-import/teachers';
            } else if (activeTab === 'mapping') {
                endpoint = '/api/bulk-import/map-students-to-teachers';
            }

            const response = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResults(response.data);
            setFile(null);
            document.getElementById('fileInput').value = '';
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            let templateEndpoint = '';
            
            if (activeTab === 'students') {
                templateEndpoint = '/api/bulk-import/template/students';
            } else if (activeTab === 'teachers') {
                templateEndpoint = '/api/bulk-import/template/teachers';
            } else if (activeTab === 'mapping') {
                templateEndpoint = '/api/bulk-import/template/mapping';
            }

            const response = await api.get(templateEndpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${activeTab}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentElement.removeChild(link);
        } catch (error) {
            alert('Error downloading template: ' + error.message);
        }
    };

    if (!userRole || !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(userRole)) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-300 rounded-lg">
                <h2 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h2>
                <p className="text-red-700">
                    You do not have permission to access this feature. 
                    Only Super Admin and Department Admin can access bulk import.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Bulk Import Management</h1>

            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                <p className="text-blue-800">
                    <strong>Role:</strong> {userRole} 
                    {userRole === 'DEPT_ADMIN' && ` • Department: ${userData?.department}`}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                {['students', 'teachers', 'mapping'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setResults(null);
                            setFile(null);
                        }}
                        className={`px-6 py-3 font-semibold capitalize transition ${
                            activeTab === tab
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                    {activeTab === 'students' && (
                        <p className="text-blue-800 text-sm">
                            Upload an Excel file with student information. Required columns: email, firstName. Optional: lastName, registrationNumber, department.
                        </p>
                    )}
                    {activeTab === 'teachers' && (
                        <p className="text-blue-800 text-sm">
                            Upload an Excel file with teacher information. Required columns: email, firstName. Optional: lastName, teacherId, department.
                        </p>
                    )}
                    {activeTab === 'mapping' && (
                        <p className="text-blue-800 text-sm">
                            Upload an Excel file to map students to teachers. Required columns: studentEmail, teacherEmail. 
                            {userRole === 'DEPT_ADMIN' && ' You can only map students and teachers within your department.'}
                        </p>
                    )}
                </div>

                {/* Organization/Department Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization {userRole === 'DEPT_ADMIN' && '(Auto-filled)'}
                        </label>
                        <input
                            type="text"
                            value={organizationId}
                            onChange={(e) => userRole !== 'DEPT_ADMIN' && setOrganizationId(e.target.value)}
                            placeholder={userRole === 'DEPT_ADMIN' ? 'Auto-filled' : 'Select organization'}
                            disabled={userRole === 'DEPT_ADMIN'}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                userRole === 'DEPT_ADMIN' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                            }`}
                        />
                    </div>
                    {activeTab !== 'mapping' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department {userRole === 'DEPT_ADMIN' && '(Auto-filled)'}
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => userRole !== 'DEPT_ADMIN' && setDepartment(e.target.value)}
                                placeholder={userRole === 'DEPT_ADMIN' ? 'Auto-filled' : 'e.g., Engineering, Science'}
                                disabled={userRole === 'DEPT_ADMIN'}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                                    userRole === 'DEPT_ADMIN' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                    )}
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                    <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer">
                        <div className="text-5xl mb-4">📁</div>
                        <p className="text-gray-700 font-medium">
                            {file ? file.name : 'Click to select Excel file or drag and drop'}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">Supported formats: .xlsx, .xls</p>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={downloadTemplate}
                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                    >
                        📥 Download Template
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                    >
                        {loading ? '⏳ Uploading...' : '📤 Upload & Process'}
                    </button>
                </div>

                {/* Results */}
                {results && (
                    <div className="mt-8 space-y-4">
                        {/* Password Display */}
                        {results.password && (
                            <div className="bg-green-50 border border-green-300 p-4 rounded">
                                <p className="text-green-800">
                                    <strong>Fixed Password for All Users:</strong> <code className="bg-white px-2 py-1 rounded font-mono">{results.password}</code>
                                </p>
                                <p className="text-sm text-green-700 mt-2">Users should change this password on first login.</p>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-bold text-green-800 mb-2">✅ Import Summary</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-green-600 font-semibold text-lg">{results.success.length}</p>
                                    <p className="text-green-700">Successfully Added</p>
                                </div>
                                {results.skipped && (
                                    <div>
                                        <p className="text-yellow-600 font-semibold text-lg">{results.skipped.length}</p>
                                        <p className="text-yellow-700">Skipped</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-red-600 font-semibold text-lg">{results.errors.length}</p>
                                    <p className="text-red-700">Errors</p>
                                </div>
                            </div>
                        </div>

                        {/* Success Details */}
                        {results.success.length > 0 && (
                            <div className="bg-white border border-green-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <h4 className="font-semibold text-green-800 mb-3">✅ Successfully Added ({results.success.length}):</h4>
                                <div className="space-y-2">
                                    {results.success.map((item, idx) => (
                                        <div key={idx} className="text-sm text-gray-700 p-2 bg-green-50 rounded">
                                            <p><strong>Email:</strong> {item.email}</p>
                                            {item.registrationNumber && (
                                                <p><strong>Reg No:</strong> {item.registrationNumber}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skipped Details */}
                        {results.skipped && results.skipped.length > 0 && (
                            <div className="bg-white border border-yellow-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Skipped ({results.skipped.length}):</h4>
                                <div className="space-y-2">
                                    {results.skipped.map((item, idx) => (
                                        <div key={idx} className="text-sm text-yellow-700 p-2 bg-yellow-50 rounded">
                                            <strong>Row {item.row}:</strong> {item.reason}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {results.errors.length > 0 && (
                            <div className="bg-white border border-red-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <h4 className="font-semibold text-red-800 mb-3">❌ Errors ({results.errors.length}):</h4>
                                <div className="space-y-2">
                                    {results.errors.map((error, idx) => (
                                        <div key={idx} className="text-sm text-red-700 p-2 bg-red-50 rounded">
                                            <strong>Row {error.row}:</strong> {error.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkImportComponent;
