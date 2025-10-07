const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const regras = new EmbedBuilder()
.setColor(0x9D00FF)
.setTitle("Regras")
.setFields({name:"Aqui vai um pouco sobre as regras do nosso server!" ,value:" "} )
.addFields(
    {name: '', value:'・———— ・ ✦୨୧✦ ・———— ・', inline:true},
    {name: '', value:'✧Sem spam', inline:false},
    {name: '', value:'✧Ban para conteúdo +18/nsfw (seja ela imagem, link ou ação)', inline:false},
    {name: '', value:'✧Sem qualquer tipo de racismo ou preconceito', inline:false},
    {name: '', value:'✧Sem troca de farpa e/ou brigas', inline:false},
    {name: '', value:'✧Por favor não compartilhe nenhuma informação pessoal (endereço, número de telefone, foto, e-mail, etc)', inline:false},
    {name: '', value:'✧Não invada o espaço pessoal de qualquer um dos membros', inline:false},
    {name: '', value:'✧Seja uma pessoa legal e respeitosa, qualquer tipo de ofensa não será tolerado', inline:false},
    {name: '', value:'✧Ban para conteúdo gore (seja ela imagem ou link)', inline:false},
    {name: '', value:'✧Por favor, respeite as funções dos canais de voz e texto', inline:false},
    {name: '', value:'✧Use os canais de voz corretamente, por favor', inline:false},
    {name: '', value:'✧Passivo de ban para condutas potencialmente suspeitas', inline:false},
    {name: '', value:'・———— ・ ✦୨୧✦ ・———— ・', inline:true},
)
.setFooter({text:`Qualquer eventual problema falar diretamente com @ryaanbili` });
module.exports={
    data: new SlashCommandBuilder().setName("rules").setDescription("Leia as regras!"),
    async execute(interaction){
        await interaction.reply({embeds: [regras]});
    }
}