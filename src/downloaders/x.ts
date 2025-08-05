import { Composer } from 'grammy';
import { getChatType, replyWithError, safelyDeleteMessage } from '../utils';
import axios from 'axios';
import parse from 'node-html-parser';

export const x = new Composer();

x.hears(/https:\/\/x.com\/.+/, async (ctx) => {
  const message = ctx.message?.text;
  const { isGroupChat, isPrivateChat } = getChatType(ctx);

  if (!message) return;

  const { data } = await axios.get<string>(
    `https://twitsave.com/info?url=${message}`,
  );

  const dom = parse(data);

  const url = dom.getElementsByTagName('video')[0].getAttribute('src');

  if (!url) {
    await replyWithError(ctx);
    return;
  }

  await ctx.replyWithVideo(
    url,
    (isGroupChat && {
      caption: '`' + ctx?.message?.from.username + '`',
      parse_mode: 'MarkdownV2',
    }) ||
      void 0,
  );

  if (isPrivateChat) return;

  await safelyDeleteMessage(ctx);
});
