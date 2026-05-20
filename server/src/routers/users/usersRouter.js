import express from "express";
import { listUsers, createUser, updateUser, deleteUser } from "../../controllers/users/usersController.js";
import { auth } from "../../middleware/index.js";

const router = express.Router();

router.use(auth()); // all routes require at least authenticated user

router.get("/", auth("ADMIN"), listUsers);
router.post("/", auth("ADMIN"), createUser);
router.patch("/:id", updateUser); // auth already applied, controller will handle authorization
router.delete("/:id", auth("ADMIN"), deleteUser);

export default router;

