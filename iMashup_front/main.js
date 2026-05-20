import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  })

  // 设置淘宝镜像环境变量
  process.env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
  process.env.ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 初始化应用
app.whenReady().then(() => {
  createWindow()

  // 处理流程数据加载
  ipcMain.handle('load-flow-data', async () => {
    const possiblePaths = [
      path.join(__dirname, 'dist', 'assets', 'flowData.json'),
      path.join(__dirname, 'public', 'flowData.json'),
      path.join(__dirname, 'src', 'assets', 'flowData.json')
    ]

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        }
      } catch (error) {
        console.warn(`读取 ${filePath} 失败:`, error)
      }
    }
    throw new Error('未找到 flowData.json')
  })

  // 处理构建请求
  ipcMain.handle('trigger-build', async (event, flowData) => {
    try {
      // 写入流程数据到多个位置
      const writePaths = [
        path.join(__dirname, 'public', 'flowData.json'),
        path.join(__dirname, 'dist', 'assets', 'flowData.json'),
        path.join(__dirname, 'src', 'assets', 'flowData.json')
      ]

      for (const filePath of writePaths) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, JSON.stringify(flowData))
      }

      return new Promise((resolve, reject) => {
        exec('npm run make:win', {
          cwd: __dirname,
          env: {
            ...process.env,
            ELECTRON_BUILDER_SKIP_WINE_CHECK: 'true',
            NODE_OPTIONS: '--openssl-legacy-provider'
          }
        }, (error, stdout, stderr) => {
          if (error) {
            reject(stderr || error.message)
          } else {
            resolve(stdout)
          }
        })
      })
    } catch (error) {
      throw error
    }
  })

  // 打开文件夹
  ipcMain.handle('open-folder', (event, folderPath) => {
    shell.openPath(path.resolve(__dirname, folderPath))
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 确保单实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit()
}