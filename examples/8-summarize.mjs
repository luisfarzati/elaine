import elaine, { Temperature } from "elaine";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";

const bot = elaine({
  model: "gpt-3.5-turbo-16k",
  instructions:
    "Write the title of the given document, summarize it and give your opinion about it.",
  temperature: Temperature.Consistent,
});

const article = await fetch("https://uist.acm.org/uist2002/files/SOSPadvice.txt");
const response = await bot.read(await article.text());

await Readable.from(response).pipe(createWriteStream("summarized.txt"));
