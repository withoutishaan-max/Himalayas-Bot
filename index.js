const { 
Client, 
GatewayIntentBits, 
EmbedBuilder,
PermissionsBitField
} = require('discord.js');

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildVoiceStates
]
});

const prefix = ",";

const afkUsers = new Map();
const snipes = new Map();
const messageCount = new Map();

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

/* SNIPE SYSTEM */

client.on("messageDelete", message => {
if(!message.guild) return;

snipes.set(message.channel.id,{
content:message.content,
author:message.author,
time:new Date()
});
});

client.on("messageCreate", async message => {

if(message.author.bot) return;

/* MESSAGE COUNTER */

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

/* AFK SYSTEM */

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

/* AFK */

if(cmd === "afk"){
const reason = args.join(" ") || "AFK";
afkUsers.set(message.author.id,reason);
message.reply(`You are now AFK: ${reason}`);
}

/* SNIPE */

if(cmd === "snipe"){

const msg = snipes.get(message.channel.id);
if(!msg) return message.reply("Nothing to snipe.");

const embed = new EmbedBuilder()
.setAuthor({name:msg.author.tag})
.setDescription(msg.content)
.setColor("Purple")
.setFooter({text:`Deleted at ${msg.time.toLocaleTimeString()}`});

message.channel.send({embeds:[embed]});
}

/* SERVER INFO */

if(cmd === "si"){

const textChannels = message.guild.channels.cache.filter(c=>c.type===0).size;
const voiceChannels = message.guild.channels.cache.filter(c=>c.type===2).size;
const categories = message.guild.channels.cache.filter(c=>c.type===4).size;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Server Information")
.setThumbnail(message.guild.iconURL({dynamic:true}))
.setDescription(`**${message.guild.name}**\nNo description set.`)

.addFields(
{
name:"📜 General Info",
value:`Name: ${message.guild.name}
Server ID: ${message.guild.id}
Owner: <@${message.guild.ownerId}>
Created: <t:${Math.floor(message.guild.createdTimestamp/1000)}:F>`
},
{
name:"👥 Members & Roles",
value:`Members: ${message.guild.memberCount}
Roles: ${message.guild.roles.cache.size}
Verification: ${message.guild.verificationLevel}`,
inline:true
},
{
name:"💎 Boost Status",
value:`Level: ${message.guild.premiumTier}
Boosts: ${message.guild.premiumSubscriptionCount || 0}`,
inline:true
},
{
name:"📁 Channels",
value:`Text: ${textChannels}
Voice: ${voiceChannels}
Categories: ${categories}`
}
)

.setFooter({
text:`Requested by ${message.author.username}`,
iconURL:message.author.displayAvatarURL()
})
.setTimestamp();

message.channel.send({embeds:[embed]});
}

/* AVATAR */

if(cmd==="av"){
const user = message.mentions.users.first() || message.author;

const embed = new EmbedBuilder()
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({size:1024}))
.setColor("#FFFFFF");

message.channel.send({embeds:[embed]});
}

/* HIDE CURRENT CHANNEL */

if(cmd==="hide"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:false
});

message.reply("Channel hidden.");

}

/* UNHIDE CURRENT CHANNEL */

if(cmd==="unhide"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:true
});

message.reply("Channel unhidden.");

}

/* MESSAGE COUNT */

if(cmd==="m"){

const user = message.mentions.users.first() || message.author;
const guildData = messageCount.get(message.guild.id);
const count = guildData?.get(user.id) || 0;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Message Count")
.setDescription(`${user.username} has sent **${count}** messages.`);

message.channel.send({embeds:[embed]});
}

/* LEADERBOARD */

if(cmd==="lb"){

const guildData = messageCount.get(message.guild.id) || new Map();

const sorted = [...guildData.entries()]
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

let leaderboard="";

sorted.forEach((data,index)=>{
const user = client.users.cache.get(data[0]);
leaderboard+=`**${index+1}.** ${user?user.username:"Unknown"} — ${data[1]} msgs\n`;
});

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Message Leaderboard")
.setDescription(leaderboard || "No data yet.");

message.channel.send({embeds:[embed]});
}

/* HELP */

if(cmd==="help"){

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Himalayas Bot Commands")

.addFields(
{name:"Utility",value:"`,av` `,si`"},
{name:"Messages",value:"`,m` `,lb`"},
{name:"Moderation",value:"`,hide` `,unhide`"},
{name:"VC",value:"`,joinvc` `,leavevc`"},
{name:"Other",value:"`,afk` `,snipe`"}
);

message.channel.send({embeds:[embed]});
}

/* JOIN VC */

if(cmd==="joinvc"){

const channel = message.member.voice.channel;
if(!channel) return message.reply("Join a voice channel first.");

joinVoiceChannel({
channelId:channel.id,
guildId:message.guild.id,
adapterCreator:message.guild.voiceAdapterCreator
});

message.reply("Joined VC.");

}

/* LEAVE VC */

if(cmd==="leavevc"){

const connection = getVoiceConnection(message.guild.id);

if(!connection) return message.reply("Bot not in VC.");

connection.destroy();

message.reply("Left VC.");

}

});

client.login(process.env.TOKEN);
