import checkUser from './helpers/user-log.js';

const createPostBtn = document.querySelector('.create-post-btn');
const postBox = document.querySelector('.post-box');
const postBtn = document.querySelector('.post-btn');
const postHolder = document.querySelector('.post-holder');
const closePostBtn = document.querySelector('#post-box-close-btn');
//post template
const source = document.querySelector('#new-post').innerHTML; // source code for template
(async () => {
    const user = await checkUser();
    if (user === null) { throw new Error("No user") }
    if (user.role !== "farmer") {
        location.href = "/login";
        throw new Error("Not of role farmer");
    }
    
    const token = localStorage.getItem('token');

    console.log(user, token);
    getAllPosts(user, token);

    initializeButtons(token);
})();

const newPost = (userData, postData, token) => {
    const numPosts = postHolder.children.length;

    const data = { // template data for values to be inserted
        title: postData.title,
        content: postData.content,
        product_type: postData.product_type,
        price: postData.price,
    }

    //adding the post number to the template
    if (numPosts === 0) { // first post means postnumber of 1
        data['post-number'] = "post-1";
    } else { // new post means number of current posts + 1
        data['post-number'] = `post-${numPosts - 1}`;
    }
    
    //verifying that there is an image to be added
    if (postData.image !== "{}") {
        console.log("has image", postData.image);
        data['image'] = postData.image;
    }
    console.log(postData.image);
    const template = Handlebars.compile(source); // creating a template from the source
    const result = template(data); // actual html code
    
    let element = document.createRange().createContextualFragment(result);

    if (numPosts === 0) { // first post
        postHolder.appendChild(element);
    } else { // new post set before the old one
        const prePostContainer = document.getElementById(`post-${numPosts}`);
        postHolder.prepend(element);
    }

    //inputted element
    element = document.querySelector(`#${data['post-number']}`);
    const deleteBtn = element.querySelector(".post-delete-btn");

    deleteBtn.addEventListener('click', () => {
        console.log("delete post");
        fetch(`/delete-post/${postData.post_id}`, {
            method: 'delete',
            headers: new Headers ({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            })
        })
        .then(data => {
            console.log(data);
            element.remove();
        })
    })
    postBox.style.opacity = 0;
    postBox.style.top = "-100%";
}

const getAllPosts = (user, token) => {
    fetch('/get-current-user-posts', {
        method: 'get',
        headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        Object.values(data).forEach(postData => {
            newPost(user, postData, token)
        })
    })
}

const initializeButtons = (token) => {
    const createPostBtn = document.querySelector('.create-post-btn');
    const postBox = document.querySelector('.post-box');
    const postBtn = postBox.querySelector('.post-btn');
    const closePostBtn = postBox.querySelector('#post-box-close-btn');
    const postHolder = document.querySelector('.post-holder');

    createPostBtn.addEventListener('click', () => {
        postBox.hidden = false;
        setTimeout(() => {
            postBox.style.opacity = 1;
            postBox.style.top = "15%";
        }, 50);
    });

    closePostBtn.addEventListener('click', () => {
        postBox.style.opacity = 0;
        postBox.style.top = "-100%";
        setTimeout(() => {
            postBox.reset();
            postBox.hidden = true;
        }, 300);
    });

    postBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const title = postBox.querySelector('input[name="title"]').value;
        const content = postBox.querySelector('textarea[name="content"]').value;
        const price = postBox.querySelector('input[name="price"]').value;
        const productType = postBox.querySelector('select[name="product-type"]').value;

       
        await fetch('/create-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                title,
                content: content || null,
                price,
                productType
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log('Created post:', data);

            // Add new post to DOM
            newPost(data.userData, data.postData, token);

           
        })
        .catch(err => {
            console.error('Error creating post:', err);
        });
        // Reset form
        postBox.reset();
        postBox.style.opacity = 0;
        postBox.style.top = "-100%";
        postBox.hidden = true;
            
        
    });
};
