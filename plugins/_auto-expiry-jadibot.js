const fs = require('fs')
const path = require('path')

let handler = m => m
handler.before = async function (m, { conn }) {
    // Jalankan pengecekan setiap 1 jam sekali agar tidak memberatkan server
    this.lastExpiryCheck = this.lastExpiryCheck || 0
    if (new Date() - this.lastExpiryCheck < 3600000) return
    this.lastExpiryCheck = +new Date()

    let users = global.db.data.users
    let now = Date.now()
    let authFolder = 'sessions'

    for (let jid in users) {
        let user = users[jid]
        
        // --- 1. PENGINGAT 24 JAM SEBELUM MATI ---
        let expiryTime = user.premium ? user.premiumTime : 0
        if (expiryTime > 0) {
            let timeLeft = expiryTime - now
            let oneDay = 24 * 60 * 60 * 1000
            
            // Jika sisa waktu antara 23-24 jam dan belum pernah dikirim pengingat hari ini
            if (timeLeft > 0 && timeLeft <= oneDay && !user.expiryReminderSent) {
                let message = `*─── [ PENGINGAT MASA AKTIF ] ───*\n\n`
                message += `Halo @${jid.split('@')[0]},\n`
                message += `Masa aktif langganan *PREMIUM* kamu akan habis dalam *24 jam*.\n\n`
                message += `Segera perpanjang agar bot kamu tetap aktif!\n`
                message += `Ketik: *.belipremium* untuk perpanjang.`
                
                await conn.reply(jid, message, null, { mentions: [jid] })
                user.expiryReminderSent = true // Tandai agar tidak spam
            }
        }

        // --- 2. PENGHAPUSAN SESI JIKA EXPIRED ---
        // Jika user bukan owner, dan waktu premium sudah habis
        if (!global.owner.some(v => v === jid.split('@')[0])) {
            if (user.premium && user.premiumTime < now) {
                
                // Matikan status akses
                user.premium = false
                user.premiumTime = 0
                user.expiryReminderSent = false // Reset pengingat untuk langganan berikutnya

                // Cari dan matikan koneksi sub-bot jika sedang aktif
                let index = global.conns.findIndex(v => v.user && v.user.jid === jid)
                if (index !== -1) {
                    try {
                        await global.conns[index].logout()
                        global.conns.splice(index, 1)
                    } catch (e) {
                        console.error('Gagal logout sub-bot expired:', e)
                    }
                }

                // Hapus folder sesi secara permanen
                let userFolder = path.join(authFolder, jid.split('@')[0])
                if (fs.existsSync(userFolder)) {
                    try {
                        fs.rmSync(userFolder, { recursive: true, force: true })
                        console.log(`Sesi jadibot ${jid} dihapus karena expired.`)
                        
                        // Kirim notifikasi akhir
                        await conn.reply(jid, `*─── [ MASA AKTIF HABIS ] ───*\n\nMasa aktif langganan premium kamu telah habis. Sesi bot telah diputuskan dan dihapus.\nTerima kasih telah berlangganan!`, null)
                    } catch (e) {
                        console.error('Gagal hapus folder sesi expired:', e)
                    }
                }
            }
        }
    }
}

module.exports = handler
