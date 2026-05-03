import "./dom_setup.ts";
import { assertEquals } from "@std/assert";
import { createSignal } from "./solid.js";
import {
  Child,
  For,
  Fragment,
  h,
  Match,
  onCleanup,
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

  const el = h(
    "div",
    {
      style: { color },
      class: () => `bg-${color()}`,
    },
    "Styled",
  ) as HTMLElement;

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
    { onClick: () => (clicked = true) },
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

Deno.test(
  "DOM Reactivity: For component renders lists dynamically",
  async () => {
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
  },
);

Deno.test(
  "DOM Reactivity: Fragment groups children without a wrapper node",
  () => {
    const el = Fragment({}, h("span", {}, "A"), h("span", {}, "B"));
    const container = document.createElement("div");
    render(el as Node, container);

    assertEquals(container.innerHTML, "<span>A</span><span>B</span>");
  },
);

Deno.test(
  "DOM Reactivity: Switch and Match render correct branch",
  async () => {
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
  },
);

Deno.test("DOM Reactivity: ref with function callback", () => {
  let refEl: Element | null = null;
  const el = h("div", { ref: (e: Element | null) => (refEl = e) }, "Ref Test");
  assertEquals(refEl, el);
});

Deno.test("DOM Reactivity: ref with object", () => {
  const refObj = { current: null as Element | null };
  const el = h("div", { ref: refObj }, "Ref Object Test");
  assertEquals(refObj.current, el);
});

Deno.test("DOM Reactivity: input value with signal", async () => {
  const [val, setVal] = createSignal("hello");
  const input = h("input", { value: val, type: "text" }) as HTMLInputElement;
  assertEquals(input.value, "hello");

  setVal("world");
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(input.value, "world");
});

Deno.test("DOM Reactivity: input value as static string", () => {
  const input = h("input", {
    value: "static",
    type: "text",
  }) as HTMLInputElement;
  assertEquals(input.value, "static");
});

Deno.test("DOM Reactivity: input checked with signal", async () => {
  const [checked, setChecked] = createSignal(true);
  const input = h("input", { checked, type: "checkbox" }) as HTMLInputElement;
  assertEquals(input.checked, true);

  setChecked(false);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(input.checked, false);
});

Deno.test("DOM Reactivity: input checked as static boolean", () => {
  const input = h("input", {
    checked: true,
    type: "checkbox",
  }) as HTMLInputElement;
  assertEquals(input.checked, true);
});

Deno.test("DOM Reactivity: boolean attributes true/false toggle", () => {
  const el = h("input", {
    disabled: true,
    readonly: false,
    required: true,
  }) as Element;
  assertEquals(el.hasAttribute("disabled"), true);
  assertEquals(el.hasAttribute("readonly"), false);
  assertEquals(el.hasAttribute("required"), true);
});

Deno.test("DOM Reactivity: className maps to class attribute", () => {
  const el = h("div", { className: "my-class" }, "Test") as Element;
  assertEquals(el.getAttribute("class"), "my-class");
});

Deno.test("DOM Reactivity: render clears existing container content", () => {
  const container = document.createElement("div");
  container.innerHTML = "<p>Old</p>";
  const el = h("span", {}, "New");
  render(el, container);
  assertEquals(container.innerHTML, "<span>New</span>");
});

Deno.test("DOM Reactivity: style as string is parsed", () => {
  const el = h(
    "div",
    { style: "color: red; font-size: 14px" },
    "Styled",
  ) as HTMLElement;
  assertEquals(el.style.getPropertyValue("color"), "red");
  assertEquals(el.style.getPropertyValue("font-size"), "14px");
});

Deno.test("DOM Reactivity: style as null/undefined is no-op", () => {
  const el = h("div", { style: null }, "X") as HTMLElement;
  assertEquals(el.style.getPropertyValue("color"), "");
});

Deno.test(
  "DOM Reactivity: style with signal getter as whole value",
  async () => {
    const [s, setS] = createSignal(
      "color: red" as string | Record<string, string>,
    );
    const el = h("div", { style: s }, "X") as HTMLElement;
    assertEquals(el.style.getPropertyValue("color"), "red");

    setS({ color: "blue", fontSize: "12px" });
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.style.getPropertyValue("color"), "blue");
    assertEquals(el.style.getPropertyValue("font-size"), "12px");
  },
);

