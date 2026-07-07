# 👉 START HERE - Ibha KSP Testing

## 🎯 YOU ARE HERE

Both servers are running. The login bug is fixed. Everything is ready to test!

---

## ✅ STEP 1: Check Your Browser

Your browser should already be open at: **http://localhost:3000**

**If not,** open it manually or click this in Windows:
```
Start → Run → http://localhost:3000
```

You should see:
- Dark themed login page
- "Ibha" logo and title
- "Intelligent Crime Analytics for Karnataka Police"
- Login form with email and password fields

---

## ✅ STEP 2: Login

Use these credentials (copy-paste recommended):

```
Email:    rajesh.kumar@ksp.gov.in
Password: password123
```

Click **"Sign In"** button.

**Expected:** Page redirects to `/chat` within 1-2 seconds.

**If it doesn't work:**
- Check browser console (F12) for errors
- Read troubleshooting section below

---

## ✅ STEP 3: Test Chat

You should now see:
- Navigation bar at top: "Chat | Trends | Network | Admin"
- User info: "Rajesh Kumar (Constable)"
- Chat interface with input box

**Type this query:**
```
Show theft cases in my station in last 30 days
```

Press Enter or click Send.

**Expected:** Within 2-3 seconds, you should see:
- List of FIR cases
- Each showing: Crime Number, Brief Facts, Date
- "Explanation" section at bottom

---

## ✅ STEP 4: Explore Other Features

### Test Trends Page
1. Click "Trends" in the navigation bar
2. You should see:
   - Bar chart of crime hotspots
   - Line chart of monthly trends
   - Text summary

### Test Network Page
1. Click "Network" in the navigation bar
2. Enter Person ID: `PERSON_001`
3. Click "Load Network"
4. You should see a graph visualization

### Test Different User Roles
1. Click your name → Logout
2. Login as DSP: `lakshmi.rao@ksp.gov.in` / `password123`
3. Run the same theft query
4. Notice: DSP sees MORE cases (district-wide access)

---

## 🐛 TROUBLESHOOTING

### Issue: "Network Error" on Login
**Solution:**
1. Check if backend is running:
   - Open http://localhost:8000/health in browser
   - Should show: `{"status": "ok"}`
2. If not, restart backend:
   ```powershell
   cd c:\Projects\Ibha\ibha-ksp
   python local_server.py
   ```

### Issue: Login Button Does Nothing
**Check:**
1. Open browser console (F12)
2. Look for red errors
3. Check Network tab - is there a POST request to `/api/v1/auth/login`?
4. What status code? (Should be 200)

**If 400/500 error:**
- Check backend terminal for error messages
- Run test script: `python test_login.py`

### Issue: Page is Blank
**Solution:**
1. Restart frontend:
   ```powershell
   cd c:\Projects\Ibha\ibha-ksp\web
   npm run dev
   ```
2. Wait for "Ready in X seconds" message
3. Refresh browser

### Issue: Chat Returns No Results
**This might be expected!** 
- Constable users only see their station's cases
- Koramangala station might not have theft cases in the last 30 days

**To verify:**
1. Try: "Show all cases in my station" (no time filter)
2. Or login as DSP to see district-wide data
3. Or check database:
   ```powershell
   psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"
   ```

---

## 📊 WHAT TO REPORT BACK

After testing, tell me:

### ✅ What Worked
- [ ] Login successful?
- [ ] Chat page loaded?
- [ ] Query returned results?
- [ ] Trends page rendered charts?
- [ ] Network graph displayed?
- [ ] Logout worked?

### ❌ What Didn't Work
- Exact error message (copy-paste)
- Which page/feature
- What you were trying to do
- Browser console errors (screenshot)

---

## 📚 MORE HELP

- **Detailed Testing:** Read `TEST_GUIDE.md`
- **System Status:** Read `READY_TO_TEST.md`
- **What Was Fixed:** Read `SESSION_SUMMARY.md`
- **Demo Script:** Read `DEMO_WALKTHROUGH.md`

---

## 🎬 TL;DR - 30 Second Test

```
1. Go to: http://localhost:3000
2. Login: rajesh.kumar@ksp.gov.in / password123
3. Type: "Show theft cases"
4. See results? ✅ SUCCESS!
5. No results or error? ❌ Report back with error message
```

---

**That's it! Start testing and let me know what you find! 🚀**
