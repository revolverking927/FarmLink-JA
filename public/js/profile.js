const email = sessionStorage.email; // from login

if (email === undefined) { //first check on reload
    location.href = '/login';
} else {
    fetch(`/current-user?email=${encodeURIComponent(email)}`)//fetches the user information
    .then(res => res.json())
    .then(user => {
        console.log("Current user info:", user);
        if (!user.firstname) {//if there is no user information, redirect to login
            location.href = '/login';
        } else { //loads the data
            setUserInfo(user); 
        }
    })
    .catch(err => console.error(err))   
}

const initials = document.querySelector('.initials');
const username = document.querySelector('.username');
const logout = document.querySelector('.logout');
const navigationLinks = document.querySelector('#nav-li');

const setUserInfo = (user) => {
    initials.innerHTML = getInitials(user.firstname, user.lastname).toUpperCase();
    username.innerHTML = user.firstname + ' ' + user.lastname;

    //creating a navigation based on the users role
    if (user.role === 'farmer') {
        const farmerHub_li = document.createElement('li');
        farmerHub_li.setAttribute('class', 'nav-li-item');

        const farmerHub_a = document.createElement('a');
        farmerHub_a.textContent = 'Farmer Hub';
        farmerHub_a.setAttribute('href', './farmer-hub.html');

        farmerHub_li.appendChild(farmerHub_a);
        navigationLinks.appendChild(farmerHub_li);
    } else if (user.role === 'buyer') {
        const farmerHub_li = document.createElement('li');
        farmerHub_li.setAttribute('class', 'nav-li-item');

        const farmerHub_a = document.createElement('a');
        farmerHub_a.textContent = 'Buyer Hub';
        farmerHub_a.setAttribute('href', './buyer-hub.html');

        farmerHub_li.appendChild(farmerHub_a);
        navigationLinks.appendChild(farmerHub_li);
    }
}

const getInitials = (firstname, lastname) => firstname[0] + lastname[0];

logout.addEventListener('click', () => {
    sessionStorage.clear();
    location.reload();
}) 