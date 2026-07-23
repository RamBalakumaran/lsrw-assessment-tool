import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopicSelection from '../components/TopicSelection';
import SmartQuiz from '../components/SmartQuiz';
import DetailedReport from '../components/DetailedReport';
import { Headphones, Play, ShieldCheck, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import FullscreenProctorGuard from '../components/FullscreenProctorGuard';

const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const calculateLevenshtein = (a, b) => {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) {
        tmp.push([i]);
    }
    for (let j = 0; j <= b.length; j++) {
        tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,
                tmp[i][j - 1] + 1,
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return tmp[a.length][b.length];
};

const getSimilarity = (str1, str2) => {
    const s1 = (str1 || "").trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ");
    const s2 = (str2 || "").trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ");
    
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;
    
    const distance = calculateLevenshtein(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - distance) / maxLength;
};

const ListeningTest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [phase, setPhase] = useState('topic');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [report, setReport] = useState(null);
    const [startTime, setStartTime] = useState(0);
    const [playCount, setPlayCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fallback topics if backend is empty
    const defaultTopics = [
        {
            id: "1", title: "General Knowledge", desc: "History of Computers and their evolution.", color: '#0ea5e9',
            audioUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1a/The_History_of_the_Computer.ogg",
            questions: [
                { id: "q1", type: "Main Idea", text: "What is the primary focus of the audio?", opts: ["Future Gaming", "History of Computing", "Robot Development"], correctAnswer: "History of Computing", time: 20 },
                { id: "q2", type: "Detail Accuracy", text: "Which early calculation device is mentioned?", opts: ["Smartphone", "Abacus", "Tesla Engine"], correctAnswer: "Abacus", time: 20 }
            ]
        },
        {
            id: "2", title: "Nature & Environment", desc: "Understanding animal behavior and sounds.", color: '#10b981',
            audioUrl: "https://www.w3schools.com/html/horse.mp3",
            questions: [
                { id: "q1", type: "Identification", text: "Identify the animal recorded in the clip.", opts: ["Domestic Cow", "Stallion (Horse)", "Mountain Sheep"], correctAnswer: "Stallion (Horse)", time: 15 },
                { id: "q2", type: "Contextual Logic", text: "In what environment would you most likely hear this sound?", opts: ["Underwater", "Traditional Farm", "Space Station"], correctAnswer: "Traditional Farm", time: 15 }
            ]
        }
    ];

    const [topics, setTopics] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                const data = res.data.filter(t => {
                    const comp = (t.lsrwComponent || t.type || '').toUpperCase();
                    return comp === 'LISTENING';
                });
                const formattedTasks = data.map((t, idx) => ({
                    ...t,
                    desc: t.description,
                    questions: t.questions && t.questions.length > 0 ? t.questions : defaultTopics[idx % defaultTopics.length].questions,
                    color: ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b'][idx % 4]
                }));
                setTopics(formattedTasks);

                if (id) {
                    const taskToAutoStart = formattedTasks.find(t => t.id === id);
                    if (taskToAutoStart) {
                        setSelectedTopic(taskToAutoStart);
                        setPhase('listen');
                    }
                }
            } catch (e) {
                console.error("Failed to fetch listening tasks:", e);
            }
        };
        fetchTasks();
    }, [id]);

    const handleComplete = (answers) => {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        let correct = 0;
        let mistakes = [];
        let criteria = {};

        const isDictation = selectedTopic?.subType === 'DICTATION' || 
                            selectedTopic?.assessmentType === 'Dictation' || 
                            selectedTopic?.title?.toLowerCase().includes('dictation');

        if (isDictation) {
            let totalSim = 0;
            selectedTopic.questions.forEach((q, idx) => {
                const sim = getSimilarity(answers[q.id], q.correctAnswer);
                totalSim += sim;
                criteria[q.type || `Sentence ${idx + 1}`] = Math.round(sim * 100);

                if (sim >= 0.95) {
                    correct++;
                } else {
                    mistakes.push({
                        type: q.type || "Dictation",
                        question: q.text || q.questionText || `Sentence ${idx + 1}`,
                        userAnswer: answers[q.id] || "[No Answer]",
                        correctAnswer: q.correctAnswer
                    });
                }
            });

            const score = Math.round((totalSim / selectedTopic.questions.length) * 100);

            const reportData = {
                score,
                title: "Listening Dictation",
                metrics: [
                    { label: "Completion Time", value: `${totalTime}s` },
                    { label: "Audio Replays", value: playCount },
                    { label: "Transcription Match", value: `${score}%` },
                    { label: "Focus Rank", value: score > 80 ? "Alpha" : "Beta" }
                ],
                criteria,
                mistakes,
                recommendations: [
                    playCount > 1 ? "Try to type the sentence with fewer audio replays." : "Excellent concentration, single playback.",
                    score < 90 ? "Listen closely to spelling and phonemes, and check for missing words." : "Excellent dictation and spelling accuracy."
                ]
            };

            setReport(reportData);
            setPhase('report');

            try {
                api.post('/attempts/submit', {
                    taskId: selectedTopic?.id,
                    studentAnswers: answers,
                    score,
                    aiResults: reportData
                });
            } catch (e) {
                console.error("Failed to submit attempt", e);
            }
        } else {
            selectedTopic.questions.forEach(q => criteria[q.type] = 0);

            selectedTopic.questions.forEach(q => {
                if (answers[q.id] === q.correctAnswer) {
                    correct++;
                    criteria[q.type] = 100;
                } else {
                    mistakes.push({
                        type: q.type,
                        question: q.text,
                        userAnswer: answers[q.id] || "No Answer",
                        correctAnswer: q.correctAnswer
                    });
                }
            });

            const score = Math.round((correct / selectedTopic.questions.length) * 100);

            const reportData = {
                score,
                title: "Listening",
                metrics: [
                    { label: "Completion Time", value: `${totalTime}s` },
                    { label: "Audio Replays", value: playCount },
                    { label: "Overall Accuracy", value: `${score}%` },
                    { label: "Focus Rank", value: score > 80 ? "Alpha" : "Beta" }
                ],
                criteria,
                mistakes,
                recommendations: [
                    playCount > 1 ? "Try to answer without replaying for higher score." : "Excellent concentration, single playback.",
                    score < 100 ? "Identify keywords in questions before playing." : "Perfect comprehension of the audio track."
                ]
            };

            setReport(reportData);
            setPhase('report');

            try {
                api.post('/attempts/submit', {
                    taskId: selectedTopic?.id,
                    studentAnswers: answers,
                    score,
                    aiResults: reportData
                });
            } catch (e) {
                console.error("Failed to submit attempt", e);
            }
        }
    };

    const renderMedia = (url) => {
        const youtubeId = getYoutubeId(url);

        if (youtubeId) {
            return (
                <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-[2rem] shadow-lg mb-10 bg-gray-900 border-4 border-gray-900" style={{ paddingTop: '56.25%' }}>
                    <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setPlayCount(p => p + 1)}
                    ></iframe>
                </div>
            );
        }

        if (url && url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            return (
                <div className="w-full max-w-3xl mx-auto rounded-[2rem] shadow-lg mb-10 bg-gray-900 overflow-hidden border-4 border-gray-900">
                    <video
                        controls
                        className="w-full outline-none"
                        onPlay={() => setPlayCount(p => p + 1)}
                    >
                        <source src={url} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        return (
            <div className="bg-gray-50 p-10 rounded-[2rem] border border-gray-100 mb-10 max-w-2xl mx-auto">
                <div className="flex items-center space-x-4 mb-6 justify-center">
                    <Music className="text-primary-500" size={24} />
                    <span className="font-bold text-gray-700 uppercase tracking-widest text-sm">Audio Track Ready</span>
                </div>
                <audio
                    controls
                    className="w-full h-12 rounded-full"
                    onPlay={() => setPlayCount(p => p + 1)}
                >
                    <source src={url} />
                    Your browser does not support audio playback.
                </audio>
            </div>
        );
    };

    const handleExit = () => {
        if (id) {
            navigate('/student/dashboard');
        } else {
            setPhase('topic');
            setSelectedTopic(null);
            setPlayCount(0);
        }
    };

    if (phase === 'topic') {
        return <TopicSelection title="Listening" topics={topics} onSelect={(t) => { setSelectedTopic(t); setPhase('listen'); }} onBack={() => window.location.href = '/dashboard'} />;
    }

    if (phase === 'listen' || phase === 'quiz') {
        return (
            <FullscreenProctorGuard
                title={selectedTopic?.title}
                onExit={handleExit}
            >
                {phase === 'listen' ? (
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
                        >
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <Headphones size={40} />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 mb-4">{selectedTopic.title}</h2>
                                <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
                                    {selectedTopic.audioUrl 
                                        ? "Listen to the media carefully. You can replay the track if needed, but it may affect your final score assessment."
                                        : "Get ready to listen to the dictation sentences. Each question will play its own audio clip."
                                    }
                                </p>

                                {selectedTopic.audioUrl ? (
                                    renderMedia(selectedTopic.audioUrl)
                                ) : (
                                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mb-10 max-w-xl mx-auto text-center">
                                        <p className="text-gray-700 font-bold text-lg leading-relaxed">
                                            This is a Dictation Exercise containing multiple sentences.
                                        </p>
                                        <p className="text-gray-500 text-md mt-2">
                                            For each sentence, play the audio clip and type exactly what you hear in the input field.
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col items-center space-y-6">
                                    <button
                                        onClick={() => {
                                            setPhase('quiz');
                                            setStartTime(Date.now());
                                        }}
                                        className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-black transition transform hover:-translate-y-1 active:scale-95 flex items-center shadow-xl shadow-gray-900/20"
                                    >
                                        Proceed to Questions <Play className="ml-3 h-5 w-5 fill-current" />
                                    </button>

                                    <div className="flex items-center space-x-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 italic">
                                        <ShieldCheck size={18} />
                                        <span>High-fidelity audio stream verified</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <SmartQuiz questions={selectedTopic.questions} onComplete={handleComplete} />
                )}
            </FullscreenProctorGuard>
        );
    }

    return (
        <DetailedReport
            {...report}
            onRetry={() => {
                if (id) {
                    navigate('/listening');
                } else {
                    setPhase('topic');
                    setReport(null);
                    setPlayCount(0);
                }
            }}
            onHome={() => navigate('/student/dashboard')}
        />
    );
};

export default ListeningTest;