import { OpenAI } from "openai";
import elaine from "elaine";

const client = new OpenAI();

// You can pass an OpenAI instance (useful for testing as well)
const bot = elaine({
  client,
  params: {
    max_tokens: 20,
  },
});

const response = await bot.read("Tell me a joke");

for await (const chunk of response) {
  process.stdout.write(chunk);
}
