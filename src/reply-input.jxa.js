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

function base64Decode(encodedString) {
  // Create an NSData object from the base64 encoded string
  const decodedData = $.NSData.alloc.initWithBase64EncodedStringOptions(encodedString, 0);
  // Convert the NSData object to an NSString object
  const decodedString = $.NSString.alloc.initWithDataEncoding(decodedData, $.NSUTF8StringEncoding);
  // Convert the NSString to JavaScript string and return it
  return ObjC.unwrap(decodedString);
}

const INSTALL_DIR = $path(
  App.systemAttribute('alfred_preferences'),
  'workflows',
  App.systemAttribute('alfred_workflow_uid'),
);

function run(argv) {
  const dto = App.systemAttribute('alfred_mm_dto');
  const decoded_dto = base64Decode(dto);
  const { chat_title } = JSON.parse(decoded_dto);

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
