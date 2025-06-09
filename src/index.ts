import { Bot, Context, HearsContext } from 'grammy';
import parse from 'node-html-parser';
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

  const { data } = await axios.get<ReelResponse>(
    `https://content.mollygram.com/?url=${message}`,
  );
  const { status } = data;

  if (status === 'error') {
    const replyMessage = await ctx.reply('Error');
    setTimeout(async () => {
      await ctx.deleteMessages([replyMessage.message_id]);
      if (isPrivateChat) return;
      await safelyDeleteMessage(ctx);
    }, 2000);
    return;
  }

  const { html } = data;

  const url = parse(html)
    .getElementsByTagName('a')
    .at(-1)
    ?.getAttribute('href')
    ?.replace('pic5', 'pic6');

  if (url) {
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
  }
});

void (async () => {
  await bot.start();
})();
