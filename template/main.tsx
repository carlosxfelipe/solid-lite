import { createRoot, h, render } from "@solid/index.ts";
import { App } from "@src/App.tsx";

createRoot(() => {
  const root = document.getElementById("app")!;
  render(<App />, root);
});
