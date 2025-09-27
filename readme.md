npm run start


# for use in npm scripts
npm install electron-packager --save-dev

# for use from cli
npm install electron-packager -g


npm install electron-builder --save-dev

npx electron-packager . "My Electron App" --platform=win32 --arch=x64 --out=dist --overwrite --icon=build/icon.ico
