const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const violationPath = path.join(__dirname, 'violations.json');
const moneyPath = path.join(__dirname, '../gambling/data.json');

// JSON helpers
function readJSON(p) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, '{}');
    return JSON.parse(fs.readFileSync(p));
}

function writeJSON(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// Escape regex for exact word matching
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// React helper with small delay
async function reactAll(msg) {
    const emojis = ['⚠️', '©', '❌'];
    for (const e of emojis) {
        try {
            await msg.react(e);
            await new Promise(r => setTimeout(r, 250)); // avoid rate limits
        } catch (err) {
            console.log('Could not react:', err.message);
        }
    }
}

module.exports = {
    onMessage: async (msg) => {
        if (msg.author.bot) return;
        if (!msg.guildId) return;

        const data = readJSON(dataPath);
        const violations = readJSON(violationPath);
        const money = readJSON(moneyPath);

        const guildId = msg.guildId;
        if (!data[guildId]) return;

        const content = msg.content.toLowerCase();
        const userId = msg.author.id;

        const processedWords = new Set();

        for (const word in data[guildId]) {
            const wordData = data[guildId][word];

            const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
            if (!regex.test(content)) continue;

            // skip owner
            if (userId === wordData.owner) continue;

            const fine = wordData.fine;

            if (!violations[userId]) violations[userId] = {};
            if (!violations[userId][word]) violations[userId][word] = 0;

            violations[userId][word]++;
            const count = violations[userId][word];

            let penalty = 0;
            let message = '';

            if (count === 1) {
                message = `⚠️ Warning: "${word}" is copyrighted.`;
            } else if (count === 2) {
                penalty = Math.floor(fine * 0.5);
                message = `💸 2nd offense for "${word}"! You lost $${penalty}`;
            } else {
                penalty = fine;
                message = `💀 ${count} offenses for "${word}"! You lost $${penalty}`;
            }

            // deduct money
            if (penalty > 0) {
                if (!money[userId]) money[userId] = { money: 0 };
                money[userId].money -= penalty;
                if (money[userId].money < 0) money[userId].money = 0;
            }

            writeJSON(violationPath, violations);
            writeJSON(moneyPath, money);

            // only process each word once per message
            if (!processedWords.has(word)) {
                processedWords.add(word);

                try {
                    // first send the message
                    const replyMsg = await msg.reply(message).catch(() => null);
                    if (replyMsg) {
                        // then react to that message
                        await reactAll(replyMsg);
                    }
                } catch (err) {
                    console.log('Error sending message or reacting:', err.message);
                }
            }
        }
    }
};