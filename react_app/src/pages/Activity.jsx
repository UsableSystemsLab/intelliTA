import Nav from '@/components/Courses/Nav';
import Footer from '@/components/Courses/Footer';
import Sidebar from '@/components/Courses/Sidebar';
import EditorSection from '@/components/Activity/EditorSection';
import OutputSection from '@/components/Activity/OutputSection';
import useCodeExecution from '@/utils/useCodeExecution';

export default function Activity({ user }) {
    const { code, setCode, output, isRunning, handleRunCode } = useCodeExecution();

    return (
        <div>
            <Nav user={ user } />
                        <div className='flex relative overflow-hidden bg-transparent min-h-screen'>
                         <Sidebar />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-6xl mx-auto flex flex-col gap-4">
                        <EditorSection
                            code={code}
                            onChange={setCode}
                            onRun={handleRunCode}
                            isRunning={isRunning}
                        />
                        <OutputSection output={output} />
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}