import Shuffle from "@/components/lib/Shuffle";
export default function Nav() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-lg">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">IntelliTA</span>
              <a href="">
                <Shuffle
                  className="shuffle-text"
                  text="IntelliTA"
                  shuffleDirection="right"
                  duration={0.35}
                  animationMode="evenodd"
                  shuffleTimes={1}
                  ease="power3.out"
                  stagger={0.03}
                  threshold={0.1}
                  triggerOnce={true}
                  triggerOnHover={true}
                  respectReducedMotion={true}
                  style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                />
              </a>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              data-command="show-modal"
              data-commandfor="mobile-menu"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                className="size-6"
              >
                <path
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              About
            </a>

            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              Courses
            </a>
            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              Contact
            </a>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-6.5">
            <button
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium 
text-gray-900 bg-white border border-gray-300 rounded-lg 
transition-all duration-300 ease-in-out 
hover:bg-gray-200 hover:border-gray-400 
focus:outline-none focus:ring-2 focus:ring-gray-300 
dark:text-white dark:bg-gray-800 dark:border-gray-600 
dark:hover:bg-gray-700 dark:hover:border-gray-500"
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M4.545 6.714L4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z" />
                <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31z" />
              </svg>

              <span className="sr-only">Icon description</span>
            </button>
            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
            >
              <span
                className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
               after:bg-white hover:after:w-full after:transition-all after:duration-300"
              >
                Log in{" "}
              </span>{" "}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
