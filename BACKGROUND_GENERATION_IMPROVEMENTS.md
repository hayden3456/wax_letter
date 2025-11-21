# Background Image Generation Improvements

## Summary

Implemented improved background generation and resume logic for the homepage image generation feature based on Option 3 (Polling/Resume) from `BACKGROUND_IMAGE_GENERATION_GUIDE.md`.

## Changes Made

### 1. Enhanced State Tracking

Added new localStorage keys to track generation state more reliably:

- `GENERATION_TIMESTAMP`: Records when generation started (prevents stale/stuck generations)
- `GENERATION_ATTEMPTS`: Tracks retry attempts (prevents infinite retry loops)

**Timeout**: 5 minutes - after this, a pending generation is considered stale and cleared.

### 2. Improved `loadState()` Function

**Before**: Basic check for `IS_GENERATING` flag, would try to resume even if generation completed or failed.

**After**: 
- Checks if generation has timed out (> 5 minutes)
- Only resumes if file data exists and generation is still valid
- Properly clears stale generation state
- Clears generation flags when image is successfully loaded from cloud or localStorage
- Prevents unnecessary resume attempts

### 3. Enhanced `continuePendingGeneration()` Function

**Before**: Simple retry without attempt tracking or failure handling.

**After**:
- Tracks retry attempts (max 3)
- Provides clear feedback when max attempts reached
- Shows retry UI instead of alerts
- Saves attempt count between page loads
- Includes original file name for better debugging
- Handles errors gracefully with appropriate user feedback

### 4. Improved `generateImageInBackground()` Function

**Before**: Would lose state if fetch was cancelled during navigation.

**After**:
- Clears old generation state before starting new generation
- Saves file data synchronously before fetch starts
- Saves file name along with data for better error messages
- Properly maintains `IS_GENERATING` flag even if fetch is cancelled
- Allows resume logic to pick up where it left off
- Better logging for debugging

### 5. Added Manual Retry UI

New features:
- `showRetryButton` state variable
- `retryGeneration()` function - allows user to manually retry after failures
- Retry overlay UI - appears when max attempts reached
- Two buttons: "Retry" (resets attempt count and retries) and "Upload New Logo"
- Styled error overlay with clear visual feedback

### 6. Better Error Handling

- No more alerts - uses visual UI instead
- Distinguishes between timeout, network errors, and API errors
- Provides appropriate feedback for each error type
- Prevents infinite retry loops
- Clears stale state automatically

## How It Works

### Initial Upload Flow

1. User uploads logo
2. File is saved to localStorage (base64 + filename)
3. `IS_GENERATING` flag and timestamp are set
4. Fetch request starts with `keepalive: true`
5. If user navigates away, fetch may be cancelled but state is preserved

### Resume Flow (User Returns)

1. `loadState()` runs on page mount
2. Checks cloud storage first (most up-to-date)
3. Falls back to localStorage if cloud fails
4. If `IS_GENERATING` flag is set:
   - Checks timestamp - if > 5 min, clears stale state
   - If valid, calls `continuePendingGeneration()`
5. Resume attempts generation with saved file data
6. Increments attempt counter
7. On success, clears all generation flags
8. On failure after 3 attempts, shows retry UI

### Manual Retry Flow

1. User sees "Generation failed" overlay with Retry button
2. Clicks "Retry"
3. `retryGeneration()` resets attempt counter
4. Calls `continuePendingGeneration()` again
5. User can also choose "Upload New Logo" to start fresh

## Testing Scenarios

### Test 1: Normal Flow (No Navigation)
- Upload logo → See loading animation → Image generates → Success ✓

### Test 2: Navigate Away During Generation
- Upload logo → Immediately navigate to pricing page
- Return to homepage → Generation resumes automatically → Success ✓

### Test 3: Generation Failure
- Upload invalid/problematic image
- After 3 attempts, see retry UI
- Click Retry → Try again
- Or Upload New Logo → Start fresh ✓

### Test 4: Timeout Handling
- Start generation → Close tab
- Wait 6+ minutes → Reopen page
- Stale state cleared, can upload new image ✓

### Test 5: Cloud Sync
- Upload logo on device A → Image generates
- Open page on device B (same account) → Image loads from cloud ✓

## Technical Notes

### Why Not Service Worker?

Based on the guide's recommendation, Option 3 (Polling/Resume) was chosen because:
1. Works in all browsers (no Service Worker support required)
2. Simpler implementation and maintenance
3. Users typically return to see results anyway
4. Image generation is fast enough (~10-30 seconds)
5. True background processing not critical for this use case

### Limitations

- `keepalive: true` has size limits and doesn't guarantee completion
- Fetch will still be cancelled on navigation (by browser)
- Generation doesn't continue if tab is closed
- Relies on user returning to page to complete

### Future Enhancements (If Needed)

If true background processing becomes necessary:
1. Implement Service Worker (see Option 1 in guide)
2. Add push notifications for completion
3. Use Background Sync API for offline support
4. Add progress polling from server

## Files Modified

- `src/routes/+page.svelte`: All generation and resume logic

## Dependencies

- Existing Firestore service for cloud storage
- No new dependencies required

