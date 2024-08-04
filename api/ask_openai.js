import OpenAI from "openai";

const openAIclient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function ask_openai(messages, options = {}) {
  try {
    const chatCompletion = await openAIclient.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 4096,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: 'json_object' },
      ...options,
    });

    console.log('chatCompletion', JSON.stringify(chatCompletion, null, 2))

    const result = chatCompletion?.choices[0]?.message?.content
    if (typeof result === 'string') {
      return result
    }
  } catch (error) {
    console.error('ERROR', error)
  }
  return null
}
