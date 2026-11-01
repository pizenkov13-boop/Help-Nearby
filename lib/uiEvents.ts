/** Small window events that let the bottom bar drive the header's language sheet, the chat and the home search. */
export const FIND_HELP_EVENT = "hn:find-help";
export const CHAT_OPEN_EVENT = "hn:chat-open";
export const LANGUAGE_TOGGLE_EVENT = "hn:language-toggle";
export const LANGUAGE_STATE_EVENT = "hn:language-state";

export function dispatchUiEvent(name: string, detail?: unknown) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}
