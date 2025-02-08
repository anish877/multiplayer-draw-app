import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prismaClient } from "db/config";
import { JWT_SECRET } from "backend-common/config"
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Cookies received:", req.cookies);

        const cookie = req.cookies?.uuid;
        if (!cookie) {
            res.status(400).json({ message: "Cookie not found" });
            return 
        }
        const decoded = jwt.verify(cookie, JWT_SECRET) as JwtPayload;
        if (!decoded || !decoded.email) {
            res.status(400).json({ message: "Invalid token" });
            return 
        }
        const user = await prismaClient.user.findUnique({ where:{email: decoded.email} });

        if (!user) {
            res.status(400).json({ message: "User not found" });
            return 
        }
        //@ts-ignore
        req.user = user;
        next(); 

    } catch (err) {
        console.error("Authentication error:", err);
        res.status(401).json({ message: "Authentication failed" });
        return 
    }
};
