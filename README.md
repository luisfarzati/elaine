## Quick start

```sh
$ npm i elaine
```

```mjs
// bot.mjs
import elaine from "elaine";

const bot = elaine();

const response = await bot.read("Write some story about a cat in just 3 sentences.");

const text = await response.text();

console.log(text);
```

```
$ OPENAI_API_KEY=<your key> node bot.mjs

Once upon a time, a curious tabby cat named Whiskers set out on an adventure through the bustling city streets. As he wandered from alley to alley, he encountered friendly shopkeepers, playful children, and even a mischievous squirrel that led him on a chase. Exhausted but content, Whiskers finally returned home, his heart filled with the unforgettable tales of his feline escapade.
```

## Stream-first

Elaine returns a stream by default.

```ts
const bot = elaine();

const response = await bot.read("Hello!");

for await (const chunk of response) {
  process.stdout.write(chunk);
}
```

## Easy to use functions

Elaine makes it easy to use functions:

```ts
import { z } from "zod";

bot.function({
  name: "GetTemperature",
  description: "Get the current temperature in the given location",
  schema: z.object({ location: z.string() }),
  onCall: ({ location }) => "25C",
});

const response = await bot.read("Is it too hot in Miami right now?");

console.log(await response.text());

// The current temperature in Miami is 25°C
```

## Conversation history

Elaine has in-memory conversation history out of the box.

```ts
let response = await bot.read("Hello, what's my name?");
console.log(await response.text());
// I'm sorry, but I am an AI language model and I do not have access to personal information.

response = await bot.read("My name is Luis");
console.log(await response.text());
// Hello Luis! How can I assist you today?

response = await bot.read("What's my name?");
console.log(await response.text());
// Your name is Luis.
```

You can configure your own message store:

```ts
import { MessageStore } from "elaine";

class DbMessageStore implements MessageStore {
  async add(message: ChatCompletionMessage): Promise<void> {
    // save the message to db
  }
  async get(): Promise<ChatCompletionMessage[]> {
    // get all messages from db
  }
  async clear(): Promise<void> {
    // delete all messages from db
  }
}

const bot = elaine({
  messageStore: new DbMessageStore(),
});
```

## Summarize a text

```ts
import { Temperature } from "elaine";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";

const bot = elaine({
  model: "gpt-3.5-turbo-16k",
  instructions:
    "Write the title of the given document, summarize it and give your opinion about it.",
  temperature: Temperature.Consistent,
});

const article = await fetch("https://uist.acm.org/uist2002/files/SOSPadvice.txt");

const summary = await bot.read(await article.text());

const outputFile = createWriteStream("summarized.txt");

await Readable.from(summary).pipe(outputFile);
```

## Use an existing OpenAI client

Useful for advanced customizations or for unit testing:

```ts
import { OpenAI } from "openai";

const client = new OpenAI();

const bot = elaine({
  client,
  params: {
    max_tokens: 20,
  },
});

const response = await bot.talk();

for await (const chunk of response) {
  process.stdout.write(chunk);
}
```

## Examples

You can check full code of the above examples and more in the [./examples](./examples) directory.

## License

The source code for the site is licensed under the MIT license, which you can find in the LICENSE.txt file.
