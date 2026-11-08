# OUR FOREVER WORLD ❤️
### Private Romantic Room Creation & Join System
An Interactive 3D Anime Romantic Adventure & Birthday Experience

---

## 🌟 What's New: Major Room Creation & Join Update

The application now supports **two distinct roles**:

1. **ROOM CREATOR – MAN (Husband/Partner)**:
   - Full editing and customization permissions.
   - Freely explores the 3D environments as the male anime character with third-person controls (WASD/arrows/touch joystick).
   - Configures all four connected 3D rooms:
     1. **Memory Museum**: Upload up to 7 photos, choose wall placement (West, East, North), adjust offset and scale, write personal love letters, and preview interactions.
     2. **Singing Room**: Upload a personal singing audio recording; male character sings passionately on stage with stage lighting and microphone.
     3. **Dancing Room**: Built-in romantic slow dance music; preview synchronized couple dance.
     4. **Bedroom**: Customize the birthday letter, upload personal voice note, configure necklace, preview 4-second Hug and Kiss animations.
   - Clearly visible **DONE – PUBLISH WORLD ❤️** button that validates, saves, publishes, and generates a unique shareable room code (e.g. `LOVE-8213`).

2. **ROOM VISITOR – WOMAN (Wife/Birthday Girl)**:
   - Enters secret room code on the landing page.
   - Read-only access with strict backend security (cannot edit, replace, or overwrite any of his content).
   - Freely controls the female anime character across all four rooms.
   - Reads every love letter in the museum, listens to his singing performance on stage, slow-dances together in the ballroom, explores the bedroom, listens to his personal voice recording, and can trigger **HUG (4s)** and **KISS (4s)** interactions!

---

## 🏛️ The Four Connected 3D Rooms

```
[ MEMORY MUSEUM ] ──(Door 1)──► [ SINGING ROOM ] ──(Door 2)──► [ DANCING ROOM ] ──(Door 3)──► [ OUR BEDROOM ]
```

1. **Memory Museum (Z: +14 to -14)**:
   - Polished marble floors with golden inlays, Roman columns, crystal chandeliers.
   - Up to 7 photo stations with dedicated letter stands and floating wax-sealed envelopes.
   - Approaching illuminates frames with pulsing hearts and proximity prompts.

2. **Singing Room (Z: -16 to -44)**:
   - Romantic concert room with raised stage platform, velvet curtains, vintage chrome microphone, and colored stage spotlights.
   - Male anime character sings his uploaded song to her!

3. **Dancing Room (Z: -46 to -74)**:
   - Grand romantic ballroom with dark mahogany parquet dance floor, crystal chandeliers, wall mirrors, and floating rose petals.
   - Synchronized romantic couple slow dance animation with included slow-dance ballad music.

4. **Our Bedroom (Z: -76 to -104)**:
   - Romantic canopy bed with satin duvet, arched moonlit French window, nightstands, and fairy lights.
   - Male character greeting (*"HAPPY BIRTHDAY, MY LOVE! ❤️"*).
   - Shimmering necklace presentation.
   - Special gold-foiled birthday letter.
   - Hand-holding walk towards the bed and sitting down together.
   - Personal voice recording player with animated waveform visualizer.
   - **Interactive 4-Second HUG & 4-Second KISS** actions initiated when she taps them!

---

## 🔒 Security & Role Permissions

- **Backend Authentication**:
  - Room creation generates a secret `creatorToken`.
  - Only requests carrying the `creatorToken` in `Authorization: Bearer <token>` can upload media or modify room configurations.
  - Visitor access via `roomCode` provides a sanitized read-only payload. Any attempts by visitor to modify or upload are rejected by the backend with **HTTP 403 Forbidden**.
  - Unpublished drafts cannot be viewed by visitors.

---

## 🚀 How to Run the Website

### Step 1: Start the Backend Server (Port 3001)
```bash
npm run server
```
*Stores rooms persistently in `server/data/rooms.json` and uploads in `uploads/`.*

### Step 2: Start the Frontend Vite Server (Port 5173)
In another terminal:
```bash
npm run dev
```

Visit:
```
http://localhost:5173
```

---

## 🧪 Testing Both Sessions

1. **Session A (Creator - Man)**:
   - Open `http://localhost:5173`
   - Click **CREATE A ROOM**
   - Click **Edit Room Studio** in top-right HUD
   - Upload photos, customize letters, upload singing recording, configure bedroom
   - Click **DONE – PUBLISH WORLD ❤️**
   - Copy the generated Room Code (e.g. `LOVE-8213`)

2. **Session B (Visitor - Woman)**:
   - Open a separate browser window or mobile browser
   - Click **JOIN A ROOM**
   - Enter the Room Code and click **Join Room Now**
   - Experience the full romantic anime world as the female anime character!
