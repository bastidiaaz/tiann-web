# Music Portfolio Planet — Design Spec

**Date:** 2026-06-21  
**Status:** Approved

---

## Overview

Transform the existing R3F 3D world into an immersive music portfolio website. The player controls a spacesuit-clad astronaut exploring a small alien planet. Six glowing crystal clusters are scattered across the surface, each linked to a song. Walking near a crystal auto-plays its 30-second Spotify preview; pressing E opens the full track on Spotify.

The mood is nostalgic, introspective, and warm — the visual aesthetic blends deep space darkness with soft amber, rose, and violet glows.

---

## World & Atmosphere

### Terrain
- Replace the current `1000×1000` flat plane with a **circular disc** built from `CircleGeometry` (~200 unit radius, ~200×200 segments).
- Simplex noise deforms the surface at low amplitude (gentle undulation, not hills) to feel organic without obstructing navigation.
- Surface material: dark muted tone (deep navy / charcoal-purple) using `MeshStandardMaterial` with low roughness and no emissive.
- The disc is oriented flat (`rotation={[-Math.PI / 2, 0, 0]}`), same as current ground.

### Horizon & Fog
- `FogExp2` (exponential) replaces the current linear fog. Color matches near-black sky (`#080010` with faint purple tint). Density ~`0.008`.
- The fog causes the disc edge to dissolve into darkness, selling the "small planet dropping away" illusion without curving geometry.

### Sky
- Canvas `background` set to `#080010`.
- Drei `<Stars>` component: dense, slightly saturated star field (radius `300`, depth `60`, count `8000`, saturation `0.4`).
- A single equirectangular nebula texture (sourced from Polyhaven or a free HDR pack) wraps the scene as the environment background — warm oranges and deep purples.
- No `<OrbitControls>` — camera is locked to third-person follow.

### Decorative Background Planet
- A large sphere (`SphereGeometry`, radius `300`) positioned far behind and below the disc (e.g. `[0, -400, -600]`).
- Subtle atmosphere: `MeshStandardMaterial` with a soft emissive tint (muted blue-green).
- Reinforces the "standing on a small planet" feeling at the horizon.

### Lighting
- Keep the existing `hemisphereLight` and `directionalLight` setup; retune colours to cooler/darker tones (sky: `#1a0a2e`, ground: `#0d0d0d`).
- Add a soft ambient point light near each crystal (auto-generated from crystal position) to cast a warm pool of coloured light on the terrain.

---

## Character

### Model
- Replace the current human FBX (`character.fbx`) with a free NASA-style astronaut GLTF/FBX (sourced from Mixamo or Sketchfab under CC license).
- The astronaut supports the same four animation clips: **idle**, **walk**, **run**, and **dance** (repurposed as a zero-gravity spin easter egg).
- Scale adjusted to match current character proportions relative to the terrain.

### Controls
- Unchanged: `W/A/S/D` for movement, `Shift` to run, `E` for dance / Spotify open (context-dependent: if in a crystal proximity zone, `E` opens Spotify; otherwise it dances).
- Movement component file renamed from `Character.tsx` to `Astronaut.tsx`; internal logic stays the same.

### Camera
- Third-person follow camera logic preserved from `Character.tsx`.
- Camera height offset increased slightly (`idealOffset` z-component raised) to show more sky, which is the visual centrepiece.

---

## Crystal Spots

### Geometry
- Each spot is a cluster of **3–5 crystal shards** built from `ConeGeometry` (tall, narrow tip: `radiusBottom ~0.4`, `height ~3–5`, `radialSegments 5`).
- Shards are grouped (`<group>`) and rotated at irregular angles (±15–30° on X/Z) to look organic, not planted.
- Material: `MeshStandardMaterial` with `emissive` set to the spot's colour and `emissiveIntensity` animated.

### Colour Palette (one per song)
| Spot | Colour | Hex |
|------|--------|-----|
| 1 | Amber | `#ffaa33` |
| 2 | Rose gold | `#ff6b8a` |
| 3 | Soft violet | `#9b6bff` |
| 4 | Coral | `#ff7f5c` |
| 5 | Dusty teal | `#4ecdc4` |
| 6 | Warm white | `#fff5e0` |

