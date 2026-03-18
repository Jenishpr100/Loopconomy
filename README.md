# Loopconomy

> **Disclaimer:** This bot is **for educational purposes only**. It does **NOT (by default) involve real money**, gambling, or encourage gambling in real life.

---

## 📖 Overview

A modular Discord bot with gambling games, economy, AutoMod, and more. Built with JavaScript/TypeScript and Discord.js.

[Main website](https://jenishpr100.github.io/Loopconomy/main/MainPage)

---

## 🛠 Features

- **🎮 Games** - Blackjack, Poker, Slots, Keno, Roulette, Bingo, Wheel of Fortune, Russian Roulette
- **💰 Economy** - Daily rewards, beg, pay, leaderboards
- **🛡️ AutoMod** - Spam, link, caps, and word filtering
- **📝 Copyright Management** - Track copyrighted content
- **⚙️ Modular Addon System** - Trust levels (1-5) for security
- **🎛️ Bot Management** - Status, logs, restart, shutdown, backup

---

## 🧩 Games

| Game | Command | Description |
|------|---------|-------------|
| Blackjack | `/blackjack` | Classic card game |
| Poker | `/poker` | Multi-mode Texas Hold'em |
| Slots | `/slots` | Slot machine |
| Keno | `/keno` | Pick numbers and win |
| Roulette | `/roulette` | European roulette |
| Bingo | `/bingo` | Get 3 lines to win |
| Wheel | `/wheel` | Spin the wheel! |
| Russian Roulette | `/russianroulette` | High stakes - loser gets muted |

---

## 🚀 Quick Install

### Prerequisites

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get install -y nodejs npm postgresql git
```

**Arch Linux:**
```bash
sudo pacman -Syu --noconfirm nodejs npm postgresql git
```

**Windows:**
```powershell
# Install Node.js from https://nodejs.org (LTS version)
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# Install Git from https://git-scm.com
```

### Setup

```bash
# Clone the repo
git clone https://github.com/Jenishpr100/Loopconomy.git
cd Loopconomy/main

# Create environment file
cp .env.example .env
# Edit .env with your credentials:
#   BOT_TOKEN=your_bot_token
#   CLIENT_ID=your_client_id
#   DATABASE_URL=postgres://user:pass@localhost/db
#   TAX_COLLECTOR_ID=your_user_id

# Install dependencies
npm install

# Run the TUI installer
cd scripts
chmod +x install.sh
./install.sh
```

**Windows (PowerShell):**
```powershell
# Clone the repo
git clone https://github.com/Jenishpr100/Loopconomy.git
cd Loopconomy/main

# Create environment file
Copy-Item .env.example .env
# Edit .env with your credentials in Notepad

# Install dependencies
npm install

# Run the bot
node main.js
```

### Manual Run

```bash
cd Loopconomy/main
node main.js
```

---

## 📝 Configuration (.env)

Create a `.env` file in `main/`:

```env
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_client_id
DATABASE_URL=postgres://username:password@localhost:5432/database_name
TAX_COLLECTOR_ID=optional_user_id_for_taxes
```

---

## 🤖 Commands

### Core
- `/balance` - Check your coins
- `/beg` - Beg for coins
- `/pay` - Pay coins to another user
- `/leaderboard` - Top players
- `/help` - Show all commands
- `/about` - About this bot

### Games
- `/daily` - Claim daily reward
- `/coinflip` - Flip a coin
- `/slots` - Play slots
- `/keno` - Play Keno
- `/roulette` - Play Roulette
- `/bingo` - Play Bingo
- `/wheel` - Spin the wheel
- `/blackjack` - Play Blackjack
- `/poker` - Play Poker

### Moderation
- `/mute` - Mute a user
- `/automod` - Configure AutoMod
- `/copyright` - Manage copyrighted content

### Management (Owner only)
- `/botstatus` - Bot status
- `/botlogs` - View logs
- `/botrestart` - Restart bot
- `/botshutdown` - Shutdown bot
- `/botbackup` - Backup database

---

## 🔧 AutoMod Setup

```bash
/automod enable          # Enable AutoMod
/automod spam enable    # Enable spam filter
/automod links enable   # Block links
/automod caps enable    # Block excessive caps
/automod wordlist add badword  # Add word to filter
```

---

## 📜 License

MIT

---

## 🔗 Invite

[Add to Discord](https://discord.com/oauth2/authorize?client_id=1483538031561412620&permissions=8&scope=bot)
