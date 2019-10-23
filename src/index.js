import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@babel/polyfill';
import validator from 'validator';
import i18next from 'i18next';
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

  i18next.init({
    lng: 'en',
    debug: true,
    resources: {
      en: {
        translation: {
          empty: 'Input field should not to be empty',
          dublicate: 'This feed is already exist',
          invalid: 'Please enter valid RSS-feed',
          network: 'Network error, please try again',
        },
      },
    },
  });

  const renderError = (state) => {
    const errorNode = document.querySelector('[data-error="errorText"]');
    const errorText = i18next.t(state.errorForm);
    if (errorText) {
      errorNode.textContent = errorText;
      errorNode.classList.remove('d-none');
    } else {
      errorNode.textContent = state.errorForm;
      errorNode.classList.add('d-none');
    }
  };

  const state = {
    input: {
      url: '',
    },
    formState: 'empty',
    feedsInfo: {
      title: '',
      description: '',
      feedLinks: [],
      subscribedFeeds: [],
    },
    errorForm: null,
  };

  const validateDublicates = url => state.feedsInfo.subscribedFeeds.some(el => el === url);

  const updatePosts = (link, lastPubDate) => {
    axios.get(`${corsOrigin}${link}`)
      .then((xml) => {
        const dataFeed = parseFeed(xml);
        const newPost = dataFeed.itemsList.filter(item => item.pubDate > lastPubDate);
        const newPostPubDate = _.max(newPost.map(({ pubDate }) => pubDate));
        state.feedsInfo.feedLinks = [...newPost, ...state.feedsInfo.feedLinks];
        setTimeout(() => updatePosts(link, newPostPubDate), 5000);
      })
      .catch(() => {
        state.formState = 'invalid';
        state.errorForm = 'network';
      });
  };

  watch(state, 'formState', () => {
    switch (state.formState) {
      case 'invalid':
        submitBtn.disabled = true;
        input.classList.add('is-invalid');
        break;
      case 'valid':
        input.classList.remove('is-invalid');
        submitBtn.disabled = false;
        break;
      case 'empty':
        submitBtn.disabled = true;
        input.value = '';
        input.classList.remove('is-invalid');
        break;
      default:
        submitBtn.disabled = true;
        input.value = '';
        input.classList.remove('is-invalid');
    }
  });

  watch(state.feedsInfo, 'title', () => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');
    feedItem.innerHTML = `<h3>${state.feedsInfo.title}</h3><span>${state.feedsInfo.description}</span>`;
    feedsNode.append(feedItem);
  });

  watch(state.feedsInfo, 'feedLinks', () => {
    const linksArr = state.feedsInfo.feedLinks.map(el => `<li class="list-group-item"><a href="${el.itemLink}">${el.itemTitle}</a><button style="display:block" class="btn btn-primary btn__desc" data-toggle="modal" data-target="#showDescription" data-description="${el.itemDescription}">Description</button></li>`).join('');
    linksNode.innerHTML = linksArr;
  });

  watch(state, 'errorForm', () => renderError(state));

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
      state.errorForm = 'empty';
    } else if (validateDublicates(state.input.url)) {
      state.formState = 'invalid';
      state.errorForm = 'dublicate';
    } else if (!validator.isURL(state.input.url)) {
      state.formState = 'invalid';
      state.errorForm = 'invalid';
    } else {
      state.formState = 'valid';
      state.errorForm = null;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = `${corsOrigin}${state.input.url}`.trim();
    state.formState = 'valid';
    axios.get(link)
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feedsInfo.title = dataFeed.title;
        state.feedsInfo.description = dataFeed.description;
        state.feedsInfo.feedLinks = [...dataFeed.itemsList, ...state.feedsInfo.feedLinks];
        state.feedsInfo.subscribedFeeds.push(state.input.url);
        state.formState = 'empty';
        const maxPubDate = _.max(dataFeed.itemsList.map(({ pubDate }) => pubDate));
        setTimeout(() => updatePosts(link, maxPubDate), 5000);
      })
      .catch(() => {
        state.formState = 'invalid';
        state.errorForm = 'network';
      });
  });
};

app();
