var db;

var conversationLabelColumnIndex;
var groupEventTypeColumnIndex; // TODO
var isFromMeColumnIndex; // TODO
var groupIdColumnIndex; // TODO
var messageDateColumnIndex; // TODO
var messageTextColumnIndex;
var fromNameInGroupColumnIndex;

// Read the sqlite file selected in the open dialog
function readSingleFile(e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}

	var reader = new FileReader();
	reader.onload = function(e) {
		db = new SQL.Database(e.target.result);

		conversationLabelColumnIndex = getColumIndexByName("ZWACHATSESSION", "ZPARTNERNAME");
		groupEventTypeColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZGROUPEVENTTYPE");
		isFromMeColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZISFROMME");
		groupIdColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZGROUPMEMBER");
		messageDateColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZMESSAGEDATE");
		messageTextColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZTEXT");
		fromNameInGroupColumnIndex = getColumIndexByName("ZWAMESSAGE", "ZPUSHNAME");

		displayConversationsList();
	};
	reader.readAsBinaryString(file);
}

// Display the conversations list in the left pane
function displayConversationsList() {
	var dbResult = db.exec('SELECT * FROM ZWACHATSESSION WHERE ZHIDDEN = 0 AND ZETAG IS NOT NULL ORDER BY ZLASTMESSAGEDATE DESC');

	var html = '';
	for (i = 0; i < dbResult[0].values.length; i++) {
		var conversationId = dbResult[0].values[i][0];
		html += '<div class="conversation">';
		html += '<a onclick="displayConversationDetail(' + conversationId + ')" href="#">' + dbResult[0].values[i][conversationLabelColumnIndex] + '</a>';
		html += '</div>';
	}

	document.getElementById('conversations-list-pane').innerHTML = html;
}

// Display the selected conversation in the right pane
function displayConversationDetail(id) {
	var dbResult = db.exec('SELECT * FROM ZWAMESSAGE WHERE ZCHATSESSION = ' + id);
	//console.log(dbResult);

	var html = '';
	var previousMessageDate;

	for (i = 0; i < dbResult[0].values.length; i++) {
		if (dbResult[0].values[i][groupEventTypeColumnIndex] != 0 || !dbResult[0].values[i][messageTextColumnIndex]) {
			continue;
		}

		var messageDate = new Date((978307200 + dbResult[0].values[i][messageDateColumnIndex]) * 1000);
		if (!previousMessageDate || messageDate.getMonth() != previousMessageDate.getMonth() || messageDate.getDate() != previousMessageDate.getDate()) {
			previousMessageDate = messageDate;

			html += '<div class="message timestamp">' + pad(messageDate.getDate(), 2) + '.' + pad(messageDate.getMonth() + 1, 2) + '.' + messageDate.getFullYear() + '</div>';
		}

		html += '<div class="message ' + (dbResult[0].values[i][isFromMeColumnIndex] == 1 ? 'message-from-me' : 'message-from-other') + '">';

		if (dbResult[0].values[i][12] == 0 && dbResult[0].values[i][groupIdColumnIndex]) {
			html += '<div class="from-name-in-group">' + dbResult[0].values[i][fromNameInGroupColumnIndex] + '</div>';
		}

		html += dbResult[0].values[i][messageTextColumnIndex];
		html += '</div><br>';
	}

	document.getElementById('conversation-detail-pane').innerHTML = html;
}

function pad(num, size) {
	var s = "000" + num;
	return s.substr(s.length - size);
}

function getColumIndexByName(table, columnName) {
	var dbResult = db.exec('PRAGMA table_info("' + table + '")');
	for (i = 0; i < dbResult[0].values.length; i++) {
		if (dbResult[0].values[i][1] == columnName) {
			return i;
		}
	}

  return -1;
}
