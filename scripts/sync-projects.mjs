#!/usr/bin/env node
// Pulls recently-committed public repos from GitHub, picks the best README media
// (video > gif > screenshot), downloads it into public/projects/<repo>/ and writes
// src/content/projects.json. Hand edits to `title`, `blurb`, `tags`, `doodle`,
// `hidden` and `order` in projects.json survive re-syncs.
//
// usage: npm run sync:projects -- [--days 7] [--user duc-minh-droid] [--force]
// --force re-downloads media even when the file already exists (use it after
// updating a recording in a repo's README — same filename won't refresh otherwise).

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).join(" ").split("--").filter(Boolean).map((s) => s.trim().split(/\s+/)),
);
const USER = args.user ?? "duc-minh-droid";
const DAYS = Number(args.days ?? 7);
const FORCE = "force" in args;
const SINCE = new Date(Date.now() - DAYS * 864e5).toISOString();
const OUT_JSON = "src/content/projects.json";
const PRESERVE = ["title", "blurb", "tags", "doodle", "hidden", "order"];
// repos that aren't projects to show (this site itself)
const SKIP = new Set(["thomas-portfolio"]);
// repos to include even though the normal filter would drop them (forks)
const INCLUDE = new Set(["LeadGreen"]);

const gh = (path, raw = false) =>
  execFileSync("gh", ["api", path, ...(raw ? ["-H", "Accept: application/vnd.github.raw"] : [])], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
const ghJson = (path) => JSON.parse(gh(path));

const IMG_EXT = /\.(png|jpe?g|webp|gif)$/i;
const VID_EXT = /\.(mp4|webm|mov)$/i;

function readmeMedia(md) {
  const found = [];
  const push = (url, alt = "", img = false) => {
    url = url.trim().replace(/^<|>$/g, "").split(/\s/)[0];
    if (url && !found.some((f) => f.url === url)) found.push({ url, alt, img });
  };
  for (const m of md.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) push(m[2], m[1], true);
  for (const m of md.matchAll(/<img[^>]*?src=["']([^"']+)["'][^>]*>/gi)) {
    const alt = m[0].match(/alt="([^"]*)"|alt='([^']*)'/i);
    push(m[1], alt?.[1] ?? alt?.[2] ?? "", true);
  }
  for (const m of md.matchAll(/<(?:video|source)[^>]*?src=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of md.matchAll(/<a[^>]*?href=["']([^"']+\.(?:mp4|webm|mov))["']/gi)) push(m[1]);
  for (const m of md.matchAll(/\]\(([^)\s]+\.(?:mp4|webm|mov))\)/gi)) push(m[1]);
  for (const m of md.matchAll(/`([^`\s]+\.(?:mp4|webm|mov))`/gi)) push(m[1]);
  for (const m of md.matchAll(/https:\/\/github\.com\/user-attachments\/assets\/[a-z0-9-]+/gi)) {
    if (!found.some((f) => f.url === m[0])) push(m[0]);
  }
  return found.filter((f) => !/badge|shields\.io|logo|\.svg(\?|$)/i.test(f.url));
}

function firstParagraph(md) {
  const text = md
    .replace(/<[^>]+>/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .map((p) => p.replace(/\s+/g, " ").replace(/[*_`]/g, "").trim())
    .find((p) => p.split(" ").length >= 8 && !/^(#|!\[|\[!|```|\||>|-{3}|-\s|\d+\.|live demo|▶)/i.test(p));
  return text?.slice(0, 220) ?? "";
}

async function download(url, dest) {
  if (!FORCE && existsSync(dest) && statSync(dest).size > 0) return true;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return false;
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

const existing = existsSync(OUT_JSON) ? JSON.parse(readFileSync(OUT_JSON, "utf8")) : [];
const prev = Object.fromEntries(existing.map((p) => [p.repo, p]));

const repos = ghJson(`users/${USER}/repos?per_page=100&sort=pushed&type=owner`).filter(
  (r) => !r.private && !SKIP.has(r.name) && (!r.fork || INCLUDE.has(r.name)) && r.pushed_at >= SINCE,
);

const projects = [];
for (const r of repos) {
  const mine = ghJson(`repos/${USER}/${r.name}/commits?per_page=1&author=${USER}&since=${SINCE}`);
  if (!mine.length) continue;

  let md = "";
  try { md = gh(`repos/${USER}/${r.name}/readme`, true); } catch {}
  const langs = Object.keys(ghJson(`repos/${USER}/${r.name}/languages`))
    .filter((l) => !/^(CSS|HTML|SCSS|Batchfile|Shell|PowerShell|Makefile|CMake|Dockerfile)$/.test(l))
    .slice(0, 3);
  const base = `https://raw.githubusercontent.com/${USER}/${r.name}/${r.default_branch}/`;
  const abs = (u) => (/^https?:/.test(u) ? u : base + u.replace(/^\.?\//, ""));

  const media = readmeMedia(md);
  // user-attachments URLs can be images too (pasted as ![](url)) — only treat
  // non-image ones as possible videos
  const video = media.find((m) => VID_EXT.test(m.url)) ?? media.find((m) => /user-attachments/.test(m.url) && !m.img);
  const gif = media.find((m) => /\.gif$/i.test(m.url) && /demo|solve|play|viewer/i.test(m.url)) ??
    media.find((m) => /\.gif$/i.test(m.url));
  const stills = media.filter((m) => IMG_EXT.test(m.url) && !/\.gif$/i.test(m.url));
  const poster = stills.find((m) => /hero|home|demo|combat|screenshot|shot|map|form/i.test(m.url)) ?? stills[0];

  const dir = join("public", "projects", r.name);
  mkdirSync(dir, { recursive: true });
  const entry = { kind: "none" };
  const save = async (m, name) => {
    const ext = extname(new URL(abs(m.url)).pathname) || ".mp4";
    const file = `${name}${ext.toLowerCase()}`;
    return (await download(abs(m.url), join(dir, file))) ? `/projects/${r.name}/${file}` : null;
  };
  if (video && (entry.video = await save(video, "demo"))) entry.kind = "video";
  else if (gif && (entry.gif = await save(gif, "demo"))) entry.kind = "gif";
  if (poster) entry.poster = await save(poster, "poster");
  if (entry.kind === "none" && entry.poster) entry.kind = "image";
  entry.alt = (gif ?? poster ?? video)?.alt || `${r.name} demo`;

  const title = (md.match(/^#\s+(.+)$/m)?.[1] ?? md.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1])
    ?.replace(/<[^>]+>|[*_`]/g, "").trim();
  const p = prev[r.name] ?? {};
  const fresh = {
    repo: r.name,
    title: title && title.length < 40 ? title : r.name,
    blurb: r.description || firstParagraph(md),
    tags: [...new Set([...langs, ...(r.topics ?? [])])].slice(0, 5),
    created: r.created_at,
    pushed: r.pushed_at,
    url: r.html_url,
    live: r.homepage || null,
    media: entry,
  };
  for (const k of PRESERVE) if (p[k] !== undefined) fresh[k] = p[k];
  projects.push(fresh);
  console.log(`✓ ${r.name.padEnd(20)} ${entry.kind.padEnd(6)} ${basename(entry.video ?? entry.gif ?? entry.poster ?? "-")}`);
}

projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.created.localeCompare(a.created));
mkdirSync("src/content", { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(projects, null, 2) + "\n");
console.log(`\n${projects.length} projects → ${OUT_JSON}`);
