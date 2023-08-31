import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { Bot } from "../source/bot";
import { createMockClient } from "./support";

let botOptions = { params: { model: "" } };

describe("Bot.message", () => {
  let bot: Bot;
  beforeEach(() => {
    bot = new Bot(createMockClient({ content: "dummy-completion-response" }), botOptions);
  });

  test("returns a ReadableStream instance", async () => {
    const response = await bot.read("");

    expect(response).instanceOf(ReadableStream);
  });

  test("returns the completion response", async () => {
    const response = await bot.read("");
    let reply = "";
    for await (const chunk of response) {
      reply += chunk;
    }

    expect(reply).toEqual("dummy-completion-response");
  });
});

describe("Bot.use", () => {
  test("appends a middleware to the chain", async () => {
    const bot = new Bot(createMockClient(), botOptions);

    const middleware = vi.fn();
    bot.use(middleware);

    await bot.read("");

    expect(middleware).toBeCalled();
  });
});

describe("Bot.function", () => {
  test("calls the function", async () => {
    const bot = new Bot(
      createMockClient({
        function_call: {
          name: "GetWeather",
          arguments: JSON.stringify({ location: "London" }),
        },
      }),
      botOptions
    );

    const fun = vi.fn();

    bot.function({
      name: "GetWeather",
      description: "Get the weather in a city",
      schema: z.object({}),
      onCall: fun,
    });

    const response = await bot.read("");

    for await (const chunk of response) {
      console.log(chunk);
    }
  });
});
