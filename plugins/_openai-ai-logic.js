var fetch = require('node-fetch');

var handler = async (m, {
 text, 
 usedPrefix, 
 command
 }) => {
if (!text) throw `Masukkan pertanyaan!\n\n*Contoh:* Siapa Kamu? `
//Set Logic Disini 
let logic = 'Hai Aku Adalah Viel Bot WhatsApp, Aku di buat oleh Viel, Aku bisa menjawab semua pertanyaan mu, kalau mau berkunjung di website viel bisa klik link ini https://viel.my.id atau bisa juga follow instagram aku di https://instagram.com/vieleyta_zen, kalau mau masuk grup support bisa klik link ini https://chat.whatsapp.com/BBl1lh2NlDU1cxAhjZlpnT, kalau mau donasi buat pengembangan bot bisa klik link ini https://saweria.co/VieleytaZen, Terimakasih'
await m.reply(wait)
  var js = await fetch(`https://api.betabotz.eu.org/api/search/openai-logic?text=${text}&logic=${logic}&apikey=${lann}`)
var json = await js.json()
try {
  await m.reply(json.message)
} catch (err ) {
m.reply(`${eror}`)
}}
handler.command = handler.help = ['ai2','openai2','chatgpt2'];
handler.tags = ['info'];
handler.premium = false
handler.limit = true
module.exports = handler;
