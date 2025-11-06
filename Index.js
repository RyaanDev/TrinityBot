const{Client, Events, GatewayIntentBits,Collection,MessageFlags, NewsChannel, PermissionFlagsBits } = require(`discord.js`)
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config();
const voiceTracker = require('./Scripts/VoiceTrack');
const idSuggestion = process.env.IDSUGESTION;


const client = new Client({intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
]});

const { startBirthdayChecker } = require('./Scripts/britdaycheck');

client.on('ready',()=>{
    console.log(`\n\nLogado como ${client.user.tag}!\n\n`);
    startBirthdayChecker(client);
});

//Cria a coleção de comandos

client.commands = new Collection();
const foldersPath = path.join(__dirname,'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders){
    const commandPath = path.join(foldersPath, folder);
    //Delimita arquivos que sejam '.js'
    const commandFiles = fs.readdirSync(commandPath).filter((file)=>file.endsWith('.js'));
    for(const file of commandFiles){
        const filePath = path.join(commandPath,file);
        const command = require(filePath);

        // Verificar se o comando está na pasta admin e adicionar restrição
       if (folder === 'admin' && command.data) {
            command.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
        }

        if('data'in command && 'execute' in command){
            client.commands.set(command.data.name, command);
        }else{
            console.log(`[Aviso] o comando ${filePath} falhou em requerer a data ou executar`);
        }
    }
}

    //Evento de VoiceTrack

 client.on('voiceStateUpdate', (oldState, newState) => {
    // Usuário entrou em um canal de voz
    if (!oldState.channelId && newState.channelId) {
        voiceTracker.startTracking(newState.member, newState.channelId);
    }
    
    // Usuário saiu de um canal de voz
    if (oldState.channelId && !newState.channelId) {
        voiceTracker.stopTracking(oldState.member);
    }
    
    // Usuário mudou de canal (saiu de um e entrou em outro)
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        voiceTracker.stopTracking(oldState.member);
        voiceTracker.startTracking(newState.member, newState.channelId);
    }
});

// Limpeza periódica de sessões
setInterval(() => {
    voiceTracker.cleanup();
}, 60 * 60 * 1000); // A cada hora


//Area de Comandos

client.on(Events.InteractionCreate, async(interaction)=>{
    //Area de comandos de barra
    if(interaction.isChatInputCommand()){
        const command = interaction.client.commands.get(interaction.commandName);
        if(!command){
            console.error(`Nenhum comando carregado. ${interaction.commandName} não encontrado.`);
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred){
                await interaction.followUp({
                    content: 'Ocorreu um erro ao executar o comando!',
                    flags: MessageFlags.Ephemeral,
                });
            }else{
                await interaction.reply({
                    content: 'Ocorreu um erro ao executar o comando!',
                    flags: MessageFlags.Ephemeral,
                })
            }
        }
    }

   
    //Trata os botões e modais atraveis do customID

    if(interaction.isButton() && interaction.customId ==='formulario'){ //Manter custom Id padrão!
        if(interaction.channel.type==1){ // Comando de sugestão!
            try {
                await interaction.reply({
                    content: `Por favor, digite sua sugestão para melhorar o bot e nosso servidor na próxima mensagem!`,
                    ephemeral: false
                });

                //Coletor da mensagem
                const filter = m => m.author.id === interaction.user.id;
                const collector = interaction.channel.createMessageCollector({
                    filter,
                    time: 120000,// 2 minutos para responder
                    max:1
                });
                

                collector.on('collect',async message=>{
                    const resposta = message.content;
                    // Envia para o canal de sugestões!
                    try{
                        const suggestionChannel = client.channels.cache.get(idSuggestion);
                        if(suggestionChannel){
                            const {createSuggestionEmbed,createStatusButtons} = require('./suport/embds/Suggestion_Embed');
                            const embedsugestao = createSuggestionEmbed(resposta);
                            const buttons = createStatusButtons();
                            await suggestionChannel.send({embeds:[embedsugestao], components:[buttons]});
                            await message.reply({content:`Obrigado por sua resposta! Seu feedback será avaliado!`});
                        }else{
                            console.error('Canal não encontrado!')
                            await message.reply({content:'Erro ao enviar sugestão. Tente novamente!'});
                        }
                    }catch(error){
                        console.error("Erro ao enviar para canal de sugestões: ",error)
                    }
                    collector.stop(); // Interrompe após a primeira mensagem
                });
                collector.on('end',collected=>{
                    if(collected.size === 0){
                        interaction.channel.send({ content: 'Tempo esgotado para responder. Tente novamente!' });
                    }
                });
            } catch (error) {
                console.error('Erro ao lidar com a interação de botão na DM',error);
            }
        }
     }
     if(interaction.inGuild()){
      if(interaction.isButton()&& (interaction.customId==='Btn_aprov'||interaction.customId==='Btn_rejei'||interaction.customId==='Btn_penden')){
         if(!interaction.member.permissions.has(PermissionFlagsBits.Administrator)){  
            return interaction.reply({content:"Você não tem permissão para usar este botão!",
                ephemeral:true
            });
         }
        try{
            const message = interaction.message;
            if(!message.embeds||message.embeds.length ===0){
                await interaction.reply({
                    content:"Mensagem de sugestão não encontrada!",
                    flags:MessageFlags.Ephemeral
                });
                return;
            }
            const originalEmbed = message.embeds[0];
                    let NewStatus = '';

                    switch(interaction.customId){
                        case 'Btn_aprov':
                            NewStatus = "aprovado";
                            break;
                        case "Btn_rejei":
                            NewStatus = "rejeitado";
                            break;
                        case "Btn_penden":
                            NewStatus = "pendente";
                            break;
                        default:
                            NewStatus = "pendente";
                    }

                
                    //Area para fazer Update no embed de sugestão
                    const{updateSuggestionEmbed,createStatusButtons}=require('./suport/embds/Suggestion_Embed');
                    const updateEmbed = updateSuggestionEmbed(originalEmbed,NewStatus,interaction.user.id);
                    if(client.user.id)
                    //Atualiza a mensagem
                     
                    await message.edit({
                        embeds:[updateEmbed],
                        components:[createStatusButtons()]
                    });
                    await interaction.reply({
                        content: `Status de sugestão alterado para **${NewStatus === "aprovado"?"Aprovado":NewStatus ==="rejeitado"?"Rejeitado":"pendente"}**!`,
                        flags:MessageFlags.ephemeral
                    });
                    }catch(error){
                    console.error("Erro ao atualizar status da sugestão: ",error);
                    await interaction.reply({
                        content:"Erro ao atualizar o status da sugestão!",
                        flags:MessageFlags.Ephemeral
                    });
                    }
        }}else{
                        return;
                    }
                
});

//Token

client.login(process.env.TOKEN);