module.exports = {
    onMessage: async (msg) => {
        if (msg.author.bot) return;

        const triggers = [
            {
                word: 'anyways',
                owner: 'Lyrics_loop',
                ignoreUser: 'lyrics_loop'
            },
            {
                word: 'yayy',
                owner: 'Cookie',
                ignoreUser: '_cookie.mp3'
            }
        ];

        for (const t of triggers) {
            if (msg.content.toLowerCase().includes(t.word)) {

                if (msg.author.username === t.ignoreUser) return;

                const emojis = ['❌', '©', '💥', '🔫'];

                for (const emoji of emojis) {
                    await msg.react(emoji).catch(() => {});
                }

                await msg.reply(`Hey! This word is copyrighted by ${t.owner}`).catch(() => {});
            }
        }

        // optional hello trigger
        if (msg.content.toLowerCase().includes('hello')) {
            await msg.react('✅').catch(() => {});
            await msg.reply("Hi!").catch(() => {});
        }
    }
};
