// api/rsvp.js
import { MongoClient, ServerApiVersion } from "mongodb";

let cachedClient = null;
let cachedDb = null;

const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });
    await client.connect();
    const db = client.db("wedding_rsvp"); // Nome do seu banco
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

export default async function handler(req, res) {
    const { client, db } = await connectToDatabase();

    if (req.method === "POST") {
        // Confirmar presença (RSVP)
        try {
            const rsvpCollection = db.collection("rsvps");
            const newRSVP = {
                ...req.body,
                createdAt: new Date()
            };
            await rsvpCollection.insertOne(newRSVP);
            res.status(201).json({ message: "Confirmação de presença enviada com sucesso!" });
        } catch (error) {
            console.error("Erro ao salvar RSVP:", error);
            res.status(500).json({ message: "Erro interno do servidor ao salvar RSVP." });
        }
    } else if (req.method === "GET") {
        // Listar todas confirmações (admin)
        try {
            const rsvpCollection = db.collection("rsvps");
            const rsvps = await rsvpCollection.find({}).toArray();
            res.status(200).json(rsvps);
        } catch (error) {
            console.error("Erro ao buscar RSVPs:", error);
            res.status(500).json({ message: "Erro interno do servidor ao buscar RSVPs." });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Método ${req.method} não permitido`);
    }
}
