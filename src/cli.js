import React from 'react';
import blessed from 'blessed';
import { render } from 'react-blessed';
import { hh, h } from 'react-hyperscript-helpers';

const Box = hh('box');
const Form = hh('form');
const Input = hh('input');
const Button = hh('button');
const Prompt = hh('prompt');
const Textbox = hh('textbox');

export const CliApp = () =>
  Box({
    label: 'Auth',
    width: '50%',
    height: '50%',
    left: 'center',
    top: 'center',
    border: {
      type: 'ascii',
    },
  }, [
    Textbox({
      top: 3,
      height: 1,
      left: 2,
      right: 2,
      bg: 'blue',
    }),
    Button({
      top: 5,
      height: 1,
      left: 2,
      width: 6,
      content: 'Submit',
      align: 'center',
      bg: 'red',
      hoverBg: 'blue',
      autoFocus: false,
      mouse: true,
    })
  ]);

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'Notion CLI',
});

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

render(h(CliApp), screen);
