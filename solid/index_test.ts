import "./dom_setup.ts";
import { assertEquals } from "@std/assert";
import { createSignal } from "./solid.js";
import {
  Child,
  For,
  Fragment,
  h,
  Match,
  render,
  Show,
  Switch,
} from "./index.ts";

Deno.test("DOM Reactivity: h creates basic elements", () => {
  const el = h("div", { id: "test", class: "btn" }, "Hello");
  assertEquals(el.nodeName, "DIV");
  assertEquals((el as Element).getAttribute("id"), "test");
  assertEquals((el as Element).getAttribute("class"), "btn");
  assertEquals(el.textContent, "Hello");
});

Deno.test("DOM Reactivity: h appends reactive styles and classes", async () => {
  const [color, setColor] = createSignal("red");

  const el = h("div", {
    style: { color },
    class: () => `bg-${color()}`,
  }, "Styled") as HTMLElement;

  assertEquals(el.style.getPropertyValue("color"), "red");
  assertEquals(el.getAttribute("class"), "bg-red");

  setColor("blue");
  await new Promise((r) => setTimeout(r, 0));

  assertEquals(el.style.getPropertyValue("color"), "blue");
  assertEquals(el.getAttribute("class"), "bg-blue");
});

Deno.test("DOM Reactivity: render mounts to container", () => {
  const container = document.createElement("div");
  const el = h("span", {}, "Test");

  render(el, container);
  assertEquals(container.innerHTML, "<span>Test</span>");
});

Deno.test("DOM Reactivity: Event binding via h", () => {
  let clicked = false;
  const el = h(
    "button",
    { onClick: () => clicked = true },
    "Click me",
  ) as Element;

  const container = document.createElement("div");
  // Events in Solid use event delegation on document.
  // We must append container to document.body so events bubble to document.
  document.body.appendChild(container);
  render(el, container);

  const event = new Event("click", { bubbles: true });
  // deno-dom might not bubble events to document properly, so we dispatch on document with mocked target
  Object.defineProperty(event, "target", { value: el });
  document.dispatchEvent(event);

  assertEquals(clicked, true);
  document.body.removeChild(container);
});

Deno.test("DOM Reactivity: Show component renders conditionally", async () => {
  const [show, setShow] = createSignal(true);
  const el = Show({
    when: () => show(),
    children: () => h("div", {}, "Visible"),
    fallback: h("div", {}, "Hidden"),
  });
  const container = document.createElement("div");
  // @ts-ignore: it returns a DocumentFragment
  render(el as Node, container);

  assertEquals(container.textContent, "Visible");

  setShow(false);
  await new Promise((r) => setTimeout(r, 0));

  assertEquals(container.textContent, "Hidden");
});

Deno.test("DOM Reactivity: For component renders lists dynamically", async () => {
  const [list, setList] = createSignal([1, 2]);
  const el = For({
    each: () => list(),
    children: (item: number) => h("span", {}, String(item)),
  });

  const container = document.createElement("div");
  // @ts-ignore: it returns a DocumentFragment
  render(el as Node, container);

  // Note: For creates comment nodes for start and end, so innerHTML contains comments.
  // Let's just check textContent which ignores comments.
  assertEquals(container.textContent, "12");

  setList([1, 2, 3]);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "123");

  setList([2]);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "2");
});

Deno.test("DOM Reactivity: Fragment groups children without a wrapper node", () => {
  const el = Fragment({}, h("span", {}, "A"), h("span", {}, "B"));
  const container = document.createElement("div");
  render(el as Node, container);

  assertEquals(container.innerHTML, "<span>A</span><span>B</span>");
});

Deno.test("DOM Reactivity: Switch and Match render correct branch", async () => {
  const [value, setValue] = createSignal(1);
  const el = Switch({
    children: [
      Match({
        when: () => value() === 1,
        children: h("div", {}, "One"),
      }) as unknown as Child,
      Match({
        when: () => value() === 2,
        children: h("div", {}, "Two"),
      }) as unknown as Child,
    ],
    fallback: h("div", {}, "Fallback"),
  });

  const container = document.createElement("div");
  // @ts-ignore: it returns a DocumentFragment
  render(el as Node, container);

  assertEquals(container.textContent, "One");

  setValue(2);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "Two");

  setValue(3);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "Fallback");
});
