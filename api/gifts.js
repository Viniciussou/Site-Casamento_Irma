// api/gifts.js
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

// 🎁 Lista de presentes iniciais (usada para popular o banco se estiver vazio)
const initialGifts = [
  { name: "Jogo de copos", available: 1 },
  { name: "Jogo de taças para sobremesa", available: 1 },
  { name: "Jogo de panelas", available: 1 },
  { name: "Jogo de taças", available: 1 },
  { name: "Forninho elétrico", available: 1 },
  { name: "Panela elétrica de arroz", available: 1 },
  { name: "Máquina de lavar", available: 1 },
  { name: "Jogo de talheres", available: 3 },
  { name: "Jogo de prato", available: 1 },
  { name: "Jogo de lençol", available: 2 },
  { name: "Cobertor", available: 2 },
  { name: "Aspirador", available: 1 },
  { name: "Mix 3 em 1", available: 1 },
  { name: "Torradeira", available: 1 },
  { name: "Jogo de toalhas", available: 1 },
  { name: "Jogo de potes", available: 6 },
  { name: "Jogo de facas", available: 1 },
  { name: "Chaleira elétrica", available: 1 },
  { name: "Geladeira", available: 1 },
  { name: "Cortinas", available: 1 },
  { name: "Purificador de água", available: 1 },
  { name: "Almofadas de decoração", available: 1 },
  { name: "Colcha de cama", available: 6 },
  { name: "Aparelho de jantar", available: 2 },
  { name: "Tábua de corta carne de madeira", available: 1 },
  { name: "Jarras", available: 1 },
  { name: "Espremedor de laranja", available: 1 },
  { name: "Escorredor de louça", available: 1 },
  { name: "Cesto de roupas", available: 1 },
  { name: "Varal de apartamento", available: 1 },
  { name: "Fogão", available: 1 },
  { name: "Tábua de passar roupa", available: 1 },
  { name: "Toalha", available: 1 },
  { name: "Jogo de formas", available: 1 },
  { name: "Sanduícheira", available: 1 },
  { name: "Jogo de xícaras", available: 1 },
]

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk.toString()))
    req.on("end", () => {
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
  })
}

module.exports = async function handler(req, res) {
  const { db } = await connectToDatabase()
  const giftsCollection = db.collection("gifts")

  // 🔄 Popular banco automaticamente se estiver vazio
  const existingCount = await giftsCollection.countDocuments()
  if (existingCount === 0) {
    await giftsCollection.insertMany(initialGifts.map((g) => ({ ...g, takenBy: [] })))
  }

  if (req.method === "GET") {
    const gifts = await giftsCollection.find({}).toArray()
    return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(gifts))
  }

  if (req.method === "POST") {
    const data = await getRequestBody(req)
    const gift = await giftsCollection.findOne({ name: data.item })

    if (!gift) {
      return res
        .writeHead(404, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Presente não encontrado." }))
    }

    if (gift.available <= 0) {
      return res
        .writeHead(400, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Este presente já foi escolhido por todos." }))
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
      },
    )

    return res
      .writeHead(201, { "Content-Type": "application/json" })
      .end(JSON.stringify({ message: "Presente reservado com sucesso!" }))
  }

  res.writeHead(405).end()
}
