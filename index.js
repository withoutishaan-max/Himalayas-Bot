const { 
Client, 
GatewayIntentBits, 
EmbedBuilder 
} = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefix = ","; // PREFIX CHANGE

const afkUsers = new Map();
const snipes = new Map();

client.once("ready", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageDelete", message => {
if(!message.guild) return;

snipes.set(message.channel.id, {
content: message.content,
author: message.author,
time: new Date()
});
});

client.on("messageCreate", async message => {

if(message.author.bot) return;

if(afkUsers.has(message.author.id)){
afkUsers.delete(message.author.id);
message.reply("Welcome back! AFK removed.");
}

message.mentions.users.forEach(user=>{
if(afkUsers.has(user.id)){
message.reply(`${user.username} is AFK: ${afkUsers.get(user.id)}`);
}
});

if(!message.content.startsWith(prefix)) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

if(cmd === "afk"){
const reason = args.join(" ") || "AFK";
afkUsers.set(message.author.id, reason);
message.reply(`You are now AFK: ${reason}`);
}

if(cmd === "snipe"){
const msg = snipes.get(message.channel.id);

if(!msg) return message.reply("Nothing to snipe.");

const embed = new EmbedBuilder()
.setAuthor({name: msg.author.tag})
.setDescription(msg.content)
.setColor("Purple")
.setFooter({text: `Deleted at ${msg.time.toLocaleTimeString()}`});

message.channel.send({embeds:[embed]});
}

if(cmd === "si"){
const embed = new EmbedBuilder()
.setTitle(message.guild.name)
.setThumbnail(message.guild.iconURL())
.addFields(
{name:"Owner", value:`<@${message.guild.ownerId}>`},
{name:"Members", value:`${message.guild.memberCount}`},
{name:"Created", value:`${message.guild.createdAt.toDateString()}`}
)
.setColor("Blue");

message.channel.send({embeds:[embed]});
}

if(cmd === "av"){
const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({size:1024}))
.setColor("Green");

message.channel.send({embeds:[embed]});
}

if(cmd === "banner"){
const user = message.mentions.users.first() || message.author;

const fetched = await client.users.fetch(user.id,{force:true});

if(!fetched.banner){
return message.reply("User has no banner.");
}

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Banner`)
.setImage(fetched.bannerURL({size:1024}))
.setColor("Gold");

message.channel.send({embeds:[embed]});
}

});


client.login(process.env.TOKEN);

