const { 
Client, 
GatewayIntentBits, 
EmbedBuilder,
PermissionsBitField
} = require('discord.js');

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildVoiceStates
]
});

const prefix = ",";
const BOT_OWNER_ID = "867633787529986048";

const afkUsers = new Map();
const snipes = new Map();
const messageCount = new Map();
const noPrefixUsers = new Set();

/* READY */

client.once("clientReady",()=>{
console.log(`Logged in as ${client.user.tag}`);
});

/* SNIPE */

client.on("messageDelete",message=>{
if(!message.guild) return;

snipes.set(message.channel.id,{
content:message.content,
author:message.author,
time:new Date()
});
});

client.on("messageCreate",async message=>{

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

/* AFK */

if(afkUsers.has(message.author.id)){
afkUsers.delete(message.author.id);
message.reply("Welcome back! AFK removed.");
}

message.mentions.users.forEach(user=>{
if(afkUsers.has(user.id)){
message.reply(`${user.username} is AFK: ${afkUsers.get(user.id)}`);
}
});

/* PREFIX + NOPREFIX */

let isNoPrefix = noPrefixUsers.has(message.author.id);

if(!message.content.startsWith(prefix) && !isNoPrefix) return;

const args = message.content.startsWith(prefix)
? message.content.slice(prefix.length).trim().split(/ +/)
: message.content.trim().split(/ +/);

const cmd = args.shift().toLowerCase();

/* AFK */

if(cmd==="afk"){
const reason=args.join(" ")||"AFK";
afkUsers.set(message.author.id,reason);
message.reply(`You are now AFK: ${reason}`);
}

/* SNIPE */

if(cmd==="snipe"){
const msg=snipes.get(message.channel.id);
if(!msg) return message.reply("Nothing to snipe.");

const embed=new EmbedBuilder()
.setAuthor({name:msg.author.tag})
.setDescription(msg.content)
.setColor("Purple");

message.channel.send({embeds:[embed]});
}

/* SERVER INFO */

if(cmd==="si"){

const textChannels=message.guild.channels.cache.filter(c=>c.type===0).size;
const voiceChannels=message.guild.channels.cache.filter(c=>c.type===2).size;
const categories=message.guild.channels.cache.filter(c=>c.type===4).size;

const embed=new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Server Information")
.setThumbnail(message.guild.iconURL({dynamic:true}))
.setDescription(`**${message.guild.name}**`)

.addFields(
{name:"Owner",value:`<@${message.guild.ownerId}>`},
{name:"Members",value:`${message.guild.memberCount}`},
{name:"Roles",value:`${message.guild.roles.cache.size}`},
{name:"Text Channels",value:`${textChannels}`,inline:true},
{name:"Voice Channels",value:`${voiceChannels}`,inline:true},
{name:"Categories",value:`${categories}`,inline:true}
);

message.channel.send({embeds:[embed]});
}

/* AVATAR */

if(cmd==="av"){
const user=message.mentions.users.first()||message.author;

const embed=new EmbedBuilder()
.setTitle(`${user.username}'s Avatar`)
.setImage(user.displayAvatarURL({size:1024}))
.setColor("#FFFFFF");

message.channel.send({embeds:[embed]});
}

/* HIDE CURRENT */

if(cmd==="hide"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:false
});

message.reply("Channel hidden.");
}

/* UNHIDE CURRENT */

if(cmd==="unhide"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:true
});

message.reply("Channel unhidden.");
}

/* HIDE ALL */

if(cmd==="hideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.guild.channels.cache.forEach(channel=>{
channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:false
});
});

message.reply("All channels hidden.");
}

/* UNHIDE ALL */

if(cmd==="unhideall"){

if(!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
return message.reply("Manage Channels permission required.");

message.guild.channels.cache.forEach(channel=>{
channel.permissionOverwrites.edit(message.guild.roles.everyone,{
ViewChannel:true
});
});

message.reply("All channels unhidden.");
}

/* MESSAGE COUNT */

if(cmd==="m"){

const user=message.mentions.users.first()||message.author;
const guildData=messageCount.get(message.guild.id);
const count=guildData?.get(user.id)||0;

const embed=new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Message Count")
.setDescription(`${user.username} has sent **${count}** messages.`);

message.channel.send({embeds:[embed]});
}

/* LEADERBOARD */

if(cmd==="lb"){

const guildData=messageCount.get(message.guild.id)||new Map();

const sorted=[...guildData.entries()]
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

let leaderboard="";

sorted.forEach((data,index)=>{
const user=client.users.cache.get(data[0]);
leaderboard+=`**${index+1}.** ${user?user.username:"Unknown"} — ${data[1]} msgs\n`;
});

const embed=new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Message Leaderboard")
.setDescription(leaderboard||"No data yet.");

message.channel.send({embeds:[embed]});
}

/* ADD MSG */

if(cmd==="addmsg"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
return message.reply("Administrator permission required.");

const amount=parseInt(args[0]);
const user=message.mentions.users.first();

if(!amount||!user) return message.reply("Usage: ,addmsg <amount> @user");

const guildData=messageCount.get(message.guild.id);

guildData.set(user.id,(guildData.get(user.id)||0)+amount);

message.reply(`Added ${amount} messages to ${user.username}.`);
}

/* REMOVE MSG */

if(cmd==="removemsg"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
return message.reply("Administrator permission required.");

const amount=parseInt(args[0]);
const user=message.mentions.users.first();

if(!amount||!user) return message.reply("Usage: ,removemsg <amount> @user");

const guildData=messageCount.get(message.guild.id);

guildData.set(user.id,Math.max(0,(guildData.get(user.id)||0)-amount));

message.reply(`Removed ${amount} messages from ${user.username}.`);
}

/* NOPREFIX GIVE */

if(cmd==="noprefix"){

if(message.author.id!==BOT_OWNER_ID)
return message.reply("Only bot owner.");

const user=message.mentions.users.first();
if(!user) return message.reply("Mention user.");

noPrefixUsers.add(user.id);

message.reply(`${user.username} can now use commands without prefix.`);
}

/* REMOVE NOPREFIX */

if(cmd==="removenoprefix"){

if(message.author.id!==BOT_OWNER_ID)
return message.reply("Only bot owner.");

const user=message.mentions.users.first();
if(!user) return message.reply("Mention user.");

noPrefixUsers.delete(user.id);

message.reply(`${user.username} noprefix removed.`);
}

/* JOIN VC */

if(cmd==="joinvc"){

const channel=message.member.voice.channel;
if(!channel) return message.reply("Join VC first.");

joinVoiceChannel({
channelId:channel.id,
guildId:message.guild.id,
adapterCreator:message.guild.voiceAdapterCreator
});

message.reply("Joined VC.");
}

/* LEAVE VC */

if(cmd==="leavevc"){

const connection=getVoiceConnection(message.guild.id);
if(!connection) return message.reply("Not in VC.");

connection.destroy();
message.reply("Left VC.");
}

/* HELP */

if(cmd==="help"){

const embed=new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("Himalayas Bot Commands")

.addFields(
{name:"Utility",value:"`,av` `,si`"},
{name:"Messages",value:"`,m` `,lb`"},
{name:"Moderation",value:"`,hide` `,unhide` `,hideall` `,unhideall`"},
{name:"VC",value:"`,joinvc` `,leavevc`"},
{name:"Owner",value:"`,noprefix` `,removenoprefix`"}
);

message.channel.send({embeds:[embed]});
}

});

client.login(process.env.TOKEN);
