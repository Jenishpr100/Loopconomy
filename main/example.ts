// Example Addon index.ts
export const init = (client: any, api: { trustLevel: number, addonName: string }) => {
    console.log(`Addon ${api.addonName} loaded with trust ${api.trustLevel}`);

    client.on('messageCreate', (msg: any) => {
        if (msg.content === '!addon-test') {
            msg.reply(`Running with Trust Level: ${api.trustLevel}`);
        }
    });
};
