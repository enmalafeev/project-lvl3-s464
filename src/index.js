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
  const links = document.querySelector('.links');
  const feeds = document.querySelector('.feeds');
  const { watch } = WatchJS;
  const crossOrigin = 'http://cors-anywhere.herokuapp.com/';
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
    const title = channel.querySelector('title').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
    const description = channel.querySelector('description').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
    const items = channel.querySelectorAll('item');
    const itemsList = [...items].map((item) => {
      const itemId = _.uniqueId('#');
      const itemTitle = item.querySelector('title').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
      const itemDescription = item.querySelector('description').innerHTML.replace('<![CDATA[', '').replace(']]>', '');
      const itemLink = item.querySelector('link').innerHTML;
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
    feeds.append(feedItem);

    state.feed.feedLinks.forEach((el) => {
      const link = document.createElement('li');
      link.classList.add('list-group-item');
      link.innerHTML = `<a href="${el.itemLink}">${el.itemTitle}</a><button style="display:block" class="btn btn-primary btn__desc" data-toggle="modal" data-target="#showDescription" data-description="${el.itemDescription}">Description</button>`;
      links.append(link);
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
        state.feed.subscribedFeeds.push(state.input.url);
        input.value = '';
      })
      .catch(err => console.log(err));
  });
};

app();
