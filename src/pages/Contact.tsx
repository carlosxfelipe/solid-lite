import { h } from "@solid/index.ts";

export function Contact() {
  return (
    <div class="container">
      <h1 class="title">Contact</h1>
      <p class="description">
        Get in touch with the Solid Lite team. We'd love to hear from you.
      </p>

      <div class="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <form>
          <div class="form-group">
            <label class="form-label" for="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              class="form-input"
              placeholder="Enter your full name"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-email">Email Address</label>
            <input
              id="contact-email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-message">Message</label>
            <textarea
              id="contact-message"
              class="form-textarea"
              placeholder="How can we help you?"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-large">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
