const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running hahaha");
});

const uri =
  "mongodb+srv://habit-tracker:EG2sGvmO7IhBlGkP@cluster0.qa09sjl.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // collections
    const db = client.db("habit-tracker");
    const habitCollection = db.collection("habits");

    // crud operation starts here
    //get method

    app.get("/habits", async (req, res) => {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.createdBy = email;
      }
      const result = await habitCollection.find(query).toArray();
      res.send(result);
    });

    // for 6 data
    app.get("/habits/limited", async (req, res) => {
      const result = await habitCollection
        .find()
        .sort({
          createdAt: -1,
        })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/habits/:id", async (req, res) => {
      const { id } = req.params;
      const result = await habitCollection.findOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    app.post("/habits", async (req, res) => {
      const data = req.body;
      if (data.streak === undefined || data.streak === null) {
        data.streak = 0;
      }
      data.createdAt = new Date();

      const result = await habitCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // update habits
    app.put("/habits/:id", async (req, res) => {
      const id = req.params;
      const updatedData = req.body;

      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          title: updatedData.title,
          category: updatedData.category,
          image: updatedData.image,
          streak: Number(updatedData.streak) || 0,
          updatedAt: new Date(),
        },
      };

      const result = await habitCollection.updateOne(filter, updatedoc);
      res.send(result);
    });

    // delete habit

    app.delete("/habits/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await habitCollection.deleteOne(filter);
      res.send({
        success: true,
        result,
      });
    });









    // mark habit as complete

app.patch("/habits/:id/complete", async (req, res) => {
  const { id } = req.params;
  const filter = { _id: new ObjectId(id) };

  try {
    const habit = await habitCollection.findOne(filter);
     const currentDate = new Date().toISOString().split("T")[0];


        if (!habit.completionHistory) {
      habit.completionHistory = [];
    }

       const alreadyCompleted = habit.completionHistory.some(
      (item) => item.date === currentDate
    );

    if (alreadyCompleted) {
      return res.send({
        success: false,
        message: "আজকে তুমি ইতিমধ্যেই এই habit complete করেছো ✅",
      });
    }

     await habitCollection.updateOne(filter, {
      $push: {
        completionHistory: { date: currentDate, time: new Date() },
      },
    });


    const updatedHabit = await habitCollection.findOne(filter);
    const streak = calculateStreak(updatedHabit.completionHistory);








    
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`surver running  on port ${port}`);
});
