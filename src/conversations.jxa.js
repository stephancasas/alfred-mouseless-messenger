#!/usr/bin/env osascript -l JavaScript

function run(argv) {
  const App = Application.currentApplication();
  App.includeStandardAdditions = true;

  const CWD = App.systemAttribute('alfred_workflow_data') || '/tmp';
  const CACHE_DIR = App.systemAttribute('alfred_workflow_cache') || '/tmp';
  const CACHE_EXTEN = 'encoded.txt';

  const ICON_RECEIVED =
    'iVBORw0KGgoAAAANSUhEUgAAAFQAAABKCAYAAAAlt3MqAAAACXBIWXMAAAsSAAALEgHS3X78AAAD5ElEQVR4nO2c63HaQBCA1xr+41RgtoLQgdVBnAqMK4g7iNMBrsC4gkAFxh1AAyyqIKgCZ06zwmeht1ZI6PabYYw9PKTPq7vT3t1efXx8QJcQ0TUATPlxbf0Efj5OHF4IABvr9zUAHPhvG0Q8dHk+ZxdKRBMAuAMAn4XdCH9FyJKjByJuSrxHjLMIJSIjbsYipQUWEbDcJSIu2/6y1oRyJM74cW6JWRi5RuocEfdtfIG4UBb5BAD3oh8sz4rFriU/WUzoBYlM8m6OW0psY6HcSxuRvyQOqENeAeCx6SihkVAiMp3MImVoc6mEHK3zswrlqDQifwxEZBLTDNzVidbKQnkItOxRz90WIUut1LZ6VV5MRDMe0w1dJnAz9sbnXJrSQvmDXwbUXpblhYhKt6mlLnkiWlzgcEiaV0QsjNbCCCWiSxxbtsE9B1YuuRFqXebKJw+ImCk2UygRmWzQm4pM5WdWoiVVKI8z9w52QGUxQ6ppWoIlqw1dqsxcxnxjc8KJUCJ6BIDb3hx6f7llV1/4csnrpV4Zc+lP7FvUZITOVWYlxuzsyDFCOZ9Jl3AWPQTjDsqO0CfXrTTg6C6KUG07G3NsS+MIvVOZjRizQ7CFKs2IHF7tdjtzuf9TmSJ883gFhyKD7/FyGEWGqUaoLFGEToZ0Rh0z8RyZcDsXN5VmPZViVKgwKlQYFSqMChVGhQpjhG4HdUbdsvU4D6rIsPcSe36UZmw8Xp6oyLCOp0AOmrFvTIiI13Ev3/qGKAeIHKpQOSKH9rz8XjNPtQkQMUqD2gP72ltJlM+FY7bQBc8vK9UI7WA8CuUFT7p6pDpze7HYyYJbbUsrcWw7Y9KSI5X25TjOiasTobxz7Nl1UyV4Tttll7dpwdzjf+/+uHuJydD5aXtB8/Khvvb6qRgns6yNtZlC+Q0q9RQ/rzBMbsae36hSP3koqrJTdq+nZqMKdtDFjIpewFUbXJYZt5mlEkiFQh1fjBtwEYLSsxpFm2ddXntfq0xGUYQ+OirzDyLWymvkDexdjM53LjVUe+IyL0Jdis6AywsV9uJFuL69O85lzqXKZGZF6NPAZQZ8jkvpeqNp+VDpSg4rvtvqwz/IlGNbSBcQtEnb3r0RSjB/KSTFNwj+mWuIhjwbuW4jGtNICp0LFQVc5WVkeOezb5UKlip4sI1LB3dR3RYS08gmcv42/LyARVa+pFjyJFGDeZKyS2VvLXCLay8fupCXRrwUZ8qXRd12LuSe0vlJvpFVabGOzIDfKzbsuHRGLKTqVMc795aNB8JDFFpma6JdynzZVkHoITDiO4XffC6B1eCv+fmmLw1+7wGA/05Pl5pD/n4/AAAAAElFTkSuQmCC';

  const ICON_SENT_IMESSAGE =
    'iVBORw0KGgoAAAANSUhEUgAAAFQAAABKCAYAAAAlt3MqAAAACXBIWXMAAAsSAAALEgHS3X78AAAEFklEQVR4nO2c23HaQBSGT3jSm0gFJhWEFBCZVBBcgXEHLkAPeKICoALjCoIrCFYFuILgCmKeojdnVvlXs6DrSquLpfPNMNZ4MEifj3ZXZ3fPh7e3N2oTxwvGRDTFSxzPlNMRv7PPTu9IRHscv+JY/tz7rvXa5vU0LtTxgimkyde5sKq8QO6OiLa+ax2avL5GhDpeMCeiOQRe1P6FpwjBWyLa+K611/nDMtQm1PGCCRHdQmTTEtMQcjeQW0vkGhfqeMEMIr8b/WDzPBDR0rRYY0IhcklEl0Y+sDmMiq0sFL30ioiuG9VgnjXEVholVBLqeMEtotJ0T90WYki28F1rW/b7SwlFVG7f4e1dlEeI1Y5WbaFoK7c9iso0xIhgrjvUGum82fGCBRH9GoBMwlBvh2suTGGhjheIjue+ttPvJiJw7nWkFrrlHS/Y9KAXr8qD71q5YnMjlGVGXDtesMx7U2aEItSHdpvnceO71ibtPalCkdD42dJJd51vvmvtks4xUSgSG/uB9OZlEA8Ak6RxalobumGZmdgYi8eICcXjZF+fgExyCVcnnNzyeKQ8cHQWJnbrn0foimVqYcNZRBSh6Ih+v4er6CCfZD5VjdDcQSuTSuQujFBuOysTtaUyQucssxI2HJIqlKlG6PDD1x9/xe3+h2Ua4ePobOkLU43ZCOuHGDNMOULNEkbopE9X1DKTUYfWHfWBC61ZTyYfFmoYFmoYFmoYFmoYFmoYIfS5V1fULs8j5EEZMxxGyp4fpjr7EfbzMGbYySmQV87YV+bou9ZY9vKl15QzEaFDFmqO0KE6L3/gzFNpXnzXCtOg6sA+dc0jk0u0ekQVusL8MqPHUQ3GSCgWPK1YpjYnu+9iC265LdXi2Xetk0nOpOSI1r6cgRNbHxoTirXj66GbKsA6aZ19WvpuyVmoTMStHotOShOKRnbBvX4ix6y1DKkJZmwa5UUQp4Qys3YpZ2bsIfWm3nN8N0iZmenOons9eUcdskl5byo0p4SteFcDb1Nt7C7MpPAkHcpGzLAxf6jkCi1T0aHv5TGySN2SKNGeRhYf5ruWiNS7Gk+8q9hJT0cqpeflfdcSg/8vRPTUM2l5ZD6aGymEhVGAEDyUpModAiqGycpiom29xavvE37a27u1Qdu6xIrom56PBuy0nYe1lrtEjadFR2qWHLEGwWSRw1hlh6bqh46V+qFN7tqTtUN3svya4UJe4vOnmRn7JlCq3MpSwZ8Nfe2TLB0MiYnrtvAP3hiK1rWaymu9BrMEksdKLWZCe3y+S+WgLHCTx4cy5SrxKLkyMDq5kndAZ4S2CeoxVRmdRJkoFgqUYd+iZMSKGY4ZC00ADyqLEvmKRxaaAcqGzDVKxB9ZqAboOMVLiJbTQ+L4fxNBdPcP7ySZDmBg+pwAAAAASUVORK5CYII=';

  const ICON_SENT_SMS =
    'iVBORw0KGgoAAAANSUhEUgAAAFQAAABKCAYAAAAlt3MqAAAACXBIWXMAAAsSAAALEgHS3X78AAAED0lEQVR4nO2cy3HbMBCG12yASgVRKohy5sFKBZErsHwwzi5B7kC64mK5gsgVRJ4J73IFkSuIVYEzUH5wIPEJEnyY3G9GY45HlsjPSwBcAHvx/v5ObSJCMSKiCV7qeGqcjvqdf3Z6ByLa4fgNx/rnTgbyrc3raVyoCMUE0vTrXFhVXiF3S0QbGch9k9fXiFARihkRzSDwc+1feIoSvCGitQzkzuYPy1CbUBGKMRHdQWTTEtNQcteQW0vkOhcqQjGFyB9OP9g9j0S0cC3WmVCIXBDRpZMPbA6nYisLRS+9JKLrRjW4ZwWxlUYJlYSKUNwhKl331G2hhmRzGchN2e8vJRRRufmAt3dRniDWOlqthaKt3PQoKtNQI4KZ7VDLs3mzCMWciH4NQCZhqLfFNRemsFARCtXxPNR2+t1EBc6DjdRCt7wIxboHvXhVHmUgc8XmRijLjLgWoVjkvSkzQhHqQ7vN87iRgVynvSdVKBIaP1s66a7zXQZym3SOiUKR2NgNpDcvg3oAGCeNU9Pa0DXLzMTHWDxGTCgeJ/v6BOSSS7g64eSWxyPlnqOzMLFb/zxClyzTCh/OIqIIRUf05yNcRQf5ovOpZoTmDlqZVCJ3xwjltrMyUVuqI3TGMivhwyGZQplqHB1e3P6+Vbf7X5bphE/e2dIXphpTD+uHGDdMOELdcozQcZ+uqGXGXofWHfWBz1aznkw+LNQxLNQxLNQxLNQxLNQxSuhLr66oXV485EEZN+w9Y88PU52dh/08jBu2egrkjTP2lTnIQI50L196TTkTcXTIQt1xdGjOy+8581SaVxnIYxrUHNinrnlkcolWj5hCl5hfZuw4mMEYCcWCpyXLtOZk911swS23pVa8yECeTHImJUes9uUMnNj60JhQrB1fDd1UAVZJ6+zT0ncLzkJlom71WHRSmlA0snPu9RM5ZK1lSE0wY9MoL4I45Sgza5dyZsYeUm/qPccPg5aZme4suteTd9Qhm5T3pkJzStiKdzXwNtXH7sJMCk/SoWzEFBvzh0qu0DIVHfpeHiOL1C2JGutpZPVhMpAqUu9rPPGu4ic9HZmUnpeXgVSD/29E9NwzaXlkPpo7KYSFUYASPJSkyj0CKobLymKqbb3Dq+8Tftbbu61B27rAiuibno8G/LSdh7WWu0SNp3lHapYcsAbBZZHDWGWHpuqHjoz6oU3u2tO1Q7e6/JrjQl7q8yeZGfsmMKrc6lLBXx197bMuHQyJieu28A9eO4rWlZnKa70GswaSR0YtZkJ7fL5LZW8scNPH+zLlKvEouXQwOrnSd0BnhLYJ6jFVGZ1EmSgWCoxh37xkxKoZjikLTQAPKvMS+YonFpoByobMLErEH1ioBeg41UuJ1tND6vh/E0F0/w99gpmJGqj+SgAAAABJRU5ErkJggg==';

  const ICON_SEND_MESSAGE =
    'iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAACXBIWXMAAAsSAAALEgHS3X78AAAFN0lEQVR4nO2c7XEiORCG29T+X28Eex3BeSM4bwTni2DtCM4XweIIjsvAG8HZGeAIFhKwcAYQgbdE9eC2UGskRp8wT5WrYAwz4h2p9arVcPb6+gojfiilfgOAKQB8Y2940ccQ8V4/GQX1QCl1TkL+7Xj1D0S8HgXtQSl1S2J+9Hj5zSiogFLqEgD0MP4c8LaXUVADipNayD8Oef+HlI1rCc842cvk1IWEtzi5GiomnHoPPTBOung5SUGVUhcAMDs0TjpYnZSgFCdnhjGPyfxkYqhSakpxMpWYmvXR91Cl1BX1ylhx0sXiaH1owjjp4tPR9dAMcVJig4jro4qhmeKkxAKOxYdmjpMS+ka2LWihOCnRrqCJ4uTGM0UnMYfWBCUhb+lvyIc3+QEAVwPPsYaWkiNKqWsK/N8ji/kPAFwMPScitjEpUQJjmiBObqhX6hv1+8BzLbsH1QoqbIjFQot5SX8xzr/uHlQnaMI42bGkXqn5N9I5592DqgSlODlN6CeX1CuhszmR2J2rCkETxknOk46ZenmolJpH7v11CJo4TnK2e+Z0zRQLgUX3oEi2KUOc5HAx9az+f+Tz66TIefckew/NECc5N12JDC1T7xNcY8GfZBM0U5zkcDHPScwUo+Hd5JZcUIqTOm79mfpaxIYmnzk7Notg3iXyCMri5PdU17CwNezdMhDe9txTTnr8xqVZy1OcXGUWc2kR8yKieZdY8+NRZ3mKkymHl0Qn5u7D0QhZpXYRiHjGn0cZ8gXiJGdn2I3jDxks2dI8MEjQQnGSs/OYRrtyZfHNm3i4oBQnZxl6gYQk5lWMoi9P5ubLggUtGCc5O49ptC2VeZfYS7B4C1o4TnIkMVOad4lwQWMVokbAZtg5JUbNwjzgFDSwYD8le4bd0s4ilSLmQaugCQpRh7DNsDvEzGHebVjb807QoQX7Cdgz7EZ7z20zbSasGf8PUFec5EiGnZPDvEvYBWV3uaQNMrF6TE5G8y5hHRkTWum0JmZO8y5hHTlnz8/P6wpm8Q6rx+TQJBR7ky0YMynSMWlMzBLm3cZeUqSjhm3kPsPOKb3k7RAnytKCOg07p5B5lxBv/oRK+Uqwl2GXKGjeJcSqkwn5z03mBoWIWdK8S8iCIuKK6n1eMjXmybX6sVDSvEuIHeHdnhIljVP60l6PySHzXtPqDcxKEZN3u57atiCijldfEsTWUDFrMO82nGHKuo2sYxt9+E9UMj00HNwEipk78x6CswzSuS+v4xwizhBRZ6H+AoDHAxrQa9g5FZl3icMF5SDiAyLqYYgA8J+HM9D//xoiJlGLeZdwOo5BhQ6OSczbsBvnu63Mb9r44vpcUSpHKMOvxf3Wl2F3nEPHzZ+DG5MYKSnSEbsUZ2snAjwmf1/yspkILMkFiURdy4cKyajRvNvo/XzFv0lXQeY9hN4lcFFBaVOwRvMu0ftVnNI91NvsV0L1grZGr3MZBfXHWiliMgrqj5evHgX1x+u7oaOg/oyCRsZrG6ZVQZcBWa9YHHUP1cmXFSLq7JReHNy4ig9iQHtvvbQo6B3PZFESvNu6+ZpoW9z7ZrUmqM72TKV/6uoTtnVzF3En1/vXH1oT1GupSr12yrZungZe1zu325Kgd6FJa3jburkcOIk9+L6wFUGdQ92HAZPYY8iNbEXQaFmpwEnsMfTaLfz23UFD3QcqoZzT5uA1/WRbV0s1P+S6tQs6eKj7QFmkWYxz1T7kW0tAVy1osqGektKC3gs2JstQT0FRQWl9rMt7+Ipm+4Wvgs06HAD4BQFSK8wKTcmkAAAAAElFTkSuQmCC';

  const PREVIEW_HTML_TEMPLATE = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <script>var chat;</script>
        <title>Conversation</title>
        <style>
          html,
          body {
            margin: 0;
            padding: 0;
            color: #bbbbb;
            background-color: #ffffff;
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
            background-color: #E9E9EB;
            border-bottom-left-radius: 0;
          }
          .sent {
            border-bottom-right-radius: 0;
            margin-left: auto;
          }
          .sms.sent {
            background-color: #65c465;
            color: #ffffff;
          }
          .imessage.sent {
            background-color: #3d83f7;
            color: #ffffff;
          }
          .hidden {
              display: none;
          }
        </style>
      </head>
      <body id="conversation">
        <div id="filler">
          <span style="margin-left: auto; margin-right: auto;">
            Last 14 messages shown. Open Messages app to see more.
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

  const SQL_QUERY = `\
    SELECT json_object( \
      'message_id', message.ROWID,  \
      'message_body', message.text,  \
      'sent', message.is_from_me, \
      'is_attachment', message.cache_has_attachments,  \
      'chat_id', chat.ROWID,  \
      'chat_guid', chat.guid \
    ) AS json \
    FROM ( \
      SELECT message_id, chat_id, ROW_NUMBER() \
        OVER ( \
          PARTITION BY chat_id \
            ORDER BY message_id DESC \
        ) AS row_num \
        FROM chat_message_join \
          WHERE chat_id IN ( \
            SELECT chat_id \
              FROM chat_message_join \
                WHERE message_id IN ( \
                  SELECT MAX(message_id) \
                    FROM chat_message_join \
                    GROUP BY chat_id \
                    ORDER BY message_id DESC \
                    LIMIT 14 \
                ) \
          ) \
    ) chat_message_join \
    JOIN message ON chat_message_join.message_id = message.ROWID \
    JOIN chat ON chat_message_join.chat_id = chat.ROWID \
      WHERE row_num < 11
      ORDER BY message_id DESC;`;

  const SQLITE_COMMAND = `sqlite3 -newline ","\
    ~/Library/Messages/chat.db "${SQL_QUERY}"`;

  const Util = {
    shellEncode: (data) => {
      if (typeof data === 'object') data = JSON.stringify(data);
      return [...data].map((char) => char.charCodeAt(0)).join(' ');
    },

    shellDecode: (data) => {
      data = String.fromCharCode(...data.split(/\s/g));
      try {
        data = JSON.parse(data);
      } catch (ex) {}
      return data;
    },

    readCache: (key) => {
      try {
        const data = App.doShellScript(`\
              curl --location \
              --request GET 'file://${CACHE_DIR}/${key}.${CACHE_EXTEN}'`);
        return Util.shellDecode(data);
      } catch (ex) {
        return '';
      }
    },

    writeCache: (key, value) => {
      App.doShellScript(
        `mkdir -p "${CACHE_DIR}"; \
            printf "${Util.shellEncode(
              value,
            )}" > "${CACHE_DIR}/${key}.${CACHE_EXTEN}";`,
      );
      return value;
    },
  };

  const Alfred = {
    setEnv: (key, value) => {
      const prefs = Alfred.var('preferences');
      const workflowUid = Alfred.var('workflow_uid');
      const workflowDir = `${prefs}/workflows/${workflowUid}`;

      return Application('System Events')
        .propertyListFiles.byName(`${workflowDir}/info.plist`)
        .propertyListItems.byName('variables')
        .propertyListItems.byName(key)
        .value.set(value);
    },

    invoke: (trigger, arg = '') => {
      Application('Alfred').runTrigger(trigger, {
        inWorkflow: Alfred.var('workflow_bundleid'),
        withArgument: typeof arg === 'string' ? arg : JSON.stringify(arg),
      });
    },

    dismiss: () => Alfred.invoke('dismiss'),

    var: (name) => App.systemAttribute(`alfred_${name}`) || '',

    getActivity: () => {
      return Alfred.var('activity');
    },
  };

  // install workflow icons
  if (!Alfred.var('workflow_installed') && CWD !== '/tmp') {
    App.doShellScript(`mkdir -p "${CWD}"`);

    // install icons
    [
      ['received', ICON_RECEIVED],
      ['sent-imessage', ICON_SENT_IMESSAGE],
      ['sent-sms', ICON_SENT_SMS],
      ['send', ICON_SEND_MESSAGE],
    ].forEach(([filename, data]) =>
      App.doShellScript(`printf "${data}" | base64 --decode\\
        > "${CWD}/${filename}.png"`),
    );

    Alfred.setEnv('alfred_workflow_installed', 1);
  }

  const Messages = {
    _messages: [],
    _masterHasRendered: false,
    _chatsHaveRendered: false,
    getMessages: (refresh = false) => {
      if (!!Alfred.var('session_has_messages') && !refresh) {
        return Messages._messages.length
          ? Messages._messages
          : Util.readCache('recent_messages');
      }

      let messages = App.doShellScript(SQLITE_COMMAND);
      messages = JSON.parse(`[${messages.replace(/,$/, '')}]`).map((msg) =>
        Object.assign(msg, {
          chat_platform: !!msg.chat_guid.match(/imessage/i)
            ? 'imessage'
            : 'sms',
        }),
      );

      Messages._messages = messages;
      Util.writeCache('recent_messages', messages);

      return messages;
    },
    renderMasterHtml: () => {
      if (
        Messages._masterHasRendered ||
        !!Alfred.var('session_has_master_html')
      )
        return;
      let messages = Messages.getMessages();
      let conversationHtml = messages
        .reverse()
        .reduce(
          (
            acc,
            { message_body, sent, is_attachment, chat_id, chat_platform },
            i,
          ) =>
            `${acc}${i ? '\r      ' : ''}<div class="${
              sent ? 'sent' : 'received'
            } message ${chat_platform} ${chat_id} hidden">${
              is_attachment
                ? '<i>Media Attachment</i>'
                : (message_body ?? '').replace(/\\n/g, '<br>')
            }</div>`,
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

      App.doShellScript(
        `mkdir -p "${CACHE_DIR}"; echo "${PREVIEW_HTML_TEMPLATE.replace(
          '<x-conversation />',
          conversationHtml,
        )
          .replace(/\n/g, '\\$&')
          .replace(/"/g, '\\$&')
          .replace(/`/g, '\\$&')}" > "${CACHE_DIR}/chat-preview.html"`,
      );
      Messages._masterHasRendered = true;
    },
    renderChats: (chats) => {
      if (Messages._chatsHaveRendered || !!Alfred.var('session_has_chat_html'))
        return;
      Messages.renderMasterHtml();
      App.doShellScript(
        chats
          .map(
            ({ chat_id: id, chat_title }) =>
              `sed 's/${id} hidden//g' \\
                              "${CACHE_DIR}/chat-preview.html" > \\
                              "${CACHE_DIR}/${chat_title}.html"`,
          )
          .join(';'),
      );
    },
  };

  const Activities = {
    pick_conversation: () => {
      let messages = Messages.getMessages();
      const MessagesApp = Application('Messages');
      const chats = [...new Set(messages.map((message) => message.chat_id))]
        .map((chatId) => {
          const msg = messages.find(({ chat_id }) => chat_id === chatId);
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

      const items = chats.map((chat) => {
        const {
          chat_guid,
          chat_id,
          is_attachment,
          message_body,
          sent,
          chat_platform,
          chat_title: title,
        } = chat;

        const icon = !sent ? 'received' : `sent-${chat_platform}`;
        const subtitle = is_attachment ? 'Media Attachment' : message_body;

        return {
          title,
          subtitle,
          valid: true,
          icon: {
            path: `${CWD}/${icon}.png`,
          },
          match: title,
          arg: '',
          variables: {
            alfred_activity: 'reply_or_preview',
            alfred_chat_guid: chat_guid,
            alfred_chat_id: chat_id,
            alfred_chat_title: title,
            alfred_chat_preview: subtitle,
            alfred_chat_platform: chat_platform,
          },
          quicklookurl: `${CACHE_DIR}/${title}.html`,
        };
      });

      Messages.renderChats(chats);

      return JSON.stringify({
        items,
        variables: {
          alfred_session_has_messages: 1,
          alfred_session_has_master_html: 1,
          alfred_session_has_chat_html: 1,
        },
      });
    },
  };

  return Activities.pick_conversation();
}
