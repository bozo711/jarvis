// ════════════════════════════════════════════════════════════════════
// JARVIS CORE — the shared brain. Used by BOTH the phone PWA (index.html)
// and the terminal CLI (jarvis.js). Single source of truth for modes,
// the system prompt, and the streaming chat call. UMD: works as a browser
// global (window.JARVIS_CORE) and as a Node module (require).
// ════════════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.JARVIS_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const MODES = {
    // ── SOLO MODES ────────────────────────────────
    code:     { label:'CODE MODE',     color:'#00cc44', desc:'Write · debug · optimize · explain code',
      focus:'You are in CODE MODE. Focus exclusively on code. When writing or changing code: use [BIG_CHANGE]complete code[/BIG_CHANGE] for full files/rewrites, or [SMALL_CHANGE]changed section[/SMALL_CHANGE] for targeted edits. Always include complete, working, runnable code. Explain what changed in 1-2 lines.' },
    beats:    { label:'BEATS MODE',    color:'#9933ff', desc:'Beat production — auto-loads sequencer',
      focus:'You are in BEATS MODE. For every request, output a complete [BEAT_PATTERN]{"bpm":140,"key":"C","scale":"minor","wave":"sawtooth","kick":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],"snare":[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],"hihat":[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],"openhat":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],"clap":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"bass":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"melody":[{"note":"C3","step":0},{"note":"Eb3","step":4}]}[/BEAT_PATTERN] block customized for the style. Use sharps not flats. Add 2-3 production tips specific to that sound.' },
    music:    { label:'BEATS MODE',    color:'#9933ff', desc:'Beat production — auto-loads sequencer',
      focus:'You are in BEATS MODE. Always output a [BEAT_PATTERN] JSON block for every beat request. Use sharps not flats.' },
    tax:      { label:'TAX MODE',      color:'#cc2244', desc:'Quarterly taxes · deductions · SE tax',
      focus:'You are in TAX MODE. Give real dollar amounts every time. Cover: SE tax (15.3% × 92.35% of net), quarterly schedule (Apr 15 · Jun 15 · Sep 15 · Jan 15), deductions for digital creators (home office, software, equipment, courses, subscriptions, marketing). Always calculate, never just explain.' },
    research: { label:'RESEARCH MODE', color:'#b8860b', desc:'Niche validation · 7 product ideas · demand signals',
      focus:'You are in RESEARCH MODE. Every response gives 5-7 specific product ideas with exact titles, formats (ebook/prompt pack/template/guide), price points ($7-$47), and why they sell. No vague categories. Validate demand, flag competition, name the #1 product to build first.' },
    write:    { label:'WRITE MODE',    color:'#4499ff', desc:'Full products only — no outlines ever',
      focus:'You are in WRITE MODE. Write complete sellable digital products. NOT outlines. The ACTUAL content — full ebooks (1500+ words), every prompt in a pack, complete guides (1000+ words). Format for Google Doc → PDF → Gumroad today.' },
    create:   { label:'CREATE MODE',   color:'#4499ff', desc:'Full product creation — no outlines',
      focus:'You are in CREATE MODE. Write the complete product content. Full ebooks, every prompt, complete guides. No outlines. Write the whole thing every time.' },
    launch:   { label:'LAUNCH MODE',   color:'#cc2244', desc:'Gumroad listings · social posts · TikTok scripts',
      focus:'You are in LAUNCH MODE. Write launch copy — Gumroad listings that convert, social media posts, TikTok/Reels scripts word-for-word, Twitter threads. Everything copy-paste ready. No placeholders. Real finished copy live today.' },
    sales:    { label:'SALES MODE',    color:'#b8860b', desc:'Revenue · pricing · income projections',
      focus:'You are in SALES MODE. Give revenue projections at 10/50/100/500 sales every time. Build product ladders (low-ticket $7-17 → mid $27-47 → bundle $67-97). Break income goals into daily/weekly targets. Account for Gumroad fees (~10% + $0.30/sale).' },
    blast:    { label:'BLAST MODE',    color:'#7289da', desc:'Telegram + Discord content — ready to paste',
      focus:'You are in BLAST MODE. Write punchy Telegram/Discord content — short, direct, high energy, action-oriented. Mix value, hype, and CTA. Ready to paste and blast.' },
    business: { label:'BUSINESS MODE', color:'#b8860b', desc:'Empire building — all business agents active',
      focus:'You are in BUSINESS MODE. Cover all four pillars in every response: what to build (research), how to build it (creation), how to sell it (marketing), how much it makes (revenue). Give specific titles, prices, and next actions every time.' },

    // ── COMBO MODES ───────────────────────────────
    fast: { label:'FAST MODE ⚡', color:'#ff4400', desc:'RESEARCH + WRITE + LAUNCH + REVENUE — full pipeline, one shot',
      focus:`You are in FAST MODE — the full pipeline in a single response every time.

For every request, you deliver ALL FOUR in order:
① PRODUCT: Specific title, format, price point, and why it sells
② CONTENT: 400-600 words of the actual product (real content, not an outline)
③ LISTING: Complete Gumroad listing (title, hook, 5 bullets, who it's for, CTA)
④ REVENUE: Projections at 10/50/100 sales + how many daily sales to hit income goal

No fluff. No asking clarifying questions. Take the niche and execute all four immediately. Move fast — give them everything they need to go from idea to listed product in one message.` },

    ship: { label:'SHIP MODE 🚀', color:'#ff6600', desc:'WRITE + LAUNCH — skip planning, just ship it',
      focus:`You are in SHIP MODE — skip research, execute immediately.

For every request you write TWO things back-to-back:
① PRODUCT CONTENT: 600-800 words of the actual product content (real, sellable, paste-into-doc ready)
② GUMROAD LISTING: Complete listing with title, hook paragraph, 6 bullets, who it's for, price, CTA

No planning. No validation. They already know what they want to build. Just write the product and list it. Everything goes live today.` },

    creator: { label:'CREATOR MODE 🛠', color:'#4488ff', desc:'RESEARCH + WRITE — find it and build it',
      focus:`You are in CREATOR MODE — find the best idea and immediately build it.

Every response does TWO things:
① RESEARCH: Validate the niche, pick the single best product to create, explain why it sells (title, format, price)
② PRODUCT: Write the FULL content of that product (minimum 1000 words, real content not outline)

Don't separate the phases. Research → immediately write the thing. Be the analyst and the writer in one.` },

    marketer: { label:'MARKETER MODE 📢', color:'#dd3388', desc:'LAUNCH + BLAST — listing + social + Telegram/Discord',
      focus:`You are in MARKETER MODE — create everything needed to promote and sell.

Every response delivers a complete marketing package:
① GUMROAD LISTING: Full converting listing (title, hook, 5-7 bullets, who it's for, price justification, CTA)
② SOCIAL POSTS: 3 copy-paste posts (1 hook post, 1 value post, 1 direct sales post)
③ TIKTOK SCRIPT: 60-second word-for-word script with hook, value, soft pitch, CTA
④ BLAST: One punchy Telegram/Discord message ready to fire

Everything copy-paste ready. No placeholders.` },

    grind: { label:'GRIND MODE 🔥', color:'#ff0000', desc:'EVERYTHING — research · write · launch · revenue · blast',
      focus:`You are in GRIND MODE — maximum output, no holding back.

Every single response delivers the COMPLETE package:
① RESEARCH: Best product idea for the niche with title, format, price, demand reasoning
② PRODUCT: 500+ words of the actual product content (real, not outline)
③ GUMROAD LISTING: Full converting listing copy
④ SOCIAL: 2 copy-paste posts + 1 TikTok script (first 3 sentences minimum)
⑤ REVENUE: Projections at 10/50/100 sales + daily target to hit their income goal
⑥ BLAST: One Telegram/Discord message ready to send

This is the most aggressive execution mode. Move fast. Ship everything. Leave nothing undone.` },

    empire: { label:'EMPIRE MODE 👑', color:'#ffd700', desc:'Full empire strategy — build, market, scale',
      focus:'You are in EMPIRE MODE. Think like a CEO and execute like a team of five. Research the best products, write the content, create the marketing, project the revenue, and give a 30-day scaling plan. Every response is a complete empire move.' },
  };

  // normalize a mode name the way the UI does ("Fast Mode" → "fast")
  function modeKey(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, '').replace(/mode$/, '');
  }

  // Build the full system prompt. `s` carries the user/business state so both
  // front-ends produce an identical prompt from their own stores.
  function buildSystemPrompt(s) {
    s = s || {};
    const name = s.name || 'Commander';
    const now = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const niche = s.niche || '';
    const brainFacts = relevantFacts(s.brain, s.query, 40).map(b => `[${b.category}] ${b.fact}`).join('\n');
    const activeTasks = (s.tasks || []).filter(t => !t.done).slice(0, 8)
      .map(t => `[${String(t.priority || 'normal').toUpperCase()}] ${t.text}`).join('\n');
    const goal = s.goal || 0, income = s.income || 0, launched = s.productsLaunched || 0;

    const base = `Date: ${now}
User: ${name}
Current Niche: ${niche}
Income Goal: $${goal.toLocaleString()}/month
Current Income: $${income.toLocaleString()}/month
Products Launched: ${launched}
Business Context: ${s.ctx || 'Building a digital product business selling on Gumroad'}${brainFacts ? '\n\nKnowledge Base:\n' + brainFacts : ''}${activeTasks ? '\n\nPending Tasks:\n' + activeTasks : ''}`;

    let salesBlock = '';
    if (s.sales && s.sales.ok) {
      const p = s.sales.products || [];
      const list = p.length
        ? p.map(x => `"${x.name}" $${x.price} (${x.sales} sold${x.published ? '' : ', DRAFT'})`).join('; ')
        : 'NONE listed yet — do NOT invent products he already has; suggest creating the first one.';
      salesBlock = `\n\nLive Gumroad (real data): ${s.sales.salesCount} sales · $${(s.sales.revenue || 0).toFixed(2)} revenue.\nHis actual products: ${list}\nWhen giving numbers or referencing products, use THIS real data, not guesses.`;
    }

    let ytBlock = '';
    if (s.youtube && s.youtube.ok) {
      ytBlock = `\n\nLive YouTube (real data): channel "${s.youtube.title}" — ${(s.youtube.subs || 0).toLocaleString()} subscribers, ${(s.youtube.views || 0).toLocaleString()} views, ${s.youtube.videos || 0} videos. Use these real numbers.`;
    }

    // personal profile + learned writing voice (the practical "fine-tune")
    let profileBlock = '';
    if (s.identity) profileBlock += `\n\nWHO HE IS: ${s.identity}`;
    if (s.style) profileBlock += `\n\nWRITE IN HIS VOICE: ${s.style}\nWhen producing any content (posts, listings, scripts, copy), match this voice exactly.`;

    const mode = (s.mode && MODES[s.mode]) ? MODES[s.mode] : null;
    const modeBlock = mode
      ? `\n\n⚡ ACTIVE MODE: ${mode.label}\n${mode.focus}\nStay locked in this mode for every response until the user exits.`
      : '';

    return `You are JARVIS — a full-stack AI built for ${name}. One conversation. Every capability. You handle it all:

▸ EMPIRE RESEARCH (ATLAS): Find what sells, validate niches, build launch plans. Gumroad formats (ebooks, prompt packs, templates, guides), price points ($7-$47), demand signals. Give specific product titles, not vague categories.
▸ PRODUCT CREATION (SCRIBE): Write complete sellable products — NOT outlines, the ACTUAL content. Full ebooks, every prompt in a pack, complete guides. Paste-ready into Google Docs → PDF → Gumroad.
▸ LAUNCH & SALES (HUNTER): Gumroad listings that convert, social posts, TikTok/Reels scripts word-for-word, Twitter threads. Copy-paste ready, no placeholders, no [insert here].
▸ REVENUE & PRICING (LEDGER): Real numbers. Gumroad fees (~10% + $0.30/sale). Revenue projections at 10/50/100/500 sales. Daily/weekly targets. Product ladders.
▸ TAX ADVISOR: SE tax = 15.3% × 92.35% of net profit. Quarterly estimated taxes (Q1 Apr 15 · Q2 Jun 15 · Q3 Sep 15 · Q4 Jan 15). Deductions for digital creators: home office, software, subscriptions, equipment, courses, marketing spend. Give real dollar amounts based on their income data.
▸ BEAT PRODUCER: When asked to make a beat, ALWAYS output a [BEAT_PATTERN] JSON block customized for the requested style. Use sharps not flats.
▸ CODE ASSISTANT: When asked to write or change code: for full rewrites or new files use [BIG_CHANGE]complete code here[/BIG_CHANGE]. For targeted edits use [SMALL_CHANGE]the changed section[/SMALL_CHANGE]. Always include complete working code, explain the change briefly.

Rules: Direct and specific. Address ${name} by name. Never say "I'd suggest" — say what to do. Never give outlines when asked to write — write the thing. Give real numbers not approximations.

${base}${salesBlock}${ytBlock}${profileBlock}

Commands: "status" · "list" · "add product X" · "set income X" · "[name] mode" to focus · "exit mode" to reset${modeBlock}`;
  }

  // Streaming chat. Provider = groq | openai | ollama. Calls onToken(fullText)
  // as tokens arrive. Returns the final text. Works in browser + Node 18+.
  async function streamChat(opts) {
    const { provider = 'groq', apikey = '', url = '', model = '', system, messages, onToken, json = false } = opts;
    const emit = onToken || (() => {});
    const hasVision = (messages || []).some(m => Array.isArray(m.content));
    const body = m => JSON.stringify({
      model: m, messages: [{ role:'system', content:system }, ...messages], stream:true,
      ...(json && provider === 'ollama' ? { format:'json' } : {}),
      ...(json && provider !== 'ollama' ? { response_format:{ type:'json_object' } } : {}),
    });

    if (provider === 'ollama') {
      if (!url) throw new Error('No Ollama URL configured.');
      const res = await fetch(`${url}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: body(model) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(()=> '')) || res.statusText}`);
      return await readStream(res, 'ollama', emit);
    }
    if (!apikey) throw new Error('No API key configured.');
    const baseUrl = provider === 'openai' ? 'https://api.openai.com' : 'https://api.groq.com/openai';
    let m = model || 'llama-3.1-8b-instant';
    if (hasVision && provider !== 'openai') m = 'llama-3.2-11b-vision-preview';
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${apikey}`}, body: body(m),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(()=> '')) || res.statusText}`);
    return await readStream(res, 'openai', emit);
  }

  async function readStream(res, kind, emit) {
    const reader = res.body.getReader(), dec = new TextDecoder();
    let full = '', buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream:true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        if (kind === 'ollama') {
          try { const d = JSON.parse(t); if (d.message && d.message.content) { full += d.message.content; emit(full); } if (d.done) return full; } catch (e) {}
        } else {
          if (!t.startsWith('data:')) continue;
          const raw = t.slice(5).trim();
          if (raw === '[DONE]') return full;
          try { const d = JSON.parse(raw); const tok = d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content; if (tok) { full += tok; emit(full); } } catch (e) {}
        }
      }
    }
    return full;
  }

  // ── PERSISTENT MEMORY ───────────────────────────────────────────────────
  // Long-term "brain" that grows over time. Facts are deduped, capped, and the
  // most relevant ones get injected into the prompt (recency + keyword match).
  const MEMORY_CAP = 200;

  function _norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }

  // merge new facts into the brain (newest first), skipping duplicates/near-dupes
  function mergeFacts(brain, newFacts) {
    brain = (brain || []).slice();
    const added = [];
    for (const f of (newFacts || [])) {
      const fact = String(f && f.fact || '').trim();
      if (!fact) continue;
      const key = _norm(fact);
      if (!key) continue;
      if (brain.some(b => { const k = _norm(b.fact); return k === key || k.includes(key) || key.includes(k); })) continue;
      brain.unshift({ category: String(f.category || 'fact').toLowerCase(), fact, date: new Date().toISOString(), auto: !!f.auto });
      added.push(fact);
    }
    if (brain.length > MEMORY_CAP) brain.length = MEMORY_CAP;
    return { brain, added };
  }

  // pick the n most relevant facts for the current query (keyword score + recency)
  function relevantFacts(brain, query, n) {
    brain = brain || []; n = n || 40;
    if (brain.length <= n) return brain;
    const words = String(query || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const scored = brain.map((b, i) => {
      const text = (b.fact + ' ' + b.category).toLowerCase();
      let score = Math.max(0, 1 - i / brain.length);            // recency
      for (const w of words) if (text.includes(w)) score += 2;  // relevance
      return { b, i, score };
    });
    scored.sort((a, z) => z.score - a.score);
    return scored.slice(0, n).sort((a, z) => a.i - z.i).map(x => x.b);  // keep original order
  }

  // ask the model to pull durable facts out of the latest exchange (auto-memory)
  async function extractFacts(opts) {
    const sys = 'You extract DURABLE long-term facts about the user or their business from a chat exchange — name, niche, income, goals, product ideas, decisions, stable preferences. Ignore one-off questions and small talk. Return JSON only: {"facts":[{"category":"","fact":""}]} with 0-3 items. category is one of: profile, niche, product, income, goal, preference, fact. Each fact = one short standalone sentence. Nothing durable → {"facts":[]}.';
    const messages = [{ role:'user', content:`USER: ${opts.userText || ''}\n\nJARVIS: ${opts.assistantText || ''}\n\nExtract durable facts as JSON.` }];
    let text = '';
    try {
      text = await streamChat({ provider:opts.provider, apikey:opts.apikey, url:opts.url, model:opts.model, system:sys, messages, json:true, onToken:()=>{} });
      const m = text.match(/\{[\s\S]*\}/);
      const d = JSON.parse(m ? m[0] : text);
      return (d.facts || []).filter(f => f && f.fact).map(f => ({ category:f.category || 'fact', fact:String(f.fact).trim(), auto:true }));
    } catch (e) { return []; }
  }

  // ── REAL ACTIONS ────────────────────────────────────────────────────────
  // Things JARVIS can actually DO. Read-only Gumroad data + an approval-gated
  // Discord blast. (Gumroad has NO create-product API — listings stay manual.)

  // pull real sales + products from Gumroad (read-only)
  async function fetchGumroad(token) {
    if (!token) return { ok:false, error:'no gumroad token set' };
    try {
      const r = await fetch(`https://api.gumroad.com/v2/sales?access_token=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (!d.success) return { ok:false, error:`gumroad rejected the token (HTTP ${r.status})` };
      const sales = d.sales || [];
      let revenue = 0;
      for (const s of sales) revenue += (Number(s.price) || 0) / 100;   // price is in cents
      let products = [];
      try {
        const pr = await fetch(`https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(token)}`);
        const pd = await pr.json().catch(() => ({}));
        if (pd.success) products = (pd.products || []).map(p => ({ name:p.name, price:(Number(p.price)||0)/100, sales:p.sales_count||0, published:!!p.published }));
      } catch (e) {}
      return { ok:true, salesCount:sales.length, revenue, products };
    } catch (e) { return { ok:false, error:e.message }; }
  }

  // pull real channel stats from YouTube Data API v3 (read-only)
  async function fetchYouTube(apiKey, channelId) {
    if (!apiKey || !channelId) return { ok:false, error:'need a YouTube API key + channel ID' };
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`);
      const d = await r.json().catch(() => ({}));
      if (d.error) return { ok:false, error: (d.error.message || ('HTTP ' + r.status)) };
      const it = (d.items || [])[0];
      if (!it) return { ok:false, error:'no channel found — check the Channel ID (must start with UC)' };
      const s = it.statistics || {};
      return { ok:true, title:(it.snippet || {}).title || '', subs:+s.subscriberCount || 0, views:+s.viewCount || 0, videos:+s.videoCount || 0 };
    } catch (e) { return { ok:false, error:e.message }; }
  }

  // search YouTube for embeddable clips on a topic (for the learning feed)
  async function fetchYouTubeSearch(apiKey, query, n) {
    if (!apiKey || !query) return [];
    try {
      const r = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=' + (n || 6) + '&q=' + encodeURIComponent(query) + '&key=' + encodeURIComponent(apiKey));
      const d = await r.json().catch(() => ({}));
      if (d.error) return [];
      return (d.items || []).filter(it => it.id && it.id.videoId).map(it => ({ id: it.id.videoId, title: (it.snippet || {}).title || '', channel: (it.snippet || {}).channelTitle || '' }));
    } catch (e) { return []; }
  }

  // post a message to a Discord channel via webhook (the actual "blast")
  async function sendDiscord(webhook, content) {
    if (!webhook) return { ok:false, error:'no discord webhook set' };
    if (!content || !content.trim()) return { ok:false, error:'nothing to send' };
    try {
      const r = await fetch(webhook, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ content: content.slice(0, 1900) }) });
      return { ok: r.status >= 200 && r.status < 300, status:r.status };
    } catch (e) { return { ok:false, error:e.message }; }
  }

  // distill a reusable "voice" descriptor from the user's own writing (the
  // practical alternative to fine-tuning — JARVIS learns to sound like them)
  async function learnStyle(opts) {
    const sys = 'Analyze the writing sample(s) and produce a SHORT style guide (2-4 sentences) describing this person\'s voice: tone, sentence length, vocabulary, punctuation/emoji quirks, energy. Write it as direct instructions an AI can follow to imitate them. Plain text only, no preamble, no quotes.';
    try {
      const text = await streamChat({ provider:opts.provider, apikey:opts.apikey, url:opts.url, model:opts.model, system:sys, messages:[{ role:'user', content:'Writing sample(s):\n\n' + (opts.samples || '') }], onToken:()=>{} });
      return String(text).trim();
    } catch (e) { return ''; }
  }

  return { MODES, modeKey, buildSystemPrompt, streamChat, MEMORY_CAP, mergeFacts, relevantFacts, extractFacts, fetchGumroad, fetchYouTube, fetchYouTubeSearch, sendDiscord, learnStyle };
});
