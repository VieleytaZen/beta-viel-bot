const axios = require('axios');
const qrcode = require('qrcode');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let amount = parseInt(text);
    if (isNaN(amount) || amount < 1000) {
        return m.reply(`*Format salah!*\n\nContoh: ${usedPrefix + command} 5000\n\nMinimal topup adalah Rp 1.000\nRate: Rp 1.000 = 75 Limit`);
    }

    let limits = Math.floor((amount / 1000) * 75);
    let orderId = 'TOPUP-' + Date.now() + '-' + m.sender.split('@')[0];

    m.reply(global.wait);

    try {
        // 1. Create Transaction in Pakasir
        const createRes = await axios.post('https://app.pakasir.com/api/transactioncreate', {
            slug: global.pakasir_slug,
            amount: amount,
            order_id: orderId,
            payment_method: 'qris'
        });

        if (createRes.data.status !== 'success') {
            throw new Error(createRes.data.message || 'Gagal membuat transaksi');
        }

        let qrString = createRes.data.qr_string;
        let qrBuffer = await qrcode.toBuffer(qrString);

        let caption = `
*───〔 TOPUP LIMIT 〕───*

💰 *Nominal:* Rp ${amount.toLocaleString()}
🎫 *Dapatkan:* ${limits} Limit
🆔 *Order ID:* ${orderId}

Silakan scan QRIS di atas untuk melakukan pembayaran. Pembayaran akan dicek otomatis.
Waktu bayar: 5 Menit.
`.trim();

        await conn.sendFile(m.chat, qrBuffer, 'qris.png', caption, m);

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
                    user.limit += limits;

                    let successMsg = `
*───〔 TOPUP BERHASIL 〕───*

✅ *Status:* BERHASIL
💰 *Nominal:* Rp ${amount.toLocaleString()}
🎫 *Ditambahkan:* ${limits} Limit
💹 *Total Limit Sekarang:* ${user.limit}

Terima kasih telah melakukan topup!
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
            conn.reply(m.chat, `*Waktu pembayaran Order ID ${orderId} telah habis.* Silakan lakukan topup kembali jika belum membayar.`, m);
        }, 300000);

    } catch (e) {
        console.error(e);
        m.reply('*Terjadi kesalahan saat memproses topup.* Silakan coba lagi nanti atau hubungi owner.');
    }
};

handler.help = ['topup <nominal>'];
handler.tags = ['main'];
handler.command = /^(topup|belilimit)$/i;
handler.register = true;

module.exports = handler;
