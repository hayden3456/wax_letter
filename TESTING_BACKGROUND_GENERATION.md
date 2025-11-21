# Testing Background Image Generation

## Quick Test Instructions

### Test 1: Basic Background Generation ⭐ (Main Test)

**This is the key test to verify true background processing works:**

1. Start the dev server: `npm run dev`
2. Open the homepage in your browser
3. Upload a logo image (any PNG, JPG, or SVG)
4. **Immediately** click the "Pricing" link in the navbar
5. Wait 15-30 seconds on the pricing page
6. Click "Wax Letter" logo or browser back to return to homepage
7. **Expected Result**: Your generated image should be there waiting for you! ✓

**What this proves**: The Service Worker continued the generation in the background even though you left the page.

---

### Test 2: Tab Switching

1. Upload a logo
2. **Immediately** press `Ctrl+T` (new tab) or switch to another tab
3. Wait 20-30 seconds
4. Switch back to the original tab
5. **Expected Result**: Image is displayed automatically ✓

---

### Test 3: Multiple Tabs

1. Open homepage in Tab 1
2. Open homepage in Tab 2 (new tab)
3. In Tab 1: Upload a logo
4. In Tab 1: Navigate to /pricing
5. Switch to Tab 2
6. **Expected Result**: Tab 2 should receive and display the generated image ✓

---

### Test 4: Check Service Worker Status

**In Chrome DevTools:**

1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. **Expected Result**: You should see `/sw.js` listed as "activated and running"

**In Console:**

1. Open browser console (`F12` → Console tab)
2. Upload a logo
3. **Expected Messages**:
   - "Service Worker registered successfully"
   - "Using Service Worker for background generation"
   - "Generation request sent to Service Worker"
   - (After completion) "Received generated image from Service Worker"

---

### Test 5: Fallback Mode (No Service Worker)

**Simulate Service Worker not available:**

1. Open DevTools → Application → Service Workers
2. Check "Bypass for network" OR unregister the Service Worker
3. Refresh the page
4. Upload a logo
5. Navigate away immediately
6. Return to homepage
7. **Expected Result**: Resume logic kicks in, generation completes ✓

---

### Test 6: Failed Generation & Retry

1. Upload a very large or corrupted image
2. If generation fails 3 times, you should see:
   - Red "Generation failed" overlay
   - "Retry" button
   - "Upload New Logo" button
3. Click "Retry"
4. **Expected Result**: Generation attempts again ✓

---

### Test 7: Cached Result Retrieval

1. Upload a logo
2. Close the browser tab (don't just navigate away, actually close it)
3. Wait 30 seconds
4. Open homepage again in a new tab
5. **Expected Result**: 
   - If Service Worker completed the generation, you'll see the cached result instantly
   - If generation was cancelled, resume logic will kick in

---

## Debugging Tips

### Check if Service Worker is Active

**In browser console:**
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
    if (reg && reg.active) {
        console.log('✓ Service Worker is active');
    } else {
        console.log('✗ Service Worker is not active');
    }
});
```

### Check for Cached Results

**In browser console:**
```javascript
caches.open('image-generation-results-v1').then(cache => {
    cache.match('/generation-result').then(response => {
        if (response) {
            response.json().then(data => {
                console.log('Found cached result:', data);
            });
        } else {
            console.log('No cached result');
        }
    });
});
```

### View localStorage State

**In browser console:**
```javascript
// Check if generation is pending
console.log('Is Generating:', localStorage.getItem('homepage_is_generating'));
console.log('Timestamp:', localStorage.getItem('homepage_generation_timestamp'));
console.log('Attempts:', localStorage.getItem('homepage_generation_attempts'));
console.log('Has file data:', !!localStorage.getItem('homepage_uploaded_file_data'));
```

### Clear All State (Fresh Start)

**In browser console:**
```javascript
// Clear localStorage
localStorage.clear();

// Clear Service Worker cache
caches.delete('image-generation-results-v1');

// Unregister Service Worker (optional)
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
});

// Refresh page
location.reload();
```

---

## Expected Console Logs

### Successful Background Generation

```
Service Worker registered successfully
Using Service Worker for background generation
Generation request sent to Service Worker
(navigate away)
(Service Worker continues in background)
(return to page)
Received generated image from Service Worker
Generation completed successfully
```

### With Resume Logic (Service Worker unavailable)

```
Service Worker not available, using fetch with resume capability
File saved to localStorage for potential resume
(navigate away - request cancelled)
(return to page)
Resuming pending generation...
Service Worker not available, using fetch for resume
Generation completed successfully
```

---

## Performance Metrics

### Measure Background Generation Time

**Add this to browser console before uploading:**

```javascript
let startTime = Date.now();
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'IMAGE_GENERATED') {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ Generation completed in ${elapsed} seconds`);
    }
});
```

Then upload a logo and navigate away to test background processing.

---

## Common Issues & Solutions

### Issue: Service Worker not registering

**Solutions:**
1. Make sure you're using HTTPS or localhost (required for Service Workers)
2. Check browser console for registration errors
3. Clear browser cache and try again
4. Try in Chrome/Edge first (best Service Worker support)

### Issue: Image not appearing after navigation

**Possible causes:**
1. Service Worker not active yet (wait 2-3 seconds after page load)
2. Generation actually failed (check Network tab for API errors)
3. Cache wasn't retrieved (check Application → Cache Storage)

**Debug:**
- Check console for "Received generated image" message
- Check if localStorage has `homepage_generated_image` key
- Check Service Worker status in DevTools

### Issue: "Generation failed" overlay appears

**This is expected behavior if:**
1. Image is invalid/corrupted
2. API server is down
3. Network connection lost
4. Image is too large

**Solution:**
- Click "Retry" to try again
- Or click "Upload New Logo" to start fresh

---

## Production Checklist

Before deploying to production, verify:

- [ ] Service Worker registers successfully
- [ ] Background generation works (Test 1)
- [ ] Cached results are retrieved
- [ ] Fallback works in older browsers
- [ ] Error handling displays retry UI
- [ ] Multiple tabs receive updates
- [ ] HTTPS is enabled (required for Service Worker)
- [ ] API endpoint is accessible
- [ ] Console has no errors

---

## Browser Compatibility Testing

Test in these browsers:

- [ ] Chrome (latest) - Full support expected
- [ ] Edge (latest) - Full support expected
- [ ] Firefox (latest) - Full support expected
- [ ] Safari (latest) - Full support expected
- [ ] Mobile Chrome - Test on actual device
- [ ] Mobile Safari - Test on actual device

For each browser, run **Test 1** (Basic Background Generation) to verify core functionality.

---

## Success Criteria

✓ **Service Worker Implementation is Working if:**

1. Upload → Navigate away → Return = Image is there
2. Console shows "Using Service Worker for background generation"
3. DevTools shows Service Worker as "activated and running"
4. Multiple tabs receive the same generated image
5. Cached results are retrieved on return

✓ **Fallback Implementation is Working if:**

1. Works in browsers without Service Worker support
2. Resume logic kicks in when returning to page
3. Retry UI appears after max attempts
4. Manual retry button works

---

## Need Help?

If background generation isn't working:

1. Check console logs for errors
2. Verify Service Worker is registered (Application tab)
3. Try clearing all state and starting fresh
4. Make sure API endpoint is working (test in Network tab)
5. Try in Chrome first (best debugging tools)

The system has multiple layers of reliability:
- Layer 1: Service Worker (true background processing)
- Layer 2: Resume logic (automatic retry on return)
- Layer 3: Manual retry (user-triggered retry)
- Layer 4: Upload new logo (start fresh)

At least one of these should work!

