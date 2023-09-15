import Bot from "meowerbot";
import { Client, Channel, ChannelCollection } from "revolt.js"; // We need Message and MessageCollection for replies, but that's commented out for now
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const meower = new Bot();
const revolt = new Client();
const mongodb = new MongoClient(Deno.env.get("MONGODB_URL"));
const db = mongodb.db("RevowerJS");

revolt.on("ready", async () => {
    console.info(`Logged in on Revolt as ${revolt.user.username}`);
});

meower.onLogin(() => {
    console.info(`Logged in on Meower as ${Deno.env.get("MEOWER_USERNAME")}`);
});

meower.onPost(async (u, p, o) => {
    const gc = await db.collection("bridges").find({ meower_gc: (o == null ? "home" : o) }).toArray();
    if (!gc) return;

    for (let i in gc) {
        const channel = new Channel(new ChannelCollection(revolt), gc[i].revolt_channel);

        await channel.sendMessage({
            "content": p,
            "masquerade": {
                "name": u,
                "avatar": "https://assets.meower.org/PFP/err.png"
            }
        });
    }
});


revolt.on("messageCreate", async (message) => {
    const user = await db.collection("users").findOne({ revolt_id: message.authorId });
    const channel = await db.collection("bridges").findOne({ revolt_channel: message.channelId });
    const attachments = [""];
    // const replies = [""];

    if (message.username == revolt.user.username || message.authorId == revolt.user.id) return;
    if (!channel) return;
    if (message.content.startsWith("!!")) return;
    if (!user) {
        await message.react("01GKGATQ93ZR2K2901HVV444YC");
        message.reply("You don't have your account linked!");
        return;
    }
    /* if (message.replyIds) {
        replies.pop();
        for (let i in message.replyIds) {
            const reply_message = new Message(new MessageCollection(revolt), message.replyIds[i]);
            const reply_user = await db.collection("users").findOne({ revolt_id: reply_message.authorId });

            replies.push(reply_user.meower_username);
        }

        replies.push(" ");
    } */
    if (message.attachments) {
        attachments.pop();
        for (let i in message.attachments) {
            const response = await fetch("https://go.meower.org/submit", {
                method: "post",
                body: JSON.stringify({ "link": message.attachments[i].url }),
                headers: { "Authorization": Deno.env.get("MEOWER_URL_SHORTENER_KEY"), "Content-Type": "application/json" }
            }).then(res => res.json());
            attachments.push(`[${message.attachments[i].url.split("/")[5]}: ${response.full_url}]`);
        }
        attachments.push("");
    }

    await message.react("01GKG7NFRVYKXMN3APJHPM2EW4");
    meower.post(`${user.meower_username}: ${attachments.join(" ")}${message.content}`, (channel.meower_gc == "home" ? null : channel.meower_gc));
});

meower.onClose(() => {
    meower.login(Deno.env.get("MEOWER_USERNAME"), Deno.env.get("MEOWER_PASSWORD"));
});

revolt.loginBot(Deno.env.get("REVOLT_TOKEN"));
meower.login(Deno.env.get("MEOWER_USERNAME"), Deno.env.get("MEOWER_PASSWORD"));
