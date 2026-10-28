# TourGuide redesign: 路線與紀念章 (Lines & Stamps)

## Brief (as interpreted)
- **Subject**: an AI planner for city walks and multi-day trips, primarily used in Taiwan (zh-TW first, EN second).
- **Audience**: young independent travellers planning on their phones, often while already out.
- **Primary job**: get from "where am I going?" to a day you can actually walk, with timing, order and fallbacks.

## Concept
Show a planned day the way Taiwan transit shows a route: **a line with stations**.
Each time slot is its own line colour (morning, afternoon, evening, night). Moving between slots is drawn as a
transfer. The times run down the left side like a station timetable.
A check-in leaves a **紀念章** (the rubber stamp you find at every station and attraction in Taiwan).
"我的旅程" works as a stamp book.

These are the only two expressive elements, the line and the stamp. Everything else stays quiet.

## Tokens
| name | light | dark | role |
|---|---|---|---|
| paper | `#F1F3EE` | `#121628` | page, cool ticket stock (deliberately not cream) |
| surface | `#FFFFFF` | `#1A2038` | sheets, inputs |
| ink | `#18213D` | `#E7EAF3` | text, primary buttons |
| ink-2 | `#4E5770` | `#A9B0C6` | secondary text |
| rule | `#D3D8CF` | `#2D3553` | hairlines, borders |
| stamp | `#5B3CC4` | `#A691FF` | stamps, focus, selection |
| line-morning | `#0B8A7E` | `#3CC7B8` | morning line (晨) |
| line-afternoon | `#C98A00` | `#F0B429` | afternoon line (午) |
| line-evening | `#CC3F67` | `#F07A9A` | evening line (暮) |
| line-night | `#3A47B5` | `#8C97FF` | night line (夜) |

Line colours carry information: each one always means that time slot, everywhere.

## Type
- **Overpass** handles Latin text and numerals. It's derived from Highway Gothic, the road-signage face, and it sets the timetable times in 800 weight with tabular figures.
- **Noto Sans TC** handles CJK text in the same font stack, so the two read as one voice.
- **Noto Serif TC 900** is used inside stamps only.
- Scale: 1.25 ratio. 13 / 16 / 20 / 25 / 31 / 39 / 49.

## Layout
- Mobile first. There's a 4-tab bar at the bottom on phones (首頁 / 散步 / 行程 / 我的). On desktop it becomes a top bar.
- Everything is left-aligned, with a max width of 1120px.
- Desktop result view: the route line on the left, a sticky map on the right. On mobile, a 路線 / 地圖 toggle switches between them.

```
home (desktop)
TourGuide      首頁 散步 行程 我的          中|EN
今天，                     │ 09:00 ● 大稻埕碼頭
去哪裡走走？               │       │  步行 8 分
[ 📍 城市、街區或景點  ]   │ 10:30 ● 迪化街
[散步路線] [完整行程]       │ 13:00 ◎ 轉乘：午後
```

## Principles
1. The product's output is the hero. The home page opens with a sample route line, not marketing copy.
2. There's one orchestrated motion: the line draws itself when a route first appears. Nothing else animates on its own, and all motion respects `prefers-reduced-motion`.
3. No alert() or confirm(). Results are shown in a toast, and decisions happen in a sheet.
4. Copy is plain and active. A button says exactly what happens, for example 生成行程 then 已生成.

## Revisions after review against the brief
- I dropped a split-flap "departure board" hero. It's a cliché for travel apps, and it shows a mood rather than the product.
- I dropped ticket-perforation edges on cards. They were decoration and didn't add information.
- I dropped the cream and clay palette the old UI used (`#f4eadb` / `#c28b57`). It's the most common generated-UI default.

## Code architecture
```
src/app/        App, AppShell (navigation), routes
src/ui/         Sheet, Toast + confirm dialog, Segmented, small primitives
src/features/
  route-line/   RouteLine: the shared station/line diagram
  stamps/       Stamp
  home/         HomePage
  plan/         PlanPage, usePlanner (all state + handlers), PlanSetup, PlanResult, PlaceSheet, CheckInSheet
  walk/         WalkPage (quick AI walk)
  trips/        TripsPage (saved trips, stamp book, activity, achievements)
  shared/       SharedTripPage (public link)
src/lib/        itinerary helpers (slot order, station times, labels)
src/styles/     tokens.css, base.css
```
Old routes redirect: `/generator` → `/plan`, `/route` → `/walk`, `/profile` → `/me`, `/itinerary/:id` → `/trip/:id`.

---

## Interaction pass (2026-10-09): 「時刻表列車」

### Brief
The ask is to make TourGuide more interactive. The risk is scattering hover effects and entrance animations everywhere, which is the generated-UI default. Instead, interaction goes into the one thing this product is about: **where you will be at a given moment of the day.**

