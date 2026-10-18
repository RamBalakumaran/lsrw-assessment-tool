import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, BarChart, Mic, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
    return (
        <div className="bg-white min-h-screen font-sans selection:bg-primary-100 selection:text-primary-800">
            {/* Responsive Navbar */}
            <nav className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
                <div className="text-2xl sm:text-3xl font-black gradient-text tracking-tighter">
                    FluentPro
                </div>
                <div className="flex items-center space-x-4 sm:space-x-8">
                    <div className="hidden sm:flex items-center space-x-6 text-gray-600 font-bold text-sm">
                        <a href="#features" className="hover:text-primary-600 transition">Features</a>
                        <a href="#about" className="hover:text-primary-600 transition">About</a>
                    </div>
                    <Link
                        to="/login"
                        className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-primary-600 text-white font-black text-xs sm:text-sm hover:bg-primary-700 shadow-md shadow-primary-500/20 transition active:scale-95"
                    >
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
                            Master LSRW Skills with <br className="hidden sm:inline" />
                            <span className="gradient-text">AI-Powered Precision</span>
                        </h1>
                        <p className="text-sm sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium px-2">
                            FluentPro is the ultimate SaaS platform for educational institutions to dynamically evaluate Listening, Speaking, Reading, and Writing skills using real-time AI analysis.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
                            <Link
                                to="/login"
                                className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:py-4 bg-primary-600 text-white rounded-2xl text-base sm:text-lg font-black hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition transform hover:-translate-y-0.5 active:scale-95"
                            >
                                <span>Login</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <a
                                href="#features"
                                className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl text-base sm:text-lg font-black hover:bg-gray-50 transition active:scale-95 shadow-xs"
                            >
                                Explore Features
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 sm:w-96 h-80 sm:h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 sm:w-80 h-72 sm:h-80 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-16 sm:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="text-xs font-black uppercase tracking-widest text-primary-600 mb-2 block">
                            Integrated Modules
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                            Everything You Need to Scale Language Competency
                        </h2>
                        <p className="text-gray-500 text-sm sm:text-base font-medium max-w-xl mx-auto">
                            Four distinct linguistic assessment pillars built for modern educational standards
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            { title: "Listening", icon: <Mic className="text-blue-500" />, desc: "MCQ & Fill-in-the-blanks with real-time scoring." },
                            { title: "Speaking", icon: <MessageSquare className="text-red-500" />, desc: "AI-driven pronunciation and fluency analysis." },
                            { title: "Reading", icon: <CheckCircle className="text-yellow-500" />, desc: "Dynamic passages with reading speed tracking." },
                            { title: "Writing", icon: <BarChart className="text-green-500" />, desc: "Grammar, coherence, and plagiarism detection." }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 sm:py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <div className="text-xl font-black gradient-text">FluentPro</div>
                    <div className="text-gray-400 text-xs sm:text-sm font-medium">© 2026 FluentPro AI. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
