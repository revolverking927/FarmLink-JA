import checkUser from './helpers/user-log.js';
import navBar_role from "./helpers/templates.js";

const initials = document.querySelector('.initials');
const username = document.querySelector('.username');
const logout = document.querySelector('.logout');
const navigationLinks = document.querySelector('#nav-li');

(async () => {
    const user = await checkUser();
    if (user === null) { throw new Error("No user") }

    console.log(user);
    setUserInfo(user);
    
    logout.addEventListener('click', () => {
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
