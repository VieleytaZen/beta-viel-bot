const axios = require('axios');

let handler = async (m, { conn, usedPrefix }) => {
    let topupData = conn.topup ? conn.topup[m.sender] : null;
    let premData = conn.topup_prem ? conn.topup_prem[m.sender] : null;

    if (!topupData && !premData) return m.reply('*Tidak ada transaksi aktif.* Silakan lakukan topup terlebih dahulu.');

    m.reply('_Sedang mengecek status pembayaran..._');

    if (topupData) {
        try {
            const checkRes = await axios.get(`https://app.pakasir.com/api/transactiondetail`, {
                params: {
                    project: global.pakasir_slug,
                    api_key: global.pakasir_key,
                    order_id: topupData.orderId,
                    amount: topupData.amount
                }
            });

            if (checkRes.data.status === 'success' && checkRes.data.data.status === 'PAID') {
                let user = global.db.data.users[m.sender];
                user.limit += topupData.limits;
                delete conn.topup[m.sender];

                return m.reply(`*───〔 TOPUP BERHASIL 〕───*\n\n✅ *Status:* PAID\n💰 *Nominal:* Rp ${topupData.amount.toLocaleString()}\n🎫 *Ditambahkan:* ${topupData.limits} Limit\n💹 *Total Limit Sekarang:* ${user.limit}`);
            } else {
                return m.reply(`*Pembayaran belum terdeteksi.*\n\nID: ${topupData.orderId}\nStatus: ${checkRes.data.data ? checkRes.data.data.status : 'PENDING'}\n\nSilakan bayar terlebih dahulu atau tunggu beberapa saat.`);
            }
        } catch (e) {
            console.error(e);
            return m.reply('*Gagal mengecek status.* Silakan coba lagi nanti.');
        }
    }

    if (premData) {
        try {
            const checkRes = await axios.get(`https://app.pakasir.com/api/transactiondetail`, {
                params: {
                    project: global.pakasir_slug,
                    api_key: global.pakasir_key,
                    order_id: premData.orderId,
                    amount: premData.amount
                }
            });

            if (checkRes.data.status === 'success' && checkRes.data.data.status === 'PAID') {
                let user = global.db.data.users[m.sender];
                let now = new Date().getTime();
                if (user.premiumTime > now) user.premiumTime += premData.days * 86400000;
                else user.premiumTime = now + (premData.days * 86400000);
                user.premium = true;
                delete conn.topup_prem[m.sender];

                return m.reply(`*───〔 PEMBELIAN BERHASIL 〕───*\n\n✅ *Status:* PAID\n⏳ *Durasi:* +${premData.days} Hari\n📅 *Berlaku hingga:* ${new Date(user.premiumTime).toLocaleString()}`);
            } else {
                return m.reply(`*Pembayaran belum terdeteksi.*\n\nID: ${premData.orderId}\nStatus: ${checkRes.data.data ? checkRes.data.data.status : 'PENDING'}`);
            }
        } catch (e) {
            console.error(e);
            return m.reply('*Gagal mengecek status.* Silakan coba lagi nanti.');
        }
    }
};

handler.help = ['cekstatus'];
handler.tags = ['main'];
handler.command = /^(cekstatus|verifikasibayar)$/i;

module.exports = handler;
