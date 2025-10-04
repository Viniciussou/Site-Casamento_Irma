// api/rsvp.js
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

// Pegando URI do MongoDB
const uri = process.env.MONGODB_URI;

// Função para conectar ao MongoDB
async function connectToDatabase() {
  if (!uri) {
    throw new Error(
      "MONGODB_URI não está definido. Configure no painel da Vercel ou no .env"
    );
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("magnorum"); // Nome do seu banco
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw new Error("Falha ao conectar ao banco de dados.");
  }
}

// Handler da API (Node.js serverless)
module.exports = async (req, res) => {
  let db;

  try {
    ({ db } = await connectToDatabase());
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
      return res
        .status(201)
        .json({ message: "Confirmação de presença enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar RSVP:", error);
      return res.status(500).json({ message: "Erro interno ao salvar RSVP." });
    }
  }

  if (req.method === "GET") {
    // Listar RSVPs
    try {
      const rsvpCollection = db.collection("rsvps");
      const rsvps = await rsvpCollection.find({}).toArray();
      return res.status(200).json(rsvps);
    } catch (error) {
      console.error("Erro ao buscar RSVPs:", error);
      return res.status(500).json({ message: "Erro interno ao buscar RSVPs." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Método ${req.method} não permitido`);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Método ${req.method} não permitido`);
};
