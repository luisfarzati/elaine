import elaine from "elaine";

// Create a new chatbot instance
const bot = elaine();

// Make it talk
const response = await bot.read("Write some story about a cat in just 3 sentences.");

// Print the response
console.log(await response.text());
