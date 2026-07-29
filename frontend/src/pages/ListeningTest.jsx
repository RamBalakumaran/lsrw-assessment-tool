import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopicSelection from '../components/TopicSelection';
import SmartQuiz from '../components/SmartQuiz';
import DetailedReport from '../components/DetailedReport';
import { Headphones, Play, ShieldCheck, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import FullscreenProctorGuard from '../components/FullscreenProctorGuard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

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
    const [showCelebration, setShowCelebration] = useState(false);

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

    // Media 50% Completion Tracking States
    const [mediaProgress, setMediaProgress] = useState(0); // 0 to 100
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const accumulatedWatchedRef = React.useRef(0);
    const lastValidTimeRef = React.useRef(0);
    const playerRef = React.useRef(null);
    const syncTimeoutRef = React.useRef(null);

    // Fetch task media progress from backend & localStorage on topic selection
    useEffect(() => {
        if (!selectedTopic) return;

        // If task has no audio/video, unlock immediately
        if (!selectedTopic.audioUrl) {
            setIsUnlocked(true);
            setMediaProgress(100);
            return;
        }

        // Restore local progress fallback
        const localKey = `media_progress_${selectedTopic.id}`;
        const storedLocal = localStorage.getItem(localKey);
        if (storedLocal) {
            try {
                const parsed = JSON.parse(storedLocal);
                const restoredWatched = parsed.watchedTime || 0;
                const restoredProg = parsed.progress || 0;
                accumulatedWatchedRef.current = restoredWatched;
                setWatchedSeconds(restoredWatched);
                setMediaProgress(restoredProg);
                if (parsed.unlocked || restoredProg >= 50) setIsUnlocked(true);
            } catch(e) {}
        }

        // Fetch backend progress
        api.get(`/attempts/media-progress/${selectedTopic.id}`)
            .then(res => {
                if (res.data) {
                    const bProg = res.data.progress || 0;
                    if (res.data.unlocked || bProg >= 50) {
                        setIsUnlocked(true);
                        setMediaProgress(prev => Math.max(prev, 100));
                    } else if (bProg > 0) {
                        setMediaProgress(prev => Math.max(prev, bProg));
                    }
                }
            })
            .catch(err => console.error("Error fetching media progress:", err));
    }, [selectedTopic]);

    // Save and sync progress safely (prevent decreasing)
    const updateProgress = React.useCallback((watchedSecs, durationSecs) => {
        if (!durationSecs || durationSecs <= 0 || !selectedTopic) return;

        const currentProg = Math.min(100, Math.max(0, (watchedSecs / durationSecs) * 100));
        
        setTotalDuration(durationSecs);
        setMediaProgress(prev => {
            const nextProg = Math.max(prev, currentProg);
            const unlockedNow = nextProg >= 50;

            if (unlockedNow) setIsUnlocked(true);

            // Save local storage
            localStorage.setItem(`media_progress_${selectedTopic.id}`, JSON.stringify({
                watchedTime: watchedSecs,
                progress: nextProg,
                unlocked: unlockedNow
            }));

            return nextProg;
        });

        // Debounced sync to backend
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            api.post('/attempts/media-progress', {
                taskId: selectedTopic.id,
                watchedTime: watchedSecs,
                totalDuration: durationSecs
            }).then(res => {
                if (res.data && res.data.unlocked) {
                    setIsUnlocked(true);
                }
            }).catch(e => console.error("Error syncing media progress:", e));
        }, 1000);
    }, [selectedTopic]);

    // Load YouTube IFrame API if YouTube URL
    useEffect(() => {
        if (!selectedTopic?.audioUrl) return;
        const youtubeId = getYoutubeId(selectedTopic.audioUrl);
        if (!youtubeId) return;

        let interval;
        const initYT = () => {
            const container = document.getElementById(`yt-player-${selectedTopic.id}`);
            if (window.YT && window.YT.Player && container) {
                playerRef.current = new window.YT.Player(`yt-player-${selectedTopic.id}`, {
                    events: {
                        'onStateChange': (event) => {
                            // YT.PlayerState.PLAYING === 1
                            if (event.data === 1) {
                                if (interval) clearInterval(interval);
                                interval = setInterval(() => {
                                    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                                        const currentTime = playerRef.current.getCurrentTime() || 0;
                                        const dur = playerRef.current.getDuration() || 0;

                                        if (dur > 0) {
                                            const diff = currentTime - lastValidTimeRef.current;
                                            
                                            // Normal playback forward (1 sec interval with up to 3 sec window)
                                            if (diff > 0 && diff <= 3) {
                                                accumulatedWatchedRef.current += diff;
                                                setWatchedSeconds(accumulatedWatchedRef.current);
                                                updateProgress(accumulatedWatchedRef.current, dur);
                                            } else if (diff > 3) {
                                                // User jumped/seeked forward -> do NOT count skipped gap
                                            } else if (diff < 0) {
                                                // User seeked backward -> keep accumulated watched time intact
                                            }
                                            lastValidTimeRef.current = currentTime;
                                        }
                                    }
                                }, 1000);
                            } else {
                                // Paused (2), Ended (0), Buffering (3) -> stop timer loop
                                if (interval) clearInterval(interval);
                                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                                    lastValidTimeRef.current = playerRef.current.getCurrentTime() || 0;
                                }
                            }
                        }
                    }
                });
            }
        };

        if (!window.YT || !window.YT.Player) {
            window.onYouTubeIframeAPIReady = initYT;
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            initYT();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedTopic, updateProgress]);

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

            setShowCelebration(true);
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

            setShowCelebration(true);
        }
    };

    const handleMediaTimeUpdate = (e) => {
        const video = e.target;
        const current = video.currentTime;
        const dur = video.duration;

        // Skip forward check
        const diff = current - lastValidTimeRef.current;
        if (diff > 0 && diff < 3) {
            accumulatedWatchedRef.current += diff;
            setWatchedSeconds(accumulatedWatchedRef.current);
            updateProgress(accumulatedWatchedRef.current, dur);
        }
        lastValidTimeRef.current = current;
    };

    const renderMedia = (url) => {
        const youtubeId = getYoutubeId(url);

        if (youtubeId) {
            return (
                <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-[2rem] shadow-lg mb-6 bg-gray-900 border-4 border-gray-900" style={{ paddingTop: '56.25%' }}>
                    <iframe
                        id={`yt-player-${selectedTopic.id}`}
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&autoplay=0`}
                        title="Learning Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
            );
        }

        if (url && url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            return (
                <div className="w-full max-w-3xl mx-auto rounded-[2rem] shadow-lg mb-6 bg-gray-900 overflow-hidden border-4 border-gray-900">
                    <video
                        controls
                        className="w-full outline-none"
                        onPlay={() => setPlayCount(p => p + 1)}
                        onTimeUpdate={handleMediaTimeUpdate}
                    >
                        <source src={url} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        return (
            <div className="bg-gray-50 p-10 rounded-[2rem] border border-gray-100 mb-6 max-w-2xl mx-auto">
                <div className="flex items-center space-x-4 mb-6 justify-center">
                    <Music className="text-primary-500" size={24} />
                    <span className="font-bold text-gray-700 uppercase tracking-widest text-sm">Audio Track Ready</span>
                </div>
                <audio
                    controls
                    className="w-full h-12 rounded-full"
                    onPlay={() => setPlayCount(p => p + 1)}
                    onTimeUpdate={handleMediaTimeUpdate}
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
            <>
                <SubmissionSuccessModal
                    isOpen={showCelebration}
                    onComplete={() => {
                        setShowCelebration(false);
                        setPhase('report');
                    }}
                />
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
                                <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                                    {selectedTopic.audioUrl 
                                        ? "Listen to the media carefully. You must complete at least 50% of the content to unlock the assessment."
                                        : "Get ready to listen to the dictation sentences. Each question will play its own audio clip."
                                    }
                                </p>

                                {selectedTopic.audioUrl ? (
                                    <>
                                        {renderMedia(selectedTopic.audioUrl)}

                                        {/* Learning Progress Indicator */}
                                        <div className="max-w-xl mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-2">
                                                <span className="text-gray-500">Learning Progress</span>
                                                <span className={isUnlocked ? "text-emerald-600 font-extrabold" : "text-amber-600"}>
                                                    {Math.round(mediaProgress)}% / 50% Required {isUnlocked && '• UNLOCKED 🟢'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${Math.min(100, mediaProgress)}%` }}
                                                />
                                            </div>
                                            {totalDuration > 0 && (
                                                <div className="text-[11px] font-bold text-gray-400 mt-2 flex justify-between">
                                                    <span>Watched: {Math.round(watchedSeconds)}s</span>
                                                    <span>Total: {Math.round(totalDuration)}s</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
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

                                <div className="flex flex-col items-center space-y-4">
                                    {isUnlocked ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <button
                                                onClick={() => {
                                                    setPhase('quiz');
                                                    setStartTime(Date.now());
                                                }}
                                                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl transition transform hover:-translate-y-1 active:scale-95 flex items-center shadow-xl shadow-emerald-600/20"
                                            >
                                                🟢 Start Assessment <Play className="ml-3 h-5 w-5 fill-current" />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="text-center space-y-3">
                                            <button
                                                disabled
                                                className="px-12 py-5 bg-gray-200 text-gray-400 rounded-2xl font-black text-xl cursor-not-allowed flex items-center shadow-none border border-gray-300"
                                            >
                                                🔒 Start Assessment
                                            </button>
                                            <p className="text-xs font-bold text-amber-600 max-w-md bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                                                Please complete at least 50% of the learning content to unlock this assessment.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 italic">
                                        <ShieldCheck size={18} />
                                        <span>High-fidelity audio stream verified</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <FullscreenProctorGuard
                        title={selectedTopic?.title}
                        onExit={handleExit}
                    >
                        <SmartQuiz questions={selectedTopic.questions} onComplete={handleComplete} />
                    </FullscreenProctorGuard>
                )}
        </>
    );
}

    return (
        <>
            <SubmissionSuccessModal
                isOpen={showCelebration}
                onComplete={() => {
                    setShowCelebration(false);
                    setPhase('report');
                }}
            />
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
        </>
    );
};

export default ListeningTest;