import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE, LLM_BASE, getAuthHeaders } from '../../config/api';
import { auth } from '@/utils/firebase.js';
import ReactMarkdown from 'react-markdown';
import ActivityHeader from './ActivityHeader';
import VideoSection from './VideoSection';
import CodeEditorSection from './CodeEditorSection';
import CheckpointOverlay from './CheckpointOverlay';
import HintChatSidebar from './HintChatSidebar';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import SubmissionResultOverlay from './SubmissionResultOverlay';
import { Play, FileText, Clock, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCheckpoints } from '@/components/Activity/useCheckpoints';


const DEFAULT_FILES = [
    {
        name: 'Product.java',
        language: 'java',
        content: `public class Product {
  private int id;
  private double price;
  private String name;
  private int quantity;
  
  public Product(int id, double price, String name){
    this.id = id;
    this.price = price;
    this.name = name;
    this.quantity++;
  }

  public void applySaleDiscount(double percentage){
    this.price = this.price - ((percentage/100) * this.price);
  }

  public void addToShoppingCart(){
    System.out.println(this.name + " has been added to the shopping cart.");
  }

  public int getTotalQuantity(){
    return this.quantity;
  }
  
  public void getSellableStatus(){
    System.out.println("This product is sellable");
  }

  public String toString(){
    return "Product info:\\n+Id: " + this.id + "\\t" + "name: " + this.name +
      "\\tPrice: SR" + this.price;
  }
}`
    },
    {
        name: 'App.java',
        language: 'java',
        content: `import java.time.LocalDate;

public class App {

  public static void main(String[] args){
    Product p1 = new Product(6745, 5.50, "Penne Pasta");
    Product p2 = new Product(8853, 6.50, "Spaghetti Pasta");
    Product p3 = new Product(2106, 4.50, "Linguine Pasta");
    System.out.println("Total Quantity: " + p3.getTotalQuantity());
  }
}`
    },
    {
        name: 'ElectricProduct.java',
        language: 'java',
        content: `public class ElectricProduct extends Product {

  private String voltage;

  public ElectricProduct(int id, double price, String name, String voltage){
    super(id, price, name);
    this.voltage = voltage;
  }

  @Override
  public String toString(){
    return super.toString() + "\\t Voltage: " + this.voltage;
  }

}`
    },
    {
        name: 'FoodProduct.java',
        language: 'java',
        content: `import java.time.LocalDate;

public class FoodProduct extends Product {
  private LocalDate expirationDate;

  public FoodProduct(int id, double price, String name, LocalDate expirationDate){
    super(id, price, name);
    this.expirationDate = expirationDate;
  }

  @Override
  public String toString(){
    return super.toString() + "\\t Expiration Date: " + this.expirationDate;
  }
}`
    }
];


const getLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
    };
    return languageMap[ext] || 'plaintext';
};

