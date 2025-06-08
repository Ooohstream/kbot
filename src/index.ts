import { Bot, webhookCallback } from 'grammy';
import parse from 'node-html-parser';
import axios from 'axios';
import { ReelResponse } from './types';
import express from 'express';

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
      await ctx.deleteMessage();
    }, 2000);
    return;
  }

  const { html } = data;

  const url = parse(html)
    .getElementsByTagName('a')
    .at(-1)
    ?.getAttribute('href');

  if (url) {
    let caption = undefined;

    if (isGroupChat) {
      caption = {
        caption: ctx?.message?.from.username,
        show_caption_above_media: true,
      };
    }

    await ctx.replyWithVideo(url, caption);
    if (isPrivateChat) return;
    await ctx.deleteMessage();
    return;
  }
});

void (async () => {
  if (process.env.NODE_ENV !== 'production') {
    await bot.start();
    console.log('The bot has been started via long-polling.');
    return;
  }

  const app = express();
  app.use(express.json());
  const domain = process.env.DOMAIN;

  if (!domain) {
    console.log('No domain provided');
    process.exit(1);
  }

  app.use(`/${token}`, webhookCallback(bot, 'express'));
  app.get('/', (req, res) => {
    res
      .send({
        status: 'ok',
        message: 'If you see this message everything works correctly!',
      })
      .status(200);
  });
  app.listen(Number(process.env.PORT), async () => {
    await bot.api.setWebhook(`https://${domain}/${token}`);
    console.log('The bot has been started via webhook!');
  });
})();
