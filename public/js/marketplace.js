import checkUser from './helpers/user-log.js';
import navBar_role from "./helpers/templates.js";

const navigationLinks = document.querySelector('#nav-li');
const postSection = document.querySelector('.post-section');
const source = document.querySelector('#post-template').innerHTML;

( async () => {
    const user = await checkUser();
    if (user === null) { throw new Error("No user") }

    let pageNum = 1;

    const token = localStorage.getItem('token');

    //setting up the nav bar for roles
    navBar_role(navigationLinks, user);
    
    fetch('/get-posts', {
        method: 'get',
        headers: new Headers({ 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token //sends the token for the current user 
        }),
        // body: JSON.stringify({
        //     pageNumber: pageNum
        // })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        Object.values(data).forEach(postData => {
            makePost(postData);
        });
    });
})();


const makePost = (postData) => {
    const numPosts = postSection.children.length;

    const data = { // template data for values to be inserted
        title: postData.title,
        content: postData.content,
        product_type: postData.product_type,
        price: postData.price,
        firstname: postData.user_firstname,
        lastname: postData.user_lastname
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
        postSection.appendChild(element);
    } else { // new post set before the old one
        const prePostContainer = document.getElementById(`post-${numPosts}`);
        postSection.prepend(element);
    }
    //inputted element
    element = document.querySelector(`#${data['post-number']}`);
    // console.log(element);
    element.classList.add(`userid-${postData.userid}`);
    element.classList.add(`postid-${postData.postid}`);
}


