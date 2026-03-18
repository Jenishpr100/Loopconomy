module.exports = {
    onMessage: async (msg) => {
        if (msg.author.bot) return;

        const triggers = [
            {
                word: 'anyways',
                owner: 'Lyrics_loop',
                ignoreUser: 'lyrics_loop',
                type: 'loose' // any form
            },
            {
                word: 'YAYY',
                owner: 'Cookie',
                ignoreUser: '_cookie.mp3',
                type: 'strict' // exact match only
            }
        ];

        for (const t of triggers) {
            const content = msg.content;

            if (t.type === 'strict') {
                // Exact word only (case-sensitive)
                const regex = new RegExp(`\\b${t.word}\\b`);
                if (!regex.test(content)) continue;
            } else {
                // Loose match (any form, case-insensitive)
                if (!content.toLowerCase().includes(t.word.toLowerCase())) continue;
            }

            if (msg.author.username === t.ignoreUser) return;

            const emojis = ['❌', '©', '💥', '🔫'];

            for (const emoji of emojis) {
                await msg.react(emoji).catch(() => {});
            }

            await msg.reply(`Hey! This word is copyrighted by ${t.owner}`).catch(() => {});
        }
    }
};
