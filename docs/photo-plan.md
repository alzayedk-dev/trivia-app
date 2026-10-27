# Plan: a photo under each question

Not started. Kept here so it can be picked up later.

## Goal

Show a photo of the question's subject between the question and the answers,
without giving the answer away and without making the card scroll.

## Approach (recommended)

Real photos from Wikimedia Commons, chosen and checked one by one, compressed
and bundled with the app so they load instantly and work offline.

## Steps

1. **Pick a photo per question.** For each of the questions in
   `src/data/questions.ts`, choose a Wikimedia Commons photo of the question's
   *subject*, never the answer.
   - Safe: "Machu Picchu is in which country?" → photo of Machu Picchu.
   - Spoiler: "Which is the largest island?" → a photo of Greenland gives it
     away. Use a neutral related photo (e.g. sea ice, a coastline) or show the
     photo only after answering.
2. **Check licences.** Use only public-domain or CC BY / CC BY-SA photos.
   Record for each: file URL, author, licence.
3. **Download and compress.** Ask before downloading. Save to
   `assets/questions/<question-id>.jpg`, about 600 px wide, roughly 30–60 KB
   each (3–6 MB total).
4. **Add to the data.** Extend `Question` with
   `image: { source: require(...), credit: string }`.
5. **Show it in the card.** In `QuestionCard`, place the photo in the flexible
   space between the prompt and the answers, rounded corners, `resizeMode`
   cover. It shrinks to the room available and hides on very short screens, so
   the card still never scrolls. Show a small credit line ("Photo: author,
   licence") under it.
6. **Test** the longest question (`mw-chimborazo`) at 360×640, 360×740,
   375×667, 375×812 and tablet for no scrolling, before and after answering.

## Alternatives considered

- **Load photos from the internet while playing:** smaller app, but needs a
  connection, can be slow, and photos can't be checked in advance.
- **Drawn maps with the region highlighted:** on-theme and licence-free, but
  less engaging, and for many questions the map reveals the answer.
