import React, { useState } from 'react';
import api from '../utils/api';

const BulkImportComponent = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [department, setDepartment] = useState('');
    const [organizationId, setOrganizationId] = useState('');

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
        if (department) formData.append('department', department);
        if (organizationId) formData.append('organizationId', organizationId);

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

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Bulk Import Management</h1>

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
                            Upload an Excel file with student information. Required columns: email, firstName. Optional: lastName, department, password.
                        </p>
                    )}
                    {activeTab === 'teachers' && (
                        <p className="text-blue-800 text-sm">
                            Upload an Excel file with teacher information. Required columns: email, firstName. Optional: lastName, department, password.
                        </p>
                    )}
                    {activeTab === 'mapping' && (
                        <p className="text-blue-800 text-sm">
                            Upload an Excel file to map students to teachers. Required columns: studentEmail, teacherEmail. This will assign each student to their designated teacher.
                        </p>
                    )}
                </div>

                {/* Organization/Department Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTab !== 'mapping' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization ID (optional)
                                </label>
                                <input
                                    type="text"
                                    value={organizationId}
                                    onChange={(e) => setOrganizationId(e.target.value)}
                                    placeholder="Leave empty to use current organization"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department (optional)
                                </label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g., Engineering, Science"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
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
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-bold text-green-800 mb-2">✅ Success Summary</h3>
                            <p className="text-green-700">
                                Successfully processed: <strong>{results.success.length}/{results.total}</strong> records
                            </p>
                        </div>

                        {/* Success Details */}
                        {results.success.length > 0 && (
                            <div className="bg-white border border-green-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <h4 className="font-semibold text-green-800 mb-3">Successfully Added:</h4>
                                <div className="space-y-2">
                                    {results.success.map((item, idx) => (
                                        <div key={idx} className="text-sm text-gray-700 p-2 bg-green-50 rounded">
                                            <p><strong>Email:</strong> {item.email}</p>
                                            {item.tempPassword && (
                                                <p><strong>Temp Password:</strong> {item.tempPassword}</p>
                                            )}
                                            {item.studentEmail && (
                                                <>
                                                    <p><strong>Student:</strong> {item.studentEmail}</p>
                                                    <p><strong>Teacher:</strong> {item.teacherEmail}</p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {results.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-300 rounded-lg p-4 max-h-60 overflow-y-auto">
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
