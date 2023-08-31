import { OpenAI } from "openai";
import { ChatCompletionMessage, CreateChatCompletionRequestMessage } from "openai/resources/chat";
import { ZodObject, ZodRawShape, z } from "zod";

export type CompletionParams = Omit<OpenAI.Chat.CompletionCreateParams, "stream" | "n">;

export type BotOptions = {
  /**
   * Default parameters to be used for all requests.
   */
  params: Partial<CompletionParams> & Pick<CompletionParams, "model">;

  /**
   * An instance of `MessageStore` to keep track of the conversation.
   * If not provided, a default transient in-memory store will be used.
   * @default MemoryStore
   */
  messageStore?: MessageStore;
};

export type BotFunction = OpenAI.Chat.CompletionCreateParams.Function & {
  call: (...args: any[]) => any;
};

export type BotFunctionDefinition<T extends ZodRawShape> = {
  name: string;
  description: string;
  schema: ZodObject<T>;
  onCall: (params: z.infer<ZodObject<T>>) => any;
};

export type ReadResponse = ReadableStream<string> &
  AsyncIterable<string> & {
    headers: Headers;
    text(): Promise<string>;
  };

/**
 * Consider Temperature as a "degree of creativity freedom" that should affect the
 * vocabulary of the response.
 * 0 uses the most frequent words and 1 a more "poetically free" behavior that allow
 * the use of rare words inside of the same context.
 */
export enum Temperature {
  MostlyDeterministic = 0,
  Consistent = 0.5,
  Moderate = 0.75,
  /**
   * OpenAI default.
   * @see https://platform.openai.com/docs/api-reference/edits/create#temperature
   */
  OpenAIDefault = 1,
  Creative = 1.4,
}

export type MessageStore = {
  add(message: ChatCompletionMessage): Promise<void>;
  get(): Promise<ChatCompletionMessage[]>;
  clear(): Promise<void>;
};
