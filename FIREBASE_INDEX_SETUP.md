# Firebase Index Setup Guide

## What's the Issue?

You're seeing this error:
```
FirebaseError: The query requires an index.
```

This happens because Firestore needs a **composite index** to query campaigns by `userId` AND order by `createdAt` at the same time.

## Quick Fix (Automatic)

1. **Click the link in your error message** - It looks like this:
   ```
   https://console.firebase.google.com/v1/r/project/wax-letter/firestore/indexes?create_composite=...
   ```

2. **Click "Create Index"** in the Firebase Console

3. **Wait 2-3 minutes** for the index to build

4. **Refresh your dashboard** - Campaigns should now appear!

## Manual Fix (If the link doesn't work)

1. Go to [Firebase Console](https://console.firebase.google.com/)

2. Select your project: **wax-letter**

3. Go to **Firestore Database** → **Indexes** tab

4. Click **"Create Index"**

5. Set up the index:
   - **Collection ID**: `campaigns`
   - **Fields to index**:
     - Field: `userId`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
   - **Query scope**: Collection

6. Click **"Create"**

7. Wait for the index to build (status will change from "Building" to "Enabled")

## Current Workaround

The dashboard has a fallback that:
1. First tries to query with ordering (requires index)
2. If that fails, queries without ordering (works without index)
3. If that also fails, loads ALL campaigns (shows yours + unclaimed ones)

So your campaigns **should still show up** even without the index, they just won't be sorted by date.

## After Creating the Index

Once the index is created:
- Queries will be faster
- Campaigns will be properly sorted by creation date (newest first)
- No more error messages in the console

## Need Help?

If you're still having issues:
1. Check the browser console (F12) for error messages
2. Verify you're logged in (check top right of dashboard)
3. Make sure campaigns exist in Firestore (check Firebase Console → Firestore Database)
4. Look for the debug logs:
   ```
   🔍 Fetching campaigns for user: [your-id]
   📊 Total campaigns in database: X
   ✅ Showing Y campaigns
   ```

