import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, BarChart, Mic, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
    return (
        <div className="bg-white min-h-screen">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold gradient-text">FluentPro</div>
                <div className="space-x-8 text-gray-600 font-medium">
                    <a href="#features" className="hover:text-primary-600 transition">Features</a>
                    <a href="#about" className="hover:text-primary-600 transition">About</a>
                    <Link to="/login" className="px-5 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition">Login</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                            Master LSRW Skills with <br />
                            <span className="gradient-text">AI-Powered Precision</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
                            FluentPro is the ultimate SaaS platform for educational institutions to dynamically evaluate Listening, Speaking, Reading, and Writing skills using real-time AI analysis.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link to="/login" className="flex items-center px-8 py-4 bg-primary-600 text-white rounded-xl text-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition transform hover:-translate-y-1">
                                Login <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl text-lg font-bold hover:bg-gray-50 transition">
                                View Demo
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to scale</h2>
                        <p className="text-gray-500">Powerful modules built for modern education</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { title: "Listening", icon: <Mic className="text-blue-500" />, desc: "MCQ & Fill-in-the-blanks with real-time scoring." },
                            { title: "Speaking", icon: <MessageSquare className="text-red-500" />, desc: "AI-driven pronunciation and fluency analysis." },
                            { title: "Reading", icon: <CheckCircle className="text-yellow-500" />, desc: "Dynamic passages with reading speed tracking." },
                            { title: "Writing", icon: <BarChart className="text-green-500" />, desc: "Grammar, coherence, and plagiarism detection." }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
                                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                    <div className="text-xl font-bold gradient-text">FluentPro</div>
                    <div className="text-gray-400 text-sm">© 2026 FluentPro AI. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
