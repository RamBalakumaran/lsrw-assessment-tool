import React from 'react';
import Sidebar from '../components/Sidebar';
import { User, Bell, Lock, Globe, Shield, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const sections = [
        { title: "Profile Information", icon: <User />, desc: "Personalize your public identity and contact details." },
        { title: "Notification Logic", icon: <Bell />, desc: "Define how and when you receive real-time alerts." },
        { title: "Security & Passwords", icon: <Lock />, desc: "Update credentials and enable multi-factor authentication." },
        { title: "Regional Settings", icon: <Globe />, desc: "Synchronize your timezone and local language preferences." },
        { title: "Privacy Control", icon: <Shield />, desc: "Manage data visibility and third-party integrations." },
        { title: "Premium Subscription", icon: <CreditCard />, desc: "Oversee payment methods and institutional billing history." },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto min-w-0 max-w-full">
                <header className="mb-6 sm:mb-12">
                    <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Portal Settings</h1>
                    <p className="text-xs sm:text-base text-gray-500 font-medium mt-1">Configure your personal and institutional preferences</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-6xl">
                    {sections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-start space-x-4 sm:space-x-6">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 text-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                                    {React.cloneElement(section.icon, { size: 24 })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-primary-600 transition-colors">{section.title}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">{section.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 sm:mt-12 p-5 sm:p-10 bg-white rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm max-w-6xl">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">Advanced Controls</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-100">
                        <div>
                            <div className="font-bold text-rose-900 text-base sm:text-lg">Terminate Persistence</div>
                            <p className="text-rose-700 text-xs sm:text-sm font-medium mt-0.5">Remove all local session data and disconnect from the network.</p>
                        </div>
                        <button className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-rose-600 font-black rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm text-sm shrink-0">
                            Clear Cache
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
