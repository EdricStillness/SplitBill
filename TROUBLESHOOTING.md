# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. React Hooks Error / Multiple React Versions

**Error:**
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
Cannot read properties of null (reading 'useState')
```

**Cause:** 
- React 19 compatibility issue with Expo Router web
- Multiple React versions in node_modules
- Metro bundler cache issue

**Solutions:**

#### Solution A: Use Native Platform (Recommended)
Don't use web platform, use iOS Simulator or Android Emulator instead:

```bash
cd apps/mobile
npx expo start
# Then press 'i' for iOS or 'a' for Android
# DON'T press 'w' for web
```

#### Solution B: Clear Cache
```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
npx expo start --clear
```

#### Solution C: Kill Existing Process
If port 8081 is already in use:
```bash
# Find the process
lsof -i :8081
# Kill it (replace PID with actual process ID)
kill -9 <PID>
```

### 2. Metro Bundler Port Already in Use

**Error:**
```
Port 8081 is running this app in another window
```

**Solution:**
```bash
# Option 1: Kill the process
kill -9 $(lsof -t -i:8081)

# Option 2: Use different port
npx expo start --port 8082
```

### 3. Expo Router Context Error

**Error:**
```
node_modules/expo-router/_ctx.web.js:Invalid call at line 2: process.env.EXPO_ROUTER_APP_ROOT
```

**Cause:** Web platform issue with Expo Router

**Solution:** Use native platforms (iOS/Android) instead of web

### 4. TypeScript Linting Errors

**Error:**
```
JSX element class does not support attributes
'View' cannot be used as a JSX component
```

**Cause:** React Native types conflict with React 19

**Solution:** These are IDE warnings only. App runs fine. Can ignore or:
```typescript
// Add to top of problematic files
// @ts-nocheck
```

### 5. Backend API Not Connecting from Mobile

**Error:**
```
Failed to fetch
Network request failed
```

**Solutions:**

For iOS Simulator:
```bash
# Use localhost
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

For Android Emulator:
```bash
# Use special IP
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```

For Physical Device:
```bash
# Use computer's local IP
EXPO_PUBLIC_API_URL=http://192.168.1.x:4000/api
# Find your IP with: ifconfig | grep "inet "
```

### 6. AsyncStorage Not Found

**Error:**
```
AsyncStorage is null
```

**Solution:**
```bash
cd apps/mobile
npm install @react-native-async-storage/async-storage
npx expo prebuild --clean
```

### 7. Image Picker Not Working

**Error:**
```
expo-image-picker is not available
```

**Solution:**
Make sure to grant permissions:
- iOS: Camera roll permission
- Android: Storage permission

Or use web fallback (file input).

### 8. Lottie Animation Not Showing

**Error:**
```
Cannot find module '@/assets/lottie/loading.json'
```

**Solution:**
Ensure Lottie files exist in `apps/mobile/assets/lottie/`:
- `loading.json`
- `success.json`

Download from [LottieFiles](https://lottiefiles.com/) if missing.

### 9. Victory Charts Not Rendering

**Error:**
```
VictoryPie is not a function
```

**Solution:**
```bash
cd apps/mobile
npm install victory-native react-native-svg
```

### 10. Build Errors

**Backend:**
```bash
cd apps/api
rm -rf dist node_modules
npm install
npm run build
```

**Mobile:**
```bash
cd apps/mobile
rm -rf node_modules .expo
npm install
npx expo start --clear
```

## Recommended Development Setup

### 1. Terminal Setup
Use **3 terminals**:

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Mobile:**
```bash
cd apps/mobile
npx expo start
```

**Terminal 3 - Testing/Commands:**
```bash
# Use for running tests, git commands, etc.
```

### 2. Testing Workflow

**Test Backend:**
```bash
cd apps/api
npm test
```

**Test Mobile (Manual):**
1. Open Expo Dev Tools
2. Press `i` for iOS Simulator
3. Wait for app to load
4. Test features manually

### 3. Clear Everything (Nuclear Option)

If all else fails:

```bash
# From project root
cd apps/api
rm -rf node_modules dist
npm install

cd ../mobile
rm -rf node_modules .expo node_modules/.cache
npm install

# Restart everything
cd ../api && npm run dev &
cd ../mobile && npx expo start --clear
```

## Platform-Specific Notes

### iOS
- ✅ Fully supported
- ✅ Simulator works great
- ⚠️ Need Xcode installed

### Android
- ✅ Fully supported
- ✅ Emulator works
- ⚠️ Use IP `10.0.2.2` for localhost
- ⚠️ Need Android Studio installed

### Web
- ⚠️ Limited support (React 19 issues)
- ❌ Expo Router has bugs on web
- 💡 **Use native platforms instead**

## Performance Tips

1. **Use React Query DevTools** (already configured)
2. **Monitor Metro Bundler** output for warnings
3. **Check Network Tab** for API calls
4. **Use React DevTools** for debugging
5. **Enable Fast Refresh** (enabled by default)

## Getting Help

1. Check this troubleshooting guide
2. Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture details
3. Check [QUICKSTART.md](./QUICKSTART.md) for setup guide
4. Search [Expo Documentation](https://docs.expo.dev/)
5. Search [React Native Documentation](https://reactnative.dev/)

## Known Limitations

- **No web support** (due to React 19 + Expo Router issues)
- **In-memory storage** (backend restarts lose data)
- **Mock exchange rates** (not real-time)
- **No authentication** (add in production)
- **No database** (add in production)

---

**Most common fix:** Just use iOS/Android, avoid web! 📱

