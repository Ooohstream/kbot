import { Bot, InputFile } from 'grammy';
import axios from 'axios';
import { ReelResponse } from './types';

import { getChatType, replyWithError, safelyDeleteMessage } from './utils';
import parse from 'node-html-parser';

const token = process.env.TOKEN;

if (!token) {
  console.log('No token provided');
  process.exit(1);
}

const bot = new Bot(token);
bot.hears(/https:\/\/www.instagram.com\/reel\/.+/, async (ctx) => {
  const message = ctx.message?.text;
  const { isGroupChat, isPrivateChat } = getChatType(ctx);

  if (!message) return;

  const { data } = await axios.post<ReelResponse>(
    `https://www.clipto.com/api/youtube`,
    { url: message },
  );
  const { success } = data;

  if (!success) {
    console.error(data);
    await replyWithError(ctx);
    return;
  }

  const { url } = data.medias[0];

  if (!url) return;

  const parsedUrl = new URL(url);
  const cdnUrl = url.replace(
    parsedUrl.origin,
    'https://scontent.cdninstagram.com',
  );

  await ctx.replyWithVideo(
    cdnUrl,
    (isGroupChat && {
      caption: '`' + ctx?.message?.from.username + '`',
      parse_mode: 'MarkdownV2',
    }) ||
      void 0,
  );
  if (isPrivateChat) return;
  await safelyDeleteMessage(ctx);
});

bot.hears(/https:\/\/www.reddit.com\/.+/, async (ctx) => {
  const message = ctx.message?.text;
  const { isGroupChat, isPrivateChat } = getChatType(ctx);

  if (!message) return;

  const { data } = await axios.get<string>(
    `https://rapidsave.com/info?url=${message}`,
  );

  const dom = parse(data);

  const url = dom
    .querySelector('.download-info')
    ?.getElementsByTagName('a')[0]
    .getAttribute('href');

  if (!url) {
    await replyWithError(ctx);
    return;
  }

  await ctx.replyWithVideo(
    new InputFile(new URL(url)),
    (isGroupChat && {
      caption: '`' + ctx?.message?.from.username + '`',
      parse_mode: 'MarkdownV2',
    }) ||
      void 0,
  );

  if (isPrivateChat) return;

  await safelyDeleteMessage(ctx);
});

bot.catch(async (error) => {
  console.error(error.message);
  await replyWithError(error.ctx);
});

void (async () => {
  await bot.start({ drop_pending_updates: true });
})();
