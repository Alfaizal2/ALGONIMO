/* ALGONIMO — VS Code–Level Compiler
 * Features:
 * - Monaco Editor (VS Code)
 * - File explorer + tabs (multi-file)
 * - Language per file (C, C++, Java, Python, JavaScript, C#, Go, PHP, Ruby, Rust, TypeScript, Swift, Kotlin)
 * - Judge0 run (RapidAPI) with your API key
 * - Stdin / stdout / stderr
 * - Monaco markers for basic error mapping
 * - Theme toggle (VS Dark / VS Light)
 * - Autosave to localStorage
 * - Shortcuts: Ctrl/Cmd+Enter run, Ctrl/Cmd+S save
 * - Debug Mode: toggle, step, highlight, breakpoints, debug info panel
 */

const RAPID_KEY = "4698c70672msh9c88aeae0cdcf4cp12c0e0jsnb157d5b16485"; // your key (as provided)
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

/* ---------- Judge0 language map ---------- */
const languageMap = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
  csharp: 51,
  go: 60,
  php: 68,
  ruby: 72,
  rust: 73,
  typescript: 74,
  swift: 83,
  kotlin: 78,
};

/* ---------- Default files/templates ---------- */
const defaultTemplates = {
  c: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int a, b;
    if (cin >> a >> b){
        cout << (a + b) << "\\n";
    }
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt(), b = sc.nextInt();
        System.out.println(a + b);
    }
}
`,
  python: `a, b = map(int, input().split())
print(a + b)
`,
  javascript: `const fs = require('fs');

const data = fs.readFileSync(0, 'utf8').trim();
if (data) {
  const [a,b] = data.split(/\\s+/).map(Number);
  console.log(a + b);
} else {
  console.log("No input");
}
`,
  csharp: `using System;

public class Program {
    public static void Main() {
        var parts = (Console.ReadLine() ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        int a = int.Parse(parts[0]), b = int.Parse(parts[1]);
        Console.WriteLine(a + b);
    }
}
`,
  go: `package main
import (
  "bufio"
  "fmt"
  "os"
)

func main(){
  in := bufio.NewReader(os.Stdin)
  var a, b int
  fmt.Fscan(in, &a, &b)
  fmt.Println(a + b)
}
`,
  php: `<?php
list($a, $b) = array_map('intval', explode(' ', trim(fgets(STDIN))));
echo ($a + $b) . PHP_EOL;
`,
  ruby: `a,b = STDIN.read.split.map(&:to_i)
puts a + b
`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut s = String::new();
    io::stdin().read_to_string(&mut s).unwrap();
    let nums: Vec<i64> = s.split_whitespace().filter_map(|x| x.parse().ok()).collect();
    if nums.len() >= 2 {
        println!("{}", nums[0] + nums[1]);
    }
}
`,
  typescript: `import * as fs from 'fs';
const data = fs.readFileSync(0, 'utf8').trim();
if (data) {
  const [a,b] = data.split(/\\s+/).map(Number);
  console.log(a + b);
} else {
  console.log("No input");
}
`,
  swift: `import Foundation
if let line = readLine() {
  let parts = line.split(separator: " ").map { Int($0)! }
  print(parts[0] + parts[1])
}
`,
  kotlin: `import java.util.StringTokenizer

fun main() {
    val st = StringTokenizer(readLine()!!)
    val a = st.nextToken().toInt()
    val b = st.nextToken().toInt()
    println(a + b)
}
`,
};

/* ---------- Project model (localStorage) ---------- */
const STORAGE_KEY = "algonimo_vscode_compiler_project";

