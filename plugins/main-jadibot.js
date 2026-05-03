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
const fetch = require('node-fetch')
const { makeWASocket } = require('../lib/simple')
const { handler } = require('../handler')

if (global.conns instanceof Array) console.log('global.conns already exists')
else global.conns = []

let handler_jadibot = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let parent = conn
    let user = global.db.data.users[m.sender]

    // Cek Akses
    let isPremium = isOwner || user.premium || false
    let hasJadibotAccess = isPremium || user.jadibot || false
    
    // Fitur List Jadibot
    if (args[0] === 'list') {
        let text = `*LIST JADIBOT AKTIF*\n\n`
        if (global.conns.length === 0) return m.reply('Tidak ada bot yang sedang aktif.')
        text += global.conns.map((v, i) => {
            return `${i + 1}. @${v.user.jid.split('@')[0]} (${v.user.name || 'No Name'})\n   Status: Aktif ✅`
        }).join('\n\n')
        return m.reply(text, m.chat, { mentions: global.conns.map(v => v.user.jid) })
    }

    // Fitur Stop Jadibot
    if (args[0] === 'stop') {
        if (conn.user.jid !== parent.user.jid) {
            await m.reply('Mematikan bot...')
            await conn.logout()
            return
        } else {
            return m.reply(`Gunakan perintah ini di chat sub-bot yang ingin dimatikan atau ketik *.stopjadibot [nomor]*`)
        }
    }

    // --- LOGIKA PEMBAYARAN OTOMATIS ---
    if (args[0] === 'pay') {
        let type = args[1] // 'premium' atau 'jadibot'
        if (!['premium', 'jadibot'].includes(type)) return m.reply(`Pilih tipe pembayaran:\n\n• *${usedPrefix + command} pay premium* (Rp 20.000)\n• *${usedPrefix + command} pay jadibot* (Rp 10.000)`)
        
        const amount = type === 'premium' ? 20000 : 10000
        const order_id = (type === 'premium' ? 'PREM-' : 'JB-') + Date.now()
        const project = global.pakasir_slug
        const api_key = global.pakasir_key
        
        try {
            m.reply(`Sedang membuat invoice QRIS untuk *${type.toUpperCase()}*...`)
            let res = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project, order_id, amount, api_key })
            })
            let json = await res.json()
            
            if (json.status === 'success') {
                let qrisData = json.data.qr_content
                let buffer = await qrcode.toBuffer(qrisData, { scale: 8 })
                let caption = `*─── [ INVOICE ${type.toUpperCase()} ] ───*\n\n`
                caption += `Layanan: *${type === 'premium' ? 'Premium Full Akses' : 'Akses Jadibot Saja'}*\n`
                caption += `Total Bayar: *Rp ${amount.toLocaleString()}*\n`
                caption += `Order ID: \`${order_id}\`\n\n`
                caption += `Silahkan scan QRIS di atas.\n`
                caption += `Status akan dicek otomatis setiap 10 detik.\n\n`
                caption += `_Berlaku untuk 30 hari._`
                
                await parent.sendFile(m.chat, buffer, 'qris.png', caption, m)
                
                let checkCount = 0
                let interval = setInterval(async () => {
                    checkCount++
                    try {
                        let checkRes = await fetch(`https://app.pakasir.com/api/transactiondetail?project=${project}&amount=${amount}&order_id=${order_id}&api_key=${api_key}`)
                        let checkJson = await checkRes.json()
                        
                        if (checkJson.transaction && checkJson.transaction.status === 'completed') {
                            clearInterval(interval)
                            if (type === 'premium') {
                                user.premium = true
                                user.premiumTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
                            } else {
                                user.jadibot = true
                                user.jadibotTime = Date.now() + (30 * 24 * 60 * 60 * 1000)
                            }
                            await parent.reply(m.chat, `✅ *PEMBAYARAN BERHASIL!*\n\nKamu sekarang memiliki akses *${type.toUpperCase()}* selama 30 hari.\nSilahkan coba gunakan perintahnya kembali.`, m)
                        }
                    } catch (e) {
                        console.error('Check Status Error:', e)
                    }
                    if (checkCount > 60) clearInterval(interval)
                }, 10000)
                return
            } else {
                // Berikan pesan error spesifik dari Pakasir
                let errorMsg = json.message || 'Gagal membuat invoice.'
                return m.reply(`*Pesan Error:* ${errorMsg}\n\nPastikan *Project Slug* dan *API Key* di \`config.js\` sudah benar.`)
            }
        } catch (e) {
            console.error(e)
            return m.reply('Terjadi kesalahan koneksi saat menghubungi server Pakasir.')
        }
    }

    // Fitur Stop Jadibot Berdasarkan Nomor (Hanya Owner)
    if (command === 'stopjadibot' && isOwner) {
        let jid = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.quoted ? m.quoted.sender : ''
        if (!jid) return m.reply('Masukkan nomor bot yang ingin dimatikan!')
        let index = global.conns.findIndex(v => v.user.jid === jid)
        if (index === -1) return m.reply('Nomor tersebut tidak ada dalam daftar bot aktif.')
        await global.conns[index].logout()
        return m.reply(`Bot @${jid.split('@')[0]} telah dimatikan.`, m.chat, { mentions: [jid] })
    }

    // Proteksi Akses Jadibot
    if (!hasJadibotAccess) {
        let text = `*─── [ AKSES JADIBOT ] ───*\n\n`
        text += `Maaf, fitur ini hanya untuk user yang berlangganan.\n\n`
        text += `*Pilihan Paket:*\n`
        text += `1. *Paket Jadibot Saja* (Rp 10.000/bln)\n`
        text += `   Ketik: *${usedPrefix + command} pay jadibot*\n\n`
        text += `2. *Paket Premium Full* (Rp 20.000/bln)\n`
        text += `   Ketik: *${usedPrefix + command} pay premium*\n\n`
        text += `_Keuntungan Premium: Semua fitur bot + Jadibot._\n`
        text += `_Keuntungan Jadibot: Hanya fitur bot di nomor kamu._`
        return conn.reply(m.chat, text, m)
    }

    if (conn.user.jid !== parent.user.jid) return m.reply('Perintah ini hanya bisa digunakan di bot utama!')

    let authFolder = 'sessions'
    let userJid = m.sender.split('@')[0]
    let userFolder = path.join(authFolder, userJid)
    
    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true })
    }

    async function startSubBot() {
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
            if (!args[0] || isNaN(args[0].replace(/[^0-9]/g, ''))) {
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
                
                await delay(5000)
                try {
                    let code = await subConn.requestPairingCode(phoneNumber)
                    code = code?.match(/.{1,4}/g)?.join('-') || code
                    await parent.reply(m.chat, `Kode Pairing kamu adalah: *${code}*\n\nMasukkan kode tersebut di WhatsApp kamu (Perangkat Tertaut > Tautkan dengan nomor telepon)`, m)
                } catch (e) {
                    console.error('Pairing Error:', e)
                }
            }
        }

        subConn.ev.on('creds.update', saveCreds)
        
        subConn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            
            if (connection === 'open') {
                subConn.isInit = true
                if (!global.conns.some(v => v.user.jid === subConn.user.jid)) {
                    global.conns.push(subConn)
                }
                await parent.reply(m.chat, `Berhasil terhubung dengan nomor @${subConn.user.jid.split('@')[0]}`, m, { mentions: [subConn.user.jid] })
            }

            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
                if (reason === DisconnectReason.restartRequired) {
                    console.log('Sub-bot restart required. Reconnecting...')
                    startSubBot()
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log('Sub-bot logged out.')
                    if (fs.existsSync(userFolder)) {
                        fs.rmSync(userFolder, { recursive: true })
                    }
                    let index = global.conns.findIndex(v => v.user.jid === subConn.user.jid)
                    if (index > -1) global.conns.splice(index, 1)
                } else {
                    console.log('Sub-bot closed. Reason:', reason)
                    let index = global.conns.findIndex(v => v.user.jid === subConn.user.jid)
                    if (index > -1) global.conns.splice(index, 1)
                }
            }
        })

        subConn.ev.on('messages.upsert', handler.bind(subConn))
        return subConn
    }

    startSubBot()
}

handler_jadibot.help = ['jadibot', 'jadibot <nomor>', 'jadibot list', 'jadibot stop', 'stopjadibot <nomor>']
handler_jadibot.tags = ['main']
handler_jadibot.command = /^(jadibot|clone|stopjadibot)$/i

module.exports = handler_jadibot
