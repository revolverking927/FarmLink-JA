import checkUser from "./helpers/user-log.js";
import { SearchBar } from "./modules/search-bar.js";

const resultBox = document.querySelector(".result-box");
const inputBox = document.querySelector("#input-box");
const source = document.querySelector("#product-result-template").innerHTML;
( async () => {
    const token = localStorage.getItem("token");
    const user = await checkUser();
    if (user === null) {throw new Error("Invalid user")};

    // console.log(availableKeywords, await loadGoodsList(token));
    
    const product_SearchBar = new SearchBar(resultBox, inputBox, await loadGoodsList(token), source);
    
    product_SearchBar.updateKeywords.addEventListener('update-keywords', async () => {
        console.log("Updated called");
        product_SearchBar.keywords = await loadGoodsList(token);
    });
    //loadGoodsList(token);
})();

const loadGoodsList = async (token) => {
    let dataList;
    await fetch('/get-all-goods', {
        method: 'get',
        headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        dataList = data;
    })
    return dataList;
};