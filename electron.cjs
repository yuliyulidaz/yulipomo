const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,        // 투명 창을 위해 테두리 제거
    transparent: true,   // 배경 투명
    alwaysOnTop: true,   // 항상 위에
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 빌드된 리액트 파일(html)을 가져오는 부분
  // 'dist' 폴더 안에 있는 index.html을 엽니다.
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});