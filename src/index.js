import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import axios from 'axios';
import WatchJS from 'melanke-watchjs';
import $ from 'jquery';
import _ from 'lodash';

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

  const parseFeed = (xml) => {
    const channel = xml.querySelector('channel');
    const title = channel.querySelector('title').textContent;
    const description = channel.querySelector('description').textContent;
    const items = channel.querySelectorAll('item');
    const itemsList = [...items].map((item) => {
      const itemId = _.uniqueId('#');
      const itemTitle = item.querySelector('title').textContent;
      const itemDescription = item.querySelector('description').textContent;
      const itemLink = item.querySelector('link').textContent;
      return {
        itemId, itemTitle, itemDescription, itemLink,
      };
    });
    return { title, description, itemsList };
  };

  const validateDublicates = url => state.feed.subscribedFeeds.some(el => el === url);

  watch(state, 'input', () => {
    submitBtn.disabled = state.submitBtn.submitDisabled;
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
    feedsNode.append(feedItem);

    state.feed.feedLinks.forEach((el) => {
      const link = document.createElement('li');
      link.classList.add('list-group-item');
      link.innerHTML = `<a href="${el.itemLink}">${el.itemTitle}</a><button style="display:block" class="btn btn-primary btn__desc" data-toggle="modal" data-target="#showDescription" data-description="${el.itemDescription}">Description</button>`;
      linksNode.append(link);
    });
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

  const parseUrl = (url) => {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(`${url.data}`, 'application/xml');
    return doc;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = `${corsOrigin}${state.input.url}`.trim();
    axios.get(link)
      .then(response => parseUrl(response))
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.feedLinks = dataFeed.itemsList;
        state.feed.subscribedFeeds.push(state.input.url);
        input.value = '';
        // updatePosts(state.feed.subscribedFeeds);
      })
      .catch(err => console.log(err));
  });
  // const updatePosts = (feeds) => {
  //   const oldPostList = state.feed.feedLinks;
  //   feeds.forEach((feedLink) => {
  //     const newPostList = axios.get(`${corsOrigin}${feedLink}`)
  //       .then(response => parseUrl(response))
  //       .then((feed) => {
  //         const dataFeed = parseFeed(feed);
  //         const postList = dataFeed.itemsList;
  //         return postList;
  //       });
  //     const newPosts = _.difference(oldPostList, newPostList);
  //     console.log(newPosts);
  //   });
  // console.log(state.feed.feedLinks);
  // console.log(state.feed.subscribedFeeds);
  // };
};

// http://lorem-rss.herokuapp.com/feed?unit=second&interval=5
app();
