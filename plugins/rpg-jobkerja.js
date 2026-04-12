const cooldown = 3000; // Cooldown default (5 menit dalam milidetik)
const cooldownAfterWork = 5 * 60 * 100; // Cooldown setelah bekerja selama 5 menit (dalam milidetik)

let handler = async (m, { isPrems, conn, text, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender];

    if (user.job === 'Pengangguran') {
        throw `Kamu belum mempunyai pekerjaan. Ketik *${usedPrefix}lamarkerja* untuk melamar pekerjaan`;
    }


    if (user.jail === true) {
        throw '*Kamu tidak bisa melakukan aktivitas karena masih dalam penjara!*';
    }
    if (user.culik === true) {
        throw '*Kamu tidak bisa melakukan aktivitas karena masih dalam sel penculik!*';
    }
        

    // Cek cooldown antara pekerjaan dan cooldown setelah bekerja selama 5 menit
    if (new Date() - user.pekerjaansatu < cooldown || user.pekerjaansatu + cooldownAfterWork > new Date()) {
        let remainingTime;
        if (new Date() - user.pekerjaansatu < cooldown) {
            remainingTime = user.pekerjaansatu + cooldown - new Date();
        } else {
            remainingTime = user.pekerjaansatu + cooldownAfterWork - new Date();
        }
        let formattedTime = new Date(remainingTime).toISOString().substr(11, 8);
        throw `Kamu sudah pergi bekerja sebelumnya. Tunggu selama *${formattedTime}* untuk bekerja lagi`;
    }

  
    const jobList = {
        'gojek': [1000, 1000, 1000],
        'kantoran': [1100, 1000, 1000],
        'game developer': [1200, 1200, 1200],
        'backend developer': [1200, 1200, 1200],
        'web developer': [1150, 1150, 1150],
        'sopir': [1000, 1000, 1000],
        'kurir': [1000, 1000, 1000],
        'frontend developer': [1150, 1150, 1150],
        'fullstack developer': [1200, 1200, 1200],
        'pemain sepak bola': [1200, 1200, 1200],
        'karyawan indomaret': [1000, 1000, 1000],
        'pembunuh bayaran': [1200, 1200, 1200],    
        'pemburu manusia': [1200, 1200, 1200],        
        'polisi': [1100, 1100, 1100],
        'trader': [1200, 1200, 1200],
        'dokter': [1200, 1200, 1200],
        'hunter': [1200, 1200, 1200]
    };

    if (jobList[user.job]) {
        let [moneyMax, expMax, bankMax] = jobList[user.job];
        let money = Math.floor(Math.random() * moneyMax);
        let exp = Math.floor(Math.random() * expMax);
        let bank = Math.floor(Math.random() * bankMax);

        user.money += money;
        user.exp += exp;
        user.jobexp += 1;
        user.pekerjaansatu = new Date().getTime();

        let message = `*Berikut pendapatan dari pekerjaan ${user.job}* 
        \n• Money : Rp. ${money}
        \n• Exp : ${exp}
        \n• Tingkat Kerja Keras : +1 🧟‍♂️`;

        conn.reply(m.chat, message, m);
    }
};
handler.help = ['jobkerja'];
handler.tags = ['rpg'];
handler.command = /^(jobkerja)$/i;
handler.limit = true;

handler.limit = true
module.exports = handler;