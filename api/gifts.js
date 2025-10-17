// api/gifts.js
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;
const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (!uri) throw new Error("MONGODB_URI não está definido.");
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("magnorum");
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = async function handler(req, res) {
  const { db } = await connectToDatabase();
  const giftsCollection = db.collection("gifts");

  if (req.method === "GET") {
    const gifts = await giftsCollection.find({}).toArray();
    return res.writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(gifts));
  }

  if (req.method === "POST") {
    const data = await getRequestBody(req);
    const gift = await giftsCollection.findOne({ name: data.item });

    if (!gift) {
      return res.writeHead(404, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Presente não encontrado." }));
    }

    if (gift.available <= 0) {
      return res.writeHead(400, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Este presente já foi escolhido por todos." }));
    }

    await giftsCollection.updateOne(
      { name: data.item },
      {
        $inc: { available: -1 },
        $push: {
          takenBy: {
            name: data.name,
            email: data.email,
            color: data.color,
            date: new Date(),
          },
        },
      }
    );

    return res.writeHead(201, { "Content-Type": "application/json" })
      .end(JSON.stringify({ message: "Presente reservado com sucesso!" }));
  }

  res.writeHead(405).end();
};
