var db;
var timer;
var selectedConversationId;

document.getElementById('file-input').addEventListener('change', readSelectedFile, false);

// Read the sqlite file selected in the open dialog
function readSelectedFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    db = new SQL.Database(e.target.result);
    displayConversationsList();
  };
  reader.readAsBinaryString(file);
}

// Display the conversations list in the left pane
function displayConversationsList() {
  var stmt = db.prepare(`SELECT DISTINCT
                            ZWACHATSESSION.Z_PK,
                            ZWACHATSESSION.ZPARTNERNAME,
                            ZWACHATSESSION.ZLASTMESSAGEDATE
                          FROM
                            ZWACHATSESSION
                          WHERE
                            ZWACHATSESSION.ZHIDDEN = 0
                          AND
                            ZWACHATSESSION.ZETAG IS NOT NULL
                          ORDER BY
                            ZWACHATSESSION.ZLASTMESSAGEDATE DESC
                          `);

  var html = '';
  while(stmt.step()) {
    var row = stmt.getAsObject();
    var lastMessageDate = new Date((978307200 + row['ZLASTMESSAGEDATE']) * 1000);

    html += '<div class="conversation" id="' + row['Z_PK'] + '">';
    html += '<a onclick="displayConversationMessages(' + row['Z_PK'] + ')" href="#">';
    html += '<div class="partner-name">' + row['ZPARTNERNAME'] + '</div>';
    html += '<div class="last-message-date">' + lastMessageDate.toLocaleDateString() + '</div>'
    html += '</a>';
    html += '</div>';
  }

  document.getElementById('bottom-left-pane').innerHTML = html;
}

function getGroupMembers() {
  var stmt = db.prepare(`SELECT Z_PK, ZCONTACTNAME, ZMEMBERJID FROM ZWAGROUPMEMBER`);
  var members = {};

  while(stmt.step()) {
    row = stmt.getAsObject();
    members[row['Z_PK']] = row['ZCONTACTNAME'] || row['ZMEMBERJID'];
  }
  return members
}

// Display the selected conversation in the right pane
function displayConversationMessages(id) {
  selectedConversationId = id;
  var members = getGroupMembers();

  var sql = ` SELECT
                ZGROUPEVENTTYPE,
                replace(ZTEXT, '\n', '<br>') AS ZTEXT,
                ZISFROMME,
                ZGROUPMEMBER,
                ZMESSAGEDATE,
                ZGROUPMEMBER,
                ZPUSHNAME
              FROM
                ZWAMESSAGE
              WHERE
                ZCHATSESSION = $ZCHATSESSION
            `

  var filter = document.getElementById('filter-field').value;
  if (filter) {
    sql += ' AND (ZTEXT LIKE $filter COLLATE NOCASE OR ZPUSHNAME LIKE $filter COLLATE NOCASE)';
  }

  var stmt = db.prepare(sql);
  stmt.bind({$ZCHATSESSION:id, $filter:'%' + filter + '%'});

  var html = '';
  var previousMessageDate;
  var nbMessages = 0;

  while(stmt.step()) {
    row = stmt.getAsObject();
    if (!row['ZTEXT']) {
      continue;
    }

    var messageDate = new Date((978307200 + row['ZMESSAGEDATE']) * 1000);
    if (!previousMessageDate || messageDate.getDate() != previousMessageDate.getDate() || messageDate.getMonth() != previousMessageDate.getMonth()) {
      previousMessageDate = messageDate;
      html += '<div class="message timestamp">' + messageDate.toLocaleDateString() + '</div>';
    }

    html += '<div class="message ' + (row['ZISFROMME'] == 1 ? 'message-from-me' : 'message-from-other') + '">';

    if (row['ZISFROMME'] == 0 && row['ZGROUPMEMBER']) {
      html += '<div class="from-name-in-group">' + (row['ZPUSHNAME'] || members[row['ZGROUPMEMBER']]) + '</div>';
    }

    html += row['ZTEXT'];
    html += '</div>';

    nbMessages++;
  }

  document.getElementById('bottom-right-pane').innerHTML = html;
  document.getElementById('conversation-title').innerHTML = document.getElementById(id).getElementsByClassName('partner-name')[0].innerHTML + ' (<span class="bold">' + nbMessages + (filter ? ' - filtered' : '') + '</span>)';
}

function filterFieldChanged() {
  if (selectedConversationId) {
    clearTimeout(timer);
    timer = setTimeout(displayConversationMessages.bind(null, selectedConversationId), 750);
  }
}
