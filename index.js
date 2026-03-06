const { 
Client, 
GatewayIntentBits, 
EmbedBuilder,
PermissionsBitField
} = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefix = ",";

const afkUsers = new Map();
const snipes = new Map();
const messageCount = new Map();

client.once("clientReady", () => {
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

/* ---------------- MESSAGE COUNTER (GUILD BASED) ---------------- */

const guildId = message.guild.id;
const userId = message.author.id;

if(!messageCount.has(guildId)){
messageCount.set(guildId,new Map());
}

const guildData = messageCount.get(guildId);

if(!guildData.has(userId)){
guildData.set(userId,1);
}else{
guildData.set(userId,guildData.get(userId)+1);
}

/* ---------------- AFK SYSTEM ---------------- */

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

/* ---------------- AFK ---------------- */

if(cmd === "afk"){
const reason = args.join(" ") || "AFK";
afkUsers.set(message.author.id, reason);
message.reply(`You are now AFK: ${reason}`);
}

/* ---------------- SNIPE ---------------- */

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

/* ---------------- SERVER INFO ---------------- */

if(cmd === "si"){

const textChannels = message.guild.channels.cache.filter(c => c.type === 0).size;
const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2).size;
const categories = message.guild.channels.cache.filter(c => c.type === 4).size;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Server Information")
.setThumbnail(message.guild.iconURL({dynamic:true}))
.setDescription(`**${message.guild.name}**`)

.addFields(
{name:"Name",value:message.guild.name},
{name:"Owner",value:`<@${message.guild.ownerId}>`},
{name:"Members",value:`${message.guild.memberCount}`},
{name:"Roles",value:`${message.guild.roles.cache.size}`},
{name:"Text Channels",value:`${textChannels}`,inline:true},
{name:"Voice Channels",value:`${voiceChannels}`,inline:true}
)

.setTimestamp();

message.channel.send({embeds:[embed]});
}

/* ---------------- AVATAR ---------------- */

if(cmd === "av"){

const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({size:1024}))
.setColor("#FFFFFF");

message.channel.send({embeds:[embed]});
}

/* ---------------- BANNER ---------------- */

if(cmd === "banner"){

const user = message.mentions.users.first() || message.author;
const fetched = await client.users.fetch(user.id,{force:true});

if(!fetched.banner){
return message.reply("User has no banner.");
}

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Banner`)
.setImage(fetched.bannerURL({size:1024}))
.setColor("#FFFFFF");

message.channel.send({embeds:[embed]});
}

/* ---------------- HIDE ALL ---------------- */

if(cmd === "hideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("You need Manage Channels permission.");

message.guild.channels.cache.forEach(channel => {
channel.permissionOverwrites.edit(message.guild.roles.everyone,{ViewChannel:false});
});

message.reply("All channels hidden.");
}

/* ---------------- UNHIDE ALL ---------------- */

if(cmd === "unhideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("You need Manage Channels permission.");

message.guild.channels.cache.forEach(channel => {
channel.permissionOverwrites.edit(message.guild.roles.everyone,{ViewChannel:true});
});

message.reply("All channels unhidden.");
}

/* ---------------- BAN ---------------- */

if(cmd === "ban"){

if(!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return message.reply("You don't have permission.");

const user = message.mentions.members.first();
if(!user) return message.reply("Mention a user.");

await user.ban();
message.channel.send(`${user.user.tag} banned.`);
}

/* ---------------- KICK ---------------- */

if(cmd === "kick"){

if(!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
return message.reply("You don't have permission.");

const user = message.mentions.members.first();
if(!user) return message.reply("Mention a user.");

await user.kick();
message.channel.send(`${user.user.tag} kicked.`);
}

/* ---------------- MESSAGE COUNT ---------------- */

if(cmd === "m"){

const user = message.mentions.users.first() || message.author;

const guildData = messageCount.get(message.guild.id);
const count = guildData?.get(user.id) || 0;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Message Count")
.setDescription(`${user.username} has sent **${count}** messages.`);

message.channel.send({embeds:[embed]});
}

/* ---------------- LEADERBOARD ---------------- */

if(cmd === "lb"){

const guildData = messageCount.get(message.guild.id) || new Map();

const sorted = [...guildData.entries()]
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

let leaderboard = "";

sorted.forEach((data,index)=>{
const user = client.users.cache.get(data[0]);
leaderboard += `**${index+1}.** ${user ? user.username : "Unknown"} — ${data[1]} msgs\n`;
});

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Message Leaderboard")
.setDescription(leaderboard || "No data yet.");

message.channel.send({embeds:[embed]});
}

/* ---------------- HELP ---------------- */

if(cmd === "help"){

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Help Command Overview")

.addFields(
{name:"Moderation",value:"`ban` `kick` `hideall` `unhideall`"},
{name:"Messages",value:"`m` `lb`"},
{name:"Utility",value:"`av` `banner` `si`"},
{name:"Other",value:"`afk` `snipe`"}
)

.setFooter({text:`Himalayas Bot • ${message.guild.name}`})
.setTimestamp();

message.channel.send({embeds:[embed]});
}

});

client.login(process.env.TOKEN);
