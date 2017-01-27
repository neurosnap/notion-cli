import blessed from 'blessed';

import * as actions from 'notion-core/actions';
import { getMessageIdSelected, getThreadIdsSelected } from 'notion-core/selectors';
import { getMessagesByThreadSelected } from 'notion-modules/threadPicker/selectors';
import { getThreadList } from 'notion-modules/threadList/selectors';
import { getMessageSelected } from 'notion-modules/messagePicker/selectors';

import configureStore from './store';
import list from './list';

const UNDO_TIMER = 5 * 1000;

const screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  title: 'Notion CLI',
  log: './debug.log',
  cursor: {
    shape: 'underline',
    color: null,
  },
  fullUnicode: true,
});

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
screen.key('tab', (ch, key) => {
  screen.focusNext();
});

const threadlist = list({
  parent: screen,
  label: 'Threads',
  content: 'Loading ...',
  width: '50%',
  height: '95%',
  left: 0,
  top: 0,
  padding: 1,
  border: { type: 'line' },
  style: {
    border: { fg: 'blue' },
    selected: {
      bg: 'yellow',
    },
    focus: {
      border: {
        fg: 'yellow',
      }
    }
  },
  keys: true,
  vi: true,
});

const threadActions = blessed.listbar({
  parent: screen,
  label: 'Thread Actions',
  width: '50%',
  height: 'shrink',
  bottom: 0,
  border: { type: 'line' },
  style: {
    border: { fg: 'blue' },
    focus: {
      border: {
        fg: 'yellow',
      },
    },
  },
  keys: true,
  vi: true,
  items: ['(r)efresh', '(c)lean', '(a)rchive', '(t)rash', '(u)ndo'],
  autoCommandKeys: false,
});

threadActions.on('focus', () => {
  screen.focusNext();
});

const messagelist = list({
  parent: screen,
  label: 'Messages',
  width: '50%',
  height: '40%',
  left: '50%',
  top: 0,
  padding: 1,
  border: { type: 'line' },
  style: {
    border: { fg: 'green' },
    selected: {
      bg: 'yellow',
    },
    focus: {
      border: {
        fg: 'yellow',
      },
    },
  },
  keys: true,
  vi: true,
});

const message = blessed.text({
  parent: screen,
  label: 'Message',
  content: 'No message selected',
  width: '50%',
  height: '60%',
  left: '50%',
  top: '40%',
  padding: 1,
  border: { type: 'line' },
  style: {
    border: { fg: 'red' },
    focus: {
      border: {
        fg: 'yellow',
      },
    },
  },
  keys: true,
  vi: true,
  scrollable: true,
});

screen.render();
threadlist.focus();
const token = process.env.NOTION_TOKEN;
const store = configureStore({ screen, initialState: { token } });
store.dispatch(actions.fetchEmailData());

store.subscribe(() => {
  const state = store.getState();
  updateThreadlist(state);
  updateMessagelist(state);
  updateMessage(state);
  screen.render();
});

function updateThreadlist(state) {
  const threads = getThreadList(state);
  if (threads.length === 0) return;

  const selectedItem = threadlist.getItem(threadlist.selected);

  let selectedThread;
  if (selectedItem) {
    selectedThread = getThreadFromList(selectedItem);
  }

  threadlist.clearItems();
  threads.forEach((thread, i) => {
    if (thread.auto_expire) {
      threadlist.addItem({
        content: displayThread(thread),
        data: thread,
        /* style: {
          fg: '#666',
        }, */
      });
    } else {
      threadlist.addItem({
        content: displayThread(thread),
        data: thread,
      });
    }

    if (selectedThread && thread.id === selectedThread.id) {
      threadlist.select(i);
    }
  });
}

function updateMessagelist(state) {
  const messages = getMessagesByThreadSelected(state);
  const messageIdSelected = getMessageIdSelected(state);

  messagelist.clearItems();
  messages.forEach((msg, i) => {
    messagelist.addItem({
      content: displayMessage(msg),
      data: msg,
    });

    if (messageIdSelected === msg.id) {
      messagelist.select(i);
    }
  });
}

function updateMessage(state) {
  const messageSelected = getMessageSelected(state);
  if (!messageSelected) {
    message.setContent('');
    return;
  }
  message.setContent(messageSelected.sanitizedPlain);
}

threadlist.on('select', (item) => {
  const thread = getThreadFromList(item);
  messagelist.focus();
  store.dispatch(actions.threadSelected({ threadId: thread.id }));
});

messagelist.on('select', (item) => {
  const msg = getMessageFromList(item);
  store.dispatch(actions.setMessageIdSelected(msg.id));
});

screen.key('c', () => {
  const threads = getThreadList(store.getState());
  const threadIds = threads.reduce((acc, thread) => {
    if (thread.auto_expire) acc = [...acc, thread.id];
    return acc;
  }, []);

  store.dispatch(actions.archiveThreads(threadIds));
  setTimeout(() => {
    store.dispatch(actions.dismissUndo());
  }, UNDO_TIMER);
  threadlist.focus();

});

screen.key('a', () => {
  const threadIds = getThreadIdsSelected(store.getState());
  store.dispatch(actions.archiveThreads(threadIds));
  setTimeout(() => {
    store.dispatch(actions.dismissUndo());
  }, UNDO_TIMER);
  threadlist.focus();
});

screen.key('t', () => {
  const threadIds = getThreadIdsSelected(store.getState());
  store.dispatch(actions.trashThreads(threadIds));
  setTimeout(() => {
    store.dispatch(actions.dismissUndo());
  }, UNDO_TIMER);
  threadlist.focus();
});

screen.key('r', () => {
  store.dispatch(actions.refreshCurrentFolder());
});

screen.key('u', () => {
  store.dispatch(actions.undo());
});

function getThreadFromList(item) {
  if (!item.options) return;
  if (!item.options.data) return;
  return item.options.data;
}

function getMessageFromList(item) {
  if (!item.options) return;
  if (!item.options.data) return;
  return item.options.data;
}

function displayThread(thread) {
  const isRead = thread.read;
  const isImportant = !thread.auto_expire;

  let text = '';
  if (isImportant) text += '$ ';
  if (!isRead) text += '* ';
  if (isImportant) {
    text += thread.preview.subject.toUpperCase();
  } else {
    text += thread.preview.subject.toLowerCase();
  }

  return text;
}

function displayMessage(msg) {
  const isRead = msg.read;
  return `${isRead ? '' : '*'} ${msg.body_excerpt}`;
}