Deno.test(
  "DOM Reactivity: style object with nested signal that becomes null",
  async () => {
    const [size, setSize] = createSignal("14px" as string | null);
    const el = h(
      "div",
      {
        style: { fontSize: size, color: "blue" },
      },
      "Nested",
    ) as HTMLElement;

    assertEquals(el.style.getPropertyValue("font-size"), "14px");

    setSize(null);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.style.getPropertyValue("font-size"), "");
  },
);

Deno.test(
  "DOM Reactivity: style supports CSS custom properties (--var)",
  () => {
    const el = h(
      "div",
      {
        style: { "--my-var": "10px", color: "red" },
      },
      "X",
    ) as HTMLElement;
    assertEquals(el.style.getPropertyValue("--my-var"), "10px");
  },
);

Deno.test(
  "DOM Reactivity: style numeric values are converted to string",
  () => {
    const el = h("div", { style: { zIndex: 5 } }, "X") as HTMLElement;
    assertEquals(el.style.getPropertyValue("z-index"), "5");
  },
);

Deno.test("DOM Reactivity: Fragment with reactive children", async () => {
  const [text, setText] = createSignal("A");
  const frag = Fragment({}, () => h("span", {}, text()));
  const container = document.createElement("div");
  render(frag as Node, container);

  assertEquals(container.textContent, "A");

  setText("B");
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "B");
});

Deno.test("DOM Reactivity: Fragment with no children is empty", () => {
  const frag = Fragment({});
  const container = document.createElement("div");
  render(frag as Node, container);
  assertEquals(container.textContent, "");
});

Deno.test(
  "DOM Reactivity: Fragment with props.children prefers it over rest args",
  () => {
    const frag = Fragment(
      { children: [h("span", {}, "fromProps")] },
      h("span", {}, "fromRest"),
    );
    const container = document.createElement("div");
    render(frag as Node, container);
    assertEquals(container.textContent, "fromProps");
  },
);

Deno.test("DOM Reactivity: multiple event handlers on same element", () => {
  let clicked = false;
  let hovered = false;

  const el = h(
    "button",
    {
      onClick: () => (clicked = true),
      onMouseOver: () => (hovered = true),
    },
    "Multi",
  ) as Element;

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(el, container);

  const clickEvent = new Event("click", { bubbles: true });
  Object.defineProperty(clickEvent, "target", { value: el });
  document.dispatchEvent(clickEvent);
  assertEquals(clicked, true);

  const hoverEvent = new Event("mouseover", { bubbles: true });
  Object.defineProperty(hoverEvent, "target", { value: el });
  document.dispatchEvent(hoverEvent);
  assertEquals(hovered, true);

  document.body.removeChild(container);
});

Deno.test("DOM Reactivity: nested arrays in children are flattened", () => {
  const el = h("div", {}, [
    [h("span", {}, "A"), h("span", {}, "B")],
    h("span", {}, "C"),
  ]);
  assertEquals(el.textContent, "ABC");
});

Deno.test("DOM Reactivity: signal getter as generic attribute", async () => {
  const [title, setTitle] = createSignal("initial" as string | null);
  const el = h("div", { title }, "Hover me") as Element;
  assertEquals(el.getAttribute("title"), "initial");

  setTitle("updated");
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(el.getAttribute("title"), "updated");

  // Signal returning null removes attribute
  setTitle(null);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(el.hasAttribute("title"), false);
});

Deno.test("DOM Reactivity: null and false children are ignored", () => {
  const el = h("div", {}, null, false, "Text", undefined);
  assertEquals(el.textContent, "Text");
});

Deno.test("DOM Reactivity: number children become text", () => {
  const el = h("div", {}, 42);
  assertEquals(el.textContent, "42");
});

