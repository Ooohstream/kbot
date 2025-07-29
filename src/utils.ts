import { Context } from 'grammy';

export const safelyDeleteMessage = async (ctx: Context) => {
  try {
    await ctx.deleteMessage();
  } catch {
    console.log("Message doesn't exists");
  }
};

export const getChatType = (ctx: Context) => {
  const isPrivateChat = ctx.message?.chat.type === 'private';
  const isGroupChat = !isPrivateChat;

  return {
    isPrivateChat,
    isGroupChat,
  };
};

export const replyWithError = async (ctx: Context) => {
  const { isPrivateChat } = getChatType(ctx);
  const replyMessage = await ctx.reply('Error');
  setTimeout(async () => {
    await ctx.deleteMessages([replyMessage.message_id]);
    if (isPrivateChat) return;
    await safelyDeleteMessage(ctx);
  }, 2000);
};
