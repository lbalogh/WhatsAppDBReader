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
  var dbResult = db.exec(`SELECT DISTINCT
                            ZWACHATSESSION.Z_PK,
                            ZWACHATSESSION.ZPARTNERNAME,
                            ZWACHATSESSION.ZLASTMESSAGEDATE
                          FROM
                            ZWACHATSESSION,
                            ZWAMESSAGE
                          WHERE
                            ZWACHATSESSION.Z_PK = ZWAMESSAGE.ZCHATSESSION
                          AND
                            ZWACHATSESSION.ZHIDDEN = 0
                          AND
                            ZWACHATSESSION.ZETAG IS NOT NULL
                          ORDER BY
                            ZWACHATSESSION.ZLASTMESSAGEDATE DESC
                          `);

  var html = '';
  for (i = 0; i < dbResult[0].values.length; i++) {
    var columnValues = dbResult[0].values[i];

    var Z_PK = columnValues[0];
    var ZPARTNERNAME = columnValues[1];
    var ZLASTMESSAGEDATE = columnValues[2];

    var lastMessageDate = new Date((978307200 + ZLASTMESSAGEDATE) * 1000);

    html += '<a onclick="displayConversationMessages(' + Z_PK + ')" href="#">';
    html += '<div class="conversation">';
    html += ZPARTNERNAME;
    html += '<div class="last-message-date">' + lastMessageDate.toLocaleDateString() + '</div>'
    html += '</div>';
    html += '</a>';
  }

  document.getElementById('left-pane').innerHTML = html;
}

// Display the selected conversation in the right pane
function displayConversationMessages(id) {
  selectedConversationId = id;

  var dbResult = db.exec(`SELECT
                            ZGROUPEVENTTYPE,
                            ZTEXT,
                            ZISFROMME,
                            ZGROUPMEMBER,
                            ZMESSAGEDATE,
                            ZPUSHNAME
                          FROM
                            ZWAMESSAGE
                          WHERE
                            ZCHATSESSION = ` + id
                          );
  //console.log(dbResult);

  var html = '';
  var previousMessageDate;

  for (i = 0; i < dbResult[0].values.length; i++) {
    var columnValues = dbResult[0].values[i];

    var ZGROUPEVENTTYPE = columnValues[0];
    var ZTEXT = columnValues[1];

    if (ZGROUPEVENTTYPE != 0 || !ZTEXT) {
      continue;
    }

    var ZISFROMME = columnValues[2];
    var ZGROUPMEMBER = columnValues[3];
    var ZMESSAGEDATE = columnValues[4];
    var ZPUSHNAME = columnValues[5];

    var messageDate = new Date((978307200 + ZMESSAGEDATE) * 1000);

    if (!previousMessageDate || messageDate.getMonth() != previousMessageDate.getMonth() || messageDate.getDate() != previousMessageDate.getDate()) {
      previousMessageDate = messageDate;
      html += '<div class="message timestamp">' + messageDate.toLocaleDateString() + '</div>';
    }

    html += '<div class="message ' + (ZISFROMME == 1 ? 'message-from-me' : 'message-from-other') + '">';

    if (ZISFROMME == 0 && ZGROUPMEMBER) {
      html += '<div class="from-name-in-group">' + ZPUSHNAME + '</div>';
    }

    html += ZTEXT.replace('\n', '<br><br>');
    html += '</div>';
  }

  document.getElementById('right-pane').innerHTML = html;

  var filter = document.getElementById('filter-field').value;
  if (filter.length > 0) {
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

    var elements = document.getElementById('right-pane').getElementsByClassName('message');
    var lastTimestamp;

    for (i = 0; i < elements.length; i++) {
      if (elements[i].classList.contains('timestamp')) {
        lastTimestamp = elements[i];
      }

      if (elements[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
          if (lastTimestamp) {
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
