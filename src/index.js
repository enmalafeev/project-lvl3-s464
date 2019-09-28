import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';

const input = document.querySelector('.form-control');
const form = document.querySelector('.form-inline');
const links = document.querySelector('.links');
const feeds = document.querySelector('.feeds');
const { watch } = WatchJS;
const crossOrigin = 'http://cors-anywhere.herokuapp.com/';
const state = {
  input: {
    url: '',
    isValid: false,
  },
  feed: {
    title: '',
    description: '',
    feedLinks: [],
  },
};
const parseFeed = (xml) => {
  const channel = xml.querySelector('channel');
  const title = channel.querySelector('title').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
  const description = channel.querySelector('description').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
  const items = channel.querySelectorAll('item');
  const itemsList = [...items].map((item) => {
    const itemTitle = item.querySelector('title').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
    const itemLink = item.querySelector('link').innerHTML;
    return { itemTitle, itemLink };
  });
  return { title, description, itemsList };
};

watch(state, 'input', () => {
  if (state.input.isValid) {
    input.classList.remove('border-danger');
  } else {
    input.classList.add('border-danger');
  }
});

watch(state.feed, 'title', () => {
  const feedItem = document.createElement('li');
  feedItem.classList.add('list-group-item');
  feedItem.innerHTML = `<h3>${state.feed.title}</h3><span>${state.feed.description}</span>`;
  feeds.append(feedItem);

  state.feed.feedLinks.forEach((el) => {
    const link = document.createElement('li');
    link.classList.add('list-group-item');
    link.innerHTML = `<a href="${el.itemLink}">${el.itemTitle}</a>`;
    links.append(link);
  });
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
  const link = `${crossOrigin}${state.input.url}`.trim();
  axios.get(link)
    .then((response) => {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(`${response.data}`, 'application/xml');
      return doc;
    })
    .then((feed) => {
      const dataFeed = parseFeed(feed);
      state.feed.title = dataFeed.title;
      state.feed.description = dataFeed.description;
      state.feed.feedLinks = dataFeed.itemsList;
    })
    .catch(err => console.log(err));
});
