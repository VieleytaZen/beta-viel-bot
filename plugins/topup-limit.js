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
        let paymentUrl = `https://app.pakasir.com/pay/${global.pakasir_slug}/${amount}?order_id=${orderId}&qris_only=1`;

        let caption = `
*───〔 TOPUP LIMIT 〕───*

💰 *Nominal:* Rp ${amount.toLocaleString()}
🎫 *Dapatkan:* ${limits} Limit
🆔 *Order ID:* ${orderId}

Silakan klik link di bawah untuk membayar via QRIS/E-Wallet:
${paymentUrl}

Setelah membayar, klik tombol di bawah untuk verifikasi otomatis.
`.trim();

        await conn.reply(m.chat, caption, m, {
            contextInfo: {
                externalAdReply: {
                    title: 'PEMBAYARAN QRIS PAKASIR',
                    body: `Klik untuk bayar Rp ${amount.toLocaleString()}`,
                    mediaType: 1,
                    sourceUrl: paymentUrl,
                    thumbnailUrl: 'https://app.pakasir.com/assets/img/pakasir.png',
                    renderLargerThumbnail: true
                }
            }
        });

        // Simpan data transaksi sementara di memory untuk dicek lewat button
        conn.topup = conn.topup ? conn.topup : {};
        conn.topup[m.sender] = {
            orderId,
            amount,
            limits,
            time: Date.now()
        };

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
