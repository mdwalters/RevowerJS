import Bot from "meowerbot";
import { Client, Channel, ChannelCollection } from "revolt.js";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const meower = new Bot();
const revolt = new Client();
const mongodb = new MongoClient(process.env.MONGODB_URL);
const db = mongodb.db("RevowerJS");
const channel = new Channel(new ChannelCollection(revolt), "01H3XKRYDB3RV5P0EM633C0QXY");

revolt.on("ready", async () => {
    console.info(`Logged in on Revolt as ${revolt.user.username}`);
});

meower.onLogin(() => {
    console.info(`Logged in on Meower as ${process.env.MEOWER_USERNAME}`);
});

meower.onPost(async (u, p, o) => {
    if (o != null) return;

    await channel.sendMessage(`${u}: ${p}`);
});


revolt.on("messageCreate", async (message) => {
    const user = await db.collection("users").findOne({ revolt_id: message.authorId });

    if (message.username == revolt.user.username) return;
    if (!user) message.reply("You don't have your account linked!");

    meower.post(`${user.meower_username}: ${message.content}`);
});

revolt.loginBot(process.env.REVOLT_TOKEN);
meower.login(process.env.MEOWER_USERNAME, process.env.MEOWER_PASSWORD);
