import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    Activity,
    Cpu,
    Database,
    Globe,
    ShieldCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const SystemHealth = () => {
    const [status, setStatus] = useState({
        api: "Healthy",
        database: "Connected",
        ai_engine: "Running",
        latency: "124ms",
        uptime: "99.98%"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="ADMIN" />
            <main className="flex-1 p-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </main>
        </div>
    );

    const metrics = [
        { label: "API Cluster", val: status.api, icon: <Globe />, color: "emerald" },
        { label: "AI Backend", val: status.ai_engine, icon: <Cpu />, color: "primary" },
        { label: "DB Instance", val: status.database, icon: <Database />, color: "emerald" },
        { label: "Mean Latency", val: status.latency, icon: <Activity />, color: "amber" },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="ADMIN" />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Reliability</h1>
                    <p className="text-gray-500 font-medium">Real-time status of global core services</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${m.color}-50 text-${m.color}-600 mb-6`}>
                                {m.icon}
                            </div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</div>
                            <div className="text-2xl font-black text-gray-900">{m.val}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                        <div className="max-w-xl">
                            <div className="flex items-center space-x-3 text-indigo-300 font-black text-xs uppercase tracking-widest mb-6">
                                <ShieldCheck size={16} />
                                <span>Security Protocol Active</span>
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight">Institutional Uptime Is Peak</h2>
                            <p className="text-indigo-100 text-lg font-medium opacity-80">
                                Global availability is at {status.uptime}. All automated AI scaling groups are operating within normal parameters.
                            </p>
                        </div>
                        <div className="mt-8 md:mt-0 text-center px-12 py-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem]">
                            <div className="text-5xl font-black mb-1">{status.uptime}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg Stability</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SystemHealth;
