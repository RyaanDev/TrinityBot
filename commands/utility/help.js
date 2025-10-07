const {SlashCommandBuilder,EmbedBuilder, Embed} = require('discord.js');
const { execute } = require('./rules');

const helpEmbed = new EmbedBuilder()
.setColor(0xFF746C)
.setTitle("Aqui esta um pouquinho do que eu posso fazer!")
.addFields(
    {name: '', value:'・———— ・ ✦୨୧✦ ・———— ・', inline:true},
    {name:"/help",value:"Abre a lista de comandos disponiveis!"},
    {name:"/ping",value:"Apenas um comando de teste 'Responderei pong!' "},
    {name:"/rules",value:"Contarei um pouco sobre as regras do servidor!"},
    {name:"/suggestion",value:"Abrirei um pedido para você fazer uma sugestão anônima"},
    {name: '', value:'・———— ・ ✦୨୧✦ ・———— ・', inline:true}
)

module.exports ={
    data: new SlashCommandBuilder().setName('help').setDescription('Falarei um pouco sobre os comandos até então disponíveis'),
    async execute(interaction){
        await interaction.reply({embeds:[helpEmbed]})
    }
}