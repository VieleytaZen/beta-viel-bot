let handler = async (m, { conn, usedPrefix, text }) => {
    let user = global.db.data.users[m.sender]
	let time = user.lastclaimb2 + 8640000
    if (new Date - user.lastclaimb2 < 86400000) throw `Kamu Sudah Ambil Gaji Hari Ini\nTunggu selama ${msToTime(time - new Date())} lagi`
	user.money += 6250
	user.lastclaimb2 = new Date * 1
  m.reply(`Kamu Mendapatkan 6.250 Money`)
}
handler.help = ['gajian']
handler.tags = ['rpg']
handler.command = /^(gaji|gajian)/i
handler.register = true
handler.rpg = true
handler.limit = true
module.exports = handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    
  
  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  seconds = (seconds < 10) ? "0" + seconds : seconds

  return hours + " jam " + minutes + " menit " + seconds + " detik"
}