import Nav from '@/components/Courses/Nav';
import Footer from '@/components/Courses/Footer';
import Sidebar from '@/components/Courses/Sidebar';
import EditorSection from '@/components/Activity/EditorSection';
import OutputSection from '@/components/Activity/OutputSection';
import Instructions from '@/components/Activity/Instructions';
import VideoPlayer from '@/components/Activity/VideoPlayer';
import useCodeExecution from '@/utils/useCodeExecution';

export default function Activity({ user }) {
    const { code, setCode, output, isRunning, handleRunCode } = useCodeExecution();

    return (
        <div>
            <Nav user={user} />
            <div className='flex relative overflow-hidden bg-transparent min-h-screen'>
                <Sidebar />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex gap-4">
                            {/* Instructions Panel */}
                            <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                                <div className="h-[52px]"></div> {/* Spacer to align with EditorSection header */}
                                <Instructions
                                    title="Lab Instructions"
                                    problemStatement="In this lab, you will learn the basics of Java programming. Write a simple program that prints 'Hello, World!' to the console. Click the Run button to execute your code and see the output below."
                                    // this should be button to popup the file like text in futrure or maybe it will be embedded in the files compiler
                                    fileName="HelloWorld.java"
                                />
                            </div>

                            {/* Code Editor, Video, and Output */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Code Input */}
                                <EditorSection
                                    code={code}
                                    onChange={setCode}
                                    onRun={handleRunCode}
                                    isRunning={isRunning}
                                />

                                {/* Code Output and Video Player Row */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <OutputSection output={output} />
                                    </div>
                                    <div className="w-80 flex-shrink-0">
                                        <VideoPlayer
                                            title="Lab Tutorial Video"
                                            videoUrl="https://www.youtube.com/watch?v=M88sDrY66r8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}