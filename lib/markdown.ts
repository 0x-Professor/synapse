import sanitizeHtml from "sanitize-html";

export function sanitizeMarkdown(markdown: string): string {
  return sanitizeHtml(markdown, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (text) => text,
  });
}

