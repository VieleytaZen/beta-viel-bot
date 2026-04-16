let handler = async (m, { conn, args, usedPrefix }) => {
  try {
    global.db.data.users[m.sender].lastngepet = global.db.data.users[m.sender].lastngepet || 0
    let randomaku = `${Math.floor(Math.random() * 101)}`.trim()
    let randomkamu = `${Math.floor(Math.random() * 101)}`.trim() 
    let Aku = (randomaku * 1)
    let Kamu = (randomkamu * 1)
    
    let wm = global.wm
    let botol = global.wm
    
    let __timers = (new Date - global.db.data.users[m.sender].lastngepet)
    let _timers = (18000000 - __timers) 
    let timers = clockString(_timers)
    let user = global.db.data.users[m.sender]

    if (new Date - global.db.data.users[m.sender].lastngepet > 18000000) { 
      if (Aku > Kamu) {
        conn.sendMessage(m.chat, {
          text: `Kamu lengah Saat Ngepet, Dan Kamu Mines -2.5 Juta`,
          contextInfo: {
            externalAdReply: {
              title: 'Nooo, Kamu sekarang memiliki hutang 2.5JT 😞',
              body: wm,
              thumbnailUrl: 'https://telegra.ph/file/c6c4a6946a354317fe970.jpg',
              mediaType: 1,
              showAdAttribution: false,
              renderLargerThumbnail: true
            }
          }
        })
        user.money -= 2500000 
        global.db.data.users[m.sender].lastngepet = new Date * 1
      } else if (Aku < Kamu) {
        user.money += 1250000 
        conn.sendMessage(m.chat, {
          text: `Kamu berhasil Ngepet, Dan kamu mendapatkan 1.25 Juta rupiah`,
          contextInfo: {
            externalAdReply: {
              title: 'Selamat Telah Mendapatkan 1.25JT',
              body: wm,
              thumbnailUrl: 'https://telegra.ph/file/6a6a440d7f123bed78263.jpg',
              mediaType: 1,
              showAdAttribution: false,
              renderLargerThumbnail: true
            }
          }
        })
        global.db.data.users[m.sender].lastngepet = new Date * 1
      } else {
        conn.sendMessage(m.chat, `Maaf kamu tidak mendapatkan *Duit* dan kamu tidak masuk Dunia Lain karna melarikan diri\n${botol}`, m)
        global.db.data.users[m.sender].lastngepet = new Date * 1
      }
    } else {
      conn.sendMessage(m.chat, {
        text: `Kamu sudah melakukan *ngepet*\nDan kamu harus menunggu selama agar bisa ngepet kembali ${timers}`,
        contextInfo: {
          externalAdReply: {
            title: 'C O O L D O W N',
            body: `${timers}`,
            thumbnailUrl: 'https://telegra.ph/file/295949ff5494f3038f48c.jpg',
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true
          }
        }
      })
    }
  } catch (e) {
    throw `${e}`
  }
}

handler.help = ['ngepet']
handler.tags = ['rpg']
handler.command = /^(ngepet|ngefet)$/i
handler.premium = true
handler.group = true
handler.rpg = true

module.exports = handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}