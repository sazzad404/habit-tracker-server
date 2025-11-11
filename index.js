const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running hahaha");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qa09sjl.mongodb.net/?appName=Cluster0`;

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
            message: "your habit already completed",
          });
        }

        await habitCollection.updateOne(filter, {
          $push: {
            completionHistory: { date: currentDate, time: new Date() },
          },
        });

        const updatedHabit = await habitCollection.findOne(filter);
        const streak = calculateStreak(updatedHabit.completionHistory);

        await habitCollection.updateOne(filter, { $set: { streak } });

        res.send({
          success: true,
          message: "Habit marked as completed for today! 🎉",
          streak,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Something went wrong while marking complete.",
        });
      }
    });

    // helper func
    function calculateStreak(history) {
      if (!history || history.length === 0) return 0;

      const dates = history.map((h) => new Date(h.date)).sort((a, b) => b - a); // নতুন থেকে পুরাতন sort

      let streak = 1;

      for (let i = 0; i < dates.length - 1; i++) {
        const diff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    }


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
