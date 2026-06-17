import React, { useState } from 'react';
import api from '../utils/api';
import { UploadCloud, Download, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkImportComponent = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [department, setDepartment] = useState('');

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

        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'students') endpoint = '/api/bulk-import/students';
            else if (activeTab === 'teachers') endpoint = '/api/bulk-import/teachers';
            else if (activeTab === 'mapping') endpoint = '/api/bulk-import/map-students-to-teachers';

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
            if (activeTab === 'students') templateEndpoint = '/api/bulk-import/template/students';
            else if (activeTab === 'teachers') templateEndpoint = '/api/bulk-import/template/teachers';
            else if (activeTab === 'mapping') templateEndpoint = '/api/bulk-import/template/mapping';

            const response = await api.get(templateEndpoint, { responseType: 'blob' });
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

    const TABS = [
        { id: 'students', label: 'Import Students' },
        { id: 'teachers', label: 'Import Teachers' },
        { id: 'mapping', label: 'Map Relations' }
    ];

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 font-sans">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Data Importer</h2>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setResults(null);
                            setFile(null);
                        }}
                        className={`px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                    {/* Instructions */}
                    <div className="bg-primary-50 border border-primary-100 p-6 rounded-[2rem]">
                        <h3 className="font-black text-primary-900 mb-2 tracking-tight text-lg">Instructions</h3>
                        <p className="text-primary-800 font-medium leading-relaxed">
                            {activeTab === 'students' && "Upload an Excel file with student information. Required columns: email, firstName. Optional: lastName, department, password."}
                            {activeTab === 'teachers' && "Upload an Excel file with teacher information. Required columns: email, firstName. Optional: lastName, department, password."}
                            {activeTab === 'mapping' && "Upload an Excel file to map students to teachers. Required columns: studentEmail, teacherEmail. This will assign each student to their designated teacher."}
                        </p>
                    </div>

                    {/* Form Controls */}
                    {activeTab !== 'mapping' && (
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Target Department (Optional)
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g. Computer Science"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={downloadTemplate}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition shadow-sm"
                        >
                            <Download size={20} /> Template
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 transition shadow-xl"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                            {loading ? 'Uploading...' : 'Process'}
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                <div>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="fileInput"
                        className={`flex flex-col items-center justify-center w-full h-full min-h-[300px] border-4 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${
                            file ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${file ? 'bg-primary-100 text-primary-600' : 'bg-white text-gray-400'}`}>
                            {file ? <FileSpreadsheet size={40} /> : <UploadCloud size={40} />}
                        </div>
                        <p className="text-xl font-black text-gray-900 mb-2">
                            {file ? file.name : 'Select Excel File'}
                        </p>
                        <p className="text-gray-400 font-bold text-sm">
                            {file ? 'Ready to upload' : 'Drag & Drop or Click to browse'}
                        </p>
                    </label>
                </div>
            </div>

            {/* Results UI */}
            <AnimatePresence>
                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 pt-10 border-t border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Upload Summary</h3>
                                <p className="text-emerald-600 font-bold">Successfully processed {results.success.length} out of {results.total} records.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {results.success.length > 0 && (
                                <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
                                    <h4 className="font-black text-emerald-900 mb-4">Successfully Added</h4>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {results.success.map((item, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm text-sm font-medium text-gray-700">
                                                {item.email && <div><span className="text-gray-400">Email:</span> {item.email}</div>}
                                                {item.tempPassword && <div><span className="text-gray-400">Password:</span> {item.tempPassword}</div>}
                                                {item.studentEmail && <div><span className="text-gray-400">Map:</span> {item.studentEmail} → {item.teacherEmail}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.errors.length > 0 && (
                                <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100">
                                    <div className="flex items-center gap-2 mb-4 text-rose-600">
                                        <AlertCircle size={20} />
                                        <h4 className="font-black text-rose-900">Errors Detected ({results.errors.length})</h4>
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {results.errors.map((error, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm text-sm font-medium text-rose-700 border-l-4 border-rose-500">
                                                <span className="font-black">Row {error.row}:</span> {error.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BulkImportComponent;
