import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Square,
    Play,
    ArrowLeft,
    Settings,
    Activity,
    ShieldCheck,
    Loader2,
    RefreshCw
} from 'lucide-react';
import TopicSelection from '../components/TopicSelection';
import DetailedReport from '../components/DetailedReport';
import api from '../utils/api';

const TestInterface = () => {
    const { id } = useParams();
    const [phase, setPhase] = useState('topic');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);

    const createZeroReport = (errorMsg) => ({
        score: 0,
        title: "Speaking",
        transcript: "",
        metrics: [
            { label: "Words Per Minute", value: 0 },
            { label: "Fluency Rating", value: "0/10" },
            { label: "Vocab Diversity", value: "0/10" }
        ],
        criteria: {
            "Pronunciation": 0, "Fluency": 0, "Grammar": 0, "Vocabulary": 0, "Confidence": 0, "Relevance": 0
        },
        mistakes: [],
        recommendations: [`⚠️ ${errorMsg}`, "Ensure your device microphone is active and you are in a quiet environment."]
    });

    const onStop = async (url, blob) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('audio', blob, 'test.wav');
        if (selectedTopic && selectedTopic.id) {
            formData.append('taskId', selectedTopic.id);
        }

        try {
            const res = await api.post('/evaluate/assess-speaking', formData);
            const data = res.data;

            if (data.error && !data.metrics) {
                const isNoSpeech = data.error.includes("No speech") || data.error.includes("Could not understand");
                if (isNoSpeech) {
                    setReport(createZeroReport(data.error));
                    setPhase('report');
                } else {
                    alert("System Analysis Error: " + data.error);
                }
                setLoading(false);
                return;
            }

            const metrics = data.metrics || {};
            const fluency9 = ((metrics.fluency || 0) / 10) * 9;
            const vocab9 = ((metrics.vocabulary || 0) / 10) * 9;
            const grammar9 = ((metrics.grammar || 0) / 10) * 9;
            const overall9 = (fluency9 + vocab9 + grammar9) / 3;

            setReport({
                score: overall9.toFixed(1),
                isPass: overall9 >= 6.0,
                title: "Speaking",
                transcript: data.transcription || "",
                metrics: [
                    { label: "Estimated WPM", value: data.wpm || 0 },
                    { label: "Fluency Score", value: `${fluency9.toFixed(1)}/9.0` },
                    { label: "Vocabulary Richness", value: `${vocab9.toFixed(1)}/9.0` },
                    { label: "Filler Words", value: metrics.filler_count || 0 }
                ],
                criteria: {
                    "Pronunciation": (metrics.pronunciation || 0) * 10,
                    "Fluency": (metrics.fluency || 0) * 10,
                    "Grammar": (metrics.grammar || 0) * 10,
                    "Vocabulary": (metrics.vocabulary || 0) * 10,
                    "Confidence": (metrics.fluency || 0) > 7 ? 90 : 60,
                    "Relevance": data.overall_score > 6 ? 100 : 50
                },
                mistakes: data.mistakes || [],
                recommendations: [
                    `Speaking tempo detected at ${data.wpm || 0} vocabulary words per minute.`,
                    (metrics.fluency || 0) < 6 ? "Work on reducing pauses between sentences." : "Strong natural cadence and flow.",
                    (metrics.filler_count || 0) > 3 ? "Try to eliminate vocal fillers like 'um' and 'ah'." : "Excellent clarity with minimal filler usage.",
                    ...(data.mistakes?.length > 0 ? [`Identified ${data.mistakes.length} points for grammatical refinement.`] : ["Grammatical structure is highly consistent."])
                ]
            });
            setPhase('report');
        } catch (e) {
            console.error(e);
            alert("Analysis pipeline disrupted. Check server connectivity.");
        }
        setLoading(false);
    };

    const { startRecording, stopRecording, status } = useReactMediaRecorder({
        audio: true,
        onStop: onStop
    });

    const [topics, setTopics] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                const specificTasks = res.data.filter(t => t.type === 'SPEAKING' || t.lsrwComponent === 'Speaking');
                const formattedTasks = specificTasks.map((t, idx) => ({
                    ...t,
                    desc: t.description,
                    color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][idx % 4]
                }));
                setTopics(formattedTasks);

                if (id) {
                    const taskToAutoStart = formattedTasks.find(t => t.id === id);
                    if (taskToAutoStart) {
                        setSelectedTopic(taskToAutoStart);
                        setPhase('record');
                    }
                }
            } catch (e) {
                console.error("Failed to fetch speaking tasks:", e);
            }
        };
        fetchTasks();
    }, [id]);

    if (phase === 'topic') {
        return <TopicSelection title="Speaking" topics={topics} onSelect={(t) => { setSelectedTopic(t); setPhase('record'); }} onBack={() => window.location.href = '/dashboard'} />;
    }

    if (phase === 'record') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-10">
                    <button
                        onClick={() => setPhase('topic')}
                        className="flex items-center text-gray-500 hover:text-primary-600 transition font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="mr-2" size={16} /> Choose Topic
                    </button>
                    <div className="flex items-center space-x-2 text-primary-600 font-bold bg-primary-50 px-4 py-2 rounded-xl text-sm">
                        <Activity size={16} />
                        <span>Interactive Audio System</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[600px]"
                >
                    {/* Topic Side */}
                    <div className="md:w-5/12 bg-gray-50 p-12 border-r border-gray-100 flex flex-col justify-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-500 shadow-sm mb-6">
                            <Mic size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{selectedTopic.title}</h2>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed">
                            {selectedTopic.desc}
                        </p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center space-x-3 text-sm font-bold text-gray-400">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                <span>Noise suppression active</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm font-bold text-gray-400">
                                <Settings size={18} />
                                <span>Auto-gain control calibrated</span>
                            </div>
                        </div>
                    </div>

                    {/* Recording Side */}
                    <div className="md:w-7/12 p-12 flex flex-col items-center justify-center relative bg-white">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="relative">
                                        <Loader2 size={80} className="text-primary-500 animate-spin mx-auto mb-8" />
                                        <RefreshCw size={30} className="text-primary-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">Analyzing Patterns...</h3>
                                    <p className="text-gray-500 font-medium">Decoding phonemes and checking fluency</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="interface"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center w-full"
                                >
                                    {status === 'recording' ? (
                                        <div className="mb-12">
                                            <div className="flex justify-center items-end gap-1.5 h-32 mb-8">
                                                {[...Array(15)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [20, Math.random() * 100 + 20, 20] }}
                                                        transition={{ repeat: Infinity, duration: 0.5 + Math.random() }}
                                                        className="w-2 bg-primary-500 rounded-full"
                                                    ></motion.div>
                                                ))}
                                            </div>
                                            <div className="inline-block px-6 py-2 bg-rose-50 text-rose-500 rounded-2xl font-black text-sm uppercase tracking-widest border border-rose-100 animate-pulse">
                                                Live • Recording
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-12">
                                            <div className="w-32 h-32 rounded-full border-4 border-gray-50 flex items-center justify-center mx-auto mb-6 bg-gray-50/50">
                                                <Mic size={48} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Ready to start?</h3>
                                            <p className="text-gray-400">Press the button when you're ready to speak</p>
                                        </div>
                                    )}

                                    <div className="flex justify-center">
                                        {status !== 'recording' ? (
                                            <button
                                                onClick={startRecording}
                                                className="group flex flex-col items-center"
                                            >
                                                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all duration-300 group-hover:bg-primary-500">
                                                    <Mic size={40} />
                                                </div>
                                                <span className="mt-4 font-black text-gray-900 uppercase tracking-tighter text-lg">Start Session</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopRecording}
                                                className="group flex flex-col items-center"
                                            >
                                                <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 hover:scale-110 active:scale-95 transition-all duration-300">
                                                    <Square size={36} className="fill-current" />
                                                </div>
                                                <span className="mt-4 font-black text-rose-600 uppercase tracking-tighter text-lg">Finish Recognition</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <DetailedReport
            {...report}
            transcript={report.transcript}
            onRetry={() => {
                setPhase('topic');
                setReport(null);
            }}
            onHome={() => window.location.href = '/dashboard'}
        />
    );
};

export default TestInterface;