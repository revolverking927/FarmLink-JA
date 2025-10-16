import checkUser from "./helpers/user-log.js";

( async () => {
    const token = localStorage.getItem("token");
    const user = await checkUser();
    if (user === null) {throw new Error("Invalid user")};

    loadGoodsList(token);
})();

const loadGoodsList = (token) => {
    fetch('/get-all-goods', {
        method: 'get',
        headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
    })
};