/* ---------- DOM ---------- */
const runBtn = document.getElementById("runBtn");
const stopBtn = document.getElementById("stopBtn");
const themeBtn = document.getElementById("themeBtn");
const newFileBtn = document.getElementById("newFileBtn");
const renameFileBtn = document.getElementById("renameFileBtn");
const deleteFileBtn = document.getElementById("deleteFileBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const fileList = document.getElementById("fileList");
const tabsEl = document.getElementById("tabs");
const stdout = document.getElementById("stdout");
const stderr = document.getElementById("stderr");
const stdin = document.getElementById("stdin");
const languageSelect = document.getElementById("languageSelect");

/* Debugging DOM */
const debugToggleBtn = document.getElementById("debugToggleBtn");
const debugStepBtn = document.getElementById("debugStepBtn");
const debugStopBtn = document.getElementById("debugStopBtn");
const debugPanel = document.getElementById("debugPanel");
const debugInfo = document.getElementById("debugInfo");

let monacoInstance = null;
let editor = null;

let project = loadProject() || createDefaultProject();
let activeFileId = project.files[0].id;
let isRunning = false;

/* Debug state */
let debugActive = false;
let debugSteps = [];
let debugIndex = 0;
let breakpoints = new Set();
let debugDecorations = [];
let breakpointDecorations = [];

/* ---------- Initialize Monaco and UI ---------- */
init();

function init(){
  populateLanguageSelect();
  renderExplorer();
  renderTabs();

  // Load Monaco
  require(["vs/editor/editor.main"], () => {
    monacoInstance = monaco;

    // Theme
    const isLight = !!project.lightTheme;
    document.body.classList.toggle("light", isLight);
    monacoInstance.editor.setTheme(isLight ? "vs" : "vs-dark");

    // Create models for each file
    project.files.forEach(f => {
      if (!f._model){
        f._model = monacoInstance.editor.createModel(
          f.content,
          languageToMonaco(f.language),
          monaco.Uri.parse(`inmemory:///${f.name}`)
        );
      }
    });

    editor = monacoInstance.editor.create(document.getElementById("editor"), {
      model: getActiveFile()._model,
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      smoothScrolling: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      glyphMargin: true, // needed for breakpoints
    });

    // Save content on change (debounced)
    let saveTimer = null;
    editor.onDidChangeModelContent(() => {
      const f = getActiveFile();
      f.content = f._model.getValue();
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(persistProject, 400);
      clearMarkers();
    });

    // Gutter click → toggle breakpoints
    editor.onMouseDown((e) => {
      if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position.lineNumber;
        toggleBreakpoint(line);
      }
    });

    // Changing active tab updates editor model
    setActiveFile(activeFileId, { refreshEditor: true });

    // Keyboard shortcuts
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => run());
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      persistProject();
      flashStdout("💾 Project saved.");
    });
  });

  // UI handlers
  runBtn.addEventListener("click", run);
  stopBtn.addEventListener("click", stop);
  themeBtn.addEventListener("click", toggleTheme);
  newFileBtn.addEventListener("click", newFile);
  renameFileBtn.addEventListener("click", renameFile);
  deleteFileBtn.addEventListener("click", deleteFile);
  saveBtn.addEventListener("click", () => { persistProject(); flashStdout("💾 Project saved."); });
  downloadBtn.addEventListener("click", downloadProjectZip);
  languageSelect.addEventListener("change", changeActiveLanguage);
  stdin.addEventListener("input", () => persistProject());

  // Debug UI
  if (debugToggleBtn) debugToggleBtn.addEventListener("click", toggleDebugMode);
  if (debugStepBtn) debugStepBtn.addEventListener("click", stepDebug);
  if (debugStopBtn) debugStopBtn.addEventListener("click", stopDebugging);
}

/* ---------- Monaco language mapping ---------- */
function languageToMonaco(lang){
  switch(lang){
    case "c": return "c";
    case "cpp": return "cpp";
    case "java": return "java";
    case "python": return "python";
    case "javascript": return "javascript";
    case "csharp": return "csharp";
    case "go": return "go";
    case "php": return "php";
    case "ruby": return "ruby";        // if not present, Monaco will still accept the id; fallback ok
    case "rust": return "rust";        // same note
    case "typescript": return "typescript";
    case "swift": return "swift";      // may show as plaintext if not available
    case "kotlin": return "kotlin";    // may show as plaintext if not available
    default: return "plaintext";
  }
}

/* ---------- Populate Language Dropdown ---------- */
function populateLanguageSelect(){
  const langs = ["c","cpp","java","python","javascript","csharp","go","php","ruby","rust","typescript","swift","kotlin"];
  languageSelect.innerHTML = langs.map(l => `<option value="${l}">${prettyLang(l)}</option>`).join("");
}

