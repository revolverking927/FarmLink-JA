import checkUser from "./helpers/user-log.js";

const form = document.getElementById('goods-form');
const list = document.getElementById('goods-list');
const liSource = document.getElementById('good-template').innerHTML;
const template = Handlebars.compile(liSource);

let liCounter = 0;

( async () => {
  const token = localStorage.getItem('token');
  const user = await checkUser();
  if (user === null) { throw new Error("Invalid user")};

  loadGoodsList(token);
 
  initializeButtons(token);
})();

const createLi = (liData) => {
  liCounter++;

  // Add an id to the data
  const data = { ...liData, id: liCounter };

  const html = template(data);

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html.trim();
  const liElement = tempDiv.firstChild;

  // Attach delete functionality
  liElement.querySelector('.delete-btn').addEventListener('click', () => liElement.remove());

  list.prepend(liElement);
}

const loadGoodsList = (token) => {
  fetch('/get-all-goods', {
    method: 'get',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('List of data is', data);

    Object.entries(data).forEach(obj => {
      const dataObj = obj[1];
      createLi(dataObj);
    })
  })
}

const initializeButtons = (token) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('good-name').value.trim();
    const price = document.getElementById('good-price').value.trim();
    const desc = document.getElementById('good-desc').value.trim();

    if (!name || !price) return alert('Please enter a name and price.');

    fetch('./post-goods', {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }),
      body: JSON.stringify({
        item_name: name,
        price,
        description: desc
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);

      createLi(data)
      // Clear inputs
      form.reset();
    })
  });

}
