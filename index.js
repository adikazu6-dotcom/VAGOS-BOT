require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers 
    ] 
});

const RESULTS_CHANNEL_ID = '1466669809315090597';

const commands = [
    {
        name: 'acc',
        description: 'Akceptuje podanie użytkownika',
        options: [
            {
                name: 'uzytkownik',
                description: 'Osoba, której podanie jest akceptowane',
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    },
    {
        name: 'dec',
        description: 'Odrzuca podanie użytkownika',
        options: [
            {
                name: 'uzytkownik',
                description: 'Osoba, której podanie jest odrzucane',
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    }
];

process.on('unhandledRejection', error => {
    console.error('⚠️ Przechwycono nieobsłużony błąd:', error.message || error);
});

client.once('clientReady', async () => {
    console.log(`Bot zalogowany jako ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Odświeżanie komend Slash na serwerze...');
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('✅ Komendy /acc i /dec zarejestrowane pomyślnie!');
        } else {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('✅ Komendy zarejestrowane globalnie!');
        }
    } catch (error) {
        console.error('❌ Błąd rejestracji komend:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'acc') {
        await interaction.reply({ content: 'Przetwarzanie podania...', ephemeral: true }).catch(() => {});

        const targetUser = interaction.options.getUser('uzytkownik');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: '❌ Nie znaleziono takiego użytkownika na tym serwerze!' }).catch(() => {});
        }

        try {
            const roleMember = '1416424091040092315';
            const roleExtra = '1416424091040092313';
            const roleNowy = '1464709776179986514';

            await member.roles.add(roleMember).catch(() => {});
            await member.roles.add(roleExtra).catch(() => {});
            await member.roles.remove(roleNowy).catch(() => {});

            // 1. Pełny embed wysyła się na kanał, na którym użyto komendy
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(
                    `✅ **Twoje podanie zostało zaakceptowane.**\n\n` +
                    `**Twoje zadania:**\n` +
                    `> Napisz na kanale <#1554945463256481853> o odbiór rangi\n` +
                    `> Jeśli jesteś na serwerze napisz na kanale <#1464687467117412392> i poczekaj na joba od kogoś z zarządu.\n\n` +
                    `**Gratulacje i powodzenia!**`
                );

            await interaction.channel.send({
                content: `<@${targetUser.id}> ✅`,
                embeds: [embed]
            });

            // 2. Na kanał wyników wysyła się TYLKO krótka wzmianka z ptaszkiem (zawsze, nawet jeśli użyto komendy na kanale wyników)
            const resultsChannel = interaction.guild.channels.cache.get(RESULTS_CHANNEL_ID);
            if (resultsChannel) {
                await resultsChannel.send({
                    content: `<@${targetUser.id}> ✅`
                }).catch(() => {});
            }

            await interaction.editReply({ content: '✅ Pomyślnie zaakceptowano podanie!' }).catch(() => {});

        } catch (err) {
            console.error('Błąd w /acc:', err);
            await interaction.editReply({ content: '❌ Wystąpił błąd podczas przetwarzania podania.' }).catch(() => {});
        }
        return;
    }

    if (commandName === 'dec') {
        await interaction.reply({ content: 'Przetwarzanie odrzucenia...', ephemeral: true }).catch(() => {});
        const targetUser = interaction.options.getUser('uzytkownik');

        try {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setDescription(
                    `❌ **Twoje podanie zostało odrzucone.**\n\n` +
                    `Niestety tym razem Twoje podanie zostało odrzucone. Możesz spróbować ponownie za 24 godziny.\n\n` +
                    `**Powodzenia następnym razem!**`
                );

            // 1. Embed z odrzuceniem na kanał komendy
            await interaction.channel.send({
                content: `<@${targetUser.id}> ❌`,
                embeds: [embed]
            });

            // 2. Krótka wzmianka z krzyżykiem na kanał wyników
            const resultsChannel = interaction.guild.channels.cache.get(RESULTS_CHANNEL_ID);
            if (resultsChannel) {
                await resultsChannel.send({
                    content: `<@${targetUser.id}> ❌`
                }).catch(() => {});
            }

            try {
                await targetUser.send({
                    content: 'W sprawie Twojego podania do organizacji:',
                    embeds: [embed]
                });
            } catch (dmErr) {
                console.log('Nie udało się wysłać wiadomości prywatnej.');
            }

            await interaction.editReply({ content: '❌ Pomyślnie odrzucono podanie!' }).catch(() => {});

        } catch (err) {
            console.error('Błąd w /dec:', err);
            await interaction.editReply({ content: '❌ Wystąpił błąd podczas odrzucania podania.' }).catch(() => {});
        }
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);