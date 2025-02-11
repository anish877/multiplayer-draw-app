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

    // Load token and userId from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("token");
            if (savedToken) setTokenState(savedToken);

            const savedUserId = localStorage.getItem("userId");
            if (savedUserId) setUserIdState(savedUserId);
        }
    }, []);

    return { token, setToken, userId, setUserId };
};
