#!/usr/bin/env osascript -l JavaScript

const App = Application.currentApplication();
App.includeStandardAdditions = true;

const Messages = Application('Messages');

function run(argv) {
  const dto = App.systemAttribute('alfred_mm_dto');
  const { chat_guid } = JSON.parse(dto);

  const chat = Messages.chats.byId(chat_guid);
  Messages.send(argv[0], { to: chat });
}
