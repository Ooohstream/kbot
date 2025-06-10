import { Bot, Context, HearsContext } from 'grammy';
import axios from 'axios';
import { ReelResponse } from './types';

const safelyDeleteMessage = async (ctx: HearsContext<Context>) => {
  try {
    await ctx.deleteMessage();
  } catch {
    console.log("Message doesn't exists");
  }
};

const token = process.env.TOKEN;

if (!token) {
  console.log('No token provided');
  process.exit(1);
}

const bot = new Bot(token);

bot.hears(/https:\/\/www.instagram.com\/reel\/.+/, async (ctx) => {
  const message = ctx.message?.text;
  const isPrivateChat = ctx.message?.chat.type === 'private';
  const isGroupChat = !isPrivateChat;

  if (!message) return;

  const { data } = await axios.post<ReelResponse>(
    `https://www.clipto.com/api/youtube`,
    { url: message },
  );
  const { success } = data;

  if (!success) {
    const replyMessage = await ctx.reply('Error');
    console.error(data);
    setTimeout(async () => {
      await ctx.deleteMessages([replyMessage.message_id]);
      if (isPrivateChat) return;
      await safelyDeleteMessage(ctx);
    }, 2000);
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

void (async () => {
  await bot.start();
})();
