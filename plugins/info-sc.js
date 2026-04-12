let handler = async (m, { conn }) => {
let ye = `@${m.sender.split`@`[0]}`
let esce = `
Hai ${ye} Bot di buat dengan server :\n• https://viel.my.id
`
m.reply(esce)
}
handler.help = ['sc', 'sourcecode']
handler.tags = ['info']
handler.command = /^(sc|sourcecode)$/i

handler.limit = true
module.exports = handler
