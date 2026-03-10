import { z } from 'zod';

// Constant for match statuses
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Schema for listing matches with an optional limit
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Schema for validating the match ID parameter
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Schema for creating a new match
export const createMatchSchema = z.object({
  sport: z.string().min(1, "sport is required and cannot be empty"),
  homeTeam: z.string().min(1, "homeTeam is required and cannot be empty"),
  awayTeam: z.string().min(1, "awayTeam is required and cannot be empty"),
  startTime: z.string().datetime({ message: "startTime must be a valid ISO date string" }),
  endTime: z.string().datetime({ message: "endTime must be a valid ISO date string" }),
  homeScore: z.coerce.number().int().nonnegative().optional(),
  awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => { 
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  
  if (end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endTime must be chronologically after startTime",
      path: ["endTime"],
    });
  }
});

// Schema for updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
