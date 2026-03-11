import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    try {
        const { id: matchId } = matchIdParamSchema.parse(req.params);
        
        const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return res.status(400).json({ errors: parsedQuery.error.errors });
        }
        
        const limit = parsedQuery.data.limit ?? 100;

        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Error fetching commentary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

commentaryRouter.post("/", async (req, res) => {
    try {
        const { id: matchId } = matchIdParamSchema.parse(req.params);
        const commentaryData = createCommentarySchema.parse(req.body);

        const [newCommentary] = await db.insert(commentary).values({
            matchId,
            ...commentaryData,
        }).returning();

        if(req.app.locals.broadcastCommentaryAdded){
            req.app.locals.broadcastCommentaryAdded(newCommentary);
        }

        res.status(201).json(newCommentary);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Error creating commentary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});