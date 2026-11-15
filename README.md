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
- PATH predictions first use the official PANYNJ JSON feed. If that feed has no usable predictions, the app tries the documented third-party `path.api.razza.dev` station-specific endpoint; availability of this older community service is unverified. When neither returns trustworthy fresh data, a dash is shown instead of an invented arrival countdown. Train routes and availability can change with the timetable.
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
Canceling the prompt keeps the existing PATH feed behavior.

The experiment requests SignalR tokens and negotiates connections using native
Scriptable `Request`. It then attempts the WebSocket handshake in the **existing map
WebView**, passing browser authentication through the `access_token` query parameter.
Hoboken subscribes to `ToNY,HOB`; Newport subscribes to `ToNY,NEW` and `ToNJ,NEW`
concurrently. Each stream is read until one usable update arrives or a 13-second
timeout; the connections are then closed. New native requests are made on the
existing 30-second popup refresh cycle. A successful response is mapped into the
existing colored PATH countdown rows. If SignalR fails, it falls back to the
unchanged PANYNJ/community-feed sequence.

**Unverified:** Browser WebSocket authentication, CORS/origin behavior and concurrent
Scriptable WebView evaluation must be tested on the iPhone. GitHub commits and static
syntax checks are not evidence that the WebSocket connects successfully. The small
rectangular Home Screen widget continues to display the shuttle timetable, as it
did before; SignalR changes affect the PATH popups in the map opened by tapping it.
No always-on background WebSocket is used.
