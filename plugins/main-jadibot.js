const { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    jidNormalizedUser,
    delay
} = require('@adiwajshing/baileys')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')
const { makeWASocket } = require('../lib/simple')

if (global.conns instanceof Array) console.log()
else global.conns = []

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let parent = conn
    if (conn.user.jid !== parent.user.jid) return m.reply('Perintah ini hanya bisa digunakan di bot utama!')
    
    if (args[0] === 'list') {
        let text = `*LIST JADIBOT*\n\n`
        text += global.conns.map((v, i) => `${i + 1}. @${v.user.jid.split('@')[0]} (${v.user.name || 'No Name'})`).join('\n')
        return m.reply(text, m.chat, { mentions: global.conns.map(v => v.user.jid) })
    }

    let authFolder = 'sessions'
    let userJid = m.sender.split('@')[0]
    let userFolder = path.join(authFolder, userJid)
    
    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(userFolder)
    const { version } = await fetchLatestBaileysVersion()

    const connectionOptions = {
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Jadibot', 'Chrome', '1.0.0'],
        logger: require('pino')({ level: 'silent' })
    }

    let subConn = makeWASocket(connectionOptions)
    
    if (!state.creds.registered) {
        if (!args[0]) {
            // Default to QR if no number provided
            subConn.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update
                if (qr) {
                    let scanMsg = 'Silahkan scan QR ini untuk menjadi bot sementara\n\n1. Klik titik tiga di pojok kanan atas\n2. Klik Perangkat Tertaut\n3. Klik Tautkan Perangkat\n4. Scan QR ini'
                    let buffer = await qrcode.toBuffer(qr, { scale: 8 })
                    await parent.sendFile(m.chat, buffer, 'qr.png', scanMsg, m)
                }
            })
        } else {
            // Use Pairing Code if number is provided
            let phoneNumber = args[0].replace(/[^0-9]/g, '')
            if (phoneNumber.length < 11) return m.reply('Nomor tidak valid!')
            
            setTimeout(async () => {
                let code = await subConn.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join('-') || code
                await parent.reply(m.chat, `Kode Pairing kamu adalah: *${code}*\n\nMasukkan kode tersebut di WhatsApp kamu (Perangkat Tertaut > Tautkan dengan nomor telepon)`, m)
            }, 3000)
        }
    }

    subConn.ev.on('creds.update', saveCreds)
    
    subConn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'open') {
            subConn.isInit = true
            global.conns.push(subConn)
            await parent.reply(m.chat, `Berhasil terhubung dengan nomor @${subConn.user.jid.split('@')[0]}`, m, { mentions: [subConn.user.jid] })
        }

        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
            if (reason === DisconnectReason.restartRequired) {
                // Restart logic
            } else if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync(userFolder)) {
                    fs.rmSync(userFolder, { recursive: true })
                }
                let index = global.conns.indexOf(subConn)
                if (index > -1) global.conns.splice(index, 1)
            } else {
                let index = global.conns.indexOf(subConn)
                if (index > -1) global.conns.splice(index, 1)
            }
        }
    })

    subConn.ev.on('messages.upsert', async (message) => {
        if (global.handler) await global.handler.call(subConn, message)
    })
}

handler.help = ['jadibot', 'jadibot <nomor>', 'jadibot list']
handler.tags = ['main']
handler.command = /^jadibot$/i

module.exports = handler
