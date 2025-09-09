import { Router } from "express";
import userController from "../controllers/user-controller";
import { body } from "express-validator";
import authMiddleware from "../middlewares/auth-middleware";

const router = Router();

router.post(
    "/registration",
    body("email").isEmail(),
    body("password").isLength({ min: 3, max: 32 }),
    userController.registration
);

router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/activate/:link", userController.activate);
router.get("/refresh", userController.refresh);

router.post("/users", authMiddleware, userController.getUsers);
router.patch("/edit-user/:id/:_name", authMiddleware, userController.editUser);
router.delete(
    "/delete-user/:id/:_delete",
    authMiddleware,
    userController.deleteUser
);

router.patch("/tracking", authMiddleware, userController.trackingHours);
router.get("/projects", authMiddleware, userController.getProjects);
router.post("/project", authMiddleware, userController.getUserProject);
router.patch("/edit", authMiddleware, userController.editStat);

export default router;
