import express, { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { authenticate } from "./middleware/authenticate"
import cookieparser from "cookie-parser"
import { prismaClient } from "db/config"
import { JWT_SECRET } from "backend-common/config"
const app = express()
app.use(express.json())
app.use(cookieparser())
app.post("/signup", async (req: Request, res: Response) => {
    const email : string = req.body.email;
    const password : string = req.body.password
    const name : string = req.body.name
    if (!email || !name)
    {
      res.status(400).json({ message: "email and name required" });
      return 
    }
    const user = await prismaClient.user.findUnique({
      where:{
        email: email
      }
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
        await prismaClient.user.create({
          data:{
            email: email,
            password: hash,
            name: name
          }
        });
        res.status(200).json({ name, email });
      } catch (dbError) {
        console.log(dbError)
        res.status(500).json({ message: "Error creating user" });
      }
    });
  });


  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email) {
      res.status(400).json({ message: "Email required" });
      return 
    }
    if (!password) {
      res.status(400).json({ message: "Password required" });
      return 
    }
  
    try {
      const user = await prismaClient.user.findUnique({ where:{email} });
  
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
      const token = jwt.sign({ email, name: user.name }, JWT_SECRET);
      res.cookie("uuid", token);
      res.status(200).json({ email, name: user.name });
  
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