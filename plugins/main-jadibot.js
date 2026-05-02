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
const pino = require('pino')
const { makeWASocket } = require('../lib/simple')
const { handler } = require('../handler')

if (global.conns instanceof Array) console.log('global.conns already exists')
else global.conns = []

let handler_jadibot = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let parent = conn
    if (conn.user.jid !== parent.user.jid) return m.reply('Perintah ini hanya bisa digunakan di bot utama!')
    
    if (args[0] === 'list') {
        let text = `*LIST JADIBOT*\n\n`
        if (global.conns.length === 0) return m.reply('Tidak ada bot yang sedang aktif.')
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
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: false,
    }

    let subConn = makeWASocket(connectionOptions)
    
    if (!state.creds.registered) {
        if (!args[0]) {
            subConn.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update
                if (qr) {
                    let scanMsg = 'Silahkan scan QR ini untuk menjadi bot sementara\n\n1. Klik titik tiga di pojok kanan atas\n2. Klik Perangkat Tertaut\n3. Klik Tautkan Perangkat\n4. Scan QR ini'
                    let buffer = await qrcode.toBuffer(qr, { scale: 8 })
                    await parent.sendFile(m.chat, buffer, 'qr.png', scanMsg, m)
                }
            })
        } else {
            let phoneNumber = args[0].replace(/[^0-9]/g, '')
            if (phoneNumber.length < 10) return m.reply('Nomor tidak valid!')
            
            // Wait for socket to be ready to request pairing code
            await delay(5000)
            try {
                let code = await subConn.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join('-') || code
                await parent.reply(m.chat, `Kode Pairing kamu adalah: *${code}*\n\nMasukkan kode tersebut di WhatsApp kamu (Perangkat Tertaut > Tautkan dengan nomor telepon)`, m)
            } catch (e) {
                console.error('Pairing Error:', e)
                m.reply('Gagal meminta kode pairing. Pastikan nomor benar dan coba lagi nanti.')
            }
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
                console.log('Sub-bot restart required.')
                // Ideally, re-run the start logic here
            } else if (reason === DisconnectReason.loggedOut) {
                console.log('Sub-bot logged out.')
                if (fs.existsSync(userFolder)) {
                    fs.rmSync(userFolder, { recursive: true })
                }
                let index = global.conns.indexOf(subConn)
                if (index > -1) global.conns.splice(index, 1)
            } else {
                console.log('Sub-bot closed. Reason:', reason)
                let index = global.conns.indexOf(subConn)
                if (index > -1) global.conns.splice(index, 1)
            }
        }
    })

    subConn.ev.on('messages.upsert', handler.bind(subConn))
}

handler_jadibot.help = ['jadibot', 'jadibot <nomor>', 'jadibot list']
handler_jadibot.tags = ['main']
handler_jadibot.command = /^(jadibot|clone)$/i

module.exports = handler_jadibot
