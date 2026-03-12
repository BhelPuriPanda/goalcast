import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";

const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.errors });
    }

    const limit = Math.min(parsed.data.limit ?? 50 , MAX_LIMIT)

    try{
        const data = await db.select().from(matches).limit(limit).orderBy(desc(matches.createdAt));
        res.status(200).json({data});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}); 

matchRouter.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid match ID" });
    }

    try {
        const [match] = await db.select().from(matches).where(eq(matches.id, id));
        if (!match) {
            return res.status(404).json({ error: `Match ${id} not found` });
        }
        res.status(200).json({ data: match });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

matchRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    const {data : {startTime , endTime , homeScore , awayScore} } = parsed;

    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.errors });
    }
    
    try{
        const [match] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(parsed.data.startTime),
            endTime: new Date(parsed.data.endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(match);
        }

        res.status(201).json(match);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default matchRouter;

