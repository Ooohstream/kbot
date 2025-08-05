import { getChatType, replyWithError, safelyDeleteMessage } from './utils';
import axios from 'axios';
import parse from 'node-html-parser';
import { InputFile } from 'grammy';
import { bot } from './index';

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
