#!/usr/bin/env osascript -l JavaScript

/**
 * -----------------------------------------------------------------------------
 * App Instances
 * -----------------------------------------------------------------------------
 */

const App = Application.currentApplication();
App.includeStandardAdditions = true;

const MessagesApp = Application('Messages');

/**
 * -----------------------------------------------------------------------------
 * Objective-C Bridge Imports / Bindings
 * -----------------------------------------------------------------------------
 */

ObjC.import('Foundation');
ObjC.import('Cocoa');
ObjC.bindFunction('malloc', ['void *', ['int']]);

/**
 * -----------------------------------------------------------------------------
 * Alfred Workflow Constants and Helpers
 * -----------------------------------------------------------------------------
 */

const BUNDLE_ID = App.systemAttribute('alfred_workflow_bundleid');
const CACHE_DIR = App.systemAttribute('alfred_workflow_cache');
const DATA_DIR = App.systemAttribute('alfred_workflow_data');
const INSTALL_DIR = $path(
  App.systemAttribute('alfred_preferences'),
  'workflows',
  App.systemAttribute('alfred_workflow_uid'),
);

/**
 * Create a path from multiple string segments.
 * @param segments The string segments of the path to create.
 * @returns string
 */
function $path(...segments) {
  return segments.join('/').replace(/\s/g, '\\ ');
}

/**
 * Does a path exist and, if so, what's there?
 * @param path The path to test.
 * @returns boolean
 */
function $pathType(path) {
  ObjC.import('Foundation');
  let isDir = Ref();
  $.NSFileManager.alloc.init.fileExistsAtPathIsDirectory(
    Path(path).toString(),
    isDir,
  );
  if (isDir[0]) return 'directory';

  return $.NSFileManager.alloc.init.fileExistsAtPath(Path(path).toString())
    ? 'file'
    : false;
}

/**
 * Safely read data from the disk.
 * @param pathOrCacheKey The path or cache key from which to read.
 * @returns any
 */
