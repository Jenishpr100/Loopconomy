//Bro really stole my code
import { Message, User, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';

export const init = async (api: any) => {
    api.log("High-Stakes Multi-Mode Poker Module Loaded.");

    const SHU_COUNT = 2; // 2 Decks
    const PENETRATION = 0.75;
    const BOT_NAMES = ['Bot_Zero', 'Bot_Vegas', 'Bot_Shark', 'Bot_Moneymaker'];

    interface Player {
        id: string;
        tag: string;
        chips: number;
        hand: string[];
        status: 'IN' | 'FOLDED' | 'ALLIN' | 'OUT';
        isBot: boolean;
        betThisRound: number;
    }

    interface Table {
        id: string;
        mode: 'NLHE' | 'PLO' | 'STUD' | 'STUD_HILO';
        players: Player[];
        deck: string[];
        pot: number;
        sidePots: { amount: number; eligible: string[] }[];
        bb: number;
        currentBet: number;
        minRaise: number;
        dealerIdx: number;
        status: 'WAITING' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
        community: string[];
        lastAction: number;
        actionIndex: number; // index of player to act
        roundBets: number[]; // total bet per player this round
        lastAggressor: number; // index of last raiser
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

    // --- HAND EVALUATION (simplified but works for all modes) ---
    const handRank = (hand: string[], community: string[]): { rank: number; value: number[] } => {
        const allCards = [...hand, ...community];
        // For PLO we will call this with 5-card combinations
        // For now, evaluate a 5-card hand
        if (allCards.length < 5) return { rank: 0, value: [0] };
        // Simple ranking: just compare by card ranks ignoring suits (for demo)
        const rankOrder: { [key: string]: number } = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14 };
        const ranks = allCards.map(c => rankOrder[c[0]]).sort((a,b)=>b-a);
        return { rank: 1, value: ranks }; // rank 1 = high card, value is descending ranks
    };

    const bestHand = (player: Player, community: string[], mode: string): { rank: number; value: number[] } => {
        if (mode === 'PLO') {
            // Must use exactly 2 from hand and 3 from community
            let best = { rank: 0, value: [0] };
            for (let i = 0; i < player.hand.length; i++) {
                for (let j = i+1; j < player.hand.length; j++) {
                    const handTwo = [player.hand[i], player.hand[j]];
                    // iterate over 5-choose-3 community
                    for (let a = 0; a < community.length; a++) {
                        for (let b = a+1; b < community.length; b++) {
                            for (let c = b+1; c < community.length; c++) {
                                const five = [...handTwo, community[a], community[b], community[c]];
                                const rank = handRank(five, []);
                                if (rank.rank > best.rank || (rank.rank === best.rank && rank.value > best.value)) best = rank;
                            }
                        }
                    }
                }
            }
            return best;
        } else if (mode.startsWith('STUD')) {
            // best 5 out of 7
            let best = { rank: 0, value: [0] };
            const cards = [...player.hand, ...community];
            for (let a = 0; a < cards.length; a++) {
                for (let b = a+1; b < cards.length; b++) {
                    for (let c = b+1; c < cards.length; c++) {
                        for (let d = c+1; d < cards.length; d++) {
                            for (let e = d+1; e < cards.length; e++) {
                                const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
                                const rank = handRank(five, []);
                                if (rank.rank > best.rank || (rank.rank === best.rank && rank.value > best.value)) best = rank;
                            }
                        }
                    }
                }
            }
            return best;
        } else {
            // NLHE: best 5 from 2+5
            const cards = [...player.hand, ...community];
            let best = { rank: 0, value: [0] };
            for (let a = 0; a < cards.length; a++) {
                for (let b = a+1; b < cards.length; b++) {
                    for (let c = b+1; c < cards.length; c++) {
                        for (let d = c+1; d < cards.length; d++) {
                            for (let e = d+1; e < cards.length; e++) {
                                const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
                                const rank = handRank(five, []);
                                if (rank.rank > best.rank || (rank.rank === best.rank && rank.value > best.value)) best = rank;
                            }
                        }
                    }
                }
            }
            return best;
        }
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
                    players: [{ id: msg.author.id, tag: msg.author.username, chips: 5000, hand: [], status: 'IN', isBot: false, betThisRound: 0 }],
                    deck: createShoe(),
                    pot: 0,
                    sidePots: [],
                    bb: 100,
                    currentBet: 0,
                    minRaise: 100,
                    dealerIdx: 0,
                    status: 'WAITING',
                    community: [],
                    lastAction: Date.now(),
                    actionIndex: 0,
                    roundBets: [],
                    lastAggressor: 0
                };
                tables.set(msg.channelId, table);
                api.reply(msg, `♦️ **${modeInput} Table Created.** Waiting for players. Bots will fill to 5 in 2 mins.`);
                
                // --- BOT AUTO-FILL LOGIC ---
                setTimeout(async () => {
                    const t = tables.get(msg.channelId);
                    if (t && t.status === 'WAITING' && t.players.length < 5) {
                        while (t.players.length < 5) {
                            const name = BOT_NAMES[t.players.length % BOT_NAMES.length] + Math.floor(Math.random()*99);
                            t.players.push({ id: 'BOT_'+name, tag: name, chips: 10000, hand: [], status: 'IN', isBot: true, betThisRound: 0 });
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
                
                const bal = await api.getBalance(msg.author.id);
                if (bal < 5000) return api.reply(msg, "You need at least 5000 coins to join.");
                await api.subCoins(msg.author.id, 5000); // buy-in
                t.players.push({ id: msg.author.id, tag: msg.author.username, chips: 5000, hand: [], status: 'IN', isBot: false, betThisRound: 0 });
                api.reply(msg, `${msg.author.username} joined! (${t.players.length}/9)`);
            }
        }
    });

    // --- ROUND LOGIC ---
    async function startRound(table: Table, msg: any) {
        table.status = 'PREFLOP';
        table.pot = 0;
        table.sidePots = [];
        table.community = [];
        table.currentBet = 0;
        table.minRaise = table.bb;
        table.roundBets = new Array(table.players.length).fill(0);
        table.actionIndex = 0;
        table.lastAggressor = -1;

        // Deal Cards based on mode
        for (const p of table.players) {
            p.hand = [];
            p.status = 'IN';
            p.betThisRound = 0;
            let count = (table.mode === 'PLO') ? 4 : (table.mode.startsWith('STUD')) ? 3 : 2;
            for (let i = 0; i < count; i++) p.hand.push(getCard(table));
            
            if (!p.isBot) {
                try {
                    const user = await msg.client.users.fetch(p.id);
                    user.send(`🎴 **Your Hand (${table.mode}):** ${p.hand.join(' ')}\nTable: <#${table.id}>`).catch(() => {});
                } catch {}
            }
        }

        // Apply Blinds/Antes
        if (table.mode.startsWith('STUD')) {
            // Stud: Ante & Bring-in
            const ante = table.bb * 0.1;
            table.players.forEach(p => { p.chips -= ante; table.pot += ante; });
            api.speak(table.id, `🃏 **7-Card Stud Start.** Antes collected. Bring-in starts...`);
            // Bring-in is the lowest upcard; for simplicity we'll just start with first player
            table.actionIndex = 0;
            table.currentBet = Math.floor(table.bb / 4); // bring-in
            table.minRaise = table.bb;
            await runBettingRound(table, msg);
        } else {
            // Blinds
            const sbIdx = (table.dealerIdx + 1) % table.players.length;
            const bbIdx = (table.dealerIdx + 2) % table.players.length;
            const sbP = table.players[sbIdx];
            const bbP = table.players[bbIdx];
            sbP.chips -= table.bb / 2;
            bbP.chips -= table.bb;
            table.pot += (table.bb / 2 + table.bb);
            sbP.betThisRound = table.bb / 2;
            bbP.betThisRound = table.bb;
            table.roundBets[sbIdx] = table.bb / 2;
            table.roundBets[bbIdx] = table.bb;
            table.currentBet = table.bb;
            table.actionIndex = (bbIdx + 1) % table.players.length; // first to act is after BB
            table.lastAggressor = bbIdx;
            api.speak(table.id, `💸 Blinds: **${sbP.tag}** (SB) and **${bbP.tag}** (BB).`);
            await runBettingRound(table, msg);
        }
    }

    async function runBettingRound(table: Table, msg: any) {
        if (table.status === 'SHOWDOWN') return;
        let activeCount = table.players.filter(p => p.status === 'IN' && p.chips > 0).length;
        if (activeCount <= 1) {
            // Only one player left, they win
            const winner = table.players.find(p => p.status === 'IN' && p.chips > 0);
            if (winner) {
                winner.chips += table.pot;
                api.speak(table.id, `🏆 **${winner.tag}** wins the pot of **${table.pot}** (others folded).`);
                table.pot = 0;
                endRound(table, msg);
            }
            return;
        }

        // Start at actionIndex, loop until all bets are equal and everyone has acted
        let betsEqual = false;
        let firstToAct = table.actionIndex;
        let actedThisRound = new Array(table.players.length).fill(false);

        while (!betsEqual) {
            const player = table.players[table.actionIndex];
            if (player.status !== 'IN' || player.chips === 0) {
                // Skip folded/all-in players
                table.actionIndex = (table.actionIndex + 1) % table.players.length;
                if (table.actionIndex === firstToAct) break;
                continue;
            }

            const toCall = table.currentBet - player.betThisRound;
            const canCheck = toCall === 0;
            const isAllIn = player.chips <= toCall;

            // Get player action
            let action: { type: 'fold' | 'call' | 'raise' | 'check'; amount?: number };
            if (player.isBot) {
                action = botDecision(player, table, toCall, canCheck);
            } else {
                action = await getHumanAction(msg, player, table, toCall, canCheck);
                if (!action) {
                    // Timeout or error: treat as fold
                    action = { type: 'fold' };
                }
            }

            // Apply action
            switch (action.type) {
                case 'fold':
                    player.status = 'FOLDED';
                    api.speak(table.id, `${player.tag} folds.`);
                    break;
                case 'check':
                    api.speak(table.id, `${player.tag} checks.`);
                    break;
                case 'call':
                    if (isAllIn) {
                        // All-in call
                        const callAmount = player.chips;
                        player.chips = 0;
                        player.status = 'ALLIN';
                        player.betThisRound += callAmount;
                        table.roundBets[table.actionIndex] += callAmount;
                        table.pot += callAmount;
                        api.speak(table.id, `${player.tag} calls all-in (${callAmount}).`);
                    } else {
                        player.chips -= toCall;
                        player.betThisRound += toCall;
                        table.roundBets[table.actionIndex] += toCall;
                        table.pot += toCall;
                        api.speak(table.id, `${player.tag} calls ${toCall}.`);
                    }
                    break;
                case 'raise':
                    const raiseAmount = action.amount!;
                    const totalBet = player.betThisRound + raiseAmount;
                    if (totalBet > player.chips) {
                        // All-in raise
                        const allInAmount = player.chips;
                        player.chips = 0;
                        player.status = 'ALLIN';
                        player.betThisRound += allInAmount;
                        table.roundBets[table.actionIndex] += allInAmount;
                        table.pot += allInAmount;
                        table.currentBet = player.betThisRound;
                        table.minRaise = raiseAmount; // track min raise for next
                        table.lastAggressor = table.actionIndex;
                        api.speak(table.id, `${player.tag} raises all-in (${allInAmount}).`);
                    } else {
                        player.chips -= totalBet;
                        player.betThisRound = totalBet;
                        table.roundBets[table.actionIndex] = totalBet;
                        table.pot += totalBet;
                        table.currentBet = totalBet;
                        table.minRaise = raiseAmount;
                        table.lastAggressor = table.actionIndex;
                        api.speak(table.id, `${player.tag} raises to ${totalBet}.`);
                    }
                    break;
            }

            actedThisRound[table.actionIndex] = true;

            // Move to next player
            table.actionIndex = (table.actionIndex + 1) % table.players.length;

            // Check if betting round is over:
            // All active players have bet the same amount (or are all-in), and last aggressor has been acted upon
            const activePlayers = table.players.filter(p => p.status === 'IN' || p.status === 'ALLIN');
            const allBetsEqual = activePlayers.every(p => p.betThisRound === table.currentBet || p.status === 'ALLIN' || p.chips === 0);
            const allActed = activePlayers.every(p => actedThisRound[table.players.indexOf(p)]);
            const aggressorActed = table.lastAggressor === -1 || actedThisRound[table.lastAggressor];

            if (allBetsEqual && allActed && aggressorActed) {
                betsEqual = true;
                break;
            }

            // If we looped back to firstToAct and no new raises, it's done
            if (table.actionIndex === firstToAct && table.lastAggressor === -1) {
                betsEqual = true;
                break;
            }
        }

        // Reset betThisRound for next street
        table.players.forEach(p => p.betThisRound = 0);
        table.currentBet = 0;
        table.minRaise = table.bb;
        table.lastAggressor = -1;

        // Proceed to next street
        progressStreet(table, msg);
    }

    async function getHumanAction(msg: Message, player: Player, table: Table, toCall: number, canCheck: boolean): Promise<any> {
        const row = new ActionRowBuilder<ButtonBuilder>();
        if (canCheck) {
            row.addComponents(new ButtonBuilder().setCustomId('check').setLabel('Check').setStyle(ButtonStyle.Success));
        } else {
            row.addComponents(new ButtonBuilder().setCustomId('call').setLabel(`Call ${toCall}`).setStyle(ButtonStyle.Primary));
        }
        row.addComponents(
            new ButtonBuilder().setCustomId('fold').setLabel('Fold').setStyle(ButtonStyle.Danger)
        );
        if (!canCheck && player.chips >= toCall + table.minRaise) {
            // Raise button (simple min raise)
            row.addComponents(new ButtonBuilder().setCustomId('raise').setLabel(`Raise to ${toCall + table.minRaise}`).setStyle(ButtonStyle.Secondary));
        }

        const embed = api.createEmbed(
            `${player.tag}'s Turn`,
            `**Mode:** ${table.mode}\n**Pot:** ${table.pot}\n**Current Bet:** ${table.currentBet}\n**Your Hand:** ${player.hand.join(' ')}\n**Community:** ${table.community.length ? table.community.join(' ') : 'None'}\n**Your Chips:** ${player.chips}`,
            '#00ff00'
        );

        const turnMsg = await msg.channel.send({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
        try {
            const i = await turnMsg.awaitMessageComponent({ filter: (int) => int.user.id === player.id, time: 60000, componentType: ComponentType.Button });
            await i.deferUpdate();
            await turnMsg.delete();
            if (i.customId === 'fold') return { type: 'fold' };
            if (i.customId === 'check') return { type: 'check' };
            if (i.customId === 'call') return { type: 'call' };
            if (i.customId === 'raise') return { type: 'raise', amount: table.minRaise };
        } catch {
            await turnMsg.delete();
            return null; // timeout = fold
        }
    }

    function botDecision(player: Player, table: Table, toCall: number, canCheck: boolean): any {
        // Simple bot logic
        if (canCheck) return { type: 'check' };
        const rand = Math.random();
        if (rand < 0.7) return { type: 'call' };
        if (rand < 0.9 && player.chips >= toCall + table.minRaise) return { type: 'raise', amount: table.minRaise };
        return { type: 'fold' };
    }

    async function progressStreet(table: Table, msg: any) {
        if (table.status === 'PREFLOP') {
            table.status = 'FLOP';
            if (!table.mode.startsWith('STUD')) {
                table.community.push(getCard(table), getCard(table), getCard(table));
                api.speak(table.id, `🌊 **The Flop:** ${table.community.join(' ')}`);
                // Start betting round starting with player after dealer
                table.actionIndex = (table.dealerIdx + 1) % table.players.length;
                await runBettingRound(table, msg);
            } else {
                // STUD: deal 4th street (one up)
                for (const p of table.players) {
                    if (p.status === 'IN' || p.status === 'ALLIN') {
                        p.hand.push(getCard(table));
                    }
                }
                api.speak(table.id, `🃏 **4th Street:** Cards dealt.`);
                table.actionIndex = (table.dealerIdx + 1) % table.players.length; // simplified
                await runBettingRound(table, msg);
            }
        } else if (table.status === 'FLOP') {
            table.status = 'TURN';
            table.community.push(getCard(table));
            api.speak(table.id, `🃏 **The Turn:** ${table.community.join(' ')}`);
            table.actionIndex = (table.dealerIdx + 1) % table.players.length;
            await runBettingRound(table, msg);
        } else if (table.status === 'TURN') {
            table.status = 'RIVER';
            table.community.push(getCard(table));
            api.speak(table.id, `🌊 **The River:** ${table.community.join(' ')}`);
            table.actionIndex = (table.dealerIdx + 1) % table.players.length;
            await runBettingRound(table, msg);
        } else {
            table.status = 'SHOWDOWN';
            await determineWinner(table, msg);
        }
    }

    async function determineWinner(table: Table, msg: any) {
        const activePlayers = table.players.filter(p => p.status !== 'FOLDED' && p.chips >= 0);
        if (activePlayers.length === 0) {
            // Should not happen
            endRound(table, msg);
            return;
        }

        // Compute side pots (simplified: just main pot for now)
        const mainPot = table.pot;
        const winners: { player: Player; share: number }[] = [];

        if (table.mode === 'STUD_HILO') {
            // Hi-Lo split: need low hand (8 or better)
            // For simplicity, just split evenly
            const share = Math.floor(mainPot / activePlayers.length);
            for (const p of activePlayers) {
                await api.addCoins(p.id, share);
                winners.push({ player: p, share });
            }
        } else {
            // Normal high hand
            let bestRank = -1;
            let bestValue: number[] = [];
            for (const p of activePlayers) {
                const rank = bestHand(p, table.community, table.mode);
                if (rank.rank > bestRank || (rank.rank === bestRank && rank.value > bestValue)) {
                    bestRank = rank.rank;
                    bestValue = rank.value;
                }
            }
            // Find all players with that best hand
            const bestPlayers = activePlayers.filter(p => {
                const rank = bestHand(p, table.community, table.mode);
                return rank.rank === bestRank && rank.value.join() === bestValue.join();
            });
            const share = Math.floor(mainPot / bestPlayers.length);
            for (const p of bestPlayers) {
                await api.addCoins(p.id, share);
                winners.push({ player: p, share });
            }
        }

        let result = `🏁 **Showdown!**\n`;
        for (const w of winners) {
            result += `🏆 **${w.player.tag}** wins **${w.share}** with hand: ${w.player.hand.join(' ')}\n`;
        }
        api.speak(table.id, result);
        endRound(table, msg);
    }

    function endRound(table: Table, msg: any) {
        // Reset for next round
        table.status = 'WAITING';
        table.dealerIdx = (table.dealerIdx + 1) % table.players.length;
        // Remove players with zero chips (bust)
        table.players = table.players.filter(p => p.chips > 0);
        if (table.players.length < 2) {
            api.speak(table.id, "❌ Not enough players. Table closed.");
            tables.delete(table.id);
        } else {
            api.speak(table.id, "🔄 New round starts in 30 seconds...");
            setTimeout(() => startRound(table, msg), 30000);
        }
    }
};
