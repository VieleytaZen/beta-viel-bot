global.owner = ['6285161444491']  
global.mods = ['6285161444491'] 
global.prems = ['6285161444491']
global.nameowner = 'Viel'
global.numberowner = '6285161444491'
global.mail = 'vieleytazen@gmail.com' 
global.gc = 'https://chat.whatsapp.com/BBl1lh2NlDU1cxAhjZlpnT'
global.maingc = '120363161802738140@g.us' // ID Grup utama, isi ID grup untuk membatasi subbot
global.instagram = 'https://instagram.com/vieleyta_zen'
global.wm = '© Viel'
global.wait = '_*Tunggu sedang di proses...*_'
global.eror = '_*Server Error*_'
global.stiker_wait = '*⫹⫺ Stiker sedang dibuat...*'
global.packname = 'VieleytaZen'
global.author = 'ig: vieleyta_zen'
global.maxwarn = '5' // Peringatan maksimum

// Pakasir Config
global.pakasir_slug = 'viel-bot'
global.pakasir_key = 'OQvowQjubQmC44isD93tmPnpkpdVBCQX'

// Prefix
global.prefix = './#'
//INI WAJIB DI ISI!//
global.lann = 'beta-rxyzal'
global.aksesKey = '' // Register dan buy 
//Daftar terlebih dahulu https://api.betabotz.eu.org

global.APIs = {   
  lann: 'https://api.betabotz.eu.org',
}
global.APIKeys = { 
  'https://api.betabotz.eu.org': global.lann, 
}

// Jadibot Restoration
if (global.conns instanceof Array) console.log()
else global.conns = []

let fs = require('fs')
let path = require('path')
let chalk = require('chalk')

async function restoreSessions() {
    let authFolder = 'sessions'
    if (!fs.existsSync(authFolder)) return
    let files = fs.readdirSync(authFolder)
    for (let file of files) {
        if (file === 'creds.json' || !fs.statSync(path.join(authFolder, file)).isDirectory()) continue
    }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})
