/* Web Worker: parsing e analisi fuori dal thread principale. Nessuna rete. */
importScripts('parser.js', 'analyze.js');
onmessage = function (e) {
  try {
    const parsed = PagellaParser.parse(e.data.text, e.data.filename);
    if (!parsed.msgs.length) { postMessage({ ok: false, error: 'empty', format: parsed.format }); return; }
    postMessage({ ok: true, R: PagellaAnalyze.analyze(parsed) });
  } catch (err) { postMessage({ ok: false, error: String(err && err.message || err) }); }
};
