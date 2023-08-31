import elaine from "elaine";

class MyMessageStore {
  #messages = [];

  add(message) {
    this.#messages.push(message);
  }
  get() {
    return this.#messages;
  }
  async clear() {
    this.#messages = [];
  }
}

const bot = elaine({
  messageStore: new MyMessageStore(),
});

let response = await bot.read("Hello, what's my name?");
console.log((await response.text()) + "\n");
// I'm sorry, but I am an AI language model and I do not have access to personal information.

response = await bot.read("My name is Luis");
console.log((await response.text()) + "\n");
// Hello Luis! How can I assist you today?

response = await bot.read("What's my name?");
console.log((await response.text()) + "\n");
// Your name is Luis.