function prettyLang(l){
  return {
    c:"C", cpp:"C++", java:"Java", python:"Python", javascript:"JavaScript",
    csharp:"C#", go:"Go", php:"PHP", ruby:"Ruby", rust:"Rust", typescript:"TypeScript", swift:"Swift", kotlin:"Kotlin"
  }[l] || l;
}

/* ---------- Project Model ---------- */
function createDefaultProject(){
  const files = [
    { id: uid(), name: "main.c", language: "c", content: defaultTemplates.c },
    { id: uid(), name: "main.cpp", language: "cpp", content: defaultTemplates.cpp },
    { id: uid(), name: "Main.java", language: "java", content: defaultTemplates.java },
    { id: uid(), name: "main.py", language: "python", content: defaultTemplates.python },
    { id: uid(), name: "main.js", language: "javascript", content: defaultTemplates.javascript },
    { id: uid(), name: "Program.cs", language: "csharp", content: defaultTemplates.csharp },
    { id: uid(), name: "main.go", language: "go", content: defaultTemplates.go },
    { id: uid(), name: "index.php", language: "php", content: defaultTemplates.php },
    { id: uid(), name: "main.rb", language: "ruby", content: defaultTemplates.ruby },
    { id: uid(), name: "main.rs", language: "rust", content: defaultTemplates.rust },
    { id: uid(), name: "main.ts", language: "typescript", content: defaultTemplates.typescript },
    { id: uid(), name: "main.swift", language: "swift", content: defaultTemplates.swift },
    { id: uid(), name: "Main.kt", language: "kotlin", content: defaultTemplates.kotlin },
  ];
  return {
    files,
    stdin: "3 5",
    lightTheme: false,
  };
}

