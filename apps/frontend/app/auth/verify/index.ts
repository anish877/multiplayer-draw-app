'use client';
import { useState, useEffect } from "react";

export const useAuth = () => {
    // Initialize state with localStorage values
    const [token, setTokenState] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("token") || "";
        }
        return "";
    });

    const [userId, setUserIdState] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("userId") || "";
        }
        return "";
    });

    const [username, setUsernameState] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("username") || "";
        }
        return "";
    });

    // Function to update token
    const setToken = (newToken: string) => {
        setTokenState(newToken);
        if (typeof window !== "undefined") {
            localStorage.setItem("token", newToken);
        }
    };

    // Function to update userId
    const setUserId = (newUserId: string) => {
        setUserIdState(newUserId);
        if (typeof window !== "undefined") {
            localStorage.setItem("userId", newUserId);
        }
    };

    // Function to update username
    const setUsername = (newUsername: string) => {
        setUsernameState(newUsername);
        if (typeof window !== "undefined") {
            localStorage.setItem("username", newUsername);
        }
    };

    // Load token, userId, and username from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("token");
            if (savedToken) setTokenState(savedToken);

            const savedUserId = localStorage.getItem("userId");
            if (savedUserId) setUserIdState(savedUserId);

            const savedUsername = localStorage.getItem("username");
            if (savedUsername) setUsernameState(savedUsername);
        }
    }, []);

    return { token, setToken, userId, setUserId, username, setUsername };
};
