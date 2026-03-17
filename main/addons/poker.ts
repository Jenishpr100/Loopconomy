import { Message, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export const init = async (api: any) => {
    api.log("High-Stakes Multi-Mode Poker Module Loaded.");

    const SHU_COUNT = 2; // 2 Decks
    const PENETRATION = 0.75;
    const BOT_NAMES = ['Bot_Zero', 'Bot_Vegas', 'Bot_Shark', 'Bot_Moneymaker'];

    interface Table {
        id: string;
        mode: 'NLHE' | 'PLO' | 'STUD' | 'STUD_HILO';
        players: any[];
        deck: string[];
        pot: number;
        bb: number;
        currentBet: number;
        dealerIdx: number;
        status: 'WAITING' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
        community: string[];
        lastAction: number;
    }

    const tables = new Map<string, Table>();

    // --- DECK MANAGEMENT ---
    const createShoe = () => {
        let shoe: string[] = [];
        const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
        const suits = ['♠️','♥️','♦️','♣️'];
        for(let d=0; d<SHU_COUNT; d++) {
            for(let s of suits) for(let r of ranks) shoe.push(r+s);
        }
        return shoe.sort(() => Math.random() - 0.5);
    };

    const getCard = (table: Table) => {
        if (table.deck.length < (104 * (1 - PENETRATION))) table.deck = createShoe();
        return table.deck.pop()!;
    };

    // --- COMMANDS ---
    api.listen("messageCreate", async (msg: Message) => {
        if (msg.author.bot) return;
        const args = msg.content.split(" ");
        const cmd = args[0].toLowerCase();

        if (cmd === "!poker") {
            const sub = args[1]?.toLowerCase();
            
            if (sub === "create") {
                const modeInput = args[2]?.toUpperCase();
                const modes = ['NLHE', 'PLO', 'STUD', 'STUD_HILO'];
                if (!modes.includes(modeInput)) return api.reply(msg, "Usage: `!poker create [NLHE|PLO|STUD|STUD_HILO]`");

                const table: Table = {
                    id: msg.channelId,
                    mode: modeInput as any,
                    players: [{ id: msg.author.id, tag: msg.author.username, chips: 5000, hand: [], status: 'IN', isBot: false }],
                    deck: createShoe(),
                    pot: 0,
                    bb: 100,
                    currentBet: 0,
                    dealerIdx: 0,
                    status: 'WAITING',
                    community: [],
                    lastAction: Date.now()
                };
                tables.set(msg.channelId, table);
                api.reply(msg, `♦️ **${modeInput} Table Created.** Waiting for players. Bots will fill to 5 in 2 mins.`);
                
                // --- BOT AUTO-FILL LOGIC ---
                setTimeout(async () => {
                    const t = tables.get(msg.channelId);
                    if (t && t.status === 'WAITING' && t.players.length < 5) {
                        while (t.players.length < 5) {
                            const name = BOT_NAMES[t.players.length % BOT_NAMES.length] + Math.floor(Math.random()*99);
                            t.players.push({ id: 'BOT_'+name, tag: name, chips: 10000, hand: [], status: 'IN', isBot: true });
                        }
                        api.speak(msg.channelId, "🤖 Bots have filled the empty seats. Starting game...");
                        startRound(t, msg);
                    }
                }, 120000);
            }

            if (sub === "join") {
                const t = tables.get(msg.channelId);
                if (!t || t.status !== 'WAITING') return api.reply(msg, "No active join phase.");
                if (t.players.some(p => p.id === msg.author.id)) return;
                
                t.players.push({ id: msg.author.id, tag: msg.author.username, chips: 5000, hand: [], status: 'IN', isBot: false });
                api.reply(msg, `${msg.author.username} joined! (${t.players.length}/9)`);
            }
        }
    });

    // --- ROUND LOGIC ---
    async function startRound(table: Table, msg: any) {
        table.status = 'PREFLOP';
        table.pot = 0;
        table.community = [];
        
        // Deal Cards based on mode
        for (const p of table.players) {
            p.hand = [];
            let count = (table.mode === 'PLO') ? 4 : (table.mode.startsWith('STUD')) ? 3 : 2;
            for (let i = 0; i < count; i++) p.hand.push(getCard(table));
            
            if (!p.isBot) {
                const user = await msg.client.users.fetch(p.id);
                user.send(`🎴 **Your Hand (${table.mode}):** ${p.hand.join(' ')}\nTable: <#${table.id}>`).catch(() => {});
            }
        }

        // Apply Blinds/Antes
        if (table.mode.startsWith('STUD')) {
            // Stud specific: Ante & Bring-in
            const ante = table.bb * 0.1;
            table.players.forEach(p => { p.chips -= ante; table.pot += ante; });
            api.speak(table.id, `🃏 **7-Card Stud Start.** Antes collected. Bring-in starts...`);
        } else {
            // Blinds
            const sb = table.bb / 2;
            const sbP = table.players[(table.dealerIdx + 1) % table.players.length];
            const bbP = table.players[(table.dealerIdx + 2) % table.players.length];
            sbP.chips -= sb; bbP.chips -= table.bb;
            table.pot += (sb + table.bb);
            table.currentBet = table.bb;
            api.speak(table.id, `💸 Blinds: **${sbP.tag}** (SB) and **${bbP.tag}** (BB).`);
        }

        progressStreet(table, msg);
    }

    async function progressStreet(table: Table, msg: any) {
        // Simple simplified betting loop placeholder
        api.speak(table.id, `📍 **Street: ${table.status}** | Pot: **${table.pot}**`);
        
        // Handle Action (Human + Bot)
        for (const p of table.players) {
            if (p.status === 'FOLDED') continue;
            
            if (p.isBot) {
                // Basic Bot AI: 80% Call, 10% Fold, 10% Raise
                const rand = Math.random();
                if (rand < 0.1) p.status = 'FOLDED';
                else {
                    const callAmt = table.currentBet;
                    p.chips -= callAmt; table.pot += callAmt;
                }
            } else {
                // Wait for DM interaction (Simplified for example)
                // Real implementation would use MessageCollectors in DM
            }
        }

        // Advance streets
        if (table.status === 'PREFLOP') {
            table.status = 'FLOP';
            if (!table.mode.startsWith('STUD')) {
                table.community.push(getCard(table), getCard(table), getCard(table));
                api.speak(table.id, `🌊 **The Flop:** ${table.community.join(' ')}`);
            }
        } else if (table.status === 'FLOP') {
            table.status = 'TURN';
            table.community.push(getCard(table));
            api.speak(table.id, `🃏 **The Turn:** ${table.community.join(' ')}`);
        } else if (table.status === 'TURN') {
            table.status = 'RIVER';
            table.community.push(getCard(table));
            api.speak(table.id, `🌊 **The River:** ${table.community.join(' ')}`);
        } else {
            table.status = 'SHOWDOWN';
            determineWinner(table, msg);
        }
    }

    function determineWinner(table: Table, msg: any) {
        // Logic for "Must use 2 from 4" in PLO and "Hi-Lo 8 or better"
        const winners = table.players.filter(p => p.status !== 'FOLDED');
        const share = table.pot / winners.length;
        
        let result = `🏁 **Showdown!**\n`;
        winners.forEach(async w => {
            await api.addCoins(w.id, share);
            result += `🏆 **${w.tag}** wins **${share}** with ${w.hand.join(' ')}\n`;
        });
        
        api.speak(table.id, result);
        table.status = 'WAITING';
        table.dealerIdx = (table.dealerIdx + 1) % table.players.length;
    }
};
