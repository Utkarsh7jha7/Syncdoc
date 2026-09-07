const API_URL = "http://localhost:5000/api/auth";


// ===============================
// REGISTER
// ===============================

export const registerUser = async (
    name,
    email,
    password
) => {

    const response = await fetch(
        `${API_URL}/register`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                password
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Registration failed"
        );
    }

    localStorage.setItem(
        "syncdoc_token",
        data.token
    );

    localStorage.setItem(
        "syncdoc_user",
        JSON.stringify(data.user)
    );

    return data;
};


// ===============================
// LOGIN
// ===============================

export const loginUser = async (
    email,
    password
) => {

    const response = await fetch(
        `${API_URL}/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Login failed"
        );
    }

    localStorage.setItem(
        "syncdoc_token",
        data.token
    );

    localStorage.setItem(
        "syncdoc_user",
        JSON.stringify(data.user)
    );

    return data;
};


// ===============================
// CURRENT USER
// ===============================

export const getCurrentUser = () => {

    const user = localStorage.getItem(
        "syncdoc_user"
    );

    if (!user) {
        return "Guest";
    }

    try {
        const parsedUser = JSON.parse(user);

        return parsedUser.name || "Guest";

    } catch {
        return "Guest";
    }
};


// ===============================
// USER OBJECT
// ===============================

export const getUser = () => {

    const user = localStorage.getItem(
        "syncdoc_user"
    );

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
};


// ===============================
// TOKEN
// ===============================

export const getToken = () => {
    return localStorage.getItem(
        "syncdoc_token"
    );
};


// ===============================
// LOGOUT
// ===============================

export const logoutUser = () => {

    localStorage.removeItem(
        "syncdoc_token"
    );

    localStorage.removeItem(
        "syncdoc_user"
    );
};