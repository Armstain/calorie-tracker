# Vision accuracy evaluation

Measures how close the AI's calorie estimates are to known values, so model or
prompt changes can be compared with numbers instead of guesses.

## Set up

1. Put 20–30 meal photos in `eval/images/`, each under 1.5 MB (resize to about 1024 px on the long side).
   Use photos where you know the calories: weighed home meals, packaged foods, or restaurant items with published nutrition.
2. Copy `labels.example.json` to `labels.json` and add one entry per photo:

   ```json
   {
     "image": "images/dal-roti.jpg",
     "calories": 520,
     "foods": ["roti", "dal"],
     "note": "2 rotis, 1 bowl dal"
   }
   ```

   - `calories` (required): the true total for the whole photo.
   - `foods` (optional): items that should be detected; used for the "food recall" score.
   - `note` (optional): sent like the in-app note box, to test whether notes help.

## Run

```bash
npm run dev                                   # in one terminal
npm run eval:vision                           # default fallback chain
npm run eval:vision -- --models gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite
npm run eval:vision -- --limit 5              # quick smoke test
```

The server's `GEMINI_API_KEY` is used unless `EVAL_GEMINI_API_KEY` is set.
Requests are spaced 6.5 s apart by default to stay under the route's 10/min
limit and the free tier's 15 requests per minute.

## Output

A summary table per model:

| Column | Meaning |
|---|---|
| MAE kcal | Average absolute calorie error |
| mean / median % err | Error relative to the true calories |
| within 20% | Share of photos estimated within ±20% |
| food recall | Share of labelled foods that were detected |
| avg ms | Average response time |

Full per-photo results are saved to `eval/results/` (git-ignored).
