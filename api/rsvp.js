// api/rsvp.js
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

// Pegando URI do MongoDB
const uri = process.env.MONGODB_URI;

// Função para conectar ao MongoDB
async function connectToDatabase() {
  if (!uri) {
    throw new Error("MONGODB_URI não está definido.");
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("magnorum");
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
    throw new Error("Falha ao conectar ao banco de dados.");
  }
}

// Função para ler body JSON sem Express
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", err => reject(err));
  });
}

module.exports = async function handler(req, res) {
  let db;

  try {
    ({ db } = await connectToDatabase());
  } catch (err) {
    return res.writeHead(500, { "Content-Type": "application/json" })
      .end(JSON.stringify({ message: err.message }));
  }

  const rsvpCollection = db.collection("rsvps");

  if (req.method === "POST") {
    // Criar RSVP
    try {
      const data = await getRequestBody(req);
      await rsvpCollection.insertOne({ ...data, createdAt: new Date() });
      return res.writeHead(201, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "RSVP salvo com sucesso!" }));
    } catch (err) {
      console.error("Erro ao salvar RSVP:", err);
      return res.writeHead(500, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Erro interno ao salvar RSVP." }));
    }
  }

  if (req.method === "GET") {
    // Listar RSVPs
    try {
      const rsvpCollection = db.collection("rsvps");
      const rsvps = await rsvpCollection.find({}).toArray();
      return res.writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(rsvps));
    } catch (err) {
      console.error("Erro ao buscar RSVPs:", err);
      return res.writeHead(500, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Erro interno ao buscar RSVPs." }));
    }
  }

  // Método não permitido
  res.writeHead(405, { "Allow": "GET, POST" }).end(`Método ${req.method} não permitido`);
};
