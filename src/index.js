import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';

const input = document.querySelector('.form-control');
const form = document.querySelector('.form-inline');
const { watch } = WatchJS;
const crossOrigin = 'http://cors-anywhere.herokuapp.com/';
const state = {
  input: {
    url: '',
    isValid: false,
  },
  xml: {
    title: '',
    description: '',
  },
};

const parseFeed = (xml) => {
  const channel = xml.querySelector('channel');
  const title = channel.querySelector('title').innerHTML;
  const description = channel.querySelector('description').innerHTML;
  const items = channel.querySelectorAll('item');
  const itemsList = [...items].map((item) => {
    const itemTitle = item.querySelector('title').innerHTML;
    const itemLink = item.querySelector('link').innerHTML;
    return { itemTitle, itemLink };
  });
  return { title, description, itemsList };
};

watch(state.input, 'url', () => {
  if (state.input.isValid) {
    input.classList.remove('border-danger');
  } else {
    input.classList.add('border-danger');
  }
});

input.addEventListener('input', (e) => {
  state.input.url = e.target.value;
  if (state.input.url === '') {
    state.input.isValid = true;
  } else if (validator.isURL(state.input.url)) {
    state.input.isValid = true;
  } else {
    state.input.isValid = false;
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const link = `${crossOrigin}${state.input.url}`;
  axios.get(link)
    .then((response) => {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(`${response.data}`, 'application/xml');
      return doc;
    })
    .then((xml) => {
      console.log(parseFeed(xml));
    })
    .catch(err => console.log(err));
});
