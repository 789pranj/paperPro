import express from "express";
import {
  createTest,
  getMyTests,
  getTestById,
  createSubmission,
  updateTest,
  submitFullTest,
} from "../controllers/test.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// CREATE TEST
router.post("/", protectRoute, createTest);

// FETCH OWN TESTS
router.get("/mine", protectRoute, getMyTests);  

// FETCH TEST BY ID
router.get("/:id", protectRoute, getTestById);

router.put("/:id", protectRoute, updateTest);

// CREATE SUBMISSION
router.post("/:id/submit", protectRoute, createSubmission);

router.post('/api/tests/:id/submit-all', submitFullTest);


export default router;
