import Bot from "meowerbot";
import {
    Channel,
    ChannelCollection,
    Client,
} from "revolt.js"; // We need Message and MessageCollection for replies, but that's commented out for now
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const meower = new Bot();
const revolt = new Client();
const mongodb = new MongoClient(process.env.MONGODB_URL);
const db = mongodb.db("RevowerJS");

revolt.on("ready", () => {
    console.info(`Logged in on Revolt as ${revolt.user.username}`);
});

meower.onLogin(() => {
    console.info(`Logged in on Meower as ${process.env.MEOWER_USERNAME}`);
});

meower.onMessage((message) => console.log(message.toString()));

meower.onPost(async (u, p, o) => {
    const gc = await db.collection("bridges").find({
        meower_gc: (o == null ? "home" : o),
    }).toArray();
    if (!gc) return;

    for (const i in gc) {
        const channel = new Channel(
            new ChannelCollection(revolt),
            gc[i].revolt_channel,
        );

        await channel.sendMessage({
            "content": p,
            "masquerade": {
                "name": u,
                "avatar": "https://assets.meower.org/PFP/err.png",
            },
        });
    }
});

revolt.on("messageCreate", async (message) => {
    const user = await db.collection("users").findOne({
        revolt_id: message.authorId,
    });
    const channel = await db.collection("bridges").findOne({
        revolt_channel: message.channelId,
    });
    const attachments = [""];

    if (
        message.username == revolt.user.username ||
        message.authorId == revolt.user.id
    ) return;
    if (!channel) return;
    if (message.content.startsWith("!!")) return;
    if (!user) {
        await message.react("01GKGATQ93ZR2K2901HVV444YC"); // Error emoji from Blobfox server
        message.reply("You don't have your account linked!");
        return;
    }
    if (message.attachments) {
        attachments.pop();
        for (const i in message.attachments) {
            const response = await fetch("https://go.meower.org/submit", {
                method: "post",
                body: JSON.stringify({ "link": message.attachments[i].url }),
                headers: {
                    "Authorization": process.env.MEOWER_URL_SHORTENER_KEY,
                    "Content-Type": "application/json",
                },
            }).then((res) => res.json());
            attachments.push(
                `[${
                    message.attachments[i].url.split("/")[5]
                }: ${response.full_url}]`,
            );
        }
        attachments.push("");
    }

    await message.react("01GKG7NFRVYKXMN3APJHPM2EW4"); // Checkmark emoji from Blobfox server

    meower.post(
        `${user.meower_username}: ${attachments.join(" ")}${message.content}`,
        channel.meower_gc == "home" ? null : channel.meower_gc,
    );
});

meower.onClose(() => {
    meower.login(
        process.env.MEOWER_USERNAME,
        process.env.MEOWER_PASSWORD,
    );
});

revolt.loginBot(process.env.REVOLT_TOKEN);
meower.login(
    process.env.MEOWER_USERNAME,
    process.env.MEOWER_PASSWORD
);
