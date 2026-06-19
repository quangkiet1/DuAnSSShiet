/**
 * GradeSync Desktop - Electron Main Process
 * Starts Express backend then opens the app in a native window.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');

let mainWindow;

/**
 * Start the Express backend server
 */
async function startServer() {
  // Set env for production / offline mode
  process.env.PORT = process.env.PORT || '5000';
  process.env.NODE_ENV = 'production';

  const { startServer } = require('./server');
  return startServer();
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'GradeSync - So sánh bảng điểm',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f3f4f6',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false, // Ẩn cho đến khi ready-to-show
  });

  // Tắt menu bar
  Menu.setApplicationMenu(null);

  // Hiện cửa sổ khi đã load xong (tránh màn hình trắng nháy)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Mở link ngoài bằng trình duyệt hệ thống
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load giao diện từ backend Express
  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Khởi động khi Electron sẵn sàng
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      'Lỗi khởi động GradeSync',
      `Không thể khởi động phần mềm:\n\n${error.message}\n\nVui lòng khởi động lại ứng dụng.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
