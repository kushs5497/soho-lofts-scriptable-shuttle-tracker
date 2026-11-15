// SoHo Lofts Shuttle — permanent Scriptable launcher.
// Install this script ONCE on the iPhone. Future app updates come from GitHub.
// icon-color: blue; icon-glyph: bus

// Change only this word to switch between production and experiment.
const BRANCH = "main"; // "main" or "SignalR"
const DEVELOPER_MODE = false; // true enables diagnostics and expanded map credits
if (!["main", "SignalR"].includes(BRANCH)) throw Error("Unsupported GitHub branch");
const REPO = "https://raw.githubusercontent.com/kushs5497/soho-lofts-scriptable-shuttle-tracker/" + BRANCH + "/";
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), "SoHoShuttleRuntime-" + BRANCH);
if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
const currentPath = fm.joinPath(dir, "core.js");
const previousPath = fm.joinPath(dir, "previous.js");
const candidatePath = fm.joinPath(dir, "candidate.js");
const statePath = fm.joinPath(dir, "update-state.json");

function readState() {
  try {
    if (!fm.fileExists(statePath)) return {};
    const saved = JSON.parse(fm.readString(statePath));
    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch (_) {
    return {};
  }
}
function saveState(data) { fm.writeString(statePath, JSON.stringify(data)); }
async function fetchText(path) {
  const separator = path.includes("?") ? "&" : "?";
  const req = new Request(REPO + path + separator + "_cacheBust=" + Date.now());
  req.timeoutInterval = config.runsInWidget ? 6 : 15;
  req.headers = { "Cache-Control": "no-cache" };
  const body = await req.loadString();
  if (req.response && req.response.statusCode >= 400) {
    throw new Error("GitHub HTTP " + req.response.statusCode);
  }
  return body;
}
async function runModule(path) {
  const app = importModule(path);
  if (!app || typeof app.main !== "function") {
    throw new Error("Downloaded module does not export main()");
  }
  await app.main({ tapURL: URLScheme.forRunningScript(), branch: BRANCH, version: state.version, developerMode: DEVELOPER_MODE });
}
async function showFailure(message) {
  if (config.runsInWidget) {
    const w = new ListWidget();
    w.addText("SoHo Shuttle");
    const t = w.addText(message);
    t.font = Font.systemFont(11);
    w.url = URLScheme.forRunningScript();
    Script.setWidget(w);
  } else {
    const a = new Alert();
    a.title = "SoHo Shuttle update";
    a.message = message;
    a.addAction("OK");
    await a.presentAlert();
  }
  Script.complete();
}
const state = readState();
const hasCurrent = fm.fileExists(currentPath);
const shouldCheck = !hasCurrent ||
  !state.checkedAt ||
  (Date.now() - state.checkedAt >= CHECK_INTERVAL_MS) ||
  !config.runsInWidget;
let newVersion = null;
let updateError = null;

if (shouldCheck) {
  try {
    const manifest = JSON.parse(await fetchText("version.json"));
    if (!manifest || !/^[0-9]+[.][0-9]+[.][0-9]+$/.test(manifest.version) ||
        manifest.entrypoint !== "core.js") {
      throw new Error("Unexpected version manifest");
    }
    if (!hasCurrent || state.version !== manifest.version) {
      const source = await fetchText("core.js?v=" + encodeURIComponent(manifest.version));
      if (!source.includes("module.exports.main")) {
        throw new Error("Missing main() export in downloaded code");
      }
      fm.writeString(candidatePath, source);
      newVersion = manifest.version;
    }
    state.checkedAt = Date.now();
  } catch (err) {
    updateError = String(err);
    state.checkedAt = Date.now();
  }
}

if (newVersion !== null) {
  // Install the selected branch's code BEFORE launching its long-lived map.
  // Otherwise web.present() blocks and version/cache never update until dismissal.
  const priorState = { ...state };
  try {
    if (fm.fileExists(currentPath)) {
      fm.writeString(previousPath, fm.readString(currentPath));
    }
    fm.writeString(currentPath, fm.readString(candidatePath));
    fm.remove(candidatePath);
    state.version = newVersion;
    saveState(state);
    await runModule(currentPath);
  } catch (err) {
    console.warn("New shuttle version failed: " + err);
    try { if (fm.fileExists(candidatePath)) fm.remove(candidatePath); } catch (_) {}
    // Roll back only when the newly installed version throws.
    if (fm.fileExists(previousPath)) {
      fm.writeString(currentPath, fm.readString(previousPath));
      state.version = priorState.version || null;
      state.checkedAt = Date.now() - CHECK_INTERVAL_MS + 60000;
      saveState(state);
      try { await runModule(currentPath); }
      catch (oldErr) { await showFailure("Both new and cached versions failed: " + oldErr); }
    } else {
      state.version = null;
      state.checkedAt = Date.now() - CHECK_INTERVAL_MS + 60000;
      saveState(state);
      await showFailure("Initial install failed: " + err);
    }
  }
} else if (hasCurrent) {
  saveState(state);
  try {
    await runModule(currentPath);
  } catch (err) {
    console.warn("Cached shuttle version failed: " + err);
    if (fm.fileExists(previousPath)) {
      try { await runModule(previousPath); }
      catch (oldErr) { await showFailure("Cached and backup versions failed: " + oldErr); }
    } else {
      await showFailure("Shuttle script failed: " + err);
    }
  }
} else {
  await showFailure("Could not download first version from GitHub. Connect to the internet and run again." +
    (updateError ? "\n" + updateError : ""));
}
