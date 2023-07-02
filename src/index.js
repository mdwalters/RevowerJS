import Bot from "meowerbot";
import { Client, Channel, ChannelCollection, Message, MessageCollection } from "revolt.js";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const meower = new Bot();
const revolt = new Client();
const mongodb = new MongoClient(process.env.MONGODB_URL);
const db = mongodb.db("RevowerJS");

revolt.on("ready", async () => {
    console.info(`Logged in on Revolt as ${revolt.user.username}`);
});

meower.onLogin(() => {
    console.info(`Logged in on Meower as ${process.env.MEOWER_USERNAME}`);
});

meower.onPost(async (u, p, o) => {
    const gc = await db.collection("bridges").findOne({ meower_gc: (o == null ? "home" : o) });
    const channel = new Channel(new ChannelCollection(revolt), gc.revolt_channel);

    if (!gc) return;

    await channel.sendMessage(`${u}: ${p}`);
});


revolt.on("messageCreate", async (message) => {
    const user = await db.collection("users").findOne({ revolt_id: message.authorId });
    const channel = await db.collection("bridges").findOne({ revolt_channel: message.channelId });
    // const replies = [""];

    if (message.username == revolt.user.username) return;
    if (message.content.startsWith("!!")) {
        await message.react("01GKGAV2T69EVPMRGYFDPKTXY0");
        return;
    }
    if (!user) {
        await message.react("01GKGATQ93ZR2K2901HVV444YC");
        message.reply("You don't have your account linked!");
        return;
    }
    if (message.replyIds) {
        message.reply("Replying to posts don't work yet, however, your post was sent anyways :trol:");
        /*
        replies.pop();
        for (let i in message.replyIds) {
            const reply_message = new Message(new MessageCollection(revolt), message.replyIds[i]);
            const reply_user = await db.collection("users").findOne({ revolt_id: reply_message.authorId });

            replies.push(reply_user.meower_username);
        }

        replies.push(" ");
        */
    }

    await message.react("01GKG7NFRVYKXMN3APJHPM2EW4");
    meower.post(`${user.meower_username}: ${message.content}`, (channel.meower_gc == "home" ? null : channel.meower_gc));
});

revolt.loginBot(process.env.REVOLT_TOKEN);
meower.login(process.env.MEOWER_USERNAME, process.env.MEOWER_PASSWORD);