Deno.test("DOM Reactivity: static null attribute does not appear", () => {
  const el = h(
    "div",
    { foo: null, bar: undefined, baz: false },
    "X",
  ) as Element;
  assertEquals(el.hasAttribute("foo"), false);
  assertEquals(el.hasAttribute("bar"), false);
  assertEquals(el.hasAttribute("baz"), false);
});

Deno.test(
  "DOM Reactivity: static true attribute appears as empty string",
  () => {
    const el = h("div", { hidden: true }) as Element;
    assertEquals(el.getAttribute("hidden"), "");
  },
);

Deno.test(
  "DOM Reactivity: Show without fallback shows nothing when false",
  async () => {
    const [show, setShow] = createSignal(true);
    const el = Show({
      when: () => show(),
      children: h("div", {}, "Visible"),
    });
    const container = document.createElement("div");
    render(el as Node, container);

    assertEquals(container.textContent, "Visible");

    setShow(false);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "");
  },
);

Deno.test("DOM Reactivity: Show with non-function children", async () => {
  const [show, setShow] = createSignal(false);
  const el = Show({
    when: () => show(),
    children: h("span", {}, "static-children"),
    fallback: h("span", {}, "static-fallback"),
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(container.textContent, "static-fallback");

  setShow(true);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "static-children");
});

Deno.test(
  "DOM Reactivity: Switch without fallback renders nothing on no match",
  async () => {
    const [value, setValue] = createSignal(1);
    const el = Switch({
      children: [
        Match({
          when: () => value() === 1,
          children: h("div", {}, "One"),
        }) as unknown as Child,
      ],
    });

    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "One");

    setValue(2);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "");
  },
);

Deno.test(
  "DOM Reactivity: For with key function reorders by identity",
  async () => {
    const [list, setList] = createSignal([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    const el = For({
      each: () => list(),
      key: (item: { id: number; name: string }) => item.id,
      children: (item: { id: number; name: string }) =>
        h("span", {}, item.name),
    });

    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "AliceBob");

    setList([
      { id: 2, name: "Bob" },
      { id: 1, name: "Alice" },
    ]);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "BobAlice");
  },
);

