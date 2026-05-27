import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const md = readFileSync(path.join(root, "DOCUMENTATION.md"), "utf8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MedLicense Documentation</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1a1a2e;
    padding: 40px 56px;
    max-width: 900px;
    margin: 0 auto;
  }
  h1 { font-size: 28px; font-weight: 800; color: #1e40af; margin: 32px 0 8px; padding-bottom: 8px; border-bottom: 3px solid #3b82f6; }
  h2 { font-size: 20px; font-weight: 700; color: #1e3a8a; margin: 28px 0 6px; padding-bottom: 4px; border-bottom: 1.5px solid #bfdbfe; }
  h3 { font-size: 15px; font-weight: 700; color: #1e40af; margin: 18px 0 4px; }
  h4 { font-size: 13px; font-weight: 700; color: #374151; margin: 12px 0 4px; }
  p  { margin: 6px 0 10px; }
  a  { color: #2563eb; }
  ul, ol { margin: 6px 0 10px 22px; }
  li { margin: 3px 0; }
  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 11.5px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 1px 5px;
    color: #0f172a;
  }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    overflow-x: auto;
    margin: 10px 0 14px;
    font-size: 11px;
    line-height: 1.55;
  }
  pre code {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 12px;
  }
  th {
    background: #1e40af;
    color: #fff;
    font-weight: 600;
    padding: 8px 12px;
    text-align: left;
  }
  td { border: 1px solid #e2e8f0; padding: 7px 12px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  blockquote {
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
    padding: 8px 14px;
    margin: 10px 0;
    border-radius: 0 6px 6px 0;
    color: #1e40af;
  }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  strong { font-weight: 700; color: #111827; }
  .cover {
    text-align: center;
    padding: 60px 0 48px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 38px;
    border: none;
    color: #1e40af;
    margin-bottom: 12px;
  }
  .cover .subtitle { font-size: 16px; color: #6b7280; margin-top: 6px; }
  .cover .date { font-size: 13px; color: #9ca3af; margin-top: 24px; }
  @media print {
    body { padding: 20px 36px; }
    h1 { page-break-before: auto; }
    pre, table, blockquote { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="cover">
  <h1>MedLicense</h1>
  <div class="subtitle">Technical Documentation</div>
  <div class="date">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
</div>
${body}
</body>
</html>`;

const htmlPath = path.join(root, "DOCUMENTATION.html");
writeFileSync(htmlPath, html);
console.log("HTML written:", htmlPath);

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  headless: true,
});

const page = await browser.newPage();
await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });

const pdfPath = path.join(root, "DOCUMENTATION.pdf");
await page.pdf({
  path: pdfPath,
  format: "A4",
  margin: { top: "24mm", right: "18mm", bottom: "24mm", left: "18mm" },
  printBackground: true,
});

await browser.close();
console.log("PDF written:", pdfPath);
