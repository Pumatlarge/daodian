'use strict';

const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});

const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');

async function capture(svgFile, size, outFile) {
  const svg = fs.readFileSync(path.join(assets, svgFile), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }
    img { display: block; width: 100%; height: 100%; }
  </style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`;

  const win = new BrowserWindow({
    width: size,
    height: size,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    webPreferences: {
      offscreen: false,
      backgroundThrottling: false
    }
  });

  await win.loadURL('data:text/html;base64,' + Buffer.from(html).toString('base64'));
  await new Promise((resolve) => setTimeout(resolve, 450));
  const image = await win.webContents.capturePage();
  fs.writeFileSync(outFile, image.toPNG());
  win.destroy();
  console.log('wrote', outFile, image.getSize());
}

app.whenReady().then(async () => {
  try {
    await capture('icon.svg', 512, path.join(assets, 'icon.png'));
    const tray128 = path.join(assets, 'tray-128.png');
    await capture('tray.svg', 128, tray128);
    const source = nativeImage.createFromPath(tray128);
    fs.writeFileSync(path.join(assets, 'tray.png'), source.resize({ width: 32, height: 32, quality: 'best' }).toPNG());
    fs.writeFileSync(
      path.join(assets, 'tray@2x.png'),
      source.resize({ width: 64, height: 64, quality: 'best' }).toPNG()
    );
    fs.unlinkSync(tray128);
    console.log('tray icons written');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    app.quit();
  }
});
