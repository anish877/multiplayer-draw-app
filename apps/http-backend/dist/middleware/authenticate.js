"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("db/config");
const config_2 = require("backend-common/config");
const authenticate = async (req, res, next) => {
    try {
        console.log("Cookies received:", req.cookies);
        const cookie = req.cookies?.uuid;
        if (!cookie) {
            res.status(400).json({ message: "Cookie not found" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(cookie, config_2.JWT_SECRET);
        if (!decoded || !decoded.email) {
            res.status(400).json({ message: "Invalid token" });
            return;
        }
        const user = await config_1.prismaClient.user.findUnique({ where: { email: decoded.email } });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        //@ts-ignore
        req.user = user;
        next();
    }
    catch (err) {
        console.error("Authentication error:", err);
        res.status(401).json({ message: "Authentication failed" });
        return;
    }
};
exports.authenticate = authenticate;
