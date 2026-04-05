import { Typewriter } from "react-simple-typewriter";

export default function CodeFrame() {
  return (
    <div className="bg-gray-900 text-green-400 font-mono p-6 max-w-2xl h-[300px] text-left overflow-hidden">
      <pre className="text-lg">
        <code>
          <span>
            <Typewriter
              words={[
                `public class Main {\n public static void main(String[] args) {\n  System.out.println("Java !"); \n  }\n }`,
                `print("Python !")`,
                `console.log("JavaScript !")`,
                `<!DOCTYPE html> \n<html> \n \t<head> \n \t\t<title>My Web Page</title> \n \t</head> \n \t<body> \n\t\t<h1>HTML !</h1> \n \t</body> \n </html>`,
              ]}
              loop={0} // set to 0 for one-time typing
              cursor
              cursorStyle="|"
              typeSpeed={80}
              deleteSpeed={50}
              delaySpeed={1500}
            />
          </span>
        </code>
      </pre>
    </div>
  );
}
