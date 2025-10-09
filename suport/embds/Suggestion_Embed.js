const{EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} =require('discord.js');

function createSuggestionEmbed(resposta, status = "pendente"){
    const statusInfo ={
        'pendente':{text:"Pendente",color:0xFFA500},
        'aprovado': { text:'Aprovado', color: 0x00FF00 },
        'rejeitado': { text:'Rejeitado', color: 0xFF0000 }
    }

    const statusData = statusInfo[status] || statusInfo.pendente;

    const embed = new EmbedBuilder()
                .setTitle('Nova sugestão')
                .setColor(statusData.color)
                .setDescription(resposta)
                .addFields(
                    {name: 'Status', value:statusData.text,inline:true},
                    {name:'Data',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline: true},
                )
                .setTimestamp()
                .setFooter({text:'Sugestão enviada pela Trinity'})
                return embed;
}

function createStatusButtons(){
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("Btn_aprov")
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
        .setCustomId("Btn_rejei")
        .setLabel("Rejeitar")
        .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
        .setCustomId("Btn_penden")
        .setLabel("Pendente")
        .setStyle(ButtonStyle.Secondary)
    );
}

function updateSuggestionEmbed(originalEmbed,newStatus,moderatorId){
    const statusInfo ={
        'pendente':{text:"Pendente",color:0xFFA500},
        'aprovado': { text:'Aprovado', color: 0x00FF00 },
        'rejeitado': { text:'Rejeitado', color: 0xFF0000 }
    }
    const statusData = statusInfo[newStatus]||statusInfo.pendente;
    const novoEmbed = EmbedBuilder.from(originalEmbed)
    .setColor(statusData.color)
    .spliceFields(0,1,{name:'Status', value:statusData.text,inline:true})
    .addFields(
        {name: "Moderador", value: `<@${moderatorId}>`,inline:true}
    )
    .setTimestamp();

    return novoEmbed;
}

module.exports = {
    createSuggestionEmbed,
    createStatusButtons,
    updateSuggestionEmbed
};