import React from 'react';
import BulkImportComponent from '../components/BulkImportComponent';
import { Users, GraduationCap, Link2, Download, AlertTriangle, FileSpreadsheet, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const BulkImportPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Bulk Import Management</h1>
                    <p className="text-gray-500 font-medium">
                        Efficiently add hundreds of students and teachers in one go, and map them instantly.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-inner">
                            <Users size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">Bulk Students</p>
                            <p className="text-2xl font-black text-gray-900">Add 100s</p>
                        </div>
                    </motion.div>
                    
                    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                            <GraduationCap size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">Bulk Teachers</p>
                            <p className="text-2xl font-black text-gray-900">Add 20+</p>
                        </div>
                    </motion.div>
                    
                    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                            <Link2 size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">Map Relations</p>
                            <p className="text-2xl font-black text-gray-900">Auto Assign</p>
                        </div>
                    </motion.div>
                </div>

                {/* Main Component */}
                <BulkImportComponent />

                {/* Help Section */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Info size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Getting Started</h3>
                        </div>
                        <ol className="space-y-4">
                            {[
                                "Download the template for Students/Teachers",
                                "Fill in the data with your user information",
                                "Upload the file using the form above",
                                "Review success/error results",
                                "Repeat for Teachers, then do Mapping"
                            ].map((step, idx) => (
                                <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="w-8 h-8 rounded-lg bg-white text-gray-900 font-black flex items-center justify-center shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <span className="font-bold text-gray-700">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Important Notes</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Email must be unique for each user",
                                "First Name is required for all users",
                                "Import Students & Teachers BEFORE mapping",
                                "Use .xlsx or .xls format only",
                                "Max 500 records per file for best performance"
                            ].map((note, idx) => (
                                <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <span className="font-bold text-gray-700">{note}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Excel Format Guide */}
                <div className="mt-12 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FileSpreadsheet size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Excel Format Guide</h2>
                            <p className="text-gray-500 font-medium mt-1">Structure your data perfectly for seamless importing.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Students Format */}
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h3 className="text-lg font-black text-blue-600 mb-2">Students Format</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6">Required: email, firstName</p>
                            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-blue-50 text-blue-900 font-black">
                                        <tr>
                                            <th className="px-4 py-3">email</th>
                                            <th className="px-4 py-3">firstName</th>
                                            <th className="px-4 py-3">department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-medium text-gray-600 divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-4 py-3">stu1@nec.edu</td>
                                            <td className="px-4 py-3">John</td>
                                            <td className="px-4 py-3">CS</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">stu2@nec.edu</td>
                                            <td className="px-4 py-3">Jane</td>
                                            <td className="px-4 py-3">MECH</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Teachers Format */}
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h3 className="text-lg font-black text-emerald-600 mb-2">Teachers Format</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6">Required: email, firstName</p>
                            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-emerald-50 text-emerald-900 font-black">
                                        <tr>
                                            <th className="px-4 py-3">email</th>
                                            <th className="px-4 py-3">firstName</th>
                                            <th className="px-4 py-3">department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-medium text-gray-600 divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-4 py-3">dr1@nec.edu</td>
                                            <td className="px-4 py-3">Dr. Mike</td>
                                            <td className="px-4 py-3">CS</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">dr2@nec.edu</td>
                                            <td className="px-4 py-3">Prof. Sarah</td>
                                            <td className="px-4 py-3">MECH</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mapping Format */}
                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h3 className="text-lg font-black text-purple-600 mb-2">Mapping Format</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6">Required: studentEmail, teacherEmail</p>
                            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-purple-50 text-purple-900 font-black">
                                        <tr>
                                            <th className="px-4 py-3">studentEmail</th>
                                            <th className="px-4 py-3">teacherEmail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-medium text-gray-600 divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-4 py-3">stu1@nec.edu</td>
                                            <td className="px-4 py-3">dr1@nec.edu</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">stu2@nec.edu</td>
                                            <td className="px-4 py-3">dr1@nec.edu</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportPage;
