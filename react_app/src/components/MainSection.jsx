import TextType from "./TextType";
import LogoLoop from "./LogoLoop";
import SplitText from "./SplitText";
import emptyphoto from "../assets/emptyphoto.png";
import {
  SiReact,
  SiTailwindcss,
  SiPython,
  // SiJava,
  SiHtml5,
  SiCss3,
  SiJavascript,
  SiPhp,
} from "react-icons/si";

export default function MainSection() {
  const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    {
      node: <SiTailwindcss />,
      title: "Tailwind CSS",
      href: "https://tailwindcss.com",
    },
    { node: <SiPython />, title: "Python", href: "https://www.python.org" },
  // { node: <SiJava />, title: "Java", href: "https://www.java.com" },
  { node: <SiHtml5 />, title: "HTML5", href: "https://developer.mozilla.org/docs/Web/HTML" },
  { node: <SiCss3 />, title: "CSS3", href: "https://developer.mozilla.org/docs/Web/CSS" },
  { node: <SiJavascript />, title: "JavaScript", href: "https://developer.mozilla.org/docs/Web/JavaScript" },
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiPhp />, title: "PHP", href: "https://www.php.net" },
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
        <div className="image-container">
          <img src={emptyphoto} alt="Empty photo" className="emptyphoto" />
        </div>
        <div>
          <SplitText 
            text="Supported Programming Languages !"
            className='shiny-text'
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
            fadeOutColor="#ffffff"
            ariaLabel="Technology partners"
          />
        </div>
      </section>
    </>
  );
}
