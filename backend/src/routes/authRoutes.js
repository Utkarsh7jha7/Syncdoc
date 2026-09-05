import express from "express";

import {
    register,
    login,
    getCurrentUser
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// REGISTER
router.post(
    "/register",
    register
);


// LOGIN
router.post(
    "/login",
    login
);


// GET CURRENT USER
router.get(
    "/me",
    protect,
    getCurrentUser
);


export default router;