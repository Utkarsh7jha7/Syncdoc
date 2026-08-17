const names = [
    "User A",
    "User B",
    "User C",
    "User D"
];

export const getCurrentUser = () => {

    let user = sessionStorage.getItem(
        "syncdoc-user"
    );

    if (!user) {

        const randomIndex =
            Math.floor(
                Math.random() * names.length
            );

        user = names[randomIndex];

        sessionStorage.setItem(
            "syncdoc-user",
            user
        );

    }

    return user;
};