#!/usr/bin/env osascript -l JavaScript

function run(argv) {
  const App = Application.currentApplication();
  App.includeStandardAdditions = true;

  const CWD = App.systemAttribute('alfred_workflow_data');

  const chat_title = App.systemAttribute('alfred_chat_title');
  const chat_preview = App.systemAttribute('alfred_chat_preview');

  return JSON.stringify({
    items: [
      {
        title: `Reply to ${chat_title.split('with')[1].trim()}`,
        subtitle: 'Press enter to send, or escape to cancel.',
        arg: argv[0],
        match: argv[0],
        variables: {
          alfred_reply_body: argv[0],
        },
        icon: {
          path: `${CWD}/send.png`,
        },
      },
    ],
  });
}
