export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {}
        <div className="footer-left">
          <h2 className="footer-logo">IntelliTA</h2>
          <p className="footer-desc">
            Empowering FCIT students through AI-powered interactive programming
            experiences.
          </p>
        </div>

        {}
        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Courses</a>
            </li>
            <li>
              <a href="#">AI Assistant</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
          </ul>
        </div>

        {}
        <div className="footer-social">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="#" aria-label="GitHub">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="social-icon"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56 0-.28-.01-1.03-.02-2.02-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.5.11-3.14 0 0 .97-.31 3.18 1.18a10.9 10.9 0 0 1 2.9-.39c.98 0 1.96.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.64.23 2.84.11 3.14.75.81 1.2 1.84 1.2 3.1 0 4.45-2.69 5.43-5.25 5.71.42.36.79 1.08.79 2.18 0 1.57-.02 2.84-.02 3.23 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="social-icon"
              >
                <path d="M4.98 3.5C4.98 5 3.9 6 2.5 6S0 5 0 3.5C0 2 1.08 1 2.5 1s2.48 1 2.48 2.5zM0 8h5v15H0V8zm8 0h4.8v2.1h.07c.67-1.2 2.32-2.47 4.78-2.47C22.42 7.63 24 9.5 24 13.18V23H19V14.1c0-2.12-.76-3.57-2.64-3.57-1.44 0-2.3.97-2.67 1.9-.14.34-.17.82-.17 1.3V23H8V8z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} IntelliTA — All rights reserved.</p>
      </div>
    </footer>
  );
}