function $read(pathOrCacheKey) {
  if (typeof CACHE_DIR !== 'undefined' && !pathOrCacheKey.match(/\//))
    pathOrCacheKey = `${CACHE_DIR}/${pathOrCacheKey}`;

  let data = App.doShellScript(
    `[ -f "${pathOrCacheKey}" ] && cat "${pathOrCacheKey}" || printf 'null'`,
  );

  try {
    data = JSON.parse(data);
  } catch (ex) {
    // no-op
  }

  return data;
}

/**
 * Safely write data to the disk.
 * @param pathOrCacheKey The path or cache key to which the data will write.
 * @param data The data to write to disk.
 * @returns any
 */
function $write(pathOrCacheKey, data) {
  if (typeof CACHE_DIR !== 'undefined' && !pathOrCacheKey.match(/\//))
    pathOrCacheKey = `${CACHE_DIR}/${pathOrCacheKey}`;

  // ensure directory exists
  const dir = pathOrCacheKey.split('/').reverse().slice(1).reverse().join('/');
  App.doShellScript(`mkdir -p "${dir}"`);

  // write data
  $(
    typeof data !== 'string' ? JSON.stringify(data) : data,
  ).writeToFileAtomicallyEncodingError(
    pathOrCacheKey,
    $(false),
    $.NSUTF8StringEncoding,
    $(),
  );

  return data;
}

/**
 * -----------------------------------------------------------------------------
 * Workflow Logic Helpers
 * -----------------------------------------------------------------------------
 */

const GH_BASE_URL = 'https://github.com';
const GH_CONTENT_BASE_URL = 'https://raw.githubusercontent.com';
const REPOSITORY = 'stephancasas/alfred-mouseless-messenger';

const CACHE = {};

function resolveColorScheme(scheme = '') {
  let preference = App.systemAttribute('alfred_mm_prefers_color_scheme');
  preference = !preference.match(/(dark|light)/i)
    ? App.doShellScript(`defaults read -g AppleInterfaceStyle`).match(/dark/gi)
      ? 'dark'
      : 'light'
    : preference.toLowerCase().trim();

  return {
    light: {
      body: { text: '#242424', bg: '#FFFFFF' },
      received: {
        bg: '#E9E9EB',
      },
      sms: {
        bg: '#34C759',
      },
      imessage: {
        bg: '#057DFE',
      },
      timestamp: '#808080',
    },
    dark: {
      body: { text: '#FFFFFF', bg: '#1E1E1E' },
      received: { bg: '#3B3A3D' },
      sms: {
        bg: '#34C759',
      },
      imessage: {
        bg: '#0C84FF',
      },
      timestamp: '#999999',
    },
  }[scheme || preference];
}

function unserializeMessageBody(mBody) {
  if (!mBody.length) {
    return 'Message un-sent by chat participant.';
  }

  const bytes = [];
  for (let c = 0; c < mBody.length; c += 2)
    bytes.push(parseInt(mBody.substr(c, 2), 16));

  const $bytes = $.malloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    $bytes[i] = bytes[i];
  }

  const txtBody = $.NSUnarchiver.alloc
    .initForReadingWithData($.NSData.dataWithBytesLength($bytes, bytes.length))
    .decodeTopLevelObjectAndReturnError(0).string;

  return ObjC.unwrap(txtBody);
}

function convertMessageTimestamp(timestamp, string = false) {
  let d = new Date(0);
  if (timestamp instanceof Date) {
    d = timestamp;
  } else {
    d.setTime(new Date('2001-01-01').getTime() + parseInt(timestamp / 1000000));
  }

  return string
    ? Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(d)
    : d;
}

function getMessageHistoryOption() {
  let history = App.systemAttribute('alfred_mm_message_history');
  history = parseInt(history);

  return isNaN(history) ? 14 : history;
}

function getMessages() {
  if ('messages' in CACHE) return CACHE.messages;

  const HISTORY = getMessageHistoryOption();

  const QUERY = `\
    SELECT json_object(\
      'message_id', message.ROWID,\
      'message_body_serialized', HEX(message.attributedBody),\
      'sent', message.is_from_me,\
      'is_attachment', message.cache_has_attachments,\
      'date', message.date,\
      'chat_id', chat.ROWID,\
      'chat_guid', chat.guid\
    ) AS json\
    FROM (\
      SELECT message_id, chat_id, ROW_NUMBER()\
        OVER (\
          PARTITION BY chat_id\
            ORDER BY message_id DESC\
        ) AS row_num\
        FROM chat_message_join\
          WHERE chat_id IN (\
            SELECT chat_id\
              FROM chat_message_join\
                WHERE message_id IN (\
                  SELECT MAX(message_id)\
                    FROM chat_message_join\
                    GROUP BY chat_id\
                    ORDER BY message_id DESC\
                    LIMIT 14\
                )\
          )\
    ) chat_message_join\
    JOIN message ON chat_message_join.message_id = message.ROWID\
    JOIN chat ON chat_message_join.chat_id = chat.ROWID\
      WHERE row_num < ${HISTORY + 1}
      ORDER BY message_id DESC;`;

  const messages = JSON.parse(
    `[${App.doShellScript(
      `sqlite3  -newline "," ~/Library/Messages/chat.db "${QUERY}"`,
    ).replace(/,$/, '')}]`,
  );

  CACHE.messages = messages.map((chat) =>
    Object.assign(chat, {
      message_body: unserializeMessageBody(chat.message_body_serialized),
      chat_platform: !!chat.chat_guid.match(/imessage/i) ? 'imessage' : 'sms',
    }),
  );

  return CACHE.messages;
}

function getChatHTML() {
  if ('html' in CACHE) return CACHE.html;

  const colorScheme = resolveColorScheme();
  const printScheme = resolveColorScheme('light');

  const TEMPLATE = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <script>var chat;</script>
        <title>Conversation</title>
        <style>
          html,
          body {
            margin: 0;
            padding: 0;
            color: ${colorScheme.body.text};
            background-color: ${colorScheme.body.bg};
          }
          #conversation {
            display: flex;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            flex-direction: column;
            font-family: sans-serif;
            font-size: 0.875rem;
            line-height: 1.25rem;
            height: 100vh;
          }
          #filler {
              display: flex;
              align-items: center;
              flex-grow: 1;
          }
          .message {
            padding-top: 0.3rem;
            padding-bottom: 0.3rem;
            padding-left: 0.6rem;
            padding-right: 0.6rem;
            border-radius: 12px;
            max-width: 70%;
            text-align: justify;
            margin-top: 0.3rem;
            margin-bottom: 0.3rem;
          }
          .received {
            margin-right: auto;
            border-bottom-left-radius: 0;
          }
          .message.received {
            background-color: ${colorScheme.received.bg};
          }
          .sent {
            border-bottom-right-radius: 0;
            margin-left: auto;
          }
          .message.sent {
              color: #FFFFFF;
          }
          .sms.sent {
            background-color: ${colorScheme.sms.bg};
          }
          .imessage.sent {
            background-color: ${colorScheme.imessage.bg};
          }
          .hidden {
              display: none;
          }
          .timestamp {
            font-size: 0.6rem;
            line-height: 1rem;
            text-align: center;
            font-weight: bold;
            color: ${colorScheme.timestamp}
          }
          .timestamp.sent, .timestamp.received {
            text-align: left;
          }
          @media print {
            html, body {
                color: ${printScheme.body.text};
                background-color: ${printScheme.body.bg};
            }
            #filler {
                display: none;
            }
            .message.received {
                background-color: ${printScheme.received.bg};
            }
            .sms.sent {
                background-color: ${printScheme.sms.bg};
            }
            .imessage.sent {
                background-color: ${printScheme.imessage.bg};
            }
            .timestamp {
                color: ${printScheme.timestamp};
            }
          }
        </style>
      </head>
      <body id="conversation">
        <div id="filler">
          <span style="margin-left: auto; margin-right: auto;">
            Last ${getMessageHistoryOption()} messages shown. Open Messages app to see more.
          </span>
        </div>
        <div><div style="height: .5rem;"></div></div>
        <x-conversation />
        <div><div style="height: .5rem;"></div></div>
      </body>
      <script>
        window.scrollTo(0, document.body.scrollHeight);
      </script>
    </html>`;

  let chats = getMessages();

  // 'periodic' | 'full' | 'none'
  const tsStyle = App.systemAttribute('alfred_mm_ts_style') || 'periodic';

  const lastDateMap = {};
  const createTimestampHtml = (date, sent, chat_id) => {
    if (tsStyle.toLowerCase() == 'none') return '';

    // reset periodic for new chat
    if (!lastDateMap[`${chat_id}`]) {
      lastDateMap[`${chat_id}`] = null;
    }

    date = convertMessageTimestamp(date);
    if (
      (tsStyle == 'periodic' && date - lastDateMap[`${chat_id}`] > 1800000) ||
      !lastDateMap[`${chat_id}`] ||
      tsStyle == 'full'
    ) {
      lastDateMap[`${chat_id}`] = date;
      const align = tsStyle == 'periodic' ? '' : sent ? ' sent' : ' received';

      return `<div class="timestamp${align} ${chat_id} hidden">${convertMessageTimestamp(
        date,
        true,
      )}</div>
      `;
    }

    return '';
  };

  let conversationHtml = chats
    .reverse()
    .reduce(
      (
        acc,
        { message_body, sent, is_attachment, chat_id, chat_platform, date },
        i,
      ) => {
        const ts = createTimestampHtml(date, sent, chat_id);
        return `${acc}${i ? '\r      ' : ''}${ts}<div class="${
          sent ? 'sent' : 'received'
        } message ${chat_platform} ${chat_id} hidden">${
          is_attachment
            ? '<i>Media Attachment</i>'
            : (message_body ?? '').replace(/\\n/g, '<br>')
        }</div>`;
      },
      '',
    );

  // entity-encode emoji chars
  const emojis = conversationHtml.match(
    // ref: https://stackoverflow.com/q/10992921
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
  );
  if (!!emojis)
    conversationHtml = emojis
      .map((emoji) => ({ emoji, html: `&#${emoji.codePointAt(0)};` }))
      .reduce(
        (acc, { emoji, html }) => acc.replace(emoji, html),
        conversationHtml,
      );

  CACHE.html = TEMPLATE.replace('<x-conversation />', conversationHtml);
  return CACHE.html;
}

