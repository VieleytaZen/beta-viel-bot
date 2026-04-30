const axios = require('axios');
const qrcode = require('qrcode');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let amount = 10000; // Harga fixed Rp 10.000
    let days = 30; // Durasi 30 hari
    let orderId = 'PREM-' + Date.now() + '-' + m.sender.split('@')[0];

    m.reply(global.wait);

    try {
        // 1. Create Transaction in Pakasir
        const createRes = await axios.post('https://app.pakasir.com/api/transactioncreate/qris', {
            project: global.pakasir_slug,
            api_key: global.pakasir_key,
            amount: amount,
            order_id: orderId
        });

        if (createRes.data.status !== 'success') {
            return m.reply(`*Gagal membuat transaksi!*\n\nRespon: ${JSON.stringify(createRes.data)}`);
        }

        let qrString = createRes.data.qr_string;
        let qrBuffer = await qrcode.toBuffer(qrString);

        let caption = `
*───〔 BELI PREMIUM 〕───*

💎 *Tipe:* Premium Membership
⏳ *Durasi:* ${days} Hari
💰 *Harga:* Rp ${amount.toLocaleString()}
🆔 *Order ID:* ${orderId}

Silakan scan QRIS di atas untuk mendapatkan akses Premium. 
Pembayaran akan dicek otomatis dalam waktu 5 menit.
`.trim();

        await conn.sendFile(m.chat, qrBuffer, 'qris.png', caption, m);

        conn.topup_prem = conn.topup_prem ? conn.topup_prem : {};
        conn.topup_prem[m.sender] = {
            orderId,
            amount,
            days,
            time: Date.now()
        };

        // 2. Polling Status
        let interval = setInterval(async () => {
            try {
                const checkRes = await axios.get(`https://app.pakasir.com/api/transactiondetail`, {
                    params: {
                        project: global.pakasir_slug,
                        api_key: global.pakasir_key,
                        order_id: orderId,
                        amount: amount
                    }
                });

                if (checkRes.data.status === 'success' && checkRes.data.data.status === 'PAID') {
                    clearInterval(interval);
                    clearTimeout(timeout);

                    let user = global.db.data.users[m.sender];
                    let now = new Date().getTime();
                    
                    if (user.premiumTime > now) {
                        user.premiumTime += days * 86400000;
                    } else {
                        user.premiumTime = now + (days * 86400000);
                    }
                    user.premium = true;
                    delete conn.topup_prem[m.sender];

                    let successMsg = `
*───〔 PEMBELIAN BERHASIL 〕───*

✅ *Status:* PREMIUM AKTIF
⏳ *Durasi:* +${days} Hari
📅 *Berlaku hingga:* ${new Date(user.premiumTime).toLocaleString()}

Selamat! Kamu sekarang memiliki akses fitur Premium.
`.trim();
                    conn.reply(m.chat, successMsg, m);
                }
            } catch (err) {
                console.error('Polling error:', err.message);
            }
        }, 10000); // Check every 10 seconds

        // 3. Timeout after 5 minutes
        let timeout = setTimeout(() => {
            clearInterval(interval);
            if (conn.topup_prem && conn.topup_prem[m.sender]) delete conn.topup_prem[m.sender];
            conn.reply(m.chat, `*Waktu pembayaran Order ID ${orderId} telah habis.* Pembelian Premium dibatalkan.`, m);
        }, 300000);

    } catch (e) {
        console.error(e);
        let detail = 'Gagal terhubung ke server.';
        if (e.response) {
            detail = `[${e.response.status}] ${JSON.stringify(e.response.data)}`;
        } else if (e.request) {
            detail = 'Tidak ada respon dari server Pakasir.';
        } else {
            detail = e.message;
        }
        m.reply(`*Terjadi kesalahan saat memproses pembelian premium.*\n\nDetail: ${detail}`);
    }
};

handler.help = ['belipremium'];
handler.tags = ['main'];
handler.command = /^(belipremium|buypremium)$/i;
handler.register = true;

module.exports = handler;
