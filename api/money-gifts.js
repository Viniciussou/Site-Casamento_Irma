// api/money-gifts.js
const { MongoClient } = require("mongodb")

let cachedClient = null
let cachedDb = null
const uri = process.env.MONGODB_URI

async function connectToDatabase() {
  if (!uri) throw new Error("MONGODB_URI não está definido.")
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db("magnorum")
  cachedClient = client
  cachedDb = db
  return { client, db }
}

module.exports = async function handler(req, res) {
  const { db } = await connectToDatabase()
  const moneyGiftsCollection = db.collection("money_gifts")

  if (req.method === "GET") {
    try {
      const moneyGifts = await moneyGiftsCollection.find({}).toArray()
      return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(moneyGifts))
    } catch (err) {
      console.error("Erro ao buscar contribuições:", err)
      return res
        .writeHead(500, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Erro interno ao buscar contribuições." }))
    }
  }

  res.writeHead(405, { Allow: "GET" }).end(`Método ${req.method} não permitido`)
}
