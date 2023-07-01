import Bot from "meowerbot";
import { Client, Channel, ChannelCollection } from "revolt.js";
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
    const gc = await db.collection("bridges").findOne({ meower_gc: o });
    let channel = new Channel(new ChannelCollection(revolt), gc.revolt_channel);

    if (!gc) return;

    await channel.sendMessage(`${u}: ${p}`);
});


revolt.on("messageCreate", async (message) => {
    const user = await db.collection("users").findOne({ revolt_id: message.authorId });
    const channel = await db.collection("bridges").findOne({ revolt_channel: message.channelId });

    if (message.username == revolt.user.username) return;
    if (message.content.startsWith("!!")) return;
    if (!user) message.reply("You don't have your account linked!");

    await message.react("01GKG7NFRVYKXMN3APJHPM2EW4");
    meower.post(`${user.meower_username}: ${message.content}`, (channel.meower_gc == "home" ? null : channel.meower_gc));
});

revolt.loginBot(process.env.REVOLT_TOKEN);
meower.login(process.env.MEOWER_USERNAME, process.env.MEOWER_PASSWORD);
