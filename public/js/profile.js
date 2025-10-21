import checkUser from './helpers/user-log.js';
import navBar_role from "./helpers/templates.js";

const initials = document.querySelector('.initials');
const username = document.querySelector('.username');
const logout = document.querySelector('.logout');
const navigationLinks = document.querySelector('#nav-li');
const savedGoodsList = document.getElementById("saved-goods-list"); // add this <ul> in HTML

(async () => {
    const token = localStorage.getItem('token');
    const user = await checkUser();
    if (!user) { throw new Error("No user") }

    console.log(user);
    setUserInfo(user);

    // Load saved goods
    const savedGoods = await loadSavedGoods(token);
    console.log(savedGoods);
    displaySavedGoods(savedGoods, token);

    // Logout
    logout.addEventListener('click', () => {
        localStorage.removeItem('token');
        sessionStorage.clear();
        location.reload();
    }) 
})();

const setUserInfo = (user) => {
    initials.innerHTML = getInitials(user.firstname, user.lastname).toUpperCase();
    username.innerHTML = user.firstname + ' ' + user.lastname;

    navBar_role(navigationLinks, user);
}

const getInitials = (firstname, lastname) => firstname[0] + lastname[0];

// Fetch saved goods from backend
const loadSavedGoods = async (token) => {
    const res = await fetch("/get-saved-goods", {
        headers: {
            "Authorization": "Bearer " + token,
        },
    });
    const data = await res.json();
    return data; // array of saved goods
};

// Display saved goods list with remove buttons
const displaySavedGoods = (goods, token) => {
    if (!savedGoodsList) return;
    savedGoodsList.innerHTML = "";

    if (!Array.isArray(goods)) {
        console.error("Saved goods is not an array", goods);
        return;
    }

    goods.forEach(good => {
        const li = document.createElement("li");
        li.classList.add("saved-good");
        li.innerHTML = `
            ${good.item_name} - $${good.price} - Seller: ${good.firstname} ${good.lastname} - Address: ${good.formatted_address || 'N/A'}
            <button class="remove-saved-btn">Remove</button>
        `;

        const removeBtn = li.querySelector(".remove-saved-btn");
        removeBtn.addEventListener('click', async () => {
            const confirmDelete = confirm(`Remove ${good.item_name} from saved goods?`);
            if (!confirmDelete) return;

            try {
                const res = await fetch(`/remove-saved-good/${good.saved_id}`, {
                    method: 'DELETE',
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                });
                if (res.ok) {
                    li.remove();
                    console.log(`${good.item_name} removed successfully`);
                } else {
                    const errData = await res.json();
                    console.error("Failed to remove saved good", errData);
                }
            } catch (err) {
                console.error(err);
            }
        });

        savedGoodsList.appendChild(li);
    });
};
