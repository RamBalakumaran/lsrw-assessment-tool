import React from 'react';
import BulkImportComponent from '../components/BulkImportComponent';

const BulkImportPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
            <div className="container mx-auto">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Bulk Import Management</h1>
                    <p className="text-xl text-gray-600">
                        Efficiently add hundreds of students and teachers in one go
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="text-4xl mr-4">👥</div>
                            <div>
                                <p className="text-gray-600">Bulk Students</p>
                                <p className="text-2xl font-bold">Add 100s</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="text-4xl mr-4">🎓</div>
                            <div>
                                <p className="text-gray-600">Bulk Teachers</p>
                                <p className="text-2xl font-bold">Add 20+</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="text-4xl mr-4">🔗</div>
                            <div>
                                <p className="text-gray-600">Map Relations</p>
                                <p className="text-2xl font-bold">Auto Assign</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Component */}
                <BulkImportComponent />

                {/* Help Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📖 Getting Started</h3>
                        <ol className="space-y-3 text-gray-700">
                            <li className="flex">
                                <span className="font-bold text-blue-600 mr-3">1.</span>
                                <span>Download the template for Students/Teachers</span>
                            </li>
                            <li className="flex">
                                <span className="font-bold text-blue-600 mr-3">2.</span>
                                <span>Fill in the data with your student/teacher information</span>
                            </li>
                            <li className="flex">
                                <span className="font-bold text-blue-600 mr-3">3.</span>
                                <span>Upload the file using the form above</span>
                            </li>
                            <li className="flex">
                                <span className="font-bold text-blue-600 mr-3">4.</span>
                                <span>Review success/error results</span>
                            </li>
                            <li className="flex">
                                <span className="font-bold text-blue-600 mr-3">5.</span>
                                <span>Repeat for Teachers, then do Mapping</span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Important Notes</h3>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-red-500 mr-3">•</span>
                                <span>Email must be unique for each user</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-500 mr-3">•</span>
                                <span>First Name is required for all users</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-500 mr-3">•</span>
                                <span>Import Students & Teachers BEFORE mapping</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-500 mr-3">•</span>
                                <span>Use .xlsx or .xls format only</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-500 mr-3">•</span>
                                <span>Max 500 records per file for best performance</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Excel Format Guide */}
                <div className="mt-12 bg-white rounded-lg shadow p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">📊 Excel Format Guide</h2>
                    
                    {/* Students Format */}
                    <div className="mb-12">
                        <h3 className="text-lg font-bold text-blue-600 mb-4">Students Excel Format</h3>
                        <p className="text-gray-700 mb-4">Required columns: email, firstName</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-700">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">email</th>
                                        <th className="px-4 py-2 text-left">firstName</th>
                                        <th className="px-4 py-2 text-left">lastName</th>
                                        <th className="px-4 py-2 text-left">department</th>
                                        <th className="px-4 py-2 text-left">password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">student1@example.com</td>
                                        <td className="px-4 py-2">John</td>
                                        <td className="px-4 py-2">Doe</td>
                                        <td className="px-4 py-2">Engineering</td>
                                        <td className="px-4 py-2"></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">student2@example.com</td>
                                        <td className="px-4 py-2">Jane</td>
                                        <td className="px-4 py-2">Smith</td>
                                        <td className="px-4 py-2">Science</td>
                                        <td className="px-4 py-2"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Teachers Format */}
                    <div className="mb-12">
                        <h3 className="text-lg font-bold text-green-600 mb-4">Teachers Excel Format</h3>
                        <p className="text-gray-700 mb-4">Required columns: email, firstName</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-700">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">email</th>
                                        <th className="px-4 py-2 text-left">firstName</th>
                                        <th className="px-4 py-2 text-left">lastName</th>
                                        <th className="px-4 py-2 text-left">department</th>
                                        <th className="px-4 py-2 text-left">password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">teacher1@example.com</td>
                                        <td className="px-4 py-2">Dr. Michael</td>
                                        <td className="px-4 py-2">Johnson</td>
                                        <td className="px-4 py-2">Engineering</td>
                                        <td className="px-4 py-2"></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">teacher2@example.com</td>
                                        <td className="px-4 py-2">Prof. Sarah</td>
                                        <td className="px-4 py-2">Williams</td>
                                        <td className="px-4 py-2">Science</td>
                                        <td className="px-4 py-2"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mapping Format */}
                    <div>
                        <h3 className="text-lg font-bold text-purple-600 mb-4">Student-Teacher Mapping Format</h3>
                        <p className="text-gray-700 mb-4">Required columns: studentEmail, teacherEmail</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-700">
                                <thead className="bg-purple-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">studentEmail</th>
                                        <th className="px-4 py-2 text-left">teacherEmail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">student1@example.com</td>
                                        <td className="px-4 py-2">teacher1@example.com</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">student2@example.com</td>
                                        <td className="px-4 py-2">teacher1@example.com</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-2">student3@example.com</td>
                                        <td className="px-4 py-2">teacher2@example.com</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-lg shadow p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">❓ FAQ</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Q: What if I leave password empty?</h4>
                            <p className="text-gray-700">A: A temporary password will be auto-generated. You can share this with users. They should change it on first login.</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Q: Can I import CSV instead of Excel?</h4>
                            <p className="text-gray-700">A: Currently only .xlsx and .xls formats are supported. You can convert CSV to Excel in Microsoft Excel or Google Sheets.</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Q: How many records can I upload at once?</h4>
                            <p className="text-gray-700">A: Recommended max 500 records per file. Larger files may take longer but should still work.</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Q: What happens if there are errors?</h4>
                            <p className="text-gray-700">A: Successful records are created anyway. You'll see detailed error messages for failed records with row numbers.</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Q: Can I map multiple students to one teacher?</h4>
                            <p className="text-gray-700">A: Yes! One teacher can have many students. Just add multiple rows with the same teacher email.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportPage;