/**
 * -----------------------------------------------------------------------------
 * Base64 encoder
 *   - The reason of doing base64 encoding/decoding is when a JSON string is being
 *     passed among different workflows, it go through Mac's SHELL, JavaScript engine
 *     and character encodings are handled differently, which casues non-ascii
 *     characters to be displayed incorrectly. By doing another layer of base64
 *     encoding/decoding, it ensures the character encoding does not get mangled.
 * -----------------------------------------------------------------------------
 */
function base64Encode(string) {
  // Convert JavaScript string to NSData object
  const data = $.NSString.alloc.initWithUTF8String(string).dataUsingEncoding($.NSUTF8StringEncoding);
  // Encode the NSData object to base64 string
  const base64String = data.base64EncodedStringWithOptions(0);
  // Convert the NSString to JavaScript string
  return ObjC.unwrap(base64String);
}

/**
 * -----------------------------------------------------------------------------
 * Workflow Run Handler (Main Logic)
 * -----------------------------------------------------------------------------
 */

function run(_) {
  const chats = [...new Set(getMessages().map((message) => message.chat_id))]
    .map((chatId) => {
      const msg = getMessages().find(({ chat_id }) => chat_id === chatId);
      const { chat_guid } = msg;

      const osaChat = MessagesApp.chats.byId(msg.chat_guid);

      // verify valid chat guid
      try {
        osaChat.properties();
      } catch (ex) {
        return {};
      }

      const isGroup = chat_guid.includes(';chat');
      const buddies =
        osaChat.participants[`${isGroup ? 'first' : 'full'}Name`]();
      const chat_title = `${isGroup ? 'Group c' : 'C'}hat with ${
        isGroup
          ? `${buddies.reverse().slice(1).join(', ')} and ${
              buddies.reverse().slice(-1)[0]
            }`
          : buddies
      }`;

      return Object.assign(msg, { chat_title });
    })
    .filter(({ chat_title }) => !!chat_title);

  const sedCmd = [];
  const items = chats.map(
    ({
      chat_guid,
      chat_id,
      is_attachment,
      message_body,
      sent,
      chat_platform,
      chat_title,
    }) => {
      const icon = !sent ? 'received' : `sent-${chat_platform}`;
      const subtitle = is_attachment ? 'Media Attachment' : message_body;

      const preview_path = `${CACHE_DIR}/${chat_title}.html`;
      const cmd = [
        `sed 's/${chat_id} hidden//g'`,
        `"${CACHE_DIR}/chat-preview.html"`,
        `>`,
        `"${preview_path}"`,
      ].join(' ');

      sedCmd.push(`${cmd} &`);

      const dto = (activity) => {
        const jsonString = JSON.stringify({
          chat_guid,
          chat_id,
          chat_title,
          chat_platform,
          is_attachment,
          message_body,
          sent,
          subtitle,
          preview_path,
          activity,
        });
        return base64Encode(jsonString);
      };

      return {
        title: chat_title.replace(/^(.*?)\swith\s/i, ''),
        subtitle,
        valid: true,
        icon: {
          path: `${icon}.png`,
        },
        match: chat_title,
        arg: '',
        variables: {
          alfred_mm_dto: dto('reply'),
        },
        quicklookurl: preview_path,
        mods: Object.assign(
          {
            alt: {
              subtitle:
                "Press enter to export this conversation's HTML preview to your Downloads folder.",
              valid: true,
              arg: '',
              variables: {
                alfred_mm_dto: dto('export_html'),
              },
            },
          },
          // offer pdf export only if chrome is installed
          !$pathType(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          )
            ? {
                cmd: {
                  subtitle:
                    'Please install Google Chrome to enable PDF exporting of conversation previews.',
                  valid: false,
                },
              }
            : {
                cmd: {
                  subtitle:
                    "Press enter to export this conversation's PDF preview to your Downloads folder.",
                  valid: true,
                  arg: '',
                  variables: {
                    alfred_mm_dto: dto('export_pdf'),
                  },
                },
              },
        ),
      };
    },
  );

  const lastMessage = getMessages()[0].message_id;
  const lastPrefsUpdate = $pathType(`${INSTALL_DIR}/prefs.plist`)
    ? App.doShellScript(`date -r "${INSTALL_DIR}/prefs.plist" +%s`)
    : 0;

  if (
    $read('last_message') != $write('last_message', lastMessage) ||
    $read('last_prefs_update') != $write('last_prefs_update', lastPrefsUpdate)
  ) {
    $write(`${CACHE_DIR}/chat-preview.html`, getChatHTML());
    App.doShellScript(sedCmd.join(' '));
  }

  return JSON.stringify({ items });
}
