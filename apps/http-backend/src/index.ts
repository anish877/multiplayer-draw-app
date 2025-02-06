import express, { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "backend-common/config"
import { authenticate } from "./middleware/authenticate"
import { User } from "./models/user.model"
import mongoose from "mongoose"
import cookieparser from "cookie-parser"

const app = express()
mongoose.connect('mongodb+srv://anishsuman2305:prkWtCmC2yzmZqBk@cluster0.pdlbk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
app.use(express.json())
app.use(cookieparser())
app.post("/signup", async (req: Request, res: Response) => {
    const username : string = req.body.username;
    const password : string = req.body.password
    if (!username)
    {
      res.status(400).json({ message: "Username required" });
      return 
    }
    const user = await User.findOne({
      username
    })
    console.log(user)
    //@ts-ignore
    if(user)
    {
      res.status(400).json({ message: "Username already taken" });
      return
    }
    if (!password)
    {
      res.status(400).json({ message: "Password required" });
      return 
    }
    bcrypt.hash(password, 0, async function (err, hash) {
      if (err) {
        res.status(500).json({ message: "Error hashing password" });
        return 
      }
      try {
        const user = await User.create({
          username: username,
          password: hash
        });
        res.status(200).json({ user:user.username });
      } catch (dbError) {
        console.log(dbError)
        res.status(500).json({ message: "Error creating user" });
      }
    });
  });


  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username) {
      res.status(400).json({ message: "Username required" });
      return 
    }
    if (!password) {
      res.status(400).json({ message: "Password required" });
      return 
    }
  
    try {
      const user = await User.findOne({ username });
  
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return 
      }
  
      // Compare password directly
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
  
      if (!isPasswordCorrect) {
        res.status(400).json({ message: "Wrong password" });
        return 
      }
  
      // Generate JWT token
      const token = jwt.sign({ username: user.username }, JWT_SECRET);
      res.cookie("uuid", token);
      res.status(200).json({ username:user.username });
  
    } catch (dbError) {
      console.log(dbError);
      res.status(500).json({ message: "Error logging in" });
    }
  });
  


app.post("/create-room",authenticate,(req,res)=>{
  res.status(200).json({message: "Room Created!"})
})
  

app.listen(3001,()=>{
    console.log("Server started at port 3001.")
})