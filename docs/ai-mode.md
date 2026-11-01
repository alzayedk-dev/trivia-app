# AI mode

The player types a topic (or taps one of the topic buttons), taps **Let's start**, and an AI writes 5 questions
about it. The game then plays like any other (timer, 50/50, swiping, scoring).

## What the player can choose

- **Topic:** typed, or one tap on Soccer, Islam, Middle East culture or Kuwait.
- **Language:** English or Arabic. In Arabic the AI writes in Arabic and the game screens read right to left.
- **Difficulty:** Mixed (easy to hard), or all Easy, Medium or Hard.
- **AI model:** Auto, Gemma or Nemotron (all free). The pick goes first; if it is busy another one steps in.
- **During a game:** a **New set** button throws the questions away and asks for a fresh set on the same topic.
  After each answer, one short line explains why the right answer is right.
- **Fact-checker:** after the questions are written, a second request asks a different model to check each one.
  Questions it isn't sure about get a "Not sure about this one" tag. If the check can't run, nothing is tagged.
  It adds about 10 seconds.
- **Best scores:** the best score for each topic is saved on the device and listed on the home screen.

## How it works

1. The app sends the topic to `api/ai-questions.ts`, a small function that runs on Vercel.
2. The function asks OpenRouter's free `google/gemma-4-26b-a4b-it:free` model for 5 questions as JSON.
3. The function tidies the reply (code blocks, extra text, trailing commas), checks it, and sends back
   clean questions. The app checks them once more. The correct answer is sent separately and the app
   shuffles the four answers, so it lands in a random spot.
4. If anything goes wrong, the player sees the "The lights flickered" screen with **Try again** and a
   small line saying why (for example `Error 429 · The AI is busy`).

The OpenRouter key only ever lives on the server (see below). It is never in the app or in Git.

## Setting up the key

| Where | What to do |
| --- | --- |
| Your computer | A file named `.env.local` in the project folder with one line: `OPENROUTER_API_KEY=sk-or-v1-...` (just the key, no quotes, no spaces, nothing around it). Git ignores this file. |
| Vercel (the live site) | Project → **Settings → Environment Variables** → add `OPENROUTER_API_KEY`, then **redeploy** so it takes effect. |

## Which model

The function tries these free models in order and moves to the next when one is busy, down or gives
an answer it can't read: `google/gemma-4-26b-a4b-it:free`, then `nvidia/nemotron-3.5-super-vl:free`,
then `google/gemma-4-31b-it:free`. It gives up after about 52 seconds in total.

Optional: add `OPENROUTER_MODEL` in either place to use your own list instead, with no code changes.
One model or several separated by commas, e.g. `nvidia/nemotron-3.5-super-vl:free,google/gemma-4-26b-a4b-it:free`.
Any model ending in `:free` costs nothing, but it must support JSON mode. Browse them at
openrouter.ai/models (filter by "Free" and the `response_format` parameter). Free models come and go.

## Testing on your computer

In one terminal: `npm run ai-api` (runs the function locally using `.env.local`).
In another: `npx expo start --web`. The app finds the local function by itself when opened from `localhost`.

## Good to know

- Free models on OpenRouter share a pool of capacity with everyone else, so they are sometimes busy.
  That shows up as `Error 429`. Trying again a little later usually works. A paid model, or adding your
  own Google AI Studio key in OpenRouter's settings, avoids this.
- AI can make mistakes, so the app says so under the Start button.
- Phones and the Expo site call the function on the Vercel site, so AI mode needs that site deployed.
