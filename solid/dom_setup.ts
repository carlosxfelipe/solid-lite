import {
  Comment,
  DocumentFragment,
  DOMParser,
  Element,
  Node,
  Text,
} from "@b-fuze/deno-dom";

const doc = new DOMParser().parseFromString(
  "<!DOCTYPE html><html><body></body></html>",
  "text/html",
);

// @ts-ignore: mock globals
globalThis.document = doc;
// @ts-ignore: mock globals
globalThis.window = { document: doc };
// @ts-ignore: mock globals
globalThis.Element = Element;
// @ts-ignore: mock globals
globalThis.Node = Node;
// @ts-ignore: mock globals
globalThis.Comment = Comment;
// @ts-ignore: mock globals
globalThis.Text = Text;
// @ts-ignore: mock globals
globalThis.DocumentFragment = DocumentFragment;

// @ts-ignore: mock globals
globalThis.HTMLElement = Element;
// @ts-ignore: mock globals
globalThis.HTMLInputElement = doc.createElement("input").constructor;
// @ts-ignore: mock globals
globalThis.HTMLTextAreaElement = doc.createElement("textarea").constructor;
// @ts-ignore: mock globals
globalThis.HTMLSelectElement = doc.createElement("select").constructor;

// Polyfill Element.prototype.style for deno-dom
Object.defineProperty(Element.prototype, "style", {
  get() {
    // @ts-ignore: mock globals
    if (!this._style) {
      const styles = new Map<string, string>();
      // @ts-ignore: mock globals
      this._style = {
        getPropertyValue: (k: string) => styles.get(k) || "",
        setProperty: (k: string, v: string) => {
          styles.set(k, String(v));
          // @ts-ignore: mock globals
          this.setAttribute(
            "style",
            Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join(
              "; ",
            ),
          );
        },
        removeProperty: (k: string) => {
          styles.delete(k);
          // @ts-ignore: mock globals
          this.setAttribute(
            "style",
            Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join(
              "; ",
            ),
          );
        },
      };
    }
    // @ts-ignore: mock globals
    return this._style;
  },
});
