import { Bot } from 'grammy';

import { replyWithError } from './utils';

const token = process.env.TOKEN;

if (!token) {
  console.log('No token provided');
  process.exit(1);
}

export const bot = new Bot(token);

bot.catch(async (error) => {
  console.error(error.message);
  await replyWithError(error.ctx);
});

void (async () => {
  await bot.start({ drop_pending_updates: true });
})();
