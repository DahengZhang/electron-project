const os = require('os')
const fs = require('fs')
const path = require('path')
const http = require('http')
const axios = require('axios')
const AdmZip = require('adm-zip')
const moment = require('moment')
const Koa = require('koa')
const static = require('koa-static')
const { app, BrowserWindow } = require('electron')

const { updateServer } = require('./config/servers')
const localTmpPath = path.join(os.tmpdir(), 'dist.zip')
const localDistPath = path.join(os.homedir(), 'AppData/Roaming/xzff')
const logFilePath = path.join(os.homedir(), 'AppData/Roaming/xzff/log.txt')

const serve = new Koa()
serve.use(static(localDistPath))

app.on('ready', async () => {
    log(`本地版本${app.getVersion()}`)
    log(`程序安装路径${path.dirname(app.getAppPath())}`)
    // 创建本地文件目录
    fs.mkdirSync(localDistPath, { recursive: true })
    // 创建日志
    log('创建本地文件目录')
    try {
        // 下载最新的包
        await downloadDist()
        log('下载最新的包')
    } catch (err) {
        // 下载失败，将自带的包拷贝到临时目录
        fs.copyFileSync(path.join(__dirname, 'dist.zip'), localTmpPath)
        log(`${err} 使用原始包`)
    }
    // 解压包
    if (!unzipFile()) {
        return
    }
    log('解压包')
    // 获取可用端口
    const port = await checkPort(3000)
    log(`获取可用端口${port}`)
    serve.listen(port, () => console.log(`serve is running at ${port}...`))
    // 创建窗体
    const win = createWin()
    win.loadURL(`http://127.0.0.1:${port}`)
    win.once('ready-to-show', () => {
        win.show()
    })
})

// 获取可用端口
function checkPort (port) {
    const serve = http.createServer().listen(port)
    return new Promise((resolve, _) => {
        serve.on('listening', () => {
            serve.close()
            resolve(port)
        })
        serve.on('error', async () => {
            resolve(await checkPort(port + 1))
        })
    })
}

// 创建窗口
function createWin (option = {}) {
    return new BrowserWindow(Object.assign({}, {
        width: 800,
        height: 500,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    }, option))
}

// 下载最新的包
async function downloadDist () {
    return new Promise((resolve, reject) => {
        axios({
            url: `${updateServer}/dist.zip`,
            method: 'GET',
            responseType: 'stream'
        }).then(res => {
            res.data.pipe(fs.createWriteStream(localTmpPath)).on('finish', e => {
                resolve('download success')
            }).on('error', e => {
                reject('write file error')
            })
        }).catch(err => {
            reject(`${updateServer}/dist.zip download error`)
        })
    })
}

// 解压包
function unzipFile () {
    try {
        const unzip = new AdmZip(localTmpPath)
        unzip.extractAllToAsync(localDistPath)
        return true
    } catch (err) {
        log('unzip error')
        return false
    }
}

// 日志系统
function log (content) {
    fs.appendFileSync(logFilePath, `${moment().format('YYYY/MM/DD HH:mm:ss')} ${content}\n`)
}
