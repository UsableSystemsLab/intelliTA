import InstantFeedback from "../assets/InstantFeedback.jpg";
import leaderboard from "../assets/Leaderboard.jpg";
import CourseLabMaker from "../assets/CourseLabMaker.jpg";
import JavaCode from "../assets/JavaCode.png";
import CPCS_203 from "../assets/CPCS-203.jpeg";
import CPCS_204 from "../assets/CPCS-204.jpg";
import React_Php from "../assets/React-Php.png";
import LogoLoop from "../components/lib/LogoLoop";
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
export default function HomeMain() {
  return (
    <>
      {/* HERO SECTION */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem]
                     -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5]
                     to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)]
                     sm:w-[72.1875rem]"
          ></div>
        </div>

        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-34">
          <div className="text-center">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              Transform how you learn to code
            </h1>
            <p className="mt-8 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8">
              A platform that transforms traditional programming labs into
              AI-powered interactive learning experiences!
            </p>
            <br />

            <div className="">
              <img src={JavaCode} alt="Java code terminal page" />
            </div>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-2xl font-semibold
                         text-white shadow-sm hover:bg-indigo-400 focus-visible:outline
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-indigo-500"
              >
                Get started
              </a>
              <a
                href="#"
                className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
              >
                <span
                  className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
               after:bg-white hover:after:w-full after:transition-all after:duration-300"
                >
                  Learn more{" "}
                </span>{" "}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu
                   overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/678]
                     w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr
                     from-[#ff80b5] to-[#9089fc] opacity-30
                     sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
      </div>

      {/* CARD SECTION */}
      {/* Ask if we maybe need to change Background color */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-semibold tracking-tight">
            Core features
          </h2>
          <p className="mt-8 text-pretty text-lg text-gray-400">
            IntelliTA core features that makes it unique!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 px-6">
          {/* CARD 1 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={InstantFeedback}
                alt="Instant feedback image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Instant feedback
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Get immediate evaluation of your code upon submission — the
                system automatically checks your work, highlights errors, and
                gives real-time feedback to help you improve quickly.{" "}
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={leaderboard}
                alt="Leaderboard image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Gamification
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Learn through fun lab activites. Compete on the leaderboard,
                earn points for progress, and stay motivated as you climb your
                way to the top.
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={CourseLabMaker}
                alt="Course lab maker image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI integration
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                AI helps instructors build interactive labs, grade student work
                automatically, and deliver personalized feedback — saving time
                and improving learning outcomes
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-semibold tracking-tight">Courses</h2>
          <p className="mt-8 text-pretty text-lg text-gray-400">
            Courses that IntelliTA supports!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 px-6">
          {/* CARD 1 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={CPCS_203}
                alt="CPCS-203 image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                CPCS-203
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Learn the key concepts of Object-Oriented Programming —
                encapsulation, inheritance, polymorphism, and abstraction — to
                write cleaner, reusable, and efficient code through practical,
                real-world projects.{" "}
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={CPCS_204}
                alt="CPCS 204 image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                CPCS-204
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Learn essential Data Structures like arrays, stacks, queues,
                linked lists, and trees. Understand how to organize and manage
                data efficiently to improve your problem-solving and coding
                performance.
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#">
              <img
                className="rounded-t-lg w-full h-66 object-cover"
                src={React_Php}
                alt="React and Php image"
              />
            </a>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                CPIT-405
              </h5>

              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Learn modern Web Development using HTML, CSS, JavaScript, React,
                and PHP. Build dynamic, responsive websites from scratch — from
                structuring pages and styling layouts to creating interactive
                features and connecting to backend servers.
              </p>
              <a
                href="#"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Read more
                <svg
                  className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <a
          href="#"
          className="flex justify-center pt-10.5 text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
        >
          <span
            className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
               after:bg-white hover:after:w-full after:transition-all after:duration-300"
          >
            See all courses
          </span>
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </a>
      </section>
      <section className="relative isolate px-6 py-30 lg:px-8 overflow-hidden bg-gray-900">
        {/* Top gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>

        {/* Main content */}
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-12 animate-bounce">
            Supported Programming Languages
          </h2>

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
            fadeOutColor="#111827"
            ariaLabel="Technology partners"
          />
        </div>

        {/* Bottom gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>
      </section>
    </>
  );
}
