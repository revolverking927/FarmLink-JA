// nav bar farmer or buyer role template
const navBar_role = (parentElement, user) => {
    let filePath, content;

    //creating a navigation based on the users role
    if (user.role === 'farmer') {
        filePath = "./farmer-hub.html";
        content = "Farmer Hub";
    } else if (user.role === 'buyer') {
        filePath = "./buyer-hub.html";
        content = "Buyer Hub";
    }

    const li = document.createElement('li'); //the list
    li.setAttribute('class', 'nav-li-item');

    const a = document.createElement('a'); //the link
    a.textContent = content;
    a.setAttribute('href', filePath);

    li.appendChild(a);
    parentElement.appendChild(li);
}

export default navBar_role;