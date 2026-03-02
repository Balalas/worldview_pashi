

# Spec Features Implementation Plan

## Overview
Implement the highest-impact missing features from the WORLDVIEW spec that are compatible with the current architecture (Leaflet/Google 3D Maps, not CesiumJS).

## Features to Implement (Priority Order)

### 1. Immersive Mode (Key `I`)
- Add `immersiveMode` boolean to Zustand store
- When active: bottom panel hides, left panel hides, top bar becomes translucent, map fills 100vh
- Toggle with `I` keyboard shortcut
- **Files**: `src/store/worldview.ts`, `src/pages/Index.tsx`

### 2. Classification Banner + REC Timestamp
- Add a "TOP SECRET // SI-TK // NOFORN" banner across the top of the map viewport
- Add pulsing red "REC" dot with live UTC timestamp (updating every second)
- Part of the HUD overlay system
- **Files**: `src/components/hud/HudOverlay.tsx`

### 3. HUD Layout Switcher (Full / Tactical / Clean)
- Add `hudLayout` state to store: `'full' | 'tactical' | 'clean'`
- Full: all HUD elements visible
- Tactical: classification banner + REC only
- Clean: no HUD
- Cycle with `H` key
- **Files**: `src/store/worldview.ts`, `src/components/hud/HudOverlay.tsx`, `src/pages/Index.tsx`

### 4. Screensaver Mode
- Build a `ScreensaverOverlay.tsx` component
- Cinematic auto-rotation through `LANDMARK_PRESETS` (already defined in store)
- Logo pulsing animation + "WORLDVIEW" branding
- Click or keypress to dismiss
- Activates via button or after idle timeout
- **Files**: `src/components/hud/ScreensaverOverlay.tsx`, `src/pages/Index.tsx`

### 5. Panoptic Mode
- Overlay deterministic labels on map entities (ACF-xxxx for aircraft, etc.)
- Add `panopticEnabled` boolean + `panopticDensity` number to store
- Toggle with a button in the HUD or TopBar
- Stats bar showing visible/total/density
- **Files**: `src/store/worldview.ts`, `src/components/hud/PanopticOverlay.tsx`, `src/pages/Index.tsx`

### 6. Circular Viewport Toggle
- Add `circularViewport` boolean to store
- When active, clip the map container to a circle using CSS `clip-path: circle(50%)`
- Toggle button in TopBar
- **Files**: `src/store/worldview.ts`, `src/components/panels/TopBar.tsx`, `src/pages/Index.tsx`

### 7. Additional Static Layers (Spaceports, Chokepoints, Critical Minerals, Cyber Attacks, Military Bases)
- Add new data files under `src/data/` with curated coordinates
- Add layer keys to `LayerType` in the store
- Render markers on the map
- **Files**: `src/store/worldview.ts`, `src/data/spaceports.ts`, `src/data/chokepoints.ts`, `src/data/criticalMinerals.ts`, `src/data/cyberAttacks.ts`, `src/data/militaryBases.ts`, `src/components/map/MapContainer.tsx`

### 8. Country Click Panel
- Click a country name in the instability index to open a detail overlay
- Shows CII score with component breakdown (baseline risk, unrest, security, info velocity)
- Shows trend + recent country-specific news
- **Files**: `src/components/panels/RightPanel.tsx` (extend the country detail type)

### 9. Data Sources Health Panel (new bottom tab)
- Add "SOURCES" tab to bottom panel
- Show each API with status dot (fresh/stale/error), last refresh time, and refresh interval
- Track actual fetch timestamps from services
- **Files**: `src/components/panels/BottomFeed.tsx`, `src/store/worldview.ts`

### 10. Prediction Markets Panel
- Add curated prediction market data (static/mock)
- Show probability bars for geopolitical scenarios
- New bottom panel tab or card in INDEXES
- **Files**: `src/components/panels/BottomFeed.tsx`

## Technical Details

### Store Changes (`src/store/worldview.ts`)
```text
New state fields:
- immersiveMode: boolean
- hudLayout: 'full' | 'tactical' | 'clean'
- panopticEnabled: boolean
- panopticDensity: number (0-100)
- circularViewport: boolean

New actions:
- toggleImmersiveMode()
- cycleHudLayout()
- togglePanoptic()
- setPanopticDensity(n)
- toggleCircularViewport()
```

### Keyboard Shortcuts (add to existing handler)
```text
I -> toggleImmersiveMode
H -> cycleHudLayout
```

### New Components
- `src/components/hud/ScreensaverOverlay.tsx`
- `src/components/hud/PanopticOverlay.tsx`

### Layout Changes (`src/pages/Index.tsx`)
- Immersive mode: conditionally hide panels, expand map to full height
- Circular viewport: apply `clip-path` to map wrapper
- HUD layout: pass layout prop to HudOverlay to control which elements render

## Sequencing
1. Store updates (all new state) -- foundation for everything
2. Immersive Mode + Circular Viewport -- quick visual wins
3. Classification Banner + REC + HUD Layouts -- tactical immersion
4. Screensaver -- cinematic polish
5. Panoptic Mode -- entity intelligence overlay
6. Static layers data + rendering
7. Country Panel + Data Sources + Prediction Markets

