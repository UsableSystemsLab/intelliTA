export const compileCode = async (code, language, setOutput, setIsRunning) => {
    setIsRunning(true);
    setOutput('Compiling and running...\n');

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // just simulate output
        // This is temporary until connect to a real compiler API

        if (code.includes('System.out.println')) {
            const printMatches = code.match(/System\.out\.println\([^)]+\)/g);

            if (printMatches) {
                const outputs = printMatches.map(match => {
                    const stringMatch = match.match(/"([^"]+)"/);
                    if (stringMatch) {
                        return stringMatch[1];
                    }
                    return '';
                });

                const outputText = outputs.filter(o => o).join('\n');
                setOutput(`Compilation successful!\n\nOutput:\n${outputText}\n\n(not real compiler just simulation)`);
            } else {
                setOutput('Compilation successful!\n\nProgram executed with no output.\n\n(Mock mode)');
            }
        } else {
            setOutput('Compilation successful!\n\nProgram executed with no output.\n\n(Mock mode)');
        }
    } catch (error) {
        setOutput(`Error:\n${error.message}`);
    } finally {
        setIsRunning(false);
    }
};