function loadProject(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function persistProject(){
  try{
    const data = {
      files: project.files.map(f => ({ id: f.id, name: f.name, language: f.language, content: f.content })),
      stdin: stdin.value,
      lightTheme: project.lightTheme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }catch(e){}
}

function getActiveFile(){
  return project.files.find(f => f.id === activeFileId);
}

function setActiveFile(id, { refreshEditor=false } = {}){
  activeFileId = id;
  renderExplorer();
  renderTabs();

  const f = getActiveFile();
  if (!f) return;

  // Update language dropdown
  languageSelect.value = f.language;

  if (monacoInstance && editor) {
    if (!f._model){
      f._model = monacoInstance.editor.createModel(
        f.content,
        languageToMonaco(f.language),
        monaco.Uri.parse(`inmemory:///${f.name}`)
      );
    }
    editor.setModel(f._model);
    editor.focus();
    refreshBreakpointDecorations(); // ensure breakpoints show on file switch
  }
}

/* ---------- UI Rendering ---------- */
function renderExplorer(){
  fileList.innerHTML = "";
  project.files.forEach(f => {
    const li = document.createElement("li");
    li.className = f.id === activeFileId ? "active" : "";
    li.innerHTML = `
      <span class="dot" style="color:${badgeColor(f.language)}">●</span>
      <span class="fname">${f.name}</span>
      <span class="badge">${prettyLang(f.language)}</span>
    `;
    li.addEventListener("click", ()=> setActiveFile(f.id, { refreshEditor:true }));
    fileList.appendChild(li);
  });
}

function renderTabs(){
  tabsEl.innerHTML = "";
  project.files.forEach(f => {
    const tab = document.createElement("div");
    tab.className = "tab" + (f.id === activeFileId ? " active" : "");
    tab.innerHTML = `
      <span>${f.name}</span>
      <span class="close" title="Close">✕</span>
    `;
    tab.addEventListener("click", (e)=>{
      if (e.target.classList.contains("close")){
        if (project.files.length === 1){ flashStderr("You must have at least one file."); return; }
        closeFile(f.id);
      } else {
        setActiveFile(f.id, { refreshEditor:true });
      }
    });
    tabsEl.appendChild(tab);
  });
}

function badgeColor(lang){
  return {
    c:"#26ffe6", cpp:"#9d87ff", java:"#ff7f50", python:"#ffd166", javascript:"#b8ff86",
    csharp:"#86e0ff", go:"#00add8", php:"#8892BF", ruby:"#ff5f5f", rust:"#dea584", typescript:"#2f9cff", swift:"#f05138", kotlin:"#7f52ff"
  }[lang] || "#ccc";
}

function closeFile(id){
  const idx = project.files.findIndex(f => f.id === id);
  if (idx === -1) return;
  const isActive = (id === activeFileId);
  project.files.splice(idx,1);
  if (isActive){
    const next = project.files[Math.max(0, idx-1)];
    setActiveFile(next.id, { refreshEditor:true });
  } else {
    renderExplorer(); renderTabs();
  }
  persistProject();
}

/* ---------- File Ops ---------- */
function newFile(){
  const name = prompt("New file name (e.g., main.py):", "untitled.py");
  if (!name) return;
  const lang = guessLangFromName(name) || "python";
  const file = { id: uid(), name, language: lang, content: defaultTemplates[lang] || "" };
  project.files.push(file);
  persistProject();
  setActiveFile(file.id, { refreshEditor:true });
}
function renameFile(){
  const f = getActiveFile(); if (!f) return;
  const name = prompt("Rename file to:", f.name);
  if (!name || name === f.name) return;
  f.name = name;
  const newLang = guessLangFromName(name) || f.language;
  if (newLang !== f.language){
    f.language = newLang;
    if (f._model) monacoInstance.editor.setModelLanguage(f._model, languageToMonaco(newLang));
  }
  persistProject();
  renderExplorer(); renderTabs();
}
function deleteFile(){
  if (project.files.length === 1){ flashStderr("You must keep at least one file."); return; }
  const f = getActiveFile();
  if (!confirm(`Delete "${f.name}"?`)) return;
  closeFile(f.id);
  persistProject();
}
function changeActiveLanguage(){
  const f = getActiveFile(); if (!f) return;
  const lang = languageSelect.value;
  f.language = lang;
  if (f._model) monacoInstance.editor.setModelLanguage(f._model, languageToMonaco(lang));
  renderExplorer(); renderTabs();
  persistProject();
}

function guessLangFromName(name){
  const ext = name.split(".").pop().toLowerCase();
  return {
    c:"c", h:"c",
    cpp:"cpp", cc:"cpp", cxx:"cpp", hpp:"cpp",
    java:"java",
    py:"python",
    js:"javascript", mjs:"javascript", cjs:"javascript",
    cs:"csharp",
    go:"go",
    php:"php",
    rb:"ruby",
    rs:"rust",
    ts:"typescript",
    swift:"swift",
    kt:"kotlin", kts:"kotlin"
  }[ext];
}

/* ---------- Run / Stop ---------- */
async function run(){
  if (isRunning) return;
  const file = getActiveFile(); if (!file) return;

  const langId = languageMap[file.language];
  if (!langId){ flashStderr(`Unsupported language: ${file.language}`); return; }

  // Prepare code and (for Java/Kotlin) ensure entry class if needed
  let source = file.content;
  if (file.language === "java"){
    source = source.replace(/public\s+class\s+([A-Za-z_]\w*)/, "public class Main");
  }
  if (file.language === "kotlin"){
    // Judge0 runs `kotlinc Main.kt` for single file; keep class with main or top-level main
    // We'll leave as-is (template works).
  }

  // Persist stdin
  project.stdin = stdin.value;
  persistProject();

  stdout.textContent = "⏳ Running...\n";
  stderr.textContent = "";
  isRunning = true;
  runBtn.disabled = true;
  stopBtn.disabled = true; // sync run; no cancel API

  try{
    const res = await fetch(JUDGE0_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: source,
        language_id: langId,
        stdin: stdin.value || "",
      })
    });
    const result = await res.json();
    handleJudge0Result(result, file.language);
  }catch(e){
    flashStderr("Request failed: " + e.message);
  }finally{
    isRunning = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function stop(){
  // Judge0 call is synchronous; stop is UX-only
  isRunning = false;
  runBtn.disabled = false;
  stopBtn.disabled = true;
  flashStderr("Stop requested (local).");
}

function handleJudge0Result(result, language){
  clearMarkers();

  const out = (result.stdout || "").trimEnd();
  const err = (result.stderr || result.compile_output || "").trimEnd();

  if (out) stdout.textContent = out;
  else if (!err) stdout.textContent = "✅ Finished with no output.";

  if (err){
    stderr.textContent = err;
    tryPlaceMarkers(err, language);
  } else {
    stderr.textContent = "";
  }
}

/* ---------- Markers (inline error underlines) ---------- */
function tryPlaceMarkers(rawErr, language){
  const f = getActiveFile();
  if (!f || !f._model) return;

  const markers = [];
  const patterns = [
    /:(\d+):(\d+):/g,          // file:line:col:
    /line\s+(\d+)/gi,          // "line X"
    /on\s+line\s+(\d+)/gi,
    /\((\d+),\s*(\d+)\)/g,     // (line, col)
  ];

  let matched = false;
  for (const p of patterns){
    let m;
    while ((m = p.exec(rawErr)) !== null){
      matched = true;
      const line = parseInt(m[1],10) || 1;
      const col = parseInt(m[2] || "1",10) || 1;

      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: shortenError(rawErr),
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: col+1,
      });
    }
  }

  if (!matched){
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: shortenError(rawErr),
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    });
  }

  monaco.editor.setModelMarkers(f._model, "algonimo", markers);
}

