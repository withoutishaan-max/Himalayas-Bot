if(cmd === "si"){

const textChannels = message.guild.channels.cache.filter(c => c.type === 0).size;
const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2).size;
const categories = message.guild.channels.cache.filter(c => c.type === 4).size;

const embed = new EmbedBuilder()
.setColor("#FFFFFF")
.setTitle("📊 Server Information")
.setThumbnail(message.guild.iconURL({dynamic:true}))
.setDescription(`**${message.guild.name}**\nNo description set.`)

.addFields(
{
name:"📜 General Info",
value:`**Name:** ${message.guild.name}
**Server ID:** ${message.guild.id}
**Owner:** <@${message.guild.ownerId}>
**Created:** <t:${Math.floor(message.guild.createdTimestamp/1000)}:F>`
},

{
name:"👥 Members & Roles",
value:`**Members:** ${message.guild.memberCount}
**Roles:** ${message.guild.roles.cache.size}
**Verification Level:** ${message.guild.verificationLevel}`,
inline:true
},

{
name:"💎 Boost Status",
value:`**Level:** ${message.guild.premiumTier}
**Boosts:** ${message.guild.premiumSubscriptionCount || 0}
**AFK Timeout:** ${message.guild.afkTimeout} sec`,
inline:true
},

{
name:"📁 Channels",
value:`**Text:** ${textChannels}
**Voice:** ${voiceChannels}
**Categories:** ${categories}`
}
)

.setFooter({
text:`Requested by ${message.author.username}`,
iconURL:message.author.displayAvatarURL()
})
.setTimestamp();

message.channel.send({embeds:[embed]});

}
