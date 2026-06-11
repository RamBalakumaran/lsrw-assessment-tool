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

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Portal Settings</h1>
                    <p className="text-gray-500 font-medium">Configure your personal and institutional preferences</p>
                </header>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl">
                    {sections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-start space-x-6">
                                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                    {React.cloneElement(section.icon, { size: 28 })}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{section.title}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed">{section.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm max-w-6xl">
                    <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Advanced Controls</h3>
                    <div className="flex items-center justify-between p-6 bg-rose-50 rounded-2xl border border-rose-100">
                        <div>
                            <div className="font-bold text-rose-900 text-lg">Terminate Persistence</div>
                            <p className="text-rose-700 text-sm font-medium">Remove all local session data and disconnect from the network.</p>
                        </div>
                        <button className="px-6 py-3 bg-white text-rose-600 font-black rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                            Clear Cache
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
