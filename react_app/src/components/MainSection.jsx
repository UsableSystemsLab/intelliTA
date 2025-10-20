import BasicButtons from "./BasicButton";
import TextType from "./TextType";
import LogoLoop from "./LogoLoop";
import SplitText from "./SplitText";
import JavaCode from "../assets/JavaCode.png";
import {
  SiReact,
  SiTailwindcss,
  SiPython,
  //SiJava,
  SiHtml5,
  SiCss3,
  SiJavascript,
  SiPhp,
} from "react-icons/si";

export default function MainSection() {
  const techLogos = [
    {
      node: <SiReact color="#61DAFB" />,
      title: "React",
      href: "https://react.dev",
    },
    {
      node: <SiTailwindcss color="#06B6D4" />,
      title: "Tailwind CSS",
      href: "https://tailwindcss.com",
    },
    {
      node: <SiPython color="#3776AB" />,
      title: "Python",
      href: "https://www.python.org",
    },
    {
      node: <SiHtml5 color="#E34F26" />,
      title: "HTML5",
      href: "https://developer.mozilla.org/docs/Web/HTML",
    },
    {
      node: <SiCss3 color="#1572B6" />,
      title: "CSS3",
      href: "https://developer.mozilla.org/docs/Web/CSS",
    },
    {
      node: <SiJavascript color="#F7DF1E" />,
      title: "JavaScript",
      href: "https://developer.mozilla.org/docs/Web/JavaScript",
    },
    {
      node: <SiPhp color="#777BB4" />,
      title: "PHP",
      href: "https://www.php.net",
    },
    // { node:  <SiJava color="#007396" />, title: "Java", href: "https://www.java.com"}
  ];

  return (
    <>
      <section className="main-sec">
        <TextType
          className="web-desc"
          text={[
            "A platform that transforms traditional programming labs into AI-powered interactive learning experiences !",
          ]}
          typingSpeed={40}
          pauseDuration={1300}
          showCursor={true}
          cursorCharacter="|"
        />
        <div className="image-button-conatiner">
          <div className="button-group">
            <BasicButtons label="Get Started" />
            <BasicButtons label="IntelliTA" />
          </div>
          <img src={JavaCode} alt="Java-photo" className="emptyphoto" />
        </div>
        <div>
          <SplitText
            text="Supported Programming Languages !"
            className="shiny-text"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <LogoLoop
            className="loop-logos"
            logos={techLogos}
            speed={120}
            direction="left"
            logoHeight={48}
            gap={40}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="#333"
            ariaLabel="Technology partners"
          />
        </div>
      </section>
    </>
  );
}