export default function Maincontent({ user }) {
    const { t } = useTranslation();
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const lastProgressSaveRef = useRef(0);
    const savedProgressRef = useRef(0);

    const [activity, setActivity] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState(DEFAULT_FILES);
    const [activeFile, setActiveFile] = useState(DEFAULT_FILES[0]);
    const [initialFiles, setInitialFiles] = useState(DEFAULT_FILES);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [feedback, setFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [submissionScore, setSubmissionScore] = useState(0);
    const [mode, setMode] = useState('preview'); // 'preview' or 'solve'
    const [markdownContent, setMarkdownContent] = useState('');
    const [isHintOpen, setIsHintOpen] = useState(false);
    const [selectedCodeForChat, setSelectedCodeForChat] = useState('');
    const [checkpointHintText, setCheckpointHintText] = useState('');
    const [isLoadingCheckpointHint, setIsLoadingCheckpointHint] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [captionSegmentsEn, setCaptionSegmentsEn] = useState([]);
    const [captionSegmentsAr, setCaptionSegmentsAr] = useState([]);
    const [captionsEnabled, setCaptionsEnabled] = useState(false);
    const [captionLang, setCaptionLang] = useState('en');
    const [chapters, setChapters] = useState([]);

    const handleAskAI = useCallback((text) => {
        setSelectedCodeForChat(text);
        setIsHintOpen(true);
    }, []);

    const handleSeek = (newTime) => {
        if (videoRef.current) videoRef.current.currentTime = newTime;
    };

    const recordAnswer = useCallback(async ({ question_id, answer, is_correct }) => {
        if (!user?.uid || !courseId || !activityId) return;
        fetch(`${API_BASE}/courses/${courseId}/activities/${activityId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...await getAuthHeaders(auth.currentUser) },
            body: JSON.stringify({ firebaseId: user.uid, question_id, answer })
        }).catch(() => {});
    }, [user, courseId, activityId]);

    // Initialize Checkpoint Logic Engine
    const {
        checkpoints,
        activeCheckpoint,
        checkSolution,
        submitQuizAnswer,
        skipCheckpoint,
        nextCheckpoint,
        prevCheckpoint,
        retryCheckpoint
    } = useCheckpoints({
        currentTime,
        files,
        setFiles,
        videoRef,
        activeFile,
        setActiveFile,
        onFeedback: setFeedback,
        onPlay: () => {
            if (videoRef.current) videoRef.current.play();
            setIsPlaying(true);
        },
        onPause: () => {
            if (videoRef.current) videoRef.current.pause();
            setIsPlaying(false);
        },
        onSeek: handleSeek,
        INITIAL_FILES: initialFiles,
        quizQuestions,
        onAnswerRecorded: recordAnswer,
        answeredQuestions
    });

    const handleCheckpointHint = useCallback(async () => {
        if (!activeCheckpoint || isLoadingCheckpointHint) return;
        setIsLoadingCheckpointHint(true);
        try {
            const fileName = activeCheckpoint.fileName || activeFile.name;
            const targetFile = files.find(f => f.name === fileName) || activeFile;
            const res = await fetch(`${LLM_BASE}/hint/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_uid: user?.uid || 'anonymous',
                    activity_id: parseInt(activityId) || 0,
                    checkpoint_instruction: activeCheckpoint.instruction,
                    student_code: targetFile.content,
                    file_name: targetFile.name,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setCheckpointHintText(data.hint || 'No hint available.');
            } else {
                setCheckpointHintText('Failed to generate hint. Please try again.');
            }
        } catch {
            setCheckpointHintText('Hint service is unavailable. Please try again later.');
        } finally {
            setIsLoadingCheckpointHint(false);
        }
    }, [activeCheckpoint, isLoadingCheckpointHint, activeFile, files, user, activityId]);

    // Clear hint when checkpoint changes
    useEffect(() => {
        setCheckpointHintText('');
    }, [activeCheckpoint?.id]);

    useEffect(() => {
        if (!activityId) {
            setLoading(false);
            setFeedback({ type: 'error', message: "No Activity ID provided." });
            return;
        }

        async function loadActivity() {
            try {
                // Fetch course name for breadcrumb
                if (courseId) {
                    const courseRes = await fetch(`${API_BASE}/courses/${courseId}`, {
                        headers: await getAuthHeaders(auth.currentUser)
                    });
                    if (courseRes.ok) {
                        const courseData = await courseRes.json();
                        setCourseName(courseData.title || "");
                    }
                }

                const url = `${API_BASE}/courses/${courseId || '0'}/activities/${activityId}`;
                const res = await fetch(url, {
                    headers: await getAuthHeaders(auth.currentUser)
                });

                if (res.ok) {
                    const data = await res.json();
                    setActivity(data);

                    // Load starter code files if available
                    let loadedFiles = [...DEFAULT_FILES];

                    if (data.starter_code_url) {
                        try {
                            const starterRes = await fetch(data.starter_code_url);
                            if (starterRes.ok) {
                                const starterCode = await starterRes.json();
                                // Add language property if not present
                                loadedFiles = starterCode.map(file => ({
                                    ...file,
                                    language: file.language || getLanguageFromFileName(file.name)
                                }));
                                setInitialFiles(loadedFiles);
                                setFiles(loadedFiles);
                                setActiveFile(loadedFiles[0]);
                            }
                        } catch (starterErr) {
                            console.error("Failed to fetch starter code:", starterErr);
                        }
                    }

                    // Load markdown file and add to files
                    if (data.md_file_url) {
                        try {
                            const mdRes = await fetch(data.md_file_url);
                            if (mdRes.ok) {
                                const mdText = await mdRes.text();
                                setMarkdownContent(mdText); // Store for preview
                                setFiles(prev => {
                                    const exists = prev.some(f => f.name === 'README.md');
                                    if (exists) return prev.map(f => f.name === 'README.md' ? { ...f, content: mdText } : f);
                                    return [...prev, { name: 'README.md', language: 'markdown', content: mdText }];
                                });
                            }
                        } catch (mdErr) {
                            console.error("Failed to fetch MD file:", mdErr);
                        }
                    }

                    // Load quiz questions from DB
                    try {
                        const quizRes = await fetch(
                            `${API_BASE}/courses/${courseId}/activities/${activityId}/quiz`,
                            { headers: await getAuthHeaders(auth.currentUser) }
                        );
                        if (quizRes.ok) {
                            const quizData = await quizRes.json();
                            setQuizQuestions(quizData.quizzes || []);
                        }
                    } catch (quizErr) {
                        console.error("Failed to fetch quiz data:", quizErr);
                    }

                    // Load video chapters
                    try {
                        const chaptersRes = await fetch(
                            `${API_BASE}/courses/${courseId}/activities/${activityId}/chapters`,
                            { headers: await getAuthHeaders(auth.currentUser) }
                        );
                        if (chaptersRes.ok) {
                            const chaptersData = await chaptersRes.json();
                            setChapters(chaptersData.chapters || []);
                        }
                    } catch (chaptersErr) {
                        console.error("Failed to fetch video chapters:", chaptersErr);
                    }

                    // Load transcript for captions (EN + AR)
                    try {
                        const transcriptRes = await fetch(
                            `${API_BASE}/transcripts/activities/${activityId}`,
                            { headers: await getAuthHeaders(auth.currentUser) }
                        );
                        if (transcriptRes.ok) {
                            const transcriptData = await transcriptRes.json();
                            if (transcriptData.status === 'completed' && transcriptData.transcript_id) {
                                // Fetch English transcript
                                const enRes = await fetch(
                                    `${API_BASE}/transcripts/${transcriptData.transcript_id}/content`,
                                    { headers: await getAuthHeaders(auth.currentUser) }
                                );
                                if (enRes.ok) {
                                    const enData = await enRes.json();
                                    setCaptionSegmentsEn(enData.segments || []);
                                }

                                // Fetch Arabic transcript (may not exist)
                                if (transcriptData.transcript_url_ar) {
                                    const arRes = await fetch(
                                        `${API_BASE}/transcripts/${transcriptData.transcript_id}/content?lang=ar`,
                                        { headers: await getAuthHeaders(auth.currentUser) }
                                    );
                                    if (arRes.ok) {
                                        const arData = await arRes.json();
                                        setCaptionSegmentsAr(arData.segments || []);
                                    }
                                }
                            }
                        }
                    } catch (transcriptErr) {
                        console.error("Failed to fetch transcript:", transcriptErr);
                    }

                    // Load student's previous answers
                    if (user?.uid) {
                        try {
                            const answersRes = await fetch(
                                `${API_BASE}/courses/${courseId}/activities/${activityId}/answers?firebaseId=${user.uid}`,
                                { headers: await getAuthHeaders(auth.currentUser) }
                            );
                            if (answersRes.ok) {
                                const { answers } = await answersRes.json();
                                setAnsweredQuestions(answers || []);
                            }
                        } catch (answersErr) {
                            console.error("Failed to fetch student answers:", answersErr);
                        }
                    }

                    // Load video progress (store in ref, apply when video loads)
                    if (user?.uid) {
                        try {
                            const progressRes = await fetch(
                                `${API_BASE}/courses/${courseId}/activities/${activityId}/progress?firebaseId=${user.uid}`,
                                { headers: await getAuthHeaders(auth.currentUser) }
                            );
                            if (progressRes.ok) {
                                const { last_watched_seconds } = await progressRes.json();
                                if (last_watched_seconds > 5) {
                                    savedProgressRef.current = last_watched_seconds;
                                }
                            }
                        } catch (progressErr) {
                            console.error("Failed to fetch video progress:", progressErr);
                        }
                    }
                } else {
                    const errorText = await res.text();
                    setFeedback({ type: 'error', message: `Failed to load activity (Status: ${res.status})` });
                }
            } catch (err) {
                setFeedback({ type: 'error', message: "Network error loading activity." });
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, [courseId, activityId, user]);


    const isYouTube = activity?.video_url && (activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be'));

    useEffect(() => {
        let interval;
        if (isYouTube && isPlaying && !activeCheckpoint) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const newTime = prev + 1;
                    if (!duration) setDuration(600);
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isYouTube, isPlaying, activeCheckpoint, duration]);


    const saveVideoProgress = useCallback(async (seconds) => {
        if (!user?.uid || !courseId || !activityId) return;
        fetch(`${API_BASE}/courses/${courseId}/activities/${activityId}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...await getAuthHeaders(auth.currentUser) },
            body: JSON.stringify({ firebaseId: user.uid, last_watched_seconds: Math.floor(seconds) })
        }).catch(() => {});
    }, [user, courseId, activityId]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const time = videoRef.current.currentTime;
        setCurrentTime(time);

        // Throttled save every 10 seconds
        if (time - lastProgressSaveRef.current > 10) {
            lastProgressSaveRef.current = time;
            saveVideoProgress(time);
        }
    };

    const handlePlay = () => {
        if (activeCheckpoint && !activeCheckpoint.completed) {
            setFeedback({ type: 'error', message: 'Complete the current challenge to continue!' });
            setTimeout(() => setFeedback(null), 3000);
            return;
        }
        videoRef.current?.play();
        setIsPlaying(true);
    };

    const handlePause = () => {
        videoRef.current?.pause();
        setIsPlaying(false);
        if (videoRef.current) saveVideoProgress(videoRef.current.currentTime);
    };

    const handleFileChange = (newContent) => {
        setFiles(prev => prev.map(f => f.name === activeFile.name ? { ...f, content: newContent } : f));
        setActiveFile(prev => ({ ...prev, content: newContent }));
    };

    const handleSubmit = async () => {
        if (!user) {
            setFeedback({ type: 'error', message: "You must be logged in to submit." });
            return;
        }
        setIsSubmitting(true);
        try {
            const challenges = checkpoints.filter(cp => cp.type === 'challenge');
            const totalCount = challenges.length;
            const verifiedCount = challenges.filter(cp => cp.status === 'verified').length;
            const calculatedScore = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

            const url = `${API_BASE}/courses/${courseId}/activities/${activityId}/submit`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    ...await getAuthHeaders(auth.currentUser)
                },
                body: JSON.stringify({
                    firebaseId: user.uid,
                    score: calculatedScore,
                    files: files.map(f => ({ name: f.name, content: f.content })),
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSubmissionScore(calculatedScore);
                setShowResultOverlay(true);
                const ghMsg = data.github?.commitUrl
                    ? ` Code pushed to GitHub.`
                    : data.github?.error
                        ? ` (GitHub push failed: ${data.github.error})`
                        : "";
                setFeedback({ type: 'success', message: `Submission successful!${ghMsg}` });
            } else {
                setFeedback({ type: 'error', message: data.message || "Submission failed. Please try again." });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: "Network error during submission." });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    if (loading) return <LoadingScreen />;

    if (!activity) return (
        <ErrorScreen
            message={feedback?.message}
            onBack={() => navigate(`/courses/${courseId}`)}
            courseId={courseId}
        />
    );

    // Preview mode - show markdown instructions with Start button
    if (mode === 'preview') {
        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] text-gray-100 font-sans h-full">
                {/* Preview Header */}
                <div className="h-14 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm">{t('backToCourse')}</span>
                        </button>
                        <div className="w-px h-6 bg-gray-700" />
                        <h1 className="text-lg font-semibold text-white">{activity.title}</h1>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto px-8 py-8">
                        {/* Activity Info Card */}
                        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8 sticky top-0 z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{activity.title}</h2>
                                        <p className="text-sm text-gray-400">{t('labActivity')}</p>
                                    </div>
                                </div>
                                {activity.end_date && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>{t('due')} {new Date(activity.end_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMode('solve')}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
                            >
                                <Play className="w-5 h-5" />
                                {t('startSolving')}
                            </button>
                        </div>

                        {/* Markdown Instructions */}
                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('instructions')}</h3>
                            </div>
                            <div className="px-6 py-6">
                                {markdownContent ? (
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                                            p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ol>,
                                            li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                            em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                                            code: ({ children, className }) => {
                                                const isBlock = className?.includes("language-");
                                                if (isBlock) {
                                                    return <code className="text-blue-300 text-sm font-mono">{children}</code>;
                                                }
                                                return (
                                                    <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>
                                                );
                                            },
                                            pre: ({ children }) => (
                                                <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700">{children}</pre>
                                            ),
                                            a: ({ href, children }) => (
                                                <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                                                    {children}
                                                </a>
                                            ),
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-4 bg-gray-800/50 py-2 rounded-r">{children}</blockquote>
                                            ),
                                            hr: () => <hr className="border-gray-700 my-6" />,
                                        }}
                                    >
                                        {markdownContent}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-gray-500 italic">{t('noInstructions')}</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // Solve mode - show the lab IDE
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] text-gray-100 font-sans h-full">
            <ActivityHeader
                activityTitle={activity.title}
                onBack={() => navigate(`/courses`)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isEnded={activity.end_date && new Date() > new Date(activity.end_date)}
                isUpcoming={activity.start_date && new Date() < new Date(activity.start_date)}
                onHintClick={() => setIsHintOpen(prev => !prev)}
                isHintOpen={isHintOpen}
            />

            <div className="flex-1 flex overflow-hidden flex-row">
                <CodeEditorSection
                    files={files}
                    activeFile={activeFile}
                    feedback={feedback}
                    activeCheckpoint={activeCheckpoint}
                    onFileSelect={setActiveFile}
                    onFileChange={handleFileChange}
                    courseName={courseName}
                    courseId={courseId}
                    activityTitle={activity.title}
                    onAskAI={handleAskAI}
                />

                <VideoSection
                    activity={activity}
                    videoRef={videoRef}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    checkpoints={checkpoints}
                    activeCheckpoint={activeCheckpoint}
                    chapters={chapters}
                    captionSegments={captionLang === 'ar' && captionSegmentsAr.length > 0 ? captionSegmentsAr : captionSegmentsEn}
                    hasArabicCaptions={captionSegmentsAr.length > 0}
                    captionsEnabled={captionsEnabled}
                    onToggleCaptions={() => setCaptionsEnabled(prev => !prev)}
                    captionLang={captionLang}
                    onToggleCaptionLang={() => setCaptionLang(prev => prev === 'en' ? 'ar' : 'en')}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={(d) => {
                        setDuration(d);
                        if (savedProgressRef.current > 0 && videoRef.current) {
                            videoRef.current.currentTime = savedProgressRef.current;
                            setCurrentTime(savedProgressRef.current);
                            savedProgressRef.current = 0;
                        }
                    }}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={handleSeek}
                    onNext={nextCheckpoint}
                    onPrev={prevCheckpoint}
                    onRetryCheckpoint={retryCheckpoint}
                    CheckpointOverlay={() => (
                        <CheckpointOverlay
                            activeCheckpoint={activeCheckpoint}
                            feedback={feedback}
                            onCheckSolution={checkSolution}
                            onSubmitQuizAnswer={submitQuizAnswer}
                            onSkip={skipCheckpoint}
                            onHint={handleCheckpointHint}
                            hintText={checkpointHintText}
                            isLoadingHint={isLoadingCheckpointHint}
                        />
                    )}
                />
            </div>

            {showResultOverlay && (
                <SubmissionResultOverlay
                    checkpoints={checkpoints}
                    score={submissionScore}
                    courseId={courseId}
                    onClose={() => setShowResultOverlay(false)}
                />
            )}

            <HintChatSidebar
                isOpen={isHintOpen}
                onClose={() => setIsHintOpen(false)}
                initialInput={selectedCodeForChat}
                onInitialInputConsumed={() => setSelectedCodeForChat('')}
                user={user}
                activityId={activityId}
                activityContext={
                    (markdownContent ? `## Activity Instructions\n${markdownContent}\n\n` : '') +
                    files.filter(f => f.name !== 'README.md').map(f => `## File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')
                }
            />
        </div>
    );
}