let handler = async m => {

let krtu = `web`
m.reply(`
> https://api.betabotz.eu.org
> https://tools.betabotz.eu.org

`.trim()) 
}
handler.command = /^(web)$/i

handler.limit = true
module.exports = handler
