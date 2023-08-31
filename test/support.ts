import { getEncoding } from "js-tiktoken";
import OpenAI from "openai";
import { ChatCompletionChunk, ChatCompletionMessage } from "openai/resources/chat";

export const tiktoken = getEncoding("cl100k_base");

export const chunk = (message: ChatCompletionMessage, finish?: string): ChatCompletionChunk =>
  ({
    choices: [
      {
        delta: message,
        finish_reason: finish,
      },
    ],
  } as ChatCompletionChunk);

export const stream = (message: ChatCompletionMessage): ReadableStream<ChatCompletionChunk> =>
  new ReadableStream<ChatCompletionChunk>({
    pull(controller) {
      // stream function call
      if (message.function_call) {
        // @ts-expect-error - function `arguments` not provided
        controller.enqueue(chunk({ function_call: { name: message.function_call.name } }));

        for (const token of tiktoken.encode(message.function_call.arguments)) {
          // @ts-expect-error - function `name` not provided
          controller.enqueue(chunk({ function_call: { arguments: tiktoken.decode([token]) } }));
        }

        // @ts-expect-error - function `name` and `arguments` not provided
        controller.enqueue(chunk({}, "function_call"));
      }
      // stream message
      else if (message.content) {
        for (const token of tiktoken.encode(message.content)) {
          controller.enqueue(chunk({ role: "assistant", content: tiktoken.decode([token]) }));
        }

        // @ts-expect-error - function `name` and `arguments` not provided
        controller.enqueue(chunk({}, "stop"));
      }

      controller.close();
    },
  });

const dummyMessage: ChatCompletionMessage = {
  role: "assistant",
  content: "dummy-completion-response",
};

export const createMockClient = (message: Partial<ChatCompletionMessage> = dummyMessage): OpenAI =>
  ({
    chat: {
      completions: {
        create() {
          return {
            async withResponse() {
              return {
                // @ts-expect-error
                data: stream(message),
                response: new Response(),
              };
            },
          };
        },
      },
    },
  } as unknown as OpenAI);