Deno.test("DOM Reactivity: For with empty list renders nothing", async () => {
  const [list, setList] = createSignal([] as number[]);
  const el = For({
    each: () => list(),
    children: (item: number) => h("span", {}, String(item)),
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(container.textContent, "");

  setList([10, 20]);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "1020");
});

Deno.test("DOM Reactivity: For without renderFn returns empty fragment", () => {
  const el = For({
    each: () => [1, 2, 3],
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(container.textContent, "");
});

Deno.test(
  "DOM Reactivity: h with functional component receives children",
  () => {
    function MyComp(props: { children?: Child[] }) {
      return h("div", { class: "my-comp" }, props.children);
    }
    const el = h(MyComp, {}, h("span", {}, "Child")) as Element;
    assertEquals(el.nodeName, "DIV");
    assertEquals(el.getAttribute("class"), "my-comp");
    assertEquals(el.textContent, "Child");
  },
);

Deno.test("DOM Reactivity: h with functional component and props", () => {
  function Greeting(props: Record<string, unknown> & { children?: Child[] }) {
    return h("div", {}, `Hello, ${props.name}`);
  }
  const el = h(Greeting, { name: "World" });
  assertEquals(el.textContent, "Hello, World");
});

Deno.test("DOM Reactivity: h with null/undefined props", () => {
  const el = h("div", null, "X");
  assertEquals(el.textContent, "X");
  const el2 = h("div", undefined, "Y");
  assertEquals(el2.textContent, "Y");
});

Deno.test(
  "DOM Reactivity: signal getter as child appends and updates",
  async () => {
    const [count, setCount] = createSignal(0);
    const el = h("div", {}, count) as Element;
    const container = document.createElement("div");
    render(el, container);
    assertEquals(el.textContent, "0");

    setCount(5);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.textContent, "5");
  },
);

Deno.test("DOM Reactivity: signal child returning array of nodes", async () => {
  const [items, setItems] = createSignal([1, 2]);
  const el = h(
    "div",
    {},
    () => items().map((i: number) => h("span", {}, String(i))),
  );
  const container = document.createElement("div");
  render(el, container);
  assertEquals(el.textContent, "12");

  setItems([3, 4, 5]);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(el.textContent, "345");
});

Deno.test(
  "DOM Reactivity: signal child returning null clears content",
  async () => {
    const [val, setVal] = createSignal("text" as string | null);
    const el = h("div", {}, val) as Element;
    assertEquals(el.textContent, "text");

    setVal(null);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.textContent, "");
  },
);

Deno.test("DOM Reactivity: dangerouslySetInnerHTML with safe HTML", () => {
  const el = h("div", {
    dangerouslySetInnerHTML: { __html: "<p>Safe <b>content</b></p>" },
  }) as HTMLElement;
  // deno-dom may format slightly differently; check the text
  assertEquals(el.textContent, "Safe content");
});

Deno.test("DOM Reactivity: dangerouslySetInnerHTML strips script tags", () => {
  const el = h("div", {
    dangerouslySetInnerHTML: {
      __html: "<p>Safe</p><script>alert('xss')</script>",
    },
  }) as HTMLElement;
  assertEquals(el.querySelector("script"), null);
  assertEquals(el.querySelector("p")?.textContent, "Safe");
});

Deno.test(
  "DOM Reactivity: dangerouslySetInnerHTML strips inline event handlers",
  () => {
    const el = h("div", {
      dangerouslySetInnerHTML: {
        __html: `<a href="/ok" onclick="alert(1)" onmouseover="bad()">Link</a>`,
      },
    }) as HTMLElement;
    const anchor = el.querySelector("a");
    assertEquals(anchor?.hasAttribute("onclick"), false);
    assertEquals(anchor?.hasAttribute("onmouseover"), false);
    assertEquals(anchor?.getAttribute("href"), "/ok");
  },
);

Deno.test(
  "DOM Reactivity: dangerouslySetInnerHTML neutralizes javascript: hrefs",
  () => {
    const el = h("div", {
      dangerouslySetInnerHTML: {
        __html:
          `<a href="javascript:alert(1)">JS</a><a href="data:text/html,x">Data</a><a href="vbscript:bad">VB</a>`,
      },
    }) as HTMLElement;
    const anchors = el.querySelectorAll("a");
    for (let i = 0; i < anchors.length; i++) {
      assertEquals(anchors[i].getAttribute("href"), "about:blank");
    }
  },
);

Deno.test(
  "DOM Reactivity: dangerouslySetInnerHTML with null __html renders empty",
  () => {
    const el = h("div", {
      dangerouslySetInnerHTML: { __html: null as unknown as string },
    }) as HTMLElement;
    assertEquals(el.innerHTML, "");
  },
);

Deno.test(
  "DOM Reactivity: dangerouslySetInnerHTML neutralizes javascript: src",
  () => {
    const el = h("div", {
      dangerouslySetInnerHTML: {
        __html: `<img src="javascript:bad()" alt="x">`,
      },
    }) as HTMLElement;
    const img = el.querySelector("img");
    assertEquals(img?.getAttribute("src"), "about:blank");
  },
);

Deno.test("DOM Reactivity: SVG element creation uses SVG namespace", () => {
  const svg = h(
    "svg",
    { width: "100", height: "100" },
    h("circle", { cx: "50", cy: "50", r: "40" }),
  );
  assertEquals(svg.nodeName.toLowerCase(), "svg");
  assertEquals((svg as Element).namespaceURI, "http://www.w3.org/2000/svg");
  assertEquals(svg.firstChild?.nodeName.toLowerCase(), "circle");
});

Deno.test(
  "DOM Reactivity: ref cleanup runs when component unmounted",
  async () => {
    const refObj = { current: null as Element | null };
    const [show, setShow] = createSignal(true);

    const el = Show({
      when: () => show(),
      children: () => h("div", { ref: refObj }, "X"),
    });
    const container = document.createElement("div");
    render(el as Node, container);

    // Ref is set on mount
    // Note: cleanup of ref runs when scope is disposed (Show toggle removes content)
    assertEquals(refObj.current !== null, true);

    setShow(false);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(refObj.current, null);
  },
);

Deno.test("DOM Reactivity: ref function cleanup runs on unmount", async () => {
  let lastRef: Element | null = null;
  const [show, setShow] = createSignal(true);

  const el = Show({
    when: () => show(),
    children: () =>
      h("div", { ref: (e: Element | null) => (lastRef = e) }, "X"),
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(lastRef !== null, true);

  setShow(false);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(lastRef, null);
});

Deno.test(
  "DOM Reactivity: event handler cleanup on unmount (undelegateEvent)",
  async () => {
    let clicked = 0;
    const [show, setShow] = createSignal(true);

    const el = Show({
      when: () => show(),
      children: () => h("button", { onClick: () => clicked++ }, "Click"),
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(el as Node, container);

    const btn = container.querySelector("button") as Element;
    const event1 = new Event("click", { bubbles: true });
    Object.defineProperty(event1, "target", { value: btn });
    document.dispatchEvent(event1);
    assertEquals(clicked, 1);

    setShow(false);
    await new Promise((r) => setTimeout(r, 0));

    // After unmount, dispatching event on detached node should not increment
    const event2 = new Event("click", { bubbles: true });
    Object.defineProperty(event2, "target", { value: btn });
    document.dispatchEvent(event2);
    assertEquals(clicked, 1);

    document.body.removeChild(container);
  },
);

Deno.test("DOM Reactivity: event delegation respects cancelBubble", () => {
  let parentClicked = 0;
  let childClicked = 0;

  const child = h(
    "button",
    {
      onClick: (e: Event) => {
        childClicked++;
        (e as Event & { cancelBubble?: boolean }).cancelBubble = true;
      },
    },
    "Child",
  ) as Element;

  const parent = h("div", { onClick: () => parentClicked++ }, child) as Element;

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(parent, container);

  const event = new Event("click", { bubbles: true });
  Object.defineProperty(event, "target", { value: child });
  document.dispatchEvent(event);

  assertEquals(childClicked, 1);
  assertEquals(parentClicked, 0);

  document.body.removeChild(container);
});

Deno.test("DOM Reactivity: For with same keys does not re-render", async () => {
  let renders = 0;
  const [list, setList] = createSignal([1, 2, 3]);
  const el = For({
    each: () => list(),
    children: (item: number) => {
      renders++;
      return h("span", {}, String(item));
    },
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(renders, 3);

  // Setting the same array (different reference but same values/keys)
  setList([1, 2, 3]);
  await new Promise((r) => setTimeout(r, 0));
  // No new renders since keys are unchanged
  assertEquals(renders, 3);
});

Deno.test("DOM Reactivity: For removes items not in new list", async () => {
  const [list, setList] = createSignal([1, 2, 3]);
  const el = For({
    each: () => list(),
    children: (item: number) => h("span", {}, String(item)),
  });
  const container = document.createElement("div");
  render(el as Node, container);
  assertEquals(container.textContent, "123");

  setList([1, 3]);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(container.textContent, "13");
});

Deno.test(
  "DOM Reactivity: For provides reactive index to renderer",
  async () => {
    const [list, setList] = createSignal(["a", "b", "c"]);
    const el = For({
      each: () => list(),
      children: (item: string, index: () => number) =>
        h("span", {}, () => `${index()}:${item}`),
    });
    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "0:a1:b2:c");

    // Reorder: new positions should reflect in the index signal
    setList(["c", "a", "b"]);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "0:c1:a2:b");
  },
);

Deno.test(
  "DOM Reactivity: For with each() returning null/undefined treated as empty",
  async () => {
    const [list, setList] = createSignal(null as unknown as number[] | null);
    const el = For({
      each: () => list() as unknown as number[],
      children: (item: number) => h("span", {}, String(item)),
    });
    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "");

    setList([1, 2] as unknown as null);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "12");
  },
);

Deno.test("DOM Reactivity: style as empty string returns empty", () => {
  const el = h("div", { style: "" }, "X") as HTMLElement;
  assertEquals(el.style.getPropertyValue("color"), "");
});

Deno.test(
  "DOM Reactivity: style string with malformed declarations is skipped",
  () => {
    const el = h(
      "div",
      { style: "no-colon-here; color: green" },
      "X",
    ) as HTMLElement;
    assertEquals(el.style.getPropertyValue("color"), "green");
  },
);

Deno.test(
  "DOM Reactivity: applyStyle removes old keys when updated",
  async () => {
    const [s, setS] = createSignal({ color: "red", fontSize: "12px" } as Record<
      string,
      string
    >);
    const el = h("div", { style: s }, "X") as HTMLElement;
    assertEquals(el.style.getPropertyValue("color"), "red");
    assertEquals(el.style.getPropertyValue("font-size"), "12px");

    setS({ color: "blue" });
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.style.getPropertyValue("color"), "blue");
    assertEquals(el.style.getPropertyValue("font-size"), "");
  },
);

Deno.test(
  "DOM Reactivity: normalizeToNodes recurses into function-returning-function",
  async () => {
    const [inner, setInner] = createSignal("hello");
    const el = h("div", {}, () => () => inner()) as Element;
    const container = document.createElement("div");
    render(el, container);
    assertEquals(el.textContent, "hello");

    setInner("world");
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(el.textContent, "world");
  },
);

Deno.test(
  "DOM Reactivity: signal child returning multiple nodes uses fragment insert",
  async () => {
    const [items, setItems] = createSignal([1, 2, 3]);
    const el = Show({
      when: () => true,
      children: () => items().map((i: number) => h("span", {}, String(i))),
    });
    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "123");

    setItems([4, 5]);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "45");
  },
);

