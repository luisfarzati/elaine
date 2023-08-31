import elaine from "elaine";
import { z } from "zod";

const bot = elaine();

// You can define functions the bot can use
bot.function({
  name: "GetTemperature",
  description: "Get the current temperature in the given location",
  schema: z.object({ location: z.string() }),
  onCall: () => "25C",
});

const reply = await bot.read("Is it too hot in Miami right now?");

for await (const chunk of reply) {
  process.stdout.write(chunk);
}
