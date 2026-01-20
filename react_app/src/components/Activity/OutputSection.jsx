import CodeOutput from './CodeOutput';

export default function OutputSection({ output }) {
    return (
        <CodeOutput
            value={output}
            height="250px"
        />
    );
}
