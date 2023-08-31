import { OpenAI } from "openai";
import { CreateChatCompletionRequestMessage } from "openai/resources/chat";
import { Bot } from "./bot";
import { BotOptions, CompletionParams, Temperature } from "./types";

const DEFAULT_MODEL = "gpt-3.5-turbo";
const DEFAULT_TEMPERATURE = Temperature.OpenAIDefault;

/**
 * Simple factory function to create a new bot with defaults.
 */
export default function elaine(options?: BotFactoryOptions): Bot {
  let messages: CreateChatCompletionRequestMessage[] = [];

  if (options?.instructions) {
    messages.push({
      role: "system",
      content: options.instructions,
    });
  }

  const client = options?.client ?? new OpenAI({ apiKey: options?.apiKey });

  return new Bot(client, {
    params: {
      model: options?.model ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    },
  });
}

export type BotFactoryOptions = Omit<BotOptions, "client" | "model" | "params"> & {
  /**
   * An instance of `OpenAI` client. If not provided, a new instance will be created.
   * @default
   * ```ts
   * new OpenAI({ apiKey: options?.apiKey })
   * ```
   */
  client?: OpenAI;

  /**
   * Your OpenAI API key. If not provided, the `OPENAI_API_KEY` environment variable
   * will be used.
   * @default process.env.OPENAI_API_KEY
   */
  apiKey?: string;

  /**
   * ID of the model to use. See the
   * [model endpoint compatibility](/docs/models/model-endpoint-compatibility) table
   * for details on which models work with the Chat API.
   * @default "gpt-3.5-turbo"
   */
  model?: string;

  /**
   * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
   * make the output more random, while lower values like 0.2 will make it more
   * focused and deterministic.
   * @default Temperature.Default
   */
  temperature?: Temperature;

  /**
   * Instructions for the bot.
   */
  instructions?: string;

  /**
   * Default parameters to be used for all requests.
   */
  params?: Partial<Omit<CompletionParams, "model" | "temperature">>;
};
