/** Latest search results known to the page, shared with the chat widget (client only). */
export interface ChatContextOrganization {
  name: string;
  category: string;
  city: string;
  phone: string;
  source_url: string;
  verified: boolean;
}

export interface ChatClientContext {
  country: string;
  organizations: ChatContextOrganization[];
}

let current: ChatClientContext = { country: "", organizations: [] };

export function setChatContext(next: ChatClientContext): void {
  current = next;
}

export function getChatContext(): ChatClientContext {
  return current;
}
