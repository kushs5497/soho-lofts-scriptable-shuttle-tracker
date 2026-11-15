# SoHo Lofts Shuttle — Scriptable

iPhone Lock Screen widget and live shuttle GPS map with MapLibre, OpenFreeMap Positron and Verizon Connect Reveal.

## One-time installation
1. In Scriptable create a script named **SoHo Shuttle**.
2. Copy the contents of [SoHo_Shuttle_Launcher.js](./SoHo_Shuttle_Launcher.js) into it.
3. Run the script once while online; it downloads `core.js` and opens the map.
4. Set your Lock Screen rectangular widget to use the **SoHo Shuttle** script.
5. Keep the launcher. Future changes come from this GitHub repository.

## Updating
The launcher checks GitHub when you open the map and approximately every 15 minutes when the widget next runs (subject to iOS refresh behavior). It caches the previous working script and falls back when offline. Whenever `core.js` is updated, increment the version in `version.json` too. The map footer and viewport diagnostic read the version from `version.json` rather than maintaining separate hardcoded version labels. If GitHub is unreachable, the map uses the launcher's locally cached version. Changes may require closing and reopening the map.

## Widget parameter
`auto` (default), `soho`, `hoboken`, `newport`, or `all`.

The weekday temporary service takes effect on November 16, 2026. In evening automatic mode, New York selects the first PATH departure at least ten minutes away; New Jersey selects the geographically closer station. If unavailable, it falls back to recent cached region/station or the first departure with a ten-minute buffer. Weekend timetable remains unchanged.

## Important
- The repository is public. Never put Verizon credentials or bearer tokens here. Credentials remain in Scriptable Keychain on the iPhone.
- Hoboken and Newport pins represent PATH station references, not verified curbside shuttle stops.
- Live GPS polls about every five seconds while the map is open. Widget refresh timing is controlled by iOS.
- The station-only initial map fit keeps its existing top/bottom padding and adds 20 pixels on the right to give PATH pin labels more space.
- Shuttle number circles are colored by current motion state, not by shuttle identity: blue = moving, yellow = idling (when explicitly reported by Reveal), gray = stopped or no confirmed movement. Moving arrows stay blue. If GPS status does not distinguish a running engine from a stopped vehicle, the marker defaults to gray.
- Tap the Hoboken PATH or Newport PATH map pin to see a popup. Hoboken has two preset destination rows; Newport has four. Each row displays the next available train as a single minutes countdown (for example, `7 min`). Rows show loading spinners until native Scriptable requests return. Tap the popup to refresh, or wait for the automatic refresh every 30 seconds. The PATH popup is compact (194px content width with responsive viewport bounds), and retains the 42px close target. Newport still has four rows; dots are yellow for regular Journal Square/33rd Street service, green for World Trade Center, blue for Hoboken, and diagonal blue/yellow for 33rd Street via Hoboken when that is the next arrival. Hoboken 33rd Street is blue and World Trade Center is green. When a live prediction identifies a different route color, the corresponding dot updates from the feed's `lineColor`/`lineColors` and route metadata.
- On this experimental branch, PATH arrivals use **only RidePATH SignalR**. Failed or unavailable streams display a dash and a retry message; no alternate arrival provider is queried. Train routes and availability can change with the timetable.
- This code has had syntax checks; it still requires first-run iPhone testing.

## Files
- `SoHo_Shuttle_Launcher.js`: installed once on the phone
- `core.js`: hosted widget and map implementation
- `version.json`: update detection
- PATH arrivals: fetched directly in `core.js` with Scriptable native `Request` (no external PATH module)

## Experimental SignalR branch (iPhone testing)

The `main` branch remains the production version. On this `SignalR` branch, install the
branch-aware `SoHo_Shuttle_Launcher.js` in your existing Scriptable script. Change the one
line `const BRANCH = "main";` to `const BRANCH = "SignalR";` to opt into the test.
Set it back to `main` to return to the production widget. Each branch uses an isolated
local cache (including its own version manifest), so a failed experimental download
cannot run a cached production build by mistake.

When you first tap the widget to open the map on the SignalR branch, Scriptable will ask
for the RidePATH **app-level bearer token**. Paste it once; the value is saved in
Scriptable's local Keychain and is **not committed to this public GitHub repository**.
Canceling the prompt leaves SignalR unconfigured; PATH rows show unavailable until a credential is entered.

The experiment exclusively requests SignalR tokens and negotiates connections using native
Scriptable `Request`. When the map opens, it establishes three persistent browser
WebSockets in the existing WebView: Hoboken toward NY and Newport toward NY/NJ.
Arrivals are cached in the WebView and continuously updated by incoming SignalR
messages. Opening a PATH popup reads the shared cache immediately, without requesting
new data; the visible ETA text changes once per second without resetting or displaying
a spinner. Every 25 seconds, the native Scriptable side checks stream health and
negotiates a replacement connection only for disconnected or stale streams. A successful
update preserves the existing colored PATH countdown rows. There are **no fallback PATH data sources** on this branch. If SignalR fails,
the popup shows unavailable and the Scriptable console reports the error.

**Unverified:** Browser WebSocket authentication, CORS/origin behavior and concurrent
Scriptable WebView evaluation must be tested on the iPhone. GitHub commits and static
syntax checks are not evidence that the WebSocket connects successfully. The small
rectangular Home Screen widget continues to display the shuttle timetable, as it
did before; SignalR changes affect the PATH popups in the map opened by tapping it.
No always-on background WebSocket is used.
