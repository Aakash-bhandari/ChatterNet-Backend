import express from 'express';
import { protect } from '../middlewares/authmiddleware.js';
import { sendMessage, allMessages } from '../controllers/messageController.js';
export const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