### The one bold thing: the day scrubber
- A time slider drives a **train** along the RouteLine. Drag it (or use the arrow keys) and the train moves through the day. The stop you're at lights up and the line ahead fades. The status reads 「14:20　在迪化街，停留到 14:45」 or 「移動中，步行前往有記名茶」.
- The current time is the typographic element: Overpass 900, large and tabular, so it updates in place like a station clock.
- The slider track is painted with the slot colours, so the day's structure is visible on the slider itself.
- ▶ 播放這一天 runs the day in about 8 seconds. It only plays when the user presses it, and it steps rather than glides under reduced motion.
- **On the result page** the scrubber is sticky. Scrubbing scrolls the active stop into view and pans the map to it. If the trip is today, it starts at the current time (「現在」).
- **On the home page** it's a live demo on the sample route. Three sample routes (大稻埕 / 台南府城 / 西門到中山) can be switched to redraw the line, which replays the line-drawing motion that already exists.

### Supporting interactions (each one answers a user action)
1. **Day shape preview (setup).** Changing the pace immediately redraws a strip of the four slots: which ones the AI will fill, and their start times. This uses the same rule as the services (relaxed = afternoon; moderate = afternoon + evening; packed = all four), so the preview is truthful.
2. **Stamp press (check-in).** On a successful stamp, the stamp comes down onto the page: scale 1.35 → 1, ink settles. Then the sheet closes. This is confirmation motion, not decoration.

### Not doing
No hover lift on rows, no scroll-triggered reveals, no parallax, no cursor effects. These would add motion without telling the user anything.

---

## One page (2026-10-09)
Home, Walk and Plan are now a single page at `/` (`src/features/trip`). One form handles everything, and the **多久** choice picks the mode. 2 hours or half a day gives a single AI walk (`geminiRouteService`). 1–7 days gives a slotted itinerary (`aiItineraryService`). A short divider in the picker marks where the mode changes, and a live caption under it says which one you'll get.

The page has three phases: compose → generating → result.
- **Compose**: on desktop the form sits next to a live example; on mobile the example sits below the form.
- **Generating and result**: the form collapses to a one-line summary with an Edit button.

Editing keeps the last result reachable through 「回到剛才的結果」. Result views read a snapshot of the request (`planner.rp`, `resultLoc`), so changing the form never rewrites a result that's already shown.

Navigation is 規劃 + 我的. `/walk`, `/plan`, `/generator` and `/route` redirect to `/` and keep their router state.

## Friendlier pass (2026-10-09)
- **Navigation**: there's no bottom tab bar. The top bar holds the wordmark (home), the language switcher, and either 登入 or the avatar plus 我的旅程.
- **Results**: every result opens with `ResultHeader`: ← 修改條件, the place name (postcode and country removed, max 2 lines), the request facts, then the route numbers inline. Only the scrubber is sticky. The 路線/地圖 toggle is a small control in the toolbar row.
- **Stops**: each stop shows only 導航 (and 蓋章 when signed in). 換一個地點 lives in the stop's sheet. Shortest order and redoing a day moved into ⋯.
- **Form**: the submit button is never disabled. Pressing it without a destination focuses the field and explains what to type. Interests are optional (none means a balanced mix). Generating can be cancelled, and a response that arrives late is discarded.
- **Guests**: the primary action is 導航這一天, which works without an account. 登入儲存 is secondary.
- **Templates removed (2026-10-10)**: the 從範本開始 list at the bottom of the page was replaced by quick picks under the destination field, shown only while it's empty. 用目前位置 uses geolocation plus a reverse geocode to a neighbourhood name. The popular places (`src/data/popularPlaces.ts`) fill the destination, and fill interests too if none are picked yet.
- **Scrubber v2 (2026-10-10)**: the range slider was replaced by an "in-car route display" strip. Stays are drawn thick, travel thin, free time dashed. A full-colour layer is clipped to the train's position over a faded copy. Drag anywhere on the strip; releasing within 12 minutes of a stop snaps to it. Tapping a stop glides the train there (420 ms ease-out, every frame goes through onChange so the line and map follow). Passing a stop while dragging gives a light vibration. The keyboard follows the slider role: ←/→ is 5 min (Shift for 30), ↑/↓ moves by stop, Space plays. The readout is fixed at three lines: state, place (ellipsis), until/arrive time.

---

## 8-bit pass (2026-10-27): 「像素小關卡」
The user asked for a retro platformer / pixel-game look (in the spirit of Mario mini-games) layered onto the existing components. The concept stays the same: the line is still the day and the stamp is still the check-in. Only the material changes. **All the art is original.** There are no Nintendo characters or sprites, just generic 8-bit vocabulary: ? blocks, coins, ground bricks, a goal flag.

- **Type (revised 2026-10-28)**: the first build used the pixel faces Cubic 11 and Press Start 2P for text. The user found them blurry, so the pixels now live in objects only and **letters stay vector-crisp**.
  - **Chiron GoRound TC** (400/700/900) for all text. Its rounded strokes echo game UI warmth and it's sharp at every size. 900 for titles and station names, 700 for controls and labels, 400 for body text.
  - **Bungee** only where a number is the point: the scrubber clock, timetable times, result facts, stats, counters, and the stamp date. It's caps-only, so it never sets words (the wordmark is GoRound 900).
  - There are no all-caps labels. `TIME` and `NOW LOADING` were cut as redundant.
