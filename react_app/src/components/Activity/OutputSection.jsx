import CodeOutput from './CodeOutput';

export default function OutputSection({ output }) {
    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-4">Output</h2>
            <CodeOutput
                value={output}
                height="250px"
            />
        </div>
    );
}
