import { h } from "@solid/index.ts";
import { Link } from "@router/index.tsx";

export function Navbar() {
  const navItems: { href: string; label: string }[] = [
    { href: "/home", label: "Home" },
  ];

  return (
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
  );
}
