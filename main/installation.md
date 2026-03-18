# Things needs to set up the code for the bot
> You may need to put "sudo" before the command if you're on Mac or Linux

 ## PowerShell
```bash
npm install discord.js fs path @discordjs/rest discord-api-types
```

```bash
npm install -g nodemon
```

To run nodemon, In terminal, put
```PowerShell
nodemon src/main.js
```

## 🤖 Discord Bot setting
| Setting                | Why it's needed              | Location                         |
| ---------------------- | ---------------------------- | -------------------------------- |
| `Presence Intent`        | To see online/offline status | Bot → Privileged Gateway Intents |
| `Server Members Intent`  | To read member info          | Bot → Privileged Gateway Intents |
| `Message Content Intent` | To read message content      | Bot → Privileged Gateway Intents |


## 📁 Recommended Project Structure

- Project\
  - package.json
  - src\
    - main.js
    - commands\
      - about.js
      - copyright.js
      - help.js
      - mute.js
      - gambling\
        - balance.js
        - beg.js
        - coinflip.js
        - daily.js
        - leaderboard.js
        - pay.js
        - work.js
        - data.json
       
## ⚙️ Code Configuration Instructions

### 1. `main.js`

**Lines 33-34**:

```js
const token = "BOTTOKEN";
const CLIENT_ID = "ID";
```
Update the Bot token and the client ID


### 2. `help.js`

**Line 10**:

```js
const res = await fetch('https://jenishpr100.github.io/Loopconomy/main/commands/CommandList.md');
```
You may update this link as your desire

### 3. `about.js`

**Line 10**:

```js
const res = await fetch('https://jenishpr100.github.io/Loopconomy/README.md');
```
You may update this link as your desire

### 4. `copyright.js`

**Line 5-12**:

```js
        const triggers = [
            {
                word: 'example',
                owner: 'any name',
                ignoreUser: 'discord username',
                type: 'loose' // any form
            }
        ];
```
You may update this list as your desire
- `type: loose` means any form, Like capitilization or adding letters, ex, "Helloooo"
- `type: strict` means the copyright is strictly following what is written in the `word`