- **Palette**: sky page `#9ED6FF` with pixel clouds, white panels, ink `#10122B` edges, red accent `#E52521` (primary buttons, focus), coin `#FBD000` (selected state everywhere), pipe green `#00A651` (play, switches, XP). Dark mode is the night level: `#14123A` with stars and blue castle bricks. Slot colours keep their meaning.
- **Edge weight ranks things**: panels, inputs and the primary button get a 3px edge. Secondary controls (chips, quick picks, segmented, day tabs, language switch, reorder rows) set `--px: 2px` and stay quieter.
- **Edges**: no radii (`--r-* = 0`). Borders are `--pixel-edge`, four offset shadows, so corners stay notched. It is declared on `*` so a local `--edge` (focus, drag-over) recolours it. Buttons are blocks: bevel plus a thick bottom edge, and pressing pushes them down 6px.
- **Progress, the bold part**:
  - Day scrubber = a level. Stops are ? blocks that become used blocks once passed and bump when focused. The train is a pixel traveller that walks (2-frame) while playing and hops while dragging. The day ends at a goal flag. The readout is the slot-coloured Bungee clock with a hard 2px ink offset shadow, so light slot colours stay legible.
  - `.px-meter` = segmented HP/XP meter: budget (coins, red blink when over), achievements (XP), loading.
  - Loading = `NOW LOADING`: the bar fills in 12 steps through the morning/afternoon/evening colours while the traveller runs along it.
  - Day shape bars are segmented and fill in frames.
- **Stamp**: a pixel badge (staircase ring, dashed inner ring, pixel star). There's no rotation, which would alias the pixels.
- **Motion**: every transition uses `steps()`, so it moves in frames. Everything still respects reduced motion.
- **Assets**: `src/assets/pixel/*.svg` are generated from character maps (crispEdges SVG). Re-draw them by editing the maps rather than the SVGs by hand.

## Motion pass (2026-10-28): 「關卡活起來」
The user asked for lots of animation to make the style stand out. That **replaces principle 2** ("one orchestrated motion"). The guardrails that keep it from becoming generic: everything moves in frames (`steps()`), and every effect is a thing from the level, never a fade-and-slide. Everything lives in `src/styles/motion.css` inside `prefers-reduced-motion: no-preference`, and the JS particles check the same preference.

- **Ambient** (always running, compositor-cheap):
  - The clouds drift on `.shell::before` (`--sky-art`, moved off `body`). In dark mode the stars twinkle.
  - The ground strip scrolls like a side-scroller.
  - The wordmark coin spins, then rests.
  - A two-block glint passes over the primary button every 4.5s.
  - The ? blocks by the headline float.
  - The traveller breathes while idle.
- **Load**:
  - The headline letters drop in like bricks (`DropText`). The result title gets the same treatment.
  - The route line still draws in, and the slot tags pop in step with it.
  - Meters fill cell by cell.
- **In answer to the user**:
  - Pressing the primary button pops a coin into a purse. The topbar shows `×n` from 440px up, stored per viewer in localStorage (`tg.coins`).
  - Picking a chip, tab or quick pick throws four sparkles, and picked things hop or pop.
  - The ? blocks by the headline pay out (1, 5, 1 coins), then turn into used blocks.
  - Passing a stop in the scrubber pops a coin out of its block, and the block you reach gets bumped.
  - The traveller walks while you drag, and the goal flag waves.
  - Sheets open like a game text box, from a line to the full box.
  - A successful check-in throws two coins out of the stamp.
- **Scroll**: stations, trip rows, stamps, achievements and budget rows wipe in from the left in six steps as they enter, using CSS scroll-driven animations (`animation-timeline: view()`). Browsers without support just show them.
- **Where motion lives (cleanup 2026-10-28)**: each component stylesheet owns its own look **and** its own motion. Motion goes in one `@media (prefers-reduced-motion: no-preference)` block at the end of the file, so rules never fight across files on load order. `src/styles/motion.css` keeps only what's shared: keyframes (`pop`, `hop`, `wiggle`, `idle-bob`, `coin-spin`, `coin-pop`), particles, `DropText` and the scroll reveal. Shared shadows are tokens: `--pixel-edge` and `--pixel-bevel` are per element, `--pixel-raised` is edge + `--pixel-drop`, and text on coin or red uses `--on-coin` / `--on-stamp`. Transfer stations are tinted with their line colour, because coin yellow always means "selected".
- **Code**: `src/ui/PixelFx.tsx` is one document listener, `src/ui/fxStore.ts` holds the particles and coin purse (named so it doesn't collide with `PixelFx.tsx` on case-insensitive disks), and there's also `src/ui/DropText.tsx` and `src/ui/CoinBlocks.tsx`. Sprites come from `node tools/gen-pixel-sprites.mjs src/assets/pixel`.
