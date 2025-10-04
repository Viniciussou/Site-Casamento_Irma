// api/rsvp.js
import { MongoClient, ServerApiVersion } from "mongodb";

let cachedClient = null;
let cachedDb = null;

// Pegando URI do MongoDB
const uri = process.env.MONGODB_URI;

// Função para conectar ao MongoDB
async function connectToDatabase() {
  if (!uri) {
    throw new Error(
      "MONGODB_URI não está definido. Configure no painel da Vercel ou no .env.local"
    );
  }

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

  try {
    await client.connect();
    const db = client.db("wedding_rsvp"); // Nome do seu banco
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw new Error("Falha ao conectar ao banco de dados.");
  }
}

// Handler da API
export default async function handler(req, res) {
  let client, db;

  try {
    ({ client, db } = await connectToDatabase());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  if (req.method === "POST") {
    // Criar RSVP
    try {
      const rsvpCollection = db.collection("rsvps");
      const newRSVP = {
        ...req.body,
        createdAt: new Date(),
      };
      await rsvpCollection.insertOne(newRSVP);
      res.status(201).json({ message: "Confirmação de presença enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar RSVP:", error);
      res.status(500).json({ message: "Erro interno ao salvar RSVP." });
    }
  } else if (req.method === "GET") {
    // Listar RSVPs
    try {
      const rsvpCollection = db.collection("rsvps");
      const rsvps = await rsvpCollection.find({}).toArray();
      res.status(200).json(rsvps);
    } catch (error) {
      console.error("Erro ao buscar RSVPs:", error);
      res.status(500).json({ message: "Erro interno ao buscar RSVPs." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
