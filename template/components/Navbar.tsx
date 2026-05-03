import { Fragment, h } from "@solid/index.ts";
import { Link } from "@router/index.tsx";
import { Icon, IconName } from "@components/Icon.tsx";

export function Navbar() {
  const navItems: { href: string; label: string; icon: IconName }[] = [
    { href: "/home", label: "Home", icon: "Home" },
    { href: "/about", label: "About", icon: "Info" },
    { href: "/contact", label: "Contact", icon: "Mail" },
    { href: "/user/123", label: "Profile", icon: "User" },
  ];

  return (
    <>
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo">Solid Lite</div>
          <div class="navbar-links">
            {navItems.map((item) => (
              <Link href={item.href} class="navbar-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <nav class="mobile-nav">
        {navItems.map((item) => (
          <Link href={item.href} class="mobile-nav-link">
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
