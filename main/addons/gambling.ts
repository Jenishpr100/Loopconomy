import { Message, EmbedBuilder } from 'discord.js';

export const init = async (api: any) => {
    api.log("Loopconomy Gambling & Economy Module Loaded.");

    // --- CONFIGURATION ---
    const SLOT_SYMBOLS = ['🎉', '🧨', '🀄', '🎰', '🔮', '⚧️', '♂️', '♀️', '🔞', '🅰️', '🆎', '🅱️', '🅾️', '🆑', '🆘', '🈷️'];
    
    // Classes for the 2x "Touching same class" rule
    const SYMBOL_CLASSES = {
        chaos: ['🎉', '🧨', '💥'],
        mystic: ['🀄', '🎰', '🔮'],
        gender: ['⚧️', '♂️', '♀️'],
        signs: ['🔞', '🅰️', '🆎', '🅱️', '🅾️', '🆑', '🆘', '🈷️']
    };

    const isRigged = () => Math.random() < 0.10; // 10% chance to rig the outcome

    api.listen("messageCreate", async (msg: Message) => {
        if (msg.author.bot) return;
        const args = msg.content.split(" ");
        const cmd = args[0].toLowerCase();

        // --- DAILY CHECK-IN SYSTEM ---
        if (cmd === "!daily") {
            const uid = msg.author.id;
            const lastCheckKey = `last_daily_${uid}`;
            const streakKey = `streak_${uid}`;

            const lastCheck = await api.readNote(lastCheckKey).catch(() => "0");
            const now = Date.now();
            const oneDay = 86400000;

            if (now - parseInt(lastCheck) < oneDay) {
                api.reply(msg, "⏳ You already checked in today! You still get your passive **1,000 LoopCoins** automatically.");
                await api.addCoins(uid, 1000);
            } else {
                let streak = parseInt(await api.readNote(streakKey).catch(() => "0"));
                
                // If last check was > 48 hours ago, streak resets
                if (now - parseInt(lastCheck) > oneDay * 2) streak = 0;

                streak++;
                const bonus = 5000 * Math.pow(1.05, streak - 1);
                const finalAmount = Math.floor(bonus);

                await api.addCoins(uid, finalAmount);
                api.writeNote(lastCheckKey, now.toString());
                api.writeNote(streakKey, streak.toString());

                api.reply(msg, `📅 **Check-in Successful!**\nStreak: ${streak} days\nReceived: **${finalAmount.toLocaleString()} LoopCoins** (Includes 5% growth bonus)`);
            }
        }

        // --- COINFLIP ---
        if (cmd === "!coinflip") {
            const bet = parseInt(args[1]);
            const choice = args[2]?.toLowerCase();
            if (isNaN(bet) || !['heads', 'tails'].includes(choice)) return api.reply(msg, "Usage: `!coinflip [amount] [heads/tails]`");

            const balance = await api.getBalance(msg.author.id);
            if (balance < bet) return api.reply(msg, "❌ You are too poor for this bet.");

            let win = Math.random() > 0.5;
            if (isRigged()) win = false; // Rigged always results in a loss

            if (win) {
                await api.addCoins(msg.author.id, bet);
                api.reply(msg, `🪙 It's **${choice}**! You won **${bet}** LoopCoins!`);
            } else {
                await api.subCoins(msg.author.id, bet);
                api.reply(msg, `🪙 Ouch. It was **${choice === 'heads' ? 'tails' : 'heads'}**. You lost **${bet}**.`);
            }
        }

        // --- SLOTS ---
        if (cmd === "!slots") {
            const bet = parseInt(args[1]);
            if (isNaN(bet) || bet <= 0) return api.reply(msg, "Usage: `!slots [bet]`");

            const balance = await api.getBalance(msg.author.id);
            if (balance < bet) return api.reply(msg, "❌ Insufficient funds.");

            await api.subCoins(msg.author.id, bet);

            // Generate 3x3 grid, but we only care about middle lane (row index 1)
            const getRow = () => [
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
            ];

            let middle = getRow();
            if (isRigged()) middle = [SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]]; // Force no match

            const [s1, s2, s3] = middle;
            let multiplier = 0;

            // Logic Check
            const getClass = (s: string) => Object.keys(SYMBOL_CLASSES).find(key => (SYMBOL_CLASSES as any)[key].includes(s));

            if (s1 === s2 && s2 === s3) {
                multiplier = 5; // 3 Matching
            } else if (s1 === s2 || s2 === s3) {
                const pair = s1 === s2 ? [s1, s2] : [s2, s3];
                if (pair[0] === pair[1]) multiplier = 3; // Touching same symbol
                else if (getClass(pair[0]) === getClass(pair[1])) multiplier = 2; // Touching same class
            } else if (s1 === s3) {
                multiplier = 1.5; // Two matching not touching
            }

            const winAmount = Math.floor(bet * multiplier);
            if (winAmount > 0) await api.addCoins(msg.author.id, winAmount);

            const display = `[ ${getRow().join(' | ')} ]\n> **[ ${middle.join(' | ')} ]**\n[ ${getRow().join(' | ')} ]`;
            
            const embed = api.createEmbed(
                "🎰 Loopconomy Slots 🎰",
                `${display}\n\n${multiplier > 0 ? `🎉 WINNER! Multiplier: **${multiplier}x**\nReceived: **${winAmount}**` : "💀 Better luck next time."}`,
                multiplier > 0 ? "#00FF00" : "#FF0000"
            );
            api.reply(msg, { embeds: [embed] }
                     );
        }
    });
};
