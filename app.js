const os = require('os')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { app, BrowserWindow } = require('electron')

const localPath = path.join(os.homedir(), 'AppData/Roaming/electron-app')

app.on('ready', async () => {

    // 尝试与下载服务器建立链接
    // 将文件下载到系统缓存目录 os.tmpdir()
    // 创建本地文件存放目录
    // 文件下载失败，使用自带静态资源
    // 将下载的或者自带的静态资源解压到本地文件存放目录
    // 启动静态资源服务，服务只想本地文件存放目录

    fs.mkdirSync(localPath, { recursive: true }) // 创建本地文件存放目录

    const win = new BrowserWindow({
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadURL('http://127.0.0.1:3000')
})

function downloadDist () {
    axios.get({})
}
