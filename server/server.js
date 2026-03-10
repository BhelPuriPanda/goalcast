import express from "express";
import matchRouter from "./src/routes/matches.js";

const app = express();

app.use(express.json());

app.use("/matches", matchRouter);

app.listen(8000, () => {
    console.log("Server started on port 8000");
});
