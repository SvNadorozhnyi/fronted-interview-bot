require('dotenv').config();
const {
    Bot,
    Keyboard,
    InlineKeyboard,
    GrammyError,
    HttpError
  } = require('grammy');
  const { getRandomQuestion, getCorrectAnswer } = require('./utils');

const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('Random question')
    .resized();
  await ctx.reply(
    'Hello! I - Frontend Interview Prep Bot🤖 \nI will help you prepare for an interview on the frontend'
  );

  await ctx.reply('Where do we start? Choose a topic in the menu 👇', {
    reply_markup: startKeyboard,
  })
});

bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Random question'], async (ctx) => {
  const topic = ctx.message.text.toLocaleLowerCase();
  const { question, questionTopic} = getRandomQuestion(topic);

  let inlineKeyboard;

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        option.text,
        JSON.stringify({
          type: `${questionTopic}-option`,
          isCorrect: option.isCorrect,
          questionId: question.id,
        }),
      )
    ]);

    inlineKeyboard = InlineKeyboard.from(buttonRows);
  } else {
    inlineKeyboard = new InlineKeyboard().text(
      'Get an answer',
      JSON.stringify({
        type: questionTopic,
        questionId: question.id,
      }),
    );
  }

  await ctx.reply(question.text, {
    reply_markup: inlineKeyboard,
  });
});

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply('You\'re right! ✅');
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
  await ctx.reply(`Wrong ❌\nCorrect answer: ${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();