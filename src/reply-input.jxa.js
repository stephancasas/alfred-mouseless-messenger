#!/usr/bin/env osascript -l JavaScript

const App = Application.currentApplication();
App.includeStandardAdditions = true;

/**
 * Create a path from multiple string segments.
 * @param segments The string segments of the path to create.
 * @returns string
 */
function $path(...segments) {
  return segments.join('/').replace(/\s/g, '\\ ');
}

const INSTALL_DIR = $path(
  App.systemAttribute('alfred_preferences'),
  'workflows',
  App.systemAttribute('alfred_workflow_uid'),
);

function run(argv) {
  const dto = App.systemAttribute('alfred_mm_dto');
  const { chat_title } = JSON.parse(dto);

  return JSON.stringify({
    items: [
      {
        title: `Reply to ${chat_title.split('with')[1].trim()}`,
        subtitle: 'Press enter to send, or escape to cancel.',
        arg: argv[0],
        match: argv[0],
        variables: {
          alfred_mm_reply_body: argv[0],
        },
        icon: {
          path: `${INSTALL_DIR}/send.png`,
        },
      },
    ],
  });
}
