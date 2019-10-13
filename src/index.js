import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';
import parseFeed from './parser';

const app = () => {
  const input = document.querySelector('.form-control');
  const form = document.querySelector('.form-inline');
  const submitBtn = document.querySelector('.submit');
  const linksNode = document.querySelector('.links');
  const feedsNode = document.querySelector('.feeds');
  const { watch } = WatchJS;
  const corsOrigin = 'http://cors-anywhere.herokuapp.com/';

  const errors = {
    empty: 'Input field should not to be empty',
    dublicate: 'This feed is already exist',
    invalid: 'Please enter valid RSS-feed',
    network: 'Network error, please try again',
  };

  const showError = (state) => {
    const errorNode = document.getElementById('showErr');
    const errorText = errors[state.error];
    if (errorText) {
      errorNode.textContent = errorText;
      errorNode.classList.toggle('d-none');
    } else {
      errorNode.textContent = state.error;
      errorNode.classList.toggle('d-none');
    }
  };

  const state = {
    input: {
      url: '',
    },
    formState: 'empty',
    feed: {
      title: '',
      description: '',
      feedLinks: [],
      subscribedFeeds: [],
    },
    error: null,
  };

  const validateDublicates = url => state.feed.subscribedFeeds.some(el => el === url);

  const updatePosts = (feeds, lastPubDate) => {
    axios.get(`${corsOrigin}${feeds}`)
      .then((response) => {
        const dataFeed = parseFeed(response);
        const newPost = dataFeed.itemsList.filter(item => item.pubDate > lastPubDate);
        const newPostPubDate = _.max(newPost.map(({ pubDate }) => pubDate));
        state.feed.feedLinks = [...newPost, ...state.feed.feedLinks];
        setTimeout(() => updatePosts(feeds, newPostPubDate), 5000);
      })
      .catch(err => console.log(err));
  };

  watch(state, 'formState', () => {
    submitBtn.disabled = state.formState === 'invalid';
    input.value = state.formState === 'empty' ? '' : input.value;
    if (state.formState === 'invalid') {
      input.classList.add('is-invalid');
    } else {
      input.classList.remove('is-invalid');
    }
  });

  watch(state.feed, 'title', () => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');
    feedItem.innerHTML = `<h3>${state.feed.title}</h3><span>${state.feed.description}</span>`;
    feedsNode.append(feedItem);
  });

  watch(state.feed, 'feedLinks', () => {
    const linksArr = state.feed.feedLinks.map(el => `<li class="list-group-item"><a href="${el.itemLink}">${el.itemTitle}</a><button style="display:block" class="btn btn-primary btn__desc" data-toggle="modal" data-target="#showDescription" data-description="${el.itemDescription}">Description</button></li>`).join('');
    linksNode.innerHTML = linksArr;
  });

  watch(state, 'error', () => showError(state));

  $('#showDescription').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    const recipient = button.data('description');
    const modal = $('#showDescription');
    modal.find('.modal-body p').text(recipient);
  });

  input.addEventListener('input', (e) => {
    state.input.url = e.target.value;
    if (state.input.url === '') {
      state.formState = 'empty';
      state.error = 'empty';
    } else if (validateDublicates(state.input.url)) {
      state.formState = 'invalid';
      state.error = 'dublicate';
    } else if (!validator.isURL(state.input.url)) {
      state.formState = 'invalid';
      state.error = 'invalid';
    } else {
      state.formState = 'valid';
      state.error = null;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = `${corsOrigin}${state.input.url}`.trim();
    state.formState = 'pending';
    axios.get(link)
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.feedLinks = [...dataFeed.itemsList, ...state.feed.feedLinks];
        state.feed.subscribedFeeds.push(state.input.url);
        state.formState = 'empty';
        const maxPubDate = _.max(dataFeed.itemsList.map(({ pubDate }) => pubDate));
        setTimeout(() => updatePosts(link, maxPubDate), 5000);
      })
      .catch(() => { state.error = 'network'; });
  });
};

app();