function clearMarkers(){
  const f = getActiveFile();
  if (f && f._model && window.monaco){
    monaco.editor.setModelMarkers(f._model, "algonimo", []);
  }
}

function shortenError(err){
  const lines = err.split("\n").slice(0,5);
  return lines.join("\n") + (err.split("\n").length > 5 ? "\n..." : "");
}

/* ---------- Theme ---------- */
function toggleTheme(){
  project.lightTheme = !project.lightTheme;
  document.body.classList.toggle("light", project.lightTheme);
  if (monacoInstance){
    monacoInstance.editor.setTheme(project.lightTheme ? "vs" : "vs-dark");
  }
  persistProject();
}

/* ---------- Files: Download ZIP ---------- */
async function downloadProjectZip(){
  const files = project.files.map(f => ({ name: f.name, content: f.content }));
  const blob = await makeZip(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "algonimo-project.zip";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

/* Minimal ZIP builder (no compression) */
async function makeZip(files){
  const encoder = new TextEncoder();
  let fileRecords = [];
  let centralRecords = [];
  let offset = 0;

  function crc32(str){
    let c = 0xffffffff;
    for (let i=0;i<str.length;i++){
      c ^= str.charCodeAt(i);
      for (let j=0;j<8;j++){
        const mask = -(c & 1);
        c = (c >>> 1) ^ (0xEDB88320 & mask);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  for (const f of files){
    const data = encoder.encode(f.content);
    const filename = encoder.encode(f.name);
    const crc = crc32(f.content);

    const localHeader = new Uint8Array(30 + filename.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, filename.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(filename, 30);

    fileRecords.push(localHeader, data);

    const central = new Uint8Array(46 + filename.length);
    const cview = new DataView(central.buffer);
    cview.setUint32(0, 0x02014b50, true);
    cview.setUint16(4, 20, true);
    cview.setUint16(6, 20, true);
    cview.setUint16(8, 0, true);
    cview.setUint16(10, 0, true);
    cview.setUint16(12, 0, true);
    cview.setUint16(14, 0, true);
    cview.setUint32(16, crc, true);
    cview.setUint32(20, data.length, true);
    cview.setUint32(24, data.length, true);
    cview.setUint16(28, filename.length, true);
    cview.setUint16(30, 0, true);
    cview.setUint16(32, 0, true);
    cview.setUint16(34, 0, true);
    cview.setUint16(36, 0, true);
    cview.setUint32(38, offset, true);
    central.set(filename, 46);
    centralRecords.push(central);

    offset += localHeader.length + data.length;
  }

  const centralSize = centralRecords.reduce((s, b)=>s+b.length, 0);
  const centralOffset = offset;

  const end = new Uint8Array(22);
  const eview = new DataView(end.buffer);
  eview.setUint32(0, 0x06054b50, true);
  eview.setUint16(4, 0, true);
  eview.setUint16(6, 0, true);
  eview.setUint16(8, files.length, true);
  eview.setUint16(10, files.length, true);
  eview.setUint32(12, centralSize, true);
  eview.setUint32(16, centralOffset, true);
  eview.setUint16(20, 0, true);

  const size = offset + centralSize + end.length;
  const out = new Uint8Array(size);
  let p = 0;
  for (const r of fileRecords){ out.set(r, p); p += r.length; }
  for (const r of centralRecords){ out.set(r, p); p += r.length; }
  out.set(end, p);
  return new Blob([out], { type: "application/zip" });
}

/* ---------- Helpers ---------- */
function uid(){
  return Math.random().toString(36).slice(2);
}

function flashStdout(msg){
  stdout.textContent = msg;
}
function flashStderr(msg){
  stderr.textContent = msg;
}

/* ---------- Init stdin from project ---------- */
stdin.value = project.stdin || "";

/* ============================
   DEBUG MODE (Integrated)
============================ */
function toggleDebugMode(){
  debugActive = !debugActive;

  if (debugActive) {
    if (debugToggleBtn) debugToggleBtn.classList.add("active");
    if (debugPanel) debugPanel.style.display = "block";
    if (debugStepBtn) debugStepBtn.disabled = false;
    if (debugStopBtn) debugStopBtn.disabled = false;
    buildDebugSteps();
    writeDebug("Debug Ready…");
  } else {
    stopDebugging();
  }
}

function buildDebugSteps(){
  const code = (editor ? editor.getValue() : "").split("\n");
  debugSteps = code.map((line, idx) => ({
    line: idx + 1,
    code: line,
    vars: extractVars(line),
  }));
  debugIndex = 0;
  refreshBreakpointDecorations();
}

function extractVars(line){
  const vars = {};
  if (line.includes("=") && !line.includes("==")) {
    const [l, r] = line.split("=");
    const name = (l || "").trim();
    const value = (r || "").trim();
    if (name) vars[name] = value || "undefined";
  }
  return vars;
}

function stepDebug(){
  if (!debugActive) return;
  if (debugIndex >= debugSteps.length){
    writeDebug("✅ Debugging Completed.");
    stopDebugging();
    return;
  }

  const step = debugSteps[debugIndex];

  // If breakpoint is set on this line, indicate it
  if (breakpoints.has(step.line)) {
    writeDebug(`⛔ Breakpoint hit at line ${step.line}\n` +
               `Code: ${step.code.trim()}\n` +
               `Vars: ${JSON.stringify(step.vars, null, 2)}`);
    // Stay on the same step until user clicks step again.
  } else {
    // Move forward and show info
    writeDebug(`➡ STEP ${debugIndex + 1}\nLine: ${step.line}\n` +
               `Code: ${step.code.trim()}\n` +
               `Vars: ${JSON.stringify(step.vars, null, 2)}`);
    debugIndex++;
  }

  highlightDebugLine(step.line);
}

function stopDebugging(){
  debugActive = false;
  if (debugToggleBtn) debugToggleBtn.classList.remove("active");
  if (debugStepBtn) debugStepBtn.disabled = true;
  if (debugStopBtn) debugStopBtn.disabled = true;
  if (debugPanel) debugPanel.style.display = "none";
  writeDebug("");
  clearDebugHighlight();
}

function writeDebug(text){
  if (debugInfo) debugInfo.textContent = text || "";
}

function highlightDebugLine(line){
  if (!editor || !monacoInstance) return;
  clearDebugHighlight();
  debugDecorations = editor.deltaDecorations(debugDecorations, [
    {
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: "debug-line" }
    }
  ]);
  editor.revealLineInCenter(line);
}

function clearDebugHighlight(){
  if (!editor) return;
  debugDecorations = editor.deltaDecorations(debugDecorations, []);
}

/* ---------- Breakpoints ---------- */
function toggleBreakpoint(line){
  if (breakpoints.has(line)) breakpoints.delete(line);
  else breakpoints.add(line);
  refreshBreakpointDecorations();
}

function refreshBreakpointDecorations(){
  if (!editor || !monacoInstance) return;

  // Remove all existing breakpoint decorations
  breakpointDecorations = editor.deltaDecorations(breakpointDecorations, []);

  if (breakpoints.size === 0) return;

  const decos = Array.from(breakpoints).map(line => ({
    range: new monaco.Range(line, 1, line, 1),
    options: {
      isWholeLine: false,
      glyphMarginClassName: "breakpoint", // styled via CSS
      glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` },
    }
  }));

  breakpointDecorations = editor.deltaDecorations(breakpointDecorations, decos);
}

/* ---------- End ---------- */
