#!/usr/bin/env osascript -l JavaScript

function run(argv) {
  const App = Application.currentApplication();
  App.includeStandardAdditions = true;

  const Messages = Application('Messages');
  const chat = Messages.chats.byId(App.systemAttribute('alfred_chat_guid'));
  Messages.send(argv[0], { to: chat });
}
