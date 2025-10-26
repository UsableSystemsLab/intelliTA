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
              className="inline-flex items-center justify-center px-3 py-0 text-sm font-medium 
                          text-gray-900 bg-white border border-gray-300 rounded-lg 
                          transition-all duration-300 ease-in-out 
                          hover:bg-gray-200 hover:border-gray-400 
                          focus:outline-none focus:ring-2 focus:ring-gray-300 
                          dark:text-white dark:bg-gray-800 dark:border-gray-600 
                          dark:hover:bg-gray-700 dark:hover:border-gray-500 hover:cursor-pointer"
            >
              <p>عربي</p>

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
                Login{" "}
              </span>{" "}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
