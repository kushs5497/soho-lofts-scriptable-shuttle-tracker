# SoHo Lofts Shuttle — Scriptable

iPhone Lock Screen widget and live shuttle GPS map with MapLibre, OpenFreeMap Positron and Verizon Connect Reveal.

## One-time installation
1. In Scriptable create a script named **SoHo Shuttle**.
2. Copy the contents of [SoHo_Shuttle_Launcher.js](./SoHo_Shuttle_Launcher.js) into it.
3. Run the script once while online; it downloads `core.js` and opens the map.
4. Set your Lock Screen rectangular widget to use the **SoHo Shuttle** script.
5. Keep the launcher. Future changes come from this GitHub repository.

## Updating
The launcher checks GitHub when you open the map and approximately every 15 minutes when the widget next runs (subject to iOS refresh behavior). It caches the previous working script and falls back when offline. Whenever `core.js` is updated, increment the version in `version.json` too. Changes may require closing and reopening the map.

## Widget parameter
`auto` (default), `soho`, `hoboken`, `newport`, or `all`.

The weekday temporary service takes effect on November 16, 2026. In evening automatic mode, New York selects the first PATH departure at least ten minutes away; New Jersey selects the geographically closer station. If unavailable, it falls back to recent cached region/station or the first departure with a ten-minute buffer. Weekend timetable remains unchanged.

## Important
- The repository is public. Never put Verizon credentials or bearer tokens here. Credentials remain in Scriptable Keychain on the iPhone.
- Hoboken and Newport pins represent PATH station references, not verified curbside shuttle stops.
- Live GPS polls about every five seconds while the map is open. Widget refresh timing is controlled by iOS.
- Tap the Hoboken PATH or Newport PATH map pin to see a popup. Hoboken has two preset destination rows; Newport has four. Rows show loading spinners until native Scriptable requests return; the popup refreshes every 30 seconds while open. No separate PATH script download is necessary.
- PATH predictions require a fresh official feed. Empty, stale, or failed responses show unavailable times rather than invented arrival estimates. Train routes and availability can change with the timetable.
- This code has had syntax checks; it still requires first-run iPhone testing.

## Files
- `SoHo_Shuttle_Launcher.js`: installed once on the phone
- `core.js`: hosted widget and map implementation
- `version.json`: update detection
- PATH arrivals: fetched directly in `core.js` with Scriptable native `Request` (no external PATH module)
