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

    html += '<a onclick="displayConversationMessages(' + row['Z_PK'] + ', \'' + row['ZPARTNERNAME'] + '\')" href="#">';
    html += '<div class="conversation">';
    html += row['ZPARTNERNAME'];
    html += '<div class="last-message-date">' + lastMessageDate.toLocaleDateString() + '</div>'
    html += '</div>';
    html += '</a>';
  }

  document.getElementById('bottom-left-pane').innerHTML = html;
}

// Display the selected conversation in the right pane
function displayConversationMessages(id, partnerName) {
  selectedConversationId = id;

  stmt = db.prepare('SELECT COUNT(*) AS COUNT FROM ZWAMESSAGE WHERE ZCHATSESSION = $ZCHATSESSION');
  var row = stmt.getAsObject({$ZCHATSESSION:id});

  document.getElementById('partner-name').innerHTML = partnerName + ' (' + row['COUNT'] + ')';

  stmt = db.prepare(`SELECT
                        ZGROUPEVENTTYPE,
                        replace(ZTEXT, '\n', '<br>') AS ZTEXT,
                        ZISFROMME,
                        ZGROUPMEMBER,
                        ZMESSAGEDATE,
                        ZPUSHNAME
                      FROM
                        ZWAMESSAGE
                      WHERE
                        ZCHATSESSION = $ZCHATSESSION`
                      );
  stmt.bind({$ZCHATSESSION:id});

  var html = '';
  var previousMessageDate;

  while(stmt.step()) {
    row = stmt.getAsObject();
    if (row['ZGROUPEVENTTYPE'] != 0 || !row['ZTEXT']) {
      continue;
    }

    var messageDate = new Date((978307200 + row['ZMESSAGEDATE']) * 1000);
    if (!previousMessageDate || messageDate.getDate() != previousMessageDate.getDate() || messageDate.getMonth() != previousMessageDate.getMonth()) {
      previousMessageDate = messageDate;
      html += '<div class="message timestamp">' + messageDate.toLocaleDateString() + '</div>';
    }

    html += '<div class="message ' + (row['ZISFROMME'] == 1 ? 'message-from-me' : 'message-from-other') + '">';

    if (row['ZISFROMME'] == 0 && row['ZGROUPMEMBER']) {
      html += '<div class="from-name-in-group">' + row['ZPUSHNAME'] + '</div>';
    }

    html += row['ZTEXT'];
    html += '</div>';
  }

  document.getElementById('bottom-right-pane').innerHTML = html;

  if (document.getElementById('filter-field').value.length > 0) {
    applyFilter();
  }
}

function filterFieldChanged() {
  clearTimeout(timer);
  timer = setTimeout(applyFilter, 750);
}

function applyFilter() {
  var filter = document.getElementById('filter-field').value;
  if (filter.length > 0) {
    filter = filter.toUpperCase();

    var elements = document.getElementById('bottom-right-pane').getElementsByClassName('message');
    var lastTimestamp;

    for (i = 0; i < elements.length; i++) {
      if (elements[i].classList.contains('timestamp')) {
        lastTimestamp = elements[i];
      }

      if (elements[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
          if (lastTimestamp && lastTimestamp.style.display != '') {
            lastTimestamp.style.display = '';
          }
          elements[i].style.display = '';
      } else {
          elements[i].style.display = 'none';
      }
    }
  }
  else if (selectedConversationId) {
    displayConversationMessages(selectedConversationId);
  }
}
