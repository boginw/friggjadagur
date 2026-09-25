import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import { shouldIgnore, compose } from "./reply.js";

// mimetext only labels the encoding, so encode ourselves: the text is full of æøð and emoji.
const base64 = (s) => Buffer.from(s).toString("base64").replace(/.{76}/g, "$&\r\n");

export default {
  async email(message, env) {
    const messageId = message.headers.get("Message-ID");
    // Cloudflare only allows replies that reference the original message.
    if (!messageId || shouldIgnore(message.from, message.headers)) return;

    const r = compose({ to: message.to, subject: message.headers.get("subject") || "" });

    const mime = createMimeMessage();
    mime.setHeader("In-Reply-To", messageId);
    mime.setHeader("References", messageId);
    mime.setHeader("Auto-Submitted", "auto-replied");
    mime.setSender({ name: "Fríggjadagur", addr: message.to });
    mime.setRecipient(message.from);
    mime.setSubject(r.subject);
    mime.addMessage({ contentType: "text/plain", encoding: "base64", data: base64(r.text) });
    mime.addMessage({ contentType: "text/html", encoding: "base64", data: base64(r.html) });

    await message.reply(new EmailMessage(message.to, message.from, mime.asRaw()));

    if (env.FORWARD_TO) await message.forward(env.FORWARD_TO);
  },
};
