import { OpenAI } from "openai";
import { ChatCompletionMessage, CreateChatCompletionRequestMessage } from "openai/resources/chat";
import { ZodRawShape, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TransientMessageStore } from "./memory-store";
import {
  BotFunction,
  BotFunctionDefinition,
  BotOptions,
  CompletionParams,
  MessageStore,
  ReadResponse,
} from "./types";

const DEFAULT_SYSTEM_PROMPT = "You are a friendly bot. If the chat is empty, say hello.";

export class Bot {
  #client: OpenAI;
  #params: Partial<CompletionParams> & Pick<CompletionParams, "model">;
  #functions: Array<BotFunction> = [];
  #store: MessageStore = new TransientMessageStore();

  constructor(client: OpenAI, options: BotOptions) {
    this.#client = client;
    this.#params = options.params;
  }

  private buildRequest(
    message: string,
    history: ChatCompletionMessage[],
    params?: Partial<CompletionParams>
  ): CompletionParams {
    // All parameters can be overridden
    const model = params?.model ?? this.#params.model;
    const max_tokens = params?.max_tokens ?? this.#params.max_tokens;
    const temperature = params?.temperature ?? this.#params.temperature;
    const top_p = params?.top_p ?? this.#params.top_p;
    const stop = params?.stop ?? this.#params.stop;
    const presence_penalty = params?.presence_penalty ?? this.#params.presence_penalty;
    const frequency_penalty = params?.frequency_penalty ?? this.#params.frequency_penalty;
    const logit_bias = params?.logit_bias ?? this.#params.logit_bias;
    const user = params?.user ?? this.#params.user;
    const contextMessages = this.#params.messages ?? [];

    // Compile messages provided during bot initialization + history + current message
    const messages: CreateChatCompletionRequestMessage[] = [
      ...contextMessages,
      ...history,
      ...(message?.trim()
        ? [{ role: "user", content: message } as CreateChatCompletionRequestMessage]
        : []),
    ];

    // If no messages are provided (e.g. first interaction with the bot), add a default system prompt
    if (messages.length === 0) {
      messages.push({
        role: "system",
        content: DEFAULT_SYSTEM_PROMPT,
      });
    }

    const functions = this.#functions.length ? [...this.#functions] : undefined;

    return {
      model,
      messages,
      functions,
      max_tokens,
      temperature,
      top_p,
      stop,
      presence_penalty,
      frequency_penalty,
      logit_bias,
      user,
    };
  }

  /**
   * Registers a function that can be called by the bot.
   * @param definition The function definition
   */
  function<T extends ZodRawShape>(definition: BotFunctionDefinition<T>): this {
    this.#functions.push({
      name: definition.name,
      description: definition.description,
      parameters: zodToJsonSchema(definition.schema),
      call: z.function().args(definition.schema).returns(z.any()).implement(definition.onCall),
    });
    return this;
  }

  /**
   * Configures the message store to be used by the bot for conversation context.
   * @param store An instance of `MessageStore`
   */
  setMessageStore(store: MessageStore): this {
    this.#store = store;
    return this;
  }

  /**
   * Returns the message history stored in the message store.
   */
  getConversationHistory() {
    return this.#store.get();
  }

  /**
   * Clears the message history stored in the message store.
   */
  clearConversationHistory() {
    return this.#store.clear();
  }

  /**
   * Makes the bot talk.
   * @param params OpenAI chat completion parameters to be used for this request. Any default parameters will be overwritten.
   */
  talk(params?: Partial<CompletionParams>): Promise<ReadResponse> {
    return this.read("", params);
  }

  /**
   * Makes the bot read the message and reply.
   * @param text The message text to be read by the bot.
   * @param params The OpenAI chat completion parameters to be used for this request. Any default parameters will be overwritten.
   */
  async read(
    message: string,
    params?: Partial<Omit<CompletionParams, "messages">>
  ): Promise<ReadResponse> {
    const history = await this.#store.get();
    const request = this.buildRequest(message, history, params);
    let functionCall: ChatCompletionMessage.FunctionCall;
    let response: ReadResponse;

    if (message) {
      await this.#store.add({ role: "user", content: message });
    }

    const { data, response: openaiResponse } = await this.#client.chat.completions
      .create({ ...request, n: 1, stream: true })
      .withResponse();

    let reply: Partial<ChatCompletionMessage> = {
      role: "assistant",
      content: "",
    };

    // @ts-expect-error - not implementing AsyncIterable (no need to!)
    response = new ReadableStream<string>({
      pull: async (controller) => {
        for await (const chunk of data) {
          const delta = chunk.choices[0].delta;

          // Handle function call completion
          if (delta.function_call) {
            const { name, arguments: args } = delta.function_call;

            if (name) {
              functionCall = { name, arguments: "" };
            } else if (args) {
              functionCall.arguments += args;
            }

            continue;
          }

          // Handle message content
          if (delta.content) {
            reply.content += delta.content;
            controller.enqueue(delta.content);
          }
        }

        // Call function if solicited
        if (functionCall) {
          const args = JSON.parse(functionCall.arguments);
          const fun = this.#functions.find((f) => f.name === functionCall.name);
          if (!fun) {
            console.error(functionCall);
            throw new Error(`Function ${functionCall.name} not found`);
          }
          const result = await fun.call(args);

          // Send function result back to model
          const messages: CreateChatCompletionRequestMessage[] = [
            ...request.messages,
            { role: "assistant", function_call: functionCall, content: null },
            {
              role: "function",
              name: fun.name,
              content: typeof result === "string" ? result : JSON.stringify(result),
            },
          ];

          const { data } = await this.#client.chat.completions
            .create({
              ...request,
              messages,
              n: 1,
              stream: true,
            })
            .withResponse();

          reply.content = "";

          for await (const chunk of data) {
            const delta = chunk.choices[0].delta;
            if (delta.content) {
              reply.content += delta.content;
              controller.enqueue(delta.content);
            }
          }
        }

        if (reply.content) {
          await this.#store.add(reply as ChatCompletionMessage);
        }

        controller.close();
      },
      cancel: (reason?: string) => {
        data.controller.abort(reason);
      },
    });

    response.headers = openaiResponse.headers;

    response.text = async () => {
      let text = "";
      for await (const chunk of response) {
        text += chunk;
      }
      return text;
    };

    return response;
  }
}
