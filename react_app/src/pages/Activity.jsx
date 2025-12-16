import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '@/components/Courses/Nav';
import Footer from '@/components/Courses/Footer';
import Sidebar from '@/components/Courses/Sidebar';
import EditorSection from '@/components/Activity/EditorSection';
import OutputSection from '@/components/Activity/OutputSection';
import InstructionsModal from '@/components/Activity/InstructionsModal';
import FloatingVideo from '@/components/Activity/FloatingVideo';
import HintModal from '@/components/Activity/HintModal';
import CompletionModal from '@/components/Activity/CompletionModal';
import useCodeExecution from '@/utils/useCodeExecution';

export default function Activity({ user }) {
    const navigate = useNavigate();
    const { code, setCode, output, isRunning, handleRunCode } = useCodeExecution();
    const [showHint, setShowHint] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    const [files, setFiles] = useState([
        { name: 'HelloWorld.java', language: 'java', content: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
        { name: 'Utils.java', language: 'java', content: 'public class Utils {\n    public static void printMessage(String msg) {\n        System.out.println(msg);\n    }\n}' },
        { name: 'README.md', language: 'markdown', content: '# Lab 1 - Java Basics\n\nIn this lab you will write your first Java program.' }
    ]);
    const [activeFile, setActiveFile] = useState(files[0]);

    const handleFileSelect = (file) => {

        const updatedFiles = files.map(f =>
            f.name === activeFile.name ? { ...f, content: code } : f
        );
        const newFile = updatedFiles.find(f => f.name === file.name);

        setFiles(updatedFiles);
        setActiveFile(newFile);
        setCode(newFile.content);
    };


    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const tasks = [
        {
            title: "Setup Environment",
            description: "Correctly define the HelloWorld class structure. Java requires the class name to match the filename.",
            requirements: "public class HelloWorld { ... }"
        },
        {
            title: "The Main Method",
            description: "Add the main entry point for the Java application. This is where the program execution begins.",
            requirements: "public static void main(String[] args)"
        },
        {
            title: "Printing Output",
            description: "Use System.out.println to print the required message to the console.",
            requirements: "Hello, World!"
        },
        {
            title: "Compilation & Execution",
            description: "Click the 'Run Code' button to compile and execute your program. Ensure there are no syntax errors.",
            requirements: "Process exited with code 0"
        },
        {
            title: "Final Review",
            description: "Review your code for any extra whitespace or formatting issues before submitting the lab.",
            requirements: "Clean and readable code"
        }
    ];

    const handleNextTask = () => {
        setIsVerifying(true);

        setTimeout(() => {
            setIsVerifying(false);
            if (currentTaskIndex < tasks.length - 1) {
                setCurrentTaskIndex(prev => prev + 1);
            } else {

                setShowInstructions(false);
                setShowCompletion(true);
            }
        }, 1500);
    };

    const handlePreviousTask = () => {
        if (!isVerifying && currentTaskIndex > 0) {
            setCurrentTaskIndex(prev => prev - 1);
        }
    };

    return (
        <div>
            <Nav user={user} />
            <div className='flex relative overflow-hidden bg-transparent min-h-screen'>
                <Sidebar />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-4">
                            {/* Code Input */}
                            <EditorSection
                                code={code}
                                onChange={setCode}
                                onRun={handleRunCode}
                                isRunning={isRunning}
                                onShowInstructions={() => setShowInstructions(true)}
                                files={files}
                                activeFile={activeFile}
                                onFileSelect={handleFileSelect}
                            />

                            {/* Code Output */}
                            <div className="flex-1">
                                <OutputSection output={output} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />

            <HintModal isOpen={showHint} onClose={() => setShowHint(false)} />

            <InstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                title="Lab 1: Java Basics"
                tasks={tasks}
                currentTaskIndex={currentTaskIndex}
                totalTasks={tasks.length}
                onNextTask={handleNextTask}
                onPreviousTask={handlePreviousTask}
                onHint={() => setShowHint(true)}
                isVerifying={isVerifying}
            />

            <CompletionModal
                isOpen={showCompletion}
                onClose={() => setShowCompletion(false)}
                grade={100}
                onGoBack={() => navigate('/courses')}
            />

            <FloatingVideo
                title="Lab Tutorial Video"
                videoUrl="https://www.youtube.com/watch?v=M88sDrY66r8"
                checkpoints={[
                    { timeDisplay: '0:00', timeSeconds: 0, label: 'Introduction' },
                    { timeDisplay: '1:04', timeSeconds: 64, label: 'Creating Java Class' },
                    { timeDisplay: '2:15', timeSeconds: 135, label: 'The Main Method' },
                    { timeDisplay: '3:45', timeSeconds: 225, label: 'System.out.println' },
                    { timeDisplay: '5:20', timeSeconds: 320, label: 'Running the Program' }
                ]}
            />
        </div>
    );
}