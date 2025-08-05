import { Bot } from 'grammy';

import { replyWithError } from './utils';
import { reddit, instagram } from './downloaders';

const token = process.env.TOKEN;

if (!token) {
  console.log('No token provided');
  process.exit(1);
}

export const bot = new Bot(token);

bot.use(reddit);
bot.use(instagram);

bot.catch(async (error) => {
  console.error(error.message);
  await replyWithError(error.ctx);
});

void (async () => {
  await bot.start({ drop_pending_updates: true });
})();