### Pulse Animation
- Each crystal animates `emissiveIntensity` via a sine wave in `useFrame`: idle range `0.4–0.8`, period ~3 seconds.
- On proximity enter: pulse period shortens to ~1.5 seconds, giving subtle active feedback.

### Placement
Positions are fixed, distributed irregularly around the disc within ~120 unit radius from centre:

| Spot | Approximate position |
|------|----------------------|
| 1 | `[80, 0, 30]` |
| 2 | `[-60, 0, 90]` |
| 3 | `[-100, 0, -20]` |
| 4 | `[-40, 0, -100]` |
| 5 | `[50, 0, -110]` |
| 6 | `[110, 0, -50]` |

Fine-tuned during implementation once the terrain shape is visible.

### Proximity Detection
- In `useFrame` inside `CrystalSpot`, compute distance from character's world position to crystal position each frame.
- **Enter threshold:** 18 units → trigger audio fade-in + show HUD.
- **Exit threshold:** 22 units (hysteresis) → audio fade-out + hide HUD.
- Only one crystal active at a time — entering a new zone triggers exit on the previous one via shared `activeSpotId` state in `App`.

---

## Spotify Integration

### Serverless Token Proxy
- File: `api/spotify-token.ts` (Vercel serverless function).
- Uses **Client Credentials** flow: `POST https://accounts.spotify.com/api/token` with `client_credentials` grant.
- Returns `{ access_token, expires_in }`.
- Env vars `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` live only in Vercel dashboard — never in the frontend bundle.

### Track Data Fetch
- `useSpotify` hook fetches the token on mount, then calls `GET https://api.spotify.com/v1/tracks/{id}` for each of the 6 track IDs (configured in `spots.config.ts`).
- Result shape used: `{ preview_url, external_urls.spotify, name, artists[0].name }`.
- Data stored in `SpotifyContext` and available to all `CrystalSpot` components.

### Audio Playback
- Each `CrystalSpot` manages one `HTMLAudioElement` (created once, reused).
- On proximity enter: `audio.src = preview_url`, `audio.loop = true`, `audio.play()` with a 1-second JS volume ramp from 0 → 1.
- On proximity exit: 1-second volume ramp from 1 → 0, then `audio.pause()`.
- If `preview_url` is `null` (Spotify market restriction): crystal still glows and HUD still appears; audio is silently skipped.

### "Press E" Interaction
- The `keydown` handler checks for `E` key in two mutually exclusive states:
  - **Not in a crystal zone** (`activeSpotId` is null): E triggers the dance animation (existing behaviour).
  - **In a crystal zone** (`activeSpotId` is set): E calls `window.open(track.external_urls.spotify, '_blank')`. Dance is suppressed.

---

## UI Overlay

### ProximityHUD
- Pure HTML/CSS overlay rendered outside the `<Canvas>` in `App.tsx`.
- Appears when `activeSpotId` is non-null.
- Content:
  ```
  ♫  Song Name
     Artist Name
     
  [ Press E to open on Spotify ]
  ```
  If `preview_url` is null, adds a small line: `(preview unavailable in your region)`.
- Styling: semi-transparent dark pill (`rgba(0,0,0,0.6)`), warm serif or monospace font, fades in/out with CSS `transition: opacity 0.4s`.
- Positioned bottom-centre of the viewport.

---

## Component File Structure

```
src/
├── App.tsx
├── components/
│   ├── world/
│   │   ├── Planet.tsx
│   │   ├── SpaceSky.tsx
│   │   └── BackgroundPlanet.tsx
│   ├── character/
│   │   └── Astronaut.tsx
│   ├── spots/
│   │   ├── CrystalSpot.tsx
│   │   └── spots.config.ts
│   └── ui/
│       └── ProximityHUD.tsx
├── hooks/
│   └── useSpotify.ts
├── context/
│   └── SpotifyContext.tsx
└── index.css / index.tsx

api/
└── spotify-token.ts
```

---

## Out of Scope

- User authentication / Spotify login.
- Collision detection with crystals or terrain edges.
- Mobile / touch controls.
- Character height adjustment based on terrain elevation (existing roadmap item, not addressed here).
- Sound spatialization (audio plays at fixed volume regardless of exact proximity, only gated by threshold).
