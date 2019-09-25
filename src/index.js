import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import WatchJS from 'melanke-watchjs';

const input = document.querySelector('.form-control');
const { watch } = WatchJS;

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
