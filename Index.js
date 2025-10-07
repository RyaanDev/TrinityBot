const{Client, Events, GatewayIntentBits, SlashCommandBuilder,Collection,MessageFlags, Discord } = require(`discord.js`)
const path = require('node:path');
const fs = require('node:fs');
const { File } = require('node:buffer');

require('dotenv').config();

const client = new Client({intents:[GatewayIntentBits.Guilds]});

client.on('ready',()=>{
    console.log(`Logado como ${client.user.tag}!`);
    
});
client.on(Events.InteractionCreate,(interaction)=>{
    if(!interaction.isChatInputCommand()) return;
    console.log(interaction)
});

//token

client.login(process.env.TOKEN);

//area de Commandos



client.on(Events.InteractionCreate, async(interaction)=>{
    if(!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if(!command){
        console.error(`Sem comando carregado ${interaction.commandName} não encontrado.`);
        return;
    }
    try{
        await command.execute(interaction);
    }catch(error){
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
});

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
        if('data'in command && 'execute' in command){
            client.commands.set(command.data.name, command);
        }else{
            console.log(`[Aviso] o comando ${filePath} falhou em requerer a data ou executar`);
        }
    }
}