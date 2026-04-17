import { h } from "@solid/index.ts";

export function Contact() {
  return (
    <div class="container">
      <h1 class="title">Contact</h1>
      <p class="description">
        Get in touch with the Solid Lite team.
      </p>
      <div class="card">
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Name</label>
            <input type="text" placeholder="Your name" style={{ width: "100%" }} />
          </div>
          <div>
            <label>Message</label>
            <textarea placeholder="Your message" style={{ width: "100%", minHeight: "100px" }}></textarea>
          </div>
          <button type="button" class="btn btn-primary">Send Message</button>
        </form>
      </div>
    </div>
  );
}