Deno.test("DOM Reactivity: appendStatic with deeply nested array", () => {
  const el = h("div", {}, [["A", ["B", ["C"]]]]);
  assertEquals(el.textContent, "ABC");
});

Deno.test(
  "DOM Reactivity: Show returning empty array clears content",
  async () => {
    // line 381: insertNodes early return when nodes.length === 0
    const [show, setShow] = createSignal(true);
    const el = Show({
      when: () => show(),
      children: () => [] as Child,
    });
    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "");

    setShow(false);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "");
  },
);

Deno.test(
  "DOM Reactivity: disposeNode swallows errors from node-level dispose",
  async () => {
    // line 352-358: disposeNode try/catch protects when a node's [DISPOSE] throws.
    function ThrowingComp(
      props: Record<string, unknown> & { children?: Child[] },
    ) {
      onCleanup(() => {
        throw new Error("intentional dispose error");
      });
      return h("span", {}, String(props.value));
    }

    const [show, setShow] = createSignal(true);
    const el = Show({
      when: () => show(),
      children: () => h(ThrowingComp, { value: 1 }),
    });

    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "1");

    // Toggling Show triggers clearRange -> disposeNode on the component node;
    // the throwing dispose must be swallowed silently.
    setShow(false);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "");
  },
);

Deno.test(
  "DOM Reactivity: For appending after end-comment uses parent.appendChild",
  async () => {
    // line 653: For's `else parent.appendChild(n)` when cursor.nextSibling is null
    const [list, setList] = createSignal([1]);
    const el = For({
      each: () => list(),
      children: (item: number) => h("span", {}, String(item)),
    });
    const container = document.createElement("div");
    render(el as Node, container);
    assertEquals(container.textContent, "1");

    // Add items at the end so they need to be appended after the last cursor
    setList([1, 2, 3, 4]);
    await new Promise((r) => setTimeout(r, 0));
    assertEquals(container.textContent, "1234");
  },
);
