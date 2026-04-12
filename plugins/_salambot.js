let handler = async (m, { conn, args, command }) => {
    conn.reply(m.chat, `Waalaikumsalam`,m)
        }
handler.help = ['Karinn']
handler.tags = ['main']
handler.customPrefix = /^(assalamualaikum)$/i 
handler.command = new RegExp
handler.limit = true
handler.group = false


module.exports = handler