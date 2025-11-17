import { useState } from 'react';
import { compileCode } from '../components/Activity/CodeCompiler';

export default function useCodeExecution() {
    const [code, setCode] = useState(`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`);
    const [output, setOutput] = useState('// Output will appear here...');
    const [isRunning, setIsRunning] = useState(false);

    const handleRunCode = () => {
        compileCode(code, 'java', setOutput, setIsRunning);
    };

    return {
        code,
        setCode,
        output,
        isRunning,
        handleRunCode
    };
}
