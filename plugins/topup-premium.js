const axios = require('axios');
const qrcode = require('qrcode');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let amount = 10000; // Harga fixed Rp 10.000
    let days = 30; // Durasi 30 hari
    let orderId = 'PREM-' + Date.now() + '-' + m.sender.split('@')[0];

    m.reply(global.wait);

    try {
        let paymentUrl = `https://app.pakasir.com/pay/${global.pakasir_slug}/${amount}?order_id=${orderId}&qris_only=1`;

        let caption = `
*───〔 BELI PREMIUM 〕───*

💎 *Tipe:* Premium Membership
⏳ *Durasi:* ${days} Hari
💰 *Harga:* Rp ${amount.toLocaleString()}
🆔 *Order ID:* ${orderId}

Silakan klik link di bawah untuk membayar via QRIS:
${paymentUrl}

Setelah membayar, klik tombol di bawah untuk verifikasi.
`.trim();

        await conn.reply(m.chat, caption, m, {
            contextInfo: {
                externalAdReply: {
                    title: 'PEMBELIAN PREMIUM QRIS',
                    body: `Klik untuk bayar Rp ${amount.toLocaleString()}`,
                    mediaType: 1,
                    sourceUrl: paymentUrl,
                    thumbnailUrl: 'https://app.pakasir.com/assets/img/pakasir.png',
                    renderLargerThumbnail: true
                }
            }
        });

        conn.topup_prem = conn.topup_prem ? conn.topup_prem : {};
        conn.topup_prem[m.sender] = {
            orderId,
            amount,
            days,
            time: Date.now()
        };

    } catch (e) {
        console.error(e);
        m.reply('*Terjadi kesalahan saat memproses pembelian premium.* Silakan coba lagi nanti.');
    }
};

handler.help = ['belipremium'];
handler.tags = ['main'];
handler.command = /^(belipremium|buypremium)$/i;
handler.register = true;

module.exports = handler;
