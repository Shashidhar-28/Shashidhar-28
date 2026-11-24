# 2048 (HTML5 → Android)

Game files are in `www/`. Open `www/index.html` in a browser to play.

## Build Android app (for Play Store)
```
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "2048" com.yourname.game2048 --web-dir=www
npx cap add android
npx cap sync
npx cap open android   # Android Studio -> Build > Generate Signed Bundle (.aab)
```
Then add AdMob (`@capacitor-community/admob`) for ads, and a Privacy Policy URL before publishing.
