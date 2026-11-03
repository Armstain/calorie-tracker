#!/usr/bin/env node
// Accuracy evaluation for the food vision pipeline.
//
// Sends each labelled photo through the app's own /api/gemini-analyze route
// (same prompt, schema and parsing as real users get) and reports calorie error
// and food recall per model.
//
// Usage:
//   npm run dev                      # in another terminal
//   npm run eval:vision -- [options]
//
// Options:
//   --labels <file>     Labels JSON (default: eval/labels.json)
//   --url <base>        App base URL (default: http://localhost:3000)
//   --models <list>     Comma-separated model ids, or "default" for the normal
//                       fallback chain (default: default)
//   --delay <ms>        Pause between requests (default: 6500, stays under the
//                       route's 10/min limit and the free tier's 15 RPM)
//   --limit <n>         Only use the first n labelled photos
//
// The server's GEMINI_API_KEY is used unless EVAL_GEMINI_API_KEY is set.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function parseArgs(argv) {
  const args = { labels: 'eval/labels.json', url: 'http://localhost:3000', models: 'default', delay: 6500, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case '--labels': args.labels = value; i++; break;
      case '--url': args.url = value.replace(/\/$/, ''); i++; break;
      case '--models': args.models = value; i++; break;
      case '--delay': args.delay = Number(value); i++; break;
      case '--limit': args.limit = Number(value); i++; break;
      case '-h':
      case '--help':
        console.log(
          'Usage: npm run eval:vision -- [--labels eval/labels.json] [--url http://localhost:3000] ' +
          '[--models default|gemini-3.8-flash,gemini-3.6-flash] [--delay 6500] [--limit n]'
        );
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${flag}`);
        process.exit(1);
    }
  }
  return args;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const normalize = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// A labelled food counts as found if any predicted name contains it or vice versa.
function foodRecall(expected, predicted) {
  if (!expected?.length) return null;
  const names = predicted.map(normalize);
  const hits = expected.filter(e => {
    const n = normalize(e);
    return names.some(p => p.includes(n) || n.includes(p));
  });
  return hits.length / expected.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const mean = values => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

async function analyze(url, body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const started = Date.now();
    const response = await fetch(`${url}/api/gemini-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const latencyMs = Date.now() - started;
    const json = await response.json().catch(() => null);

    if (response.status === 429 && attempt < 2) {
      const wait = Number(response.headers.get('retry-after') || 30);
      console.log(`  rate limited, waiting ${wait}s...`);
      await sleep(wait * 1000);
      continue;
    }
    return { ok: response.ok, status: response.status, json, latencyMs };
  }
  return { ok: false, status: 429, json: { message: 'Rate limited' }, latencyMs: 0 };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const labelsPath = path.resolve(args.labels);
  const labelsDir = path.dirname(labelsPath);

  let labels;
  try {
    labels = JSON.parse(await readFile(labelsPath, 'utf8'));
  } catch (error) {
    console.error(`Could not read labels from ${labelsPath}: ${error.message}`);
    console.error('Copy eval/labels.example.json to eval/labels.json and add your photos (see eval/README.md).');
    process.exit(1);
  }
  labels = labels.slice(0, args.limit);

  const models = args.models === 'default' ? [undefined] : args.models.split(',').map(m => m.trim()).filter(Boolean);
  const apiKey = process.env.EVAL_GEMINI_API_KEY || undefined;

  const rows = [];
  let first = true;

  for (const model of models) {
    const modelName = model || 'default chain';
    console.log(`\n== ${modelName} ==`);

    for (const label of labels) {
      const imagePath = path.resolve(labelsDir, label.image);
      const ext = path.extname(imagePath).toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) {
        console.warn(`  skip ${label.image}: unsupported extension`);
        continue;
      }
      const { size } = await stat(imagePath);
      if (size > MAX_IMAGE_BYTES) {
        console.warn(`  skip ${label.image}: ${(size / 1024 / 1024).toFixed(1)} MB is over the 1.5 MB limit, resize it first`);
        continue;
      }

      if (!first) await sleep(args.delay);
      first = false;

      const imageData = `data:${mime};base64,${(await readFile(imagePath)).toString('base64')}`;
      const { ok, status, json, latencyMs } = await analyze(args.url, {
        imageData,
        apiKey,
        note: label.note,
        model,
      });

      if (!ok || !json) {
        console.log(`  ✗ ${label.image}: ${status} ${json?.message ?? ''}`);
        rows.push({ model: modelName, image: label.image, ok: false, status, error: json?.message });
        continue;
      }

      const predicted = json.totalCalories;
      const absError = Math.abs(predicted - label.calories);
      const pctError = label.calories > 0 ? absError / label.calories : null;
      const recall = foodRecall(label.foods, (json.foods || []).map(f => f.name));

      console.log(
        `  ✓ ${label.image}: predicted ${predicted} kcal vs ${label.calories} ` +
        `(${pctError === null ? 'n/a' : `${Math.round(pctError * 100)}%`} off, ${latencyMs} ms, ${json.modelUsed})`
      );
      rows.push({
        model: modelName,
        modelUsed: json.modelUsed,
        image: label.image,
        ok: true,
        expected: label.calories,
        predicted,
        absError,
        pctError,
        recall,
        latencyMs,
        foods: (json.foods || []).map(f => ({ name: f.name, calories: f.calories, grams: f.estimatedGrams })),
      });
    }
  }

  // Summary per model
  const summary = models.map(model => {
    const name = model || 'default chain';
    const all = rows.filter(r => r.model === name);
    const ok = all.filter(r => r.ok);
    const pct = ok.map(r => r.pctError).filter(v => v !== null);
    const recalls = ok.map(r => r.recall).filter(v => v !== null);
    return {
      model: name,
      photos: all.length,
      succeeded: ok.length,
      maeKcal: mean(ok.map(r => r.absError)),
      meanPctError: mean(pct),
      medianPctError: median(pct),
      within20Pct: pct.length ? pct.filter(v => v <= 0.2).length / pct.length : null,
      foodRecall: mean(recalls),
      avgLatencyMs: mean(ok.map(r => r.latencyMs)),
    };
  });

  const fmt = (v, kind) => {
    if (v === null || v === undefined) return 'n/a';
    if (kind === 'pct') return `${Math.round(v * 100)}%`;
    return String(Math.round(v));
  };

  console.log('\n== Summary ==');
  console.table(summary.map(s => ({
    model: s.model,
    ok: `${s.succeeded}/${s.photos}`,
    'MAE kcal': fmt(s.maeKcal),
    'mean % err': fmt(s.meanPctError, 'pct'),
    'median % err': fmt(s.medianPctError, 'pct'),
    'within 20%': fmt(s.within20Pct, 'pct'),
    'food recall': fmt(s.foodRecall, 'pct'),
    'avg ms': fmt(s.avgLatencyMs),
  })));

  const outDir = path.resolve('eval/results');
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(outFile, JSON.stringify({ args: { ...args, limit: Number.isFinite(args.limit) ? args.limit : null }, summary, rows }, null, 2));
  console.log(`\nFull results written to ${path.relative(process.cwd(), outFile)}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
