import { Router } from "express";
import { completeAssignmentById, listPendingAssignmentsForUser } from "../models/assignments";

export const assignmentsRouter = Router();

assignmentsRouter.get("/current", async (req, res) => {
  try {
    const userId = req.user!.id;
    const assignments = await listPendingAssignmentsForUser(userId);
    return res.json({ assignments });
  } catch (e) {
    console.error("assignments list failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});

assignmentsRouter.patch("/:id/complete", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const row = await completeAssignmentById({ userId, assignmentId: id });
    if (!row) {
      return res.status(404).json({ message: "Pending assignment not found" });
    }
    return res.json({ assignment: row });
  } catch (e) {
    console.error("assignments complete failed:", e);
    return res.status(500).json({ error: "Something went wrong", code: "INTERNAL_ERROR" });
  }
});
