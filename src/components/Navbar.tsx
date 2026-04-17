import { h } from "@solid/index.ts";
import { Link } from "@components/Link.tsx";

export function Navbar() {
  return (
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-logo">Solid Lite</div>
        <div class="navbar-links">
          <Link href="/" class="navbar-link">
            Home
          </Link>
          <Link href="/about" class="navbar-link">
            About
          </Link>
          <Link href="/contact" class="navbar-link">
            Contact
          </Link>
          <Link href="/user/123" class="navbar-link">
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}
