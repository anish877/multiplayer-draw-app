import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { prismaClient } from "db/config";
import { JWT_SECRET } from "backend-common/config";
import { authenticate } from "./middleware/authenticate";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post("/signup", async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !name || !password) {
        res.status(400).json({ message: "Email, name, and password are required" });
        return;
    }

    try {
        const existingUser = await prismaClient.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "Email already registered" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prismaClient.user.create({
            data: { email, password: hashedPassword, name }
        });

        res.status(201).json({ name, email });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
        return;
    }
});

app.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }

    try {
        const user = await prismaClient.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: "Wrong password" });
            return;
        }

        const token = jwt.sign({ id: user.id, email, name: user.name }, JWT_SECRET, { expiresIn: "1d" });
        res.cookie("uuid", token, { httpOnly: true, secure: true });
        res.status(200).json({ email, name: user.name });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in" });
        return;
    }
});

app.post("/create-room", authenticate, async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    try {
        const existingRoom = await prismaClient.room.findUnique({ where: { slug } });
        if (existingRoom) {
            res.status(400).json({ message: "Room already exists" });
            return;
        }

        await prismaClient.room.create({
          //@ts-ignore
            data: { slug, adminId: req.user.id }
        });

        res.status(201).json({ message: "Room created successfully" });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating room" });
        return;
    }
});

app.get("/chats/:roomdId",authenticate,async (req,res)=>{
  if(!req.params.roomdId){
    res.status(400).json({message : "room id required"})
    return
  }
  const roomId = parseInt(req.params.roomdId)
  const messages = await prismaClient.chat.findMany({
    where:{
      roomId : roomId
    },
    orderBy:{
      id: "desc"
    },
    take: 50
  })

  res.status(200).json({messages})
})

app.listen(3001, () => {
    console.log("Server started at port 3001.");
});