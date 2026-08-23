import { mount } from 'svelte';
import App from './editor/App.svelte';
import './editor/styles.css';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Application root element was not found.');
}

mount(App, { target });