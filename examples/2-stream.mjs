import elaine from "elaine";

// Create a new chatbot instance
const bot = elaine();

// Make it read your message
const response = await bot.read("Hi! What's the oldest robot ever built?");

// Consume stream and print
for await (const chunk of response) {
  process.stdout.write(chunk);
}
