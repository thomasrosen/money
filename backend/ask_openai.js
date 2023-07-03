import { Configuration, OpenAIApi } from 'openai'
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function ask_openai(messages, options = {}) {
  const {
    max_tokens = 500,
    temperature = 0.7,
  } = options

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    n: 1,
    temperature, // Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
    max_tokens,
    stream: false,
    messages: messages,
    ...options,
  }, { responseType: null })

  return new Promise(resolve => {
    try {
      resolve(completion.data?.choices[0]?.message?.content)
    } catch (error) {
      console.error('ERROR', error)
      resolve(null)
    }
  })
}
