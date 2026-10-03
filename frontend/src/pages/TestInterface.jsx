import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactMediaRecorder } from 'react-media-recorder';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Square, Play, ArrowLeft, Settings, Activity, ShieldCheck, Loader2, RefreshCw, Clock
} from 'lucide-react';
import TopicSelection from '../components/TopicSelection';
import DetailedReport from '../components/DetailedReport';
import api from '../utils/api';
import FullscreenProctorGuard from '../components/FullscreenProctorGuard';
import SubmissionSuccessModal from '../components/SubmissionSuccessModal';

const TestInterface = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [phase, setPhase] = useState('topic');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Sequential Assessment States
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [mediaPhase, setMediaPhase] = useState('play'); // 'play', 'record', 'evaluating'
    
    // Stable Refs for callbacks
    const recordedBlobsRef = useRef([]);
    const currentQIndexRef = useRef(0);
    const selectedTopicRef = useRef(null);

    useEffect(() => {
        selectedTopicRef.current = selectedTopic;
        if (selectedTopic) {
            setCurrentQIndex(0);
            currentQIndexRef.current = 0;
            recordedBlobsRef.current = [];
            
            // Check if current question has media
            const hasMedia = selectedTopic.questions && selectedTopic.questions[0] && selectedTopic.questions[0].audioUrl;
            setMediaPhase(hasMedia ? 'play' : 'record');
        }
    }, [selectedTopic]);

    const isRepeatTask = selectedTopic?.assessmentType === 'Repeat Sentences' || 
                         selectedTopic?.subType === 'REPEAT_SENTENCES' || 
                         selectedTopic?.title?.toLowerCase().includes('repeat');

    const isMulti = selectedTopic?.questions && selectedTopic.questions.length > 0 && 
                    (selectedTopic.type === 'SPEAKING' || selectedTopic.lsrwComponent === 'Speaking' || isRepeatTask);

    const createZeroReport = (errorMsg, recordingUrl) => ({
        score: 0, title: "Speaking", transcript: "", recordingUrl,
        metrics: [ { label: "Words Per Minute", value: 0 }, { label: "Fluency Rating", value: "0/9.0" }, { label: "Vocab Diversity", value: "0/9.0" } ],
        criteria: { "Pronunciation": 0, "Fluency": 0, "Grammar": 0, "Vocabulary": 0, "Confidence": 0, "Relevance": 0 },
        mistakes: [],
        recommendations: [`⚠️ ${errorMsg}`, "Ensure your device microphone is active and you are in a quiet environment."]
    });

    const evaluateSingle = async (blob, topic) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('audio', blob, 'test.wav');
        if (topic && topic.id) {
            formData.append('taskId', topic.id);
            formData.append('topicTitle', topic.title || '');
            formData.append('topicDesc', topic.desc || '');
            if (topic.imageUrl) formData.append('topicImageUrl', topic.imageUrl);
        }

        try {
            const res = await api.post('/evaluate/assess-speaking', formData);
            const data = res.data;

            if (data.error && !data.metrics) {
                const isNoSpeech = data.error.includes("No speech") || data.error.includes("Could not understand");
                if (isNoSpeech) {
                    setReport(createZeroReport(data.error, data.recordingUrl));
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
            const rel9 = ((metrics.relevance || 0) / 10) * 9;
            
            const isRepeatTask = topic?.assessmentType === 'Repeat Sentences' || topic?.subType === 'REPEAT_SENTENCES' || topic?.title?.toLowerCase().includes('repeat');
            const overall9 = isRepeatTask ? (fluency9 + rel9) / 2 : (fluency9 + vocab9 + grammar9 + rel9) / 4;
            
            // Dynamic strict recommendations based on score
            let fluencyRec = "Work on reducing pauses and maintaining a steady pace.";
            if (metrics.fluency >= 8.5) fluencyRec = "Excellent natural cadence and speaking flow.";
            else if (metrics.fluency >= 7.0) fluencyRec = "Good speaking pace, but minor hesitations present.";
            else if (metrics.fluency >= 5.0) fluencyRec = "Average fluency. Try to minimize pauses and filler words.";
            
            let relRec = "Your response did not address the topic prompt accurately.";
            if (metrics.relevance >= 8.5) relRec = "Highly relevant and precise response.";
            else if (metrics.relevance >= 7.0) relRec = "Mostly relevant, but lacking some key details.";
            else if (metrics.relevance >= 5.0) relRec = "Somewhat relevant. Focus on directly answering the prompt.";

            const finalReport = {
                score: overall9.toFixed(1),
                isPass: overall9 >= 6.0,
                title: isRepeatTask ? "Repeat Sentence" : "Speaking",
                transcript: data.transcription || "",
                recordingUrl: data.recordingUrl,
                metrics: isRepeatTask ? [
                    { label: "Estimated WPM", value: data.wpm || 0 },
                    { label: "Fluency Score", value: `${fluency9.toFixed(1)}/9.0` },
                    { label: "Accuracy", value: `${Math.round((metrics.relevance || 0) * 10)}%` },
                    { label: "Number of Pauses", value: metrics.pause_count || 0 }
                ] : [
                    { label: "Estimated WPM", value: data.wpm || 0 },
                    { label: "Fluency Score", value: `${fluency9.toFixed(1)}/9.0` },
                    { label: "Vocabulary Richness", value: `${vocab9.toFixed(1)}/9.0` },
                    { label: "Number of Pauses", value: metrics.pause_count || 0 }
                ],
                criteria: isRepeatTask ? {
                    "Pronunciation": (metrics.pronunciation || 0) * 10,
                    "Fluency": (metrics.fluency || 0) * 10,
                    "Accuracy": (metrics.relevance || 0) * 10,
                    "Confidence": (metrics.fluency || 0) > 7 ? 90 : 60
                } : {
                    "Pronunciation": (metrics.pronunciation || 0) * 10,
                    "Fluency": (metrics.fluency || 0) * 10,
                    "Grammar": (metrics.grammar || 0) * 10,
                    "Vocabulary": (metrics.vocabulary || 0) * 10,
                    "Confidence": (metrics.fluency || 0) > 7 ? 90 : 60,
                    "Relevance": (metrics.relevance || 0) * 10
                },
                mistakes: data.mistakes || [],
                recommendations: data.recommendations || [
                    `Speaking tempo detected at ${data.wpm || 0} vocabulary words per minute with ${metrics.pause_count || 0} distinct pauses.`,
                    fluencyRec,
                    relRec,
                    ...(data.mistakes?.length > 0 ? [`Identified ${data.mistakes.length} structural points for refinement.`] : ["Structure appears consistent."])
                ]
            };
            
            setReport(finalReport);
            setShowCelebration(true);
            
            if (topic && topic.id) {
                await api.post('/attempts/submit', {
                    taskId: topic.id,
                    score: Math.round(overall9 * 10),
                    studentAnswers: data.transcription || "",
                    aiResults: finalReport,
                    recordingUrl: data.recordingUrl
                });
            }
        } catch (e) {
            console.error(e);
            const serverError = e.response?.data?.raw || e.response?.data?.error || e.message;
            alert("Analysis pipeline disrupted: " + serverError.substring(0, 200));
        }
        setLoading(false);
    };

    const evaluateAll = async (blobs, topic) => {
        setLoading(true);
        let totals = { wpm: 0, fluency: 0, vocab: 0, grammar: 0, pauses: 0, relevance: 0, score: 0 };
        let fullTranscript = [];
        let allMistakes = [];
        let allRecordingUrls = [];
        let valid = 0;

        for (let i = 0; i < blobs.length; i++) {
            const formData = new FormData();
            formData.append('audio', blobs[i], `test_${i}.wav`);
            formData.append('taskId', topic.id);
            formData.append('topicTitle', "Repeat Sentence - Question " + (i+1));
            // Send exact sentence for strict LLM checking
            formData.append('topicDesc', "Sentence to repeat: " + (topic.questions[i].questionText || topic.questions[i].text));

            try {
                const res = await api.post('/evaluate/assess-speaking', formData);
                const data = res.data;
                if (!data.error) {
                    const metrics = data.metrics || {};
                    totals.wpm += data.wpm || 0;
                    totals.fluency += metrics.fluency || 0;
                    totals.vocab += metrics.vocabulary || 0;
                    totals.grammar += metrics.grammar || 0;
                    totals.pauses += metrics.pause_count || 0;
                    totals.relevance += metrics.relevance || 0;
                    totals.score += data.overall_score || 0;
                    fullTranscript.push(`[Sentence ${i+1}]: ${data.transcription}`);
                    if (data.recordingUrl) allRecordingUrls.push(data.recordingUrl);
                    if (data.mistakes) allMistakes.push(...data.mistakes);
                    valid++;
                }
            } catch (e) {
                console.error("Error evaluating chunk", i, e);
            }
        }

        if (valid === 0) {
            setReport(createZeroReport("All recordings failed to process. Try speaking louder."));
            setPhase('report');
            setLoading(false);
            return;
        }

            const avg = (val) => val / valid;
            const avgFluency = avg(totals.fluency);
            const avgRelevance = avg(totals.relevance);
            const fluency9 = (avgFluency / 10) * 9;
            const vocab9 = (avg(totals.vocab) / 10) * 9;
            const grammar9 = (avg(totals.grammar) / 10) * 9;
            const rel9 = (avgRelevance / 10) * 9;
            
            const isRepeatTask = topic?.assessmentType === 'Repeat Sentences' || topic?.subType === 'REPEAT_SENTENCES' || topic?.title?.toLowerCase().includes('repeat');
            const overall9 = isRepeatTask ? (fluency9 + rel9) / 2 : (fluency9 + vocab9 + grammar9 + rel9) / 4;

            let fluencyRec = "Work on reducing pauses and maintaining a steady pace.";
            if (avgFluency >= 8.5) fluencyRec = "Excellent natural cadence and speaking flow.";
            else if (avgFluency >= 7.0) fluencyRec = "Good speaking pace, but minor hesitations present.";
            else if (avgFluency >= 5.0) fluencyRec = "Average fluency. Try to minimize pauses and filler words.";
            
            let relRec = "Your response did not address the topic prompt accurately.";
            if (avgRelevance >= 8.5) relRec = "Highly accurate and precise responses across sentences.";
            else if (avgRelevance >= 7.0) relRec = "Mostly accurate, but lacking precision in some sentences.";
            else if (avgRelevance >= 5.0) relRec = "Somewhat accurate. Focus on directly repeating or answering the prompt.";

            const finalReport = {
                score: overall9.toFixed(1),
                isPass: overall9 >= 6.0,
                title: isRepeatTask ? "Repeat Sentences" : "Speaking",
                transcript: fullTranscript.join('\n\n'),
                recordingUrls: allRecordingUrls,
                metrics: isRepeatTask ? [
                    { label: "Avg WPM", value: Math.round(avg(totals.wpm)) },
                    { label: "Avg Fluency Score", value: `${fluency9.toFixed(1)}/9.0` },
                    { label: "Accuracy", value: `${Math.round(avgRelevance * 10)}%` },
                    { label: "Total Pauses", value: totals.pauses }
                ] : [
                    { label: "Avg WPM", value: Math.round(avg(totals.wpm)) },
                    { label: "Avg Fluency Score", value: `${fluency9.toFixed(1)}/9.0` },
                    { label: "Avg Vocab Richness", value: `${vocab9.toFixed(1)}/9.0` },
                    { label: "Total Pauses", value: totals.pauses }
                ],
                criteria: isRepeatTask ? {
                    "Pronunciation": 80,
                    "Fluency": avgFluency * 10,
                    "Accuracy": avgRelevance * 10,
                    "Confidence": avgFluency > 7 ? 90 : 60
                } : {
                    "Pronunciation": 80,
                    "Fluency": avgFluency * 10,
                    "Grammar": avg(totals.grammar) * 10,
                    "Vocabulary": avg(totals.vocab) * 10,
                    "Confidence": avgFluency > 7 ? 90 : 60,
                    "Relevance": avgRelevance * 10
                },
                mistakes: allMistakes,
                recommendations: [
                    `Successfully completed ${valid} out of ${blobs.length} prompts.`,
                    fluencyRec,
                    relRec,
                    ...(allMistakes.length > 0 ? [`Identified ${allMistakes.length} structural points for refinement across all recordings.`] : ["Structure appears highly consistent overall."])
                ]
            };
            
            setReport(finalReport);
            setShowCelebration(true);
            setLoading(false);
            
            if (topic && topic.id) {
                await api.post('/attempts/submit', {
                    taskId: topic.id,
                    score: Math.round(overall9 * 10),
                    studentAnswers: fullTranscript.join('\n\n'),
                    aiResults: finalReport,
                    recordingUrl: allRecordingUrls.length > 0 ? allRecordingUrls[0] : null
                });
            }
        };

    const handleStop = async (url, blob) => {
        const topic = selectedTopicRef.current;
        const _isRepeatTask = topic?.assessmentType === 'Repeat Sentences' || topic?.subType === 'REPEAT_SENTENCES' || topic?.title?.toLowerCase().includes('repeat');
        const _isMulti = topic?.questions && topic.questions.length > 0 && 
                         (topic.type === 'SPEAKING' || topic.lsrwComponent === 'Speaking' || _isRepeatTask);
        
        if (_isMulti) {
            recordedBlobsRef.current.push(blob);
            if (currentQIndexRef.current < topic.questions.length - 1) {
                currentQIndexRef.current += 1;
                setCurrentQIndex(currentQIndexRef.current);
                const nextHasMedia = topic.questions[currentQIndexRef.current].audioUrl;
                setMediaPhase(nextHasMedia ? 'play' : 'record');
            } else {
                setMediaPhase('evaluating');
                await evaluateAll(recordedBlobsRef.current, topic);
            }
        } else {
            await evaluateSingle(blob, topic);
        }
    };

    const { startRecording, stopRecording, status } = useReactMediaRecorder({
        audio: true,
        onStop: handleStop
    });

    useEffect(() => {
        let timer;
        if (status === 'recording') {
            const limit = selectedTopic?.timeLimit || null; 
            if (limit !== null) {
                setTimeLeft(limit);
                timer = setInterval(() => {
                    setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
                }, 1000);
            } else {
                setTimeLeft(null); 
            }
        } else {
            setTimeLeft(null);
        }
        return () => clearInterval(timer);
    }, [status, selectedTopic]);

    useEffect(() => {
        if (timeLeft === 0 && status === 'recording') {
            stopRecording();
        }
    }, [timeLeft, status, stopRecording]);

    const [topics, setTopics] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/tasks');
                const specificTasks = res.data.filter(t => {
                    const comp = (t.lsrwComponent || t.type || '').toUpperCase();
                    return comp === 'SPEAKING';
                });
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

    const handleExit = () => {
        if (id) {
            navigate('/student/dashboard');
        } else {
            setPhase('topic');
            setSelectedTopic(null);
        }
    };

    if (phase === 'topic') {
        return <TopicSelection title="Speaking" topics={topics} onSelect={(t) => { setSelectedTopic(t); setPhase('record'); }} onBack={() => window.location.href = '/dashboard'} />;
    }

    if (phase === 'record') {
        return (
            <>
                <SubmissionSuccessModal
                    isOpen={showCelebration}
                    onComplete={() => {
                        setShowCelebration(false);
                        setPhase('report');
                    }}
                />
                <FullscreenProctorGuard
                    title={selectedTopic?.title}
                    onExit={handleExit}
                >
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

                    {isRepeatTask ? (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[600px] p-8 md:p-12 items-center justify-between text-center relative"
                        >
                            {/* Top header/progress */}
                            <div className="w-full flex flex-col items-center mb-6">
                                <div className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 font-black rounded-full text-xs tracking-widest uppercase border border-primary-100">
                                    Sentence {currentQIndex + 1} of {selectedTopic.questions.length}
                                </div>
                                
                                {/* Progress indicators */}
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    {selectedTopic.questions.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                                idx === currentQIndex 
                                                    ? 'w-8 bg-primary-600' 
                                                    : idx < currentQIndex 
                                                        ? 'w-2.5 bg-emerald-500' 
                                                        : 'w-2.5 bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Center block containing the main elements: Sentence text and Audio player */}
                            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full my-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Repeat the following sentence
                                </h3>
                                
                                {selectedTopic.questions[currentQIndex] && (selectedTopic.questions[currentQIndex].questionText || selectedTopic.questions[currentQIndex].text) && (
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-relaxed mb-8 text-center italic px-4">
                                        "{selectedTopic.questions[currentQIndex].questionText || selectedTopic.questions[currentQIndex].text}"
                                    </h1>
                                )}

                                {selectedTopic.questions[currentQIndex]?.audioUrl && (
                                    <div className="w-full max-w-xl p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm mb-6 flex flex-col items-center justify-center">
                                        {selectedTopic.questions[currentQIndex].audioUrl.match(/\.(mp4|webm|mkv)/i) ? (
                                            <video 
                                                key={currentQIndex}
                                                controls 
                                                src={selectedTopic.questions[currentQIndex].audioUrl} 
                                                className="w-full rounded-2xl shadow-sm max-h-[300px] object-contain bg-black"
                                                onPlay={() => setMediaPhase('play')}
                                                onEnded={() => setMediaPhase('record')}
                                            />
                                        ) : (
                                            <div className="w-full flex flex-col items-center py-2">
                                                <div className="mb-3 text-xs text-primary-500 font-bold tracking-widest uppercase">
                                                    Listen to the Audio
                                                </div>
                                                <audio 
                                                    key={currentQIndex}
                                                    controls 
                                                    src={selectedTopic.questions[currentQIndex].audioUrl} 
                                                    className="w-full rounded-lg"
                                                    onPlay={() => setMediaPhase('play')}
                                                    onEnded={() => setMediaPhase('record')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-gray-500 text-sm font-medium mb-2">
                                    {selectedTopic.desc || "Listen to the media carefully, then repeat exactly what you hear."}
                                </p>
                            </div>

                            {/* Bottom block: Recording interface */}
                            <div className="w-full flex flex-col items-center justify-center min-h-[220px] bg-gray-50/50 rounded-[2.5rem] border border-gray-50 p-6 md:p-8 mt-4">
                                {status === 'recording' && timeLeft !== null && (
                                    <div className="mb-4 bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center space-x-2 text-rose-500 font-black tracking-widest shadow-sm">
                                        <Clock size={16} />
                                        <span>
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {loading || mediaPhase === 'evaluating' ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-4"
                                        >
                                            <div className="relative">
                                                <Loader2 size={64} className="text-primary-500 animate-spin mx-auto mb-4" />
                                                <RefreshCw size={24} className="text-primary-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-1">Analyzing Patterns...</h3>
                                            <p className="text-xs text-gray-500 font-medium">Decoding phonemes and checking fluency</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="interface"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center w-full flex flex-col items-center"
                                        >
                                            {status === 'recording' ? (
                                                <div className="mb-6">
                                                    <div className="flex justify-center items-end gap-1 h-16 mb-4">
                                                        {[...Array(15)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ height: [12, Math.random() * 48 + 12, 12] }}
                                                                transition={{ repeat: Infinity, duration: 0.5 + Math.random() }}
                                                                className="w-1.5 bg-primary-500 rounded-full"
                                                            ></motion.div>
                                                        ))}
                                                    </div>
                                                    <div className="inline-block px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full font-black text-xs uppercase tracking-widest border border-rose-100 animate-pulse">
                                                        Live • Recording
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        {mediaPhase === 'play' ? "Watch/Listen First" : "Ready to repeat?"}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        {mediaPhase === 'play' ? "Please play the media above." : "Press the button and repeat the sentence."}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-center">
                                                {status !== 'recording' ? (
                                                    <button
                                                        onClick={startRecording}
                                                        disabled={mediaPhase === 'play'}
                                                        className={`group flex flex-col items-center ${mediaPhase === 'play' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 active:scale-95 transition-all duration-300 group-hover:bg-primary-500">
                                                            <Mic size={32} />
                                                        </div>
                                                        <span className="mt-3 font-bold text-gray-800 uppercase tracking-tight text-sm">Start Recording</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={stopRecording}
                                                        className="group flex flex-col items-center"
                                                    >
                                                        <div className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-300">
                                                            <Square size={28} className="fill-current" />
                                                        </div>
                                                        <span className="mt-3 font-bold text-rose-600 uppercase tracking-tight text-sm">
                                                            {currentQIndex < selectedTopic.questions.length - 1 ? 'Next Sentence' : 'Finish Recognition'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]"
                        >
                            {/* Topic Side */}
                            <div className={`${selectedTopic.passage ? 'md:w-7/12 p-8 justify-start max-h-[650px] overflow-y-auto' : 'md:w-5/12 p-12 justify-center'} bg-gray-50 border-r border-gray-100 flex flex-col`}>
                                <div className={`${selectedTopic.passage ? 'w-12 h-12 mb-4' : 'w-16 h-16 mb-6'} bg-white rounded-2xl flex items-center justify-center text-primary-500 shadow-sm`}>
                                    <Mic size={selectedTopic.passage ? 24 : 32} />
                                </div>
                                <h2 className={`${selectedTopic.passage ? 'text-2xl mb-2' : 'text-3xl mb-4'} font-black text-gray-900 tracking-tight`}>{selectedTopic.title}</h2>
                                
                                {isMulti ? (
                                    <div className="mb-6">
                                        <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 font-bold rounded-lg mb-4 text-xs tracking-widest uppercase">
                                            Sentence {currentQIndex + 1} of {selectedTopic.questions.length}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-2">Instructions</h3>
                                        <p className="text-gray-500 mb-6">{selectedTopic.desc || "Listen to the media carefully, then repeat exactly what you hear."}</p>
                                        
                                        {(selectedTopic.questions[currentQIndex].questionText || selectedTopic.questions[currentQIndex].text) && (
                                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
                                                <p className="text-gray-700 font-medium italic">"{selectedTopic.questions[currentQIndex].questionText || selectedTopic.questions[currentQIndex].text}"</p>
                                            </div>
                                        )}

                                        {selectedTopic.questions[currentQIndex].audioUrl && (
                                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                                {selectedTopic.questions[currentQIndex].audioUrl.match(/\.(mp4|webm|mkv)/i) ? (
                                                    <video 
                                                        key={currentQIndex}
                                                        controls 
                                                        src={selectedTopic.questions[currentQIndex].audioUrl} 
                                                        className="w-full rounded-xl"
                                                        onPlay={() => setMediaPhase('play')}
                                                        onEnded={() => setMediaPhase('record')}
                                                    />
                                                ) : (
                                                    <audio 
                                                        key={currentQIndex}
                                                        controls 
                                                        src={selectedTopic.questions[currentQIndex].audioUrl} 
                                                        className="w-full"
                                                        onPlay={() => setMediaPhase('play')}
                                                        onEnded={() => setMediaPhase('record')}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {selectedTopic.imageUrl && (
                                            <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white p-2">
                                                <img src={selectedTopic.imageUrl} alt="Topic Visual" className="w-full h-auto rounded-xl object-contain max-h-[250px]" />
                                            </div>
                                        )}
                                        {selectedTopic.desc && (
                                            <p className={`${selectedTopic.passage ? 'text-slate-500 text-sm font-semibold mb-2' : 'text-gray-500 text-lg font-medium leading-relaxed mb-6'}`}>
                                                {selectedTopic.desc}
                                            </p>
                                        )}
                                        {selectedTopic.passage && (
                                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-3 flex-1 flex flex-col min-h-[300px]">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                                    Passage to Read Aloud
                                                </h4>
                                                <div className="text-slate-700 text-base md:text-lg font-medium leading-relaxed whitespace-pre-line select-none flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                                    {selectedTopic.passage}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="mt-8 space-y-4">
                                    {selectedTopic.timeLimit && (
                                        <div className="flex items-center space-x-3 text-sm font-bold text-gray-400">
                                            <Clock size={18} className="text-blue-500" />
                                            <span>Time Limit: {selectedTopic.timeLimit} seconds</span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-3 text-sm font-bold text-gray-400">
                                        <ShieldCheck size={18} className="text-emerald-500" />
                                        <span>Noise suppression active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recording Side */}
                            <div className={`${selectedTopic.passage ? 'md:w-5/12 p-8' : 'md:w-7/12 p-12'} flex flex-col items-center justify-center relative bg-white`}>
                                {status === 'recording' && timeLeft !== null && (
                                    <div className="absolute top-8 right-8 bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center space-x-2 text-rose-500 font-black tracking-widest shadow-sm">
                                        <Clock size={16} />
                                        <span>
                                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                )}
                                <AnimatePresence mode="wait">
                                    {loading || mediaPhase === 'evaluating' ? (
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
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        {isMulti ? (mediaPhase === 'play' ? "Watch/Listen First" : "Ready to start?") : "Ready to start?"}
                                                    </h3>
                                                    <p className="text-gray-400">
                                                        {isMulti ? (mediaPhase === 'play' ? "Please play the media on the left." : "Press the button and repeat the sentence.") : "Press the button when you're ready to speak"}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-center">
                                                {status !== 'recording' ? (
                                                    <button
                                                        onClick={startRecording}
                                                        disabled={isMulti && mediaPhase === 'play'}
                                                        className={`group flex flex-col items-center ${isMulti && mediaPhase === 'play' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary-500/40 group-hover:scale-110 active:scale-95 transition-all duration-300 group-hover:bg-primary-500">
                                                            <Mic size={40} />
                                                        </div>
                                                        <span className="mt-4 font-black text-gray-900 uppercase tracking-tighter text-lg">Start Recording</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={stopRecording}
                                                        className="group flex flex-col items-center"
                                                    >
                                                        <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 hover:scale-110 active:scale-95 transition-all duration-300">
                                                            <Square size={36} className="fill-current" />
                                                        </div>
                                                        <span className="mt-4 font-black text-rose-600 uppercase tracking-tighter text-lg">
                                                            {isMulti && currentQIndex < selectedTopic.questions.length - 1 ? 'Next Sentence' : 'Finish Recognition'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </div>
            </FullscreenProctorGuard>
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
                transcript={report?.transcript}
                onRetry={() => {
                    if (id) {
                        navigate('/speaking');
                    } else {
                        setPhase('topic');
                        setReport(null);
                    }
                }}
                onHome={() => navigate('/student/dashboard')}
            />
        </>
    );
};

export default TestInterface;