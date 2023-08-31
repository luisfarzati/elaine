import { ChatCompletionMessage } from "openai/resources/chat";
import { MessageStore } from "./types";

export class TransientMessageStore implements MessageStore {
  #messages: ChatCompletionMessage[] = [];

  async add(message: ChatCompletionMessage): Promise<void> {
    this.#messages.push(message);
    this.#messages = this.#messages.slice(-50);
  }

  async get(): Promise<ChatCompletionMessage[]> {
    return [...this.#messages];
  }

  async clear(): Promise<void> {
    this.#messages = [];
  }
}
