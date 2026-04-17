import { h } from "@solid/index.ts";

export function Navbar() {
  return (
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-logo">Solid Lite</div>
        <div class="navbar-links">
          <a href="#" class="navbar-link">Início</a>
          <a href="#" class="navbar-link">Sobre</a>
          <a href="#" class="navbar-link">Contato</a>
        </div>
      </div>
    </nav>
  );
}
