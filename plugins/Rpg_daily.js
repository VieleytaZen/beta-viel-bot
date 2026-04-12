const fs = require('fs');

const prem = 1000; // xp yang didapat untuk user prem
const free = 100; // xp yang didapat untuk user free

let handler = async (m, {conn, text, isPrems}) => {
    let user = global.db.data.users[m.sender];
    if (!user) return m.reply('Data user tidak ditemukan di database.');

    let lastClaimTime = user.lastclaim || 0;
    let currentTime = new Date().getTime();

    if (currentTime - lastClaimTime < 86400000) {
        throw `🎁 *Anda telah mengumpulkan hadiah harian Anda*\n\n🕚 Masuk kembali *${msToTime(86400000 - (currentTime - lastClaimTime))}*`;
    }

    // Tambahkan XP sesuai jenis user
    let reward = isPrems ? prem : free;
    user.exp += reward;
    
    m.reply(`
🎁 *HADIAH XP*
*Spam terus untuk mendapatkan xp*
cek .balance jumlah xp mu!
🆙 *XP* : +${reward}`);

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