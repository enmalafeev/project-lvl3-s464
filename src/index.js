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
      console.log(doc);
    })
    .catch(err => console.log(err));
});
