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

// message counter
if(!messageCount.has(message.author.id)){
messageCount.set(message.author.id,1);
}else{
messageCount.set(message.author.id,messageCount.get(message.author.id)+1);
}

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

const textChannels = message.guild.channels.cache.filter(c => c.type === 0).size;
const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2).size;
const categories = message.guild.channels.cache.filter(c => c.type === 4).size;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle(`📊 Server Information`)
.setThumbnail(message.guild.iconURL({dynamic:true}))
.setDescription(`**${message.guild.name}**\nNo description set.`)

.addFields(
{ name: "📜 General Info", value:
`**Name:** ${message.guild.name}
**Server ID:** ${message.guild.id}
**Owner:** <@${message.guild.ownerId}>
**Created:** <t:${Math.floor(message.guild.createdTimestamp/1000)}:F>` },

{ name: "👥 Members & Roles", value:
`**Members:** ${message.guild.memberCount}
**Roles:** ${message.guild.roles.cache.size}
**Verification Level:** ${message.guild.verificationLevel}`, inline:true },

{ name: "💎 Boost Status", value:
`**Level:** ${message.guild.premiumTier}
**Boosts:** ${message.guild.premiumSubscriptionCount || 0}
**AFK Timeout:** ${message.guild.afkTimeout} sec`, inline:true },

{ name: "📁 Channels", value:
`**Text:** ${textChannels}
**Voice:** ${voiceChannels}
**Categories:** ${categories}` }
)

.setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
.setTimestamp();

message.channel.send({embeds:[embed]});
}

if(cmd === "av"){
const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({size:1024}))
.setColor("#FFFFFF");

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
.setColor("#FFFFFF");

message.channel.send({embeds:[embed]});
}

if(cmd === "hideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("You need Manage Channels permission.");

message.guild.channels.cache.forEach(channel => {

channel.permissionOverwrites.edit(message.guild.roles.everyone, {
ViewChannel: false
});

});

message.reply("All channels have been hidden.");
}

if(cmd === "unhideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("You need Manage Channels permission.");

message.guild.channels.cache.forEach(channel => {

channel.permissionOverwrites.edit(message.guild.roles.everyone, {
ViewChannel: true
});

});

message.reply("All channels have been unhidden.");
}

if(cmd === "ban"){

if(!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return message.reply("You don't have permission to ban.");

const user = message.mentions.members.first();

if(!user) return message.reply("Mention a user to ban.");

await user.ban();

message.channel.send(`${user.user.tag} has been banned.`);
}

if(cmd === "kick"){

if(!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
return message.reply("You don't have permission to kick.");

const user = message.mentions.members.first();

if(!user) return message.reply("Mention a user to kick.");

await user.kick();

message.channel.send(`${user.user.tag} has been kicked.`);
}

if(cmd === "m"){

const user = message.mentions.users.first() || message.author;
const count = messageCount.get(user.id) || 0;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Message Count")
.setDescription(`${user.username} has sent **${count}** messages.`)
.setThumbnail(user.displayAvatarURL());

message.channel.send({embeds:[embed]});
}

if(cmd === "lb"){

const sorted = [...messageCount.entries()]
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

if(cmd === "help"){

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Himalayas Bot Commands")

.addFields(
{name:"Utility",value:"`,av` `,banner` `,si`"},
{name:"Messages",value:"`,m` `,lb`"},
{name:"Moderation",value:"`,ban` `,kick` `,hideall` `,unhideall`"},
{name:"Other",value:"`,afk` `,snipe`"}
);

message.channel.send({embeds:[embed]});
}

});

client.login(process.env.TOKEN);
