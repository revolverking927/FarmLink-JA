import checkUser from "./helpers/user-log.js";
import { SearchBar } from "./modules/search-bar.js";
import { map, plotGoodsOnMap } from './map.js';

const resultBox = document.querySelector(".result-box");
const inputBox = document.querySelector("#input-box");
const source = document.querySelector("#product-result-template").innerHTML;
( async () => {
    const token = localStorage.getItem("token");
    const user = await checkUser();
    if (user === null) {throw new Error("Invalid user")};

    // console.log(availableKeywords, await loadGoodsList(token));
    
    const goods = await loadGoodsList(token);

    // Plot all goods on map
    //plotGoodsOnMap(goods);

    const product_SearchBar = new SearchBar(resultBox, inputBox, goods, source);
    
    // product_SearchBar.updateKeywords.addEventListener('update-keywords', async (event) => {
    //     console.log("Update called, and the result is:", event.details);
    //     product_SearchBar.keywords = await loadGoodsList(token);
    //     console.log(product_SearchBar.keywords);
    //     plotGoodsOnMap(product_SearchBar.keywords); // update map markers
    // });
    product_SearchBar.updateKeywords.addEventListener('update-keywords', () => {
        const filteredGoods = product_SearchBar.currentResults; // access filtered results
        console.log("Filtered goods:", filteredGoods);

        // Example: update map markers
        plotGoodsOnMap(filteredGoods);

        attachSaveButtons(token);
    });
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

const attachSaveButtons = (token) => {
    document.querySelectorAll('.result-save-icon').forEach(button => {
        button.addEventListener('click', async (e) => {
            const li = e.target.closest('.product-result');
            const list_id = li.dataset.listId; // We'll store list_id in data attribute
            if (!list_id) return console.error('No good ID found');

            try {
                const res = await fetch(`/save-good/${list_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                    },
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Good saved successfully!');
                } else {
                    alert(data.error || 'Failed to save good');
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
};
