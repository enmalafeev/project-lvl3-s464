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
  const state = {
    input: {
      url: '',
      isValid: false,
    },
    submitBtn: {
      submitDisabled: true,
    },
    feed: {
      title: '',
      description: '',
      feedLinks: [],
      subscribedFeeds: [],
    },
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

  watch(state, 'input', () => {
    submitBtn.disabled = state.submitBtn.submitDisabled;
    if (state.input.isValid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
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

  $('#showDescription').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget);
    const recipient = button.data('description');
    const modal = $('#showDescription');
    modal.find('.modal-body p').text(recipient);
  });

  input.addEventListener('input', (e) => {
    state.input.url = e.target.value;
    if (state.input.url === '') {
      state.input.isValid = true;
      state.submitBtn.submitDisabled = true;
    } else if (validateDublicates(state.input.url)) {
      state.input.isValid = false;
      state.submitBtn.submitDisabled = true;
    } else if (validator.isURL(state.input.url)) {
      state.input.isValid = true;
      state.submitBtn.submitDisabled = false;
    } else {
      state.input.isValid = false;
      state.submitBtn.submitDisabled = true;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = `${corsOrigin}${state.input.url}`.trim();
    axios.get(link)
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.feedLinks = [...dataFeed.itemsList, ...state.feed.feedLinks];
        state.feed.subscribedFeeds.push(state.input.url);
        input.value = '';
        const maxPubDate = _.max(dataFeed.itemsList.map(({ pubDate }) => pubDate));
        setTimeout(() => updatePosts(link, maxPubDate), 5000);
      })
      .catch(err => console.log(err));
  });
};

app();
