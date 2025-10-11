import checkUser from "./helpers/user-log.js";

(async () => {
    
    const user = await checkUser();
    if (user === null) { throw new Error("No user") }
    if (user.role !== "buyer") {
        location.href = "/login";
        throw new Error("Not of role buyer");
    }
})();