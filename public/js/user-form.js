const buyerBtn = document.querySelector('#buyer-btn');
const farmerBtn = document.querySelector('#farmer-btn');

console.log(buyerBtn);


const firstname = document.querySelector('#first-name') || null;
const lastname = document.querySelector('#last-name');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const parish = document.querySelector('#parish');
const license = document.querySelector('#food-handlers-license');
const submitBtn = document.querySelector('#submit-btn');

let currRole = 'farmer';

//form validation

if (firstname == null && lastname == null) { //means login page is open
    submitBtn.addEventListener('click', () => {
        fetch('/login-user',{
            method: 'post',
            headers: new Headers({'Content-Type': 'application/json'}),
            body: JSON.stringify({
                email: email.value,
                password: password.value
            })
        })
        .then(res => res.json())
        .then(data => {
           // if (data.token) {
           //     localStorage.setItem('token', data.token);
                validateData(data, 'login');
          //  } else {

           // }
            
        })
    })
} else { //means register page is open

     submitBtn.addEventListener('click', () => {//form submission button
        fetch('/register-user', { //used to submit the form
            method: 'post',
            headers: new Headers({'Content-Type': 'application/json'}),
            body: JSON.stringify({
                firstname: firstname.value,
                lastname: lastname.value,
                email: email.value,
                password: password.value,
                parish: parish.value,
                role: currRole,
            }) 
        }) 
        .then(res => res.json()) //response to json
        .then(data => {
            validateData(data);
        })
    })

    buyerBtn.addEventListener('click', () => {//when buyer button is clicked
        if (currRole === 'farmer') {
            license.setAttribute('hidden', true);
        }
        currRole = 'buyer';
    });

    farmerBtn.addEventListener('click', () => {//when farmer button is clicked
        if (currRole === 'buyer') {
            license.removeAttribute('hidden');
        }
        currRole = 'farmer';
    });
}

const alertBox = (data) => {
    const alertContainer = document.querySelector('.alert-box');
    const alertMsg = document.querySelector('.alert-message');
    alertMsg.innerHTML = data;

    alertContainer.style.top = '5%';
    setTimeout(() => {
        alertContainer.style.top = null;
    }, 5000);
}

const validateData = (data, currentPage) => {
    console.log(data);
    if(!data.userData.firstname || !data.token) {
        alertBox(data.userData);
    } else {
        sessionStorage.name = data.userData.name;
        sessionStorage.email = data.userData.email;
        localStorage.setItem('token', data.token);
        // if (currentPage === 'login') {
            location.href = '/profile.html';
        // } else {
        //     location.href = '/';
        // }
        
    }
}
