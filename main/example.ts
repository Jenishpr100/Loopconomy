/**
 * ============================================================================
 * LOOPCONOMY KERNEL ADDON DOCUMENTATION (V2.5)
 * ============================================================================
 * * WELCOME TO THE CORE DOCUMENTATION. This file is both a functional addon 
 * and the complete manual for the Loopconomy Addon System.
 *
 * 1. ARCHITECTURE OVERVIEW
 * -------------------------
 * The Loopconomy Bot operates on a "Kernel-Addon" model. 
 * - The Kernel (main.js) owns the Discord Client and the PostgreSQL pool.
 * - Addons are sandboxed modules that receive a restricted "API" object.
 * - Your code NEVER touches 'cln' or 'pool' directly; it uses the API methods.
 *
 * 2. LIFECYCLE
 * ------------
 * When the bot starts or performs a Hot-Reload:
 * A. The Kernel scans the /addons directory.
 * B. It 'requires' your file and looks for an exported function named 'init'.
 * C. It executes 'init(api)', passing in a set of tools based on your Trust Level.
 *
 * 3. TRUST LEVELS (The Security Hierarchy)
 * -----------------------------------------
 * LEVEL 1 [Sandbox]: Public info only. No destructive power.
 * LEVEL 2 [Utility]: Access to Currency DB and local Note-writing.
 * LEVEL 3 [Moderator]: Can affect other users (Kick, Mute, Purge).
 * LEVEL 4 [System]: High-level server mutations (Roles, Channel Locks).
 * LEVEL 5 [Core]: Total system control. FS access, Shell, Shutdown.
 *
 * 4. THE COMPLETE API REFERENCE
 * -----------------------------
 * * --- [ BASE & LEVEL 1: ESSENTIALS ] ---
 * .log(text)                -> Prints "[AddonName] text" to the console.
 * .listen(event, callback)  -> Same as client.on(event, ...). 
 * Example: api.listen("messageCreate", (msg) => {})
 * .speak(channelId, text)   -> Sends a raw message to a specific channel.
 * .reply(msg, text)         -> Replies to a specific message object.
 * .react(msg, emoji)        -> Adds a reaction to a message.
 * .getUptime()              -> Returns bot uptime in milliseconds.
 * .getPing()                -> Returns current WebSocket heartbeat.
 * .findMember(guild, "q")   -> Async. Searches for a member by Name or ID.
 * .formatDate(date)         -> Formats a JS Date into "MM/DD/YYYY".
 *
 * --- [ LEVEL 2: ECONOMY & PERSISTENCE ] ---
 * .getBalance(uid)          -> Async. Fetches LoopCoins for a user ID from Postgres.
 * .addCoins(uid, amount)    -> Async. Adds coins (uses UPSERT logic).
 * .subCoins(uid, amount)    -> Async. Subtracts coins only if balance >= amount.
 * .writeNote(name, text)    -> Saves 'text' to /main/notes/name.txt.
 * .readNote(name)           -> Returns string content of a local note file.
 * .createEmbed(tit, des, c) -> Returns a Discord.js EmbedBuilder instance.
 *
 * --- [ LEVEL 3: MODERATION ] ---
 * .delete(msg)              -> Deletes target message. Lvl 3+ can delete anyone's.
 * .kick(member, reason)     -> Kicks target member.
 * .mute(member, min, res)   -> Timeouts user for X minutes.
 * .purge(channel, amount)   -> Deletes the last X messages in a channel.
 * .warn(uid, reason)        -> Async. Records a permanent warning in Postgres.
 * .setSlowmode(chan, sec)   -> Changes channel rate-limit.
 *
 * --- [ LEVEL 4: SYSTEM CONTROL ] ---
 * .addRole(member, roleId)  -> Grants a role to a member.
 * .removeRole(mem, roleId)  -> Strips a role from a member.
 * .lockChannel(channel)     -> Denies @everyone permission to SendMessages.
 * .unlockChannel(channel)   -> Restores @everyone permission to SendMessages.
 *
 * --- [ LEVEL 5: KERNEL CORE ] ---
 * .shell(command)           -> Async. Executes a Windows CMD command. Returns stdout.
 * .hotReload()              -> Re-scans /addons/ and refreshes all modules instantly.
 * .broadcast(guild, text)   -> Finds the #general channel and blasts a message.
 * .getSystemStats()         -> Returns OS platform, architecture, and memory usage.
 *
 * 5. CODING BEST PRACTICES
 * ------------------------
 * - Use 'async/await' for all DB calls (getBalance, addCoins, etc.).
 * - Always wrap API calls in try/catch blocks to prevent your addon from crashing.
 * - For Windows paths, use the native 'path' module if the Kernel doesn't provide it.
 * ============================================================================
 */

import { Message, GuildMember, TextChannel } from 'discord.js';

export const init = async (api: any) => {
    
    // Announce presence in console
    api.log("Documentation System Active.");

    /**
     * EXAMPLE: AN ECONOMY-DRIVEN COMMAND
     * This uses Level 2 (DB) and Level 1 (Embeds)
     */
    api.listen("messageCreate", async (msg: Message) => {
        if (msg.author.bot) return;

        const cmd = msg.content.toLowerCase();

        // 1. Check Balance
        if (cmd === "!wallet") {
            const balance = await api.getBalance(msg.author.id);
            const embed = api.createEmbed(
                `${msg.author.username}'s Vault`,
                `Current Balance: **${balance} LoopCoins**`,
                "#FFD700" // Gold
            );
            api.reply(msg, { embeds: [embed] });
        }

        // 2. Local Note Saving (Level 2)
        if (cmd.startsWith("!memo ")) {
            const content = msg.content.slice(6);
            api.writeNote(`memo_${msg.author.id}`, content);
            api.reply(msg, "✅ Content archived to physical local storage.");
        }

        // 3. System Diagnostic (Level 5)
        // Restricted to a specific user via Kernel API
        if (cmd === "!kernel" && msg.author.username === "jkid88") {
            const stats = api.getSystemStats();
            const uptime = Math.floor(api.getUptime() / 60000);
            
            api.reply(msg, `
                **Kernel Status (Windows)**
                - Uptime: ${uptime} minutes
                - Arch: ${stats.arch}
                - Memory: ${Math.round(stats.memory.rss / 1024 / 1024)}MB
                - Ping: ${api.getPing()}ms
            `);
        }

        /**
         * EXAMPLE: MODERATOR TOOL (Level 3)
         * Deletes a message and warns the user
         */
        if (cmd.startsWith("!bonk ")) {
            const target = msg.mentions.members?.first();
            if (target) {
                await api.warn(target.id, "Violated the vibe check.");
                api.reply(msg, `${target.user.username} has been recorded in the Postgres Warning Log.`);
                api.delete(msg); // Self-delete the command to keep chat clean
            }
        }
    });

    /**
     * EXAMPLE: AUTOMATED SYSTEM TASK
     * Uses api.log to track time every hour
     */
    setInterval(() => {
        api.log(`Kernel Heartbeat. Ping: ${api.getPing()}ms`);
    }, 3600000);

};

// END OF DOCUMENTATION
