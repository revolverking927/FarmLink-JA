import Handlebars from "handlebars/runtime";

const createPostBtn = document.querySelector('.create-post-btn');
const postBox = document.querySelector('.post-box');
const postBtn = document.querySelector('.post-btn');

//post template

const newPost = (userData, postData) => {

}

createPostBtn.addEventListener('click', () => {
    postBox.style.opacity = 1;
})

postBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const formData = new FormData(postBox);

    const title = formData.get('title');
    const content = formData.get('content');
    const image = formData.get('image');
    const price = formData.get('price');
    const productType = formData.get('product-type');

    console.log(title);

    const token = localStorage.getItem('token');
    console.log(token);
    fetch('/create-post', {
        method: 'post',
        headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token //sends the token for the current user 
        }),
        body: JSON.stringify({
            title: title,
            content: content,
            image: image,
            price: price,
            productType: productType
        })
    })
    .then(res => res.json())
    .then(data => {
        // console.log(data);
        userData = data.userData;
        postData = data.postData;

    });
})

