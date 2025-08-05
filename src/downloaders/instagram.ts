import { getChatType, replyWithError, safelyDeleteMessage } from '../utils';
import axios from 'axios';
import { ReelResponse } from '../types';
import { Composer } from 'grammy';

export const instagram = new Composer();

instagram.hears(/https:\/\/www.instagram.com\/reel\/.+/, async (ctx) => {
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
