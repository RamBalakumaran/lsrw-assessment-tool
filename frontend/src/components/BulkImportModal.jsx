import React, { useState } from 'react';
import api from '../utils/api';
import { X, UploadCloud, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const BulkImportModal = ({ groupId, onSuccess, onClose }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewStudents, setPreviewStudents] = useState(null);
    const [errors, setErrors] = useState([]);
    const [confirming, setConfirming] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setPreviewStudents(null);
        setErrors([]);
    };

    const handleParse = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const response = await api.post(`/groups/${groupId}/bulk-import/parse`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreviewStudents(response.data.students || []);
            setErrors(response.data.errors || []);
        } catch (error) {
            alert('Error parsing file: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!previewStudents || previewStudents.length === 0) return;

        setConfirming(true);
        try {
            await api.post(`/groups/${groupId}/bulk-import/confirm`, {
                students: previewStudents
            });
            alert('Students successfully enrolled!');
            onSuccess();
            onClose();
        } catch (error) {
            alert('Error confirming import: ' + (error.response?.data?.error || error.message));
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />

            {/* Modal Content */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-10 max-h-[85vh] overflow-y-auto"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-3xl font-black text-gray-900 mb-2">Bulk Import Students</h2>
                <p className="text-gray-500 font-medium mb-6">
                    Upload an Excel or CSV file. Existing students will be linked, and new accounts will be auto-created.
                </p>

                {/* Step 1: Upload & Parse */}
                {!previewStudents && (
                    <div className="space-y-6">
                        <div className="border-4 border-dashed border-gray-200 hover:border-primary-500 rounded-[2rem] p-10 text-center cursor-pointer bg-gray-50 hover:bg-primary-50/10 transition-all relative">
                            <input
                                id="modalFileInput"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-white text-gray-400 flex items-center justify-center shadow-inner mb-4">
                                    <UploadCloud size={32} />
                                </div>
                                <p className="text-lg font-black text-gray-900">
                                    {file ? file.name : 'Select Excel/CSV File'}
                                </p>
                                <p className="text-sm text-gray-400 font-bold mt-1">
                                    {file ? 'Click parse to review list' : 'Click to browse or drag and drop'}
                                </p>
                            </div>
                        </div>

                        {/* File Format Guidelines */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left space-y-3 font-sans">
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <FileSpreadsheet className="text-primary-500" size={16} />
                                File Format Guidelines
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Please ensure your spreadsheet (Excel <code>.xlsx</code> / <code>.xls</code> or CSV <code>.csv</code>) contains the following columns:
                            </p>
                            <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1 font-medium">
                                <li><strong>Registration Number (Required):</strong> Named <code>regno</code>, <code>rollno</code>, or <code>registrationNumber</code>.</li>
                                <li><strong>First Name (Optional):</strong> Named <code>name</code> or <code>firstName</code> (Defaults to "Student" if blank).</li>
                                <li><strong>Last Name (Optional):</strong> Named <code>lastName</code> (Defaults to Registration Number if blank).</li>
                            </ul>
                            <div className="mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-gray-400 italic font-medium">
                                * The system automatically creates new accounts with the username <code>[regno]@nec.edu.in</code> and a default password of <code>123456</code>.
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleParse}
                                disabled={!file || loading}
                                className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 transition flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                {loading ? 'Parsing...' : 'Upload & Preview'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview & Confirm */}
                {previewStudents && (
                    <div className="space-y-6">
                        {/* Errors Warning */}
                        {errors.length > 0 && (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-rose-600 mb-2 font-black">
                                    <AlertCircle size={20} />
                                    <span>Skipped Rows / Errors ({errors.length})</span>
                                </div>
                                <div className="max-h-24 overflow-y-auto space-y-1 text-sm font-medium text-rose-700">
                                    {errors.map((err, idx) => (
                                        <div key={idx}>Row {err.row}: {err.error}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Students Preview Table */}
                        <div className="border border-gray-100 rounded-3xl overflow-hidden bg-gray-50">
                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white border-b border-gray-100 text-gray-400 font-black text-xs uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Reg No</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Username (Email)</th>
                                            <th className="px-6 py-4">Action Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-bold text-gray-700 text-sm">
                                        {previewStudents.map((student, idx) => (
                                            <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono">{student.registrationNumber}</td>
                                                <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{student.email}</td>
                                                <td className="px-6 py-4">
                                                    {student.exists ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700">
                                                            <UserCheck size={12} /> Existing User (Enroll Only)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700">
                                                            <UserPlus size={12} /> Create & Enroll (Pass: 123456)
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setPreviewStudents(null)}
                                className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={confirming || previewStudents.length === 0}
                                className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 transition flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                            >
                                {confirming && <Loader2 size={18} className="animate-spin" />}
                                {confirming ? 'Enrolling...' : `Confirm & Add ${previewStudents.length} Students`}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BulkImportModal;
