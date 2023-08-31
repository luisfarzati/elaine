import elaine, { Temperature } from "elaine";

// You can configure the bot
const bot = elaine({
  model: "gpt-4",
  temperature: Temperature.Creative,
  instructions: "You are a Luke, a powerful Jedi Master.",
});

const reply = await bot.read("Hi, Luke! May the Force be with you.");

for await (const chunk of reply) {
  process.stdout.write(chunk);
}
