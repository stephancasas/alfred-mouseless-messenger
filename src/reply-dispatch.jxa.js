#!/usr/bin/env osascript -l JavaScript

const App = Application.currentApplication();
App.includeStandardAdditions = true;

const Messages = Application('Messages');

function base64Decode(encodedString) {
  // Create an NSData object from the base64 encoded string
  const decodedData = $.NSData.alloc.initWithBase64EncodedStringOptions(encodedString, 0);
  // Convert the NSData object to an NSString object
  const decodedString = $.NSString.alloc.initWithDataEncoding(decodedData, $.NSUTF8StringEncoding);
  // Convert the NSString to JavaScript string and return it
  return ObjC.unwrap(decodedString);
}

function run(argv) {
  const dto = App.systemAttribute('alfred_mm_dto');
  const decoded_dto = base64Decode(dto);
  const { chat_guid } = JSON.parse(decoded_dto);

  const chat = Messages.chats.byId(chat_guid);
  Messages.send(argv[0], { to: chat });
}
