# Sonique Restoration Roadmap

This document summarizes the current state of Sonique after the latest reset and outlines the exact logic we need to re-implement to restore the **Memory Engine** and **Intelligent Shuffle**.

## Current Gaps (The "Broken" Features)

| Feature | Current State | What's Missing |
| :--- | :--- | :--- |
| **Control Lag** | ❌ BROKEN (4-5s delay) | The `backgroundSync` is unthrottled and lacks the "Bridge Air-Lock" (cancellation). |
| **Memory Engine** | ❌ BROKEN (Forgetful) | The native queue audit is gone; every click triggers a full bridge reset. |
| **Intelligent Shuffle** | ⚠️ PARTIAL | `shuffleUtils.ts` exists, but the store actions are empty or missing. |
| **Aesthetics** | ❌ MISSING | Artwork pulse and staggered list animations were lost in the reset. |

## 🛠️ The Restoration Plan

### Phase 1: Engine Re-Stabilization
*   **Player Store**: 
    *   Re-add `originalQueue` to state (required for disabling shuffle correctly).
    *   Implement `shuffleAndPlay` (The core of Intelligent Shuffle).
    *   Update `toggleShuffle` with "Seamless Sync" logic.

### Phase 2: The Apollo Memory Engine
*   **Sticky Context**: Update the `play()` action to audit the native queue. If context matches, skip to index instantly (0ms bridge traffic).
*   **Congestion Control**: Throttled `backgroundSync` (Chunks of 30, 500ms sleep).
*   **Synchronization Air-Lock**: Use `currentSyncId` to kill old loading loops immediately when a new song starts.

### Phase 3: Android Resiliency
*   **IO Error Handling**: Implement a "Path Health Check" before adding tracks to prevent the `android-io-file-not-found` crash loop.
*   **Legacy Architecture Guard**: Ensure we stay on standard `Animated` to avoid "Reanimated" crashes on the legacy architecture.

### Phase 4: Aesthetic Restoration
*   **Breathing Artwork**: Re-implement the pulse animation in `app/player.tsx`.
*   **SongList Reveal**: Re-implement staggered entry animations in `components/SongList.tsx`.

---

## Technical Context for the Next Conversation:
*   **Zustand Store**: Needs `persist` with MMKV.
*   **Shuffle Logic**: Intelligent de-clustering based on artist ID.
*   **Bridge Rule**: Never block the bridge for more than 100ms. Always yield in background loops.
