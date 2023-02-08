#!/usr/bin/env osascript -l JavaScript

const App = Application.currentApplication();
App.includeStandardAdditions = true;

function reply(dto) {
  Application('com.runningwithcrayons.Alfred').runTrigger('reply', {
    inWorkflow: 'com.stephancasas.AlfredMouselessMessenger',
    withArgument: dto,
  });
}

function exportHTML(previewPath) {
  const downloads = `${App.systemAttribute('HOME')}/Downloads`;

  const cmd = ['cp', `"${previewPath}"`, `"${downloads}"`].join(' ');

  App.doShellScript(cmd);
  App.doShellScript(`afplay /System/Library/Sounds/Funk.aiff`);
}

function exportPDF(previewPath, chatTitle) {
  const downloads = `${App.systemAttribute('HOME')}/Downloads`;

  const cmd = [
    `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome`,
    '--headless',
    `--print-to-pdf='${downloads}/${chatTitle}.pdf'`,
    `'file://${previewPath}'`,
  ].join(' ');

  App.doShellScript(cmd);
  App.doShellScript(`afplay /System/Library/Sounds/Funk.aiff`);
}

function run(_) {
  const dto = App.systemAttribute('alfred_mm_dto');
  const { chat_title, preview_path, activity } = JSON.parse(dto);

  switch (activity) {
    case 'reply_or_preview':
      reply(dto);
      break;

    case 'export_html':
      exportHTML(preview_path);
      break;

    case 'export_pdf':
      exportPDF(preview_path, chat_title);
      break;

    default:
      reply(dto);
      break;
  }
}
