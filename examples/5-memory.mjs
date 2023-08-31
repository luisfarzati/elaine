import elaine from "elaine";

const bot = elaine();

let response = await bot.read("Hello, what's my name?");
console.log(await response.text());
// I'm sorry, but I am an AI language model and I do not have access to personal information.

response = await bot.read("My name is Luis");
console.log(await response.text());
// Hello Luis! How can I assist you today?

response = await bot.read("What's my name?");
console.log(await response.text());
// Your name is Luis.
