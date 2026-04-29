const fs = require('fs');

const prem = 500; // xp yang didapat untuk user prem
const free = 100; // xp yang didapat untuk user free

let handler = async (m, {conn, text, isPrems}) => {
    let user = global.db.data.users[m.sender];
    if (!user) return m.reply('Data user tidak ditemukan di database.');

    let lastClaimTime = user.lastclaim || 0;
    let currentTime = new Date().getTime();

    if (currentTime - lastClaimTime < 86400000) {
        throw `🎁 *Anda telah mengumpulkan hadiah harian Anda*\n\n🕚 Masuk kembali *${msToTime(86400000 - (currentTime - lastClaimTime))}*`;
    }

    // Tambahkan XP dan Money sesuai jenis user
    let rewardXp = isPrems ? 500 : 100;
    let rewardMoney = isPrems ? 5000 : 1000;
    
    user.exp += rewardXp;
    user.money += rewardMoney;
    
    m.reply(`
🎁 *HADIAH HARIAN*
*Selamat! Kamu telah mengklaim hadiah harianmu.*

🆙 *XP* : +${rewardXp}
💰 *Money* : +${rewardMoney}

Cek .balance untuk melihat total saldo kamu!`);

    user.lastclaim = currentTime;
}

handler.help = ['daily'];
handler.command = ['daily'];
handler.tags = ['rpg'];
handler.rpg = true;
handler.limit = true;
handler.register = true;
handler.premium = false;

module.exports = handler;

function msToTime(duration) {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + " Jam " + minutes + " Menit";
}