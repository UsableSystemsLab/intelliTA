import { useState } from "react";
import { LogIn, ChevronDown } from "lucide-react";
import Shuffle from "./Shuffle";
export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (label) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const items = [
    {
      label: "About",
      bgColor: "#374151",
      textColor: "#fff",
      links: [
        { label: "Who are we", ariaLabel: "About us" },
        { label: "IntelliTA", ariaLabel: "About our project" },
      ],
    },
    {
      label: "Courses",
      bgColor: "#374151",
      textColor: "#fff",
      links: [
        { label: "CPCS-202", ariaLabel: "CPCS-202" },
        { label: "CPCS-203", ariaLabel: "CPCS-203" },
        { label: "CPCS-204", ariaLabel: "CPCS-204" },
        { label: "CPIT-252", ariaLabel: "CPIT-252" },
        { label: "CPIT-305", ariaLabel: "CPIT-305" },
        { label: "CPIT-405", ariaLabel: "CPIT-405" },
      ],
    },
    {
      label: "Contact",
      bgColor: "#374151",
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us" },
        { label: "GitHub", ariaLabel: "GitHub" },
      ],
    },
  ];

  return (
    <div className="header-nav">
      <div className="header-left">
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
          />
        </a>
      </div>

      <div className="header-center">
        {items.map((item) => (
          <div
            key={item.label}
            className="nav-item"
            onMouseEnter={() => setActiveDropdown(item.label)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className="nav-button"
              style={{ color: item.textColor, backgroundColor: item.bgColor }}
              onClick={() => toggleDropdown(item.label)}
            >
              {item.label}{" "}
              <ChevronDown
                size={16}
                className={activeDropdown === item.label ? "rotate" : ""}
              />
            </button>

            {activeDropdown === item.label && (
              <ul
                className="dropdown"
                style={{
                  backgroundColor: item.bgColor,
                  color: item.textColor,
                }}
              >
                {item.links.map((link, idx) => (
                  <li key={idx}>
                    <a href="#" aria-label={link.ariaLabel || link.label}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {}
      <div className="header-right">
        <button>
          
          <span className="login-text">
            <LogIn size={24} />
            Login</span>
        </button>
      </div>
    </div>
  );
}
