var db;

// Read the sqlite file selected in the open dialog
function readSingleFile(e) {
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
	var dbResult = db.exec('SELECT Z_PK, ZPARTNERNAME FROM ZWACHATSESSION WHERE ZHIDDEN = 0 AND ZETAG IS NOT NULL ORDER BY ZLASTMESSAGEDATE DESC');

	var html = '';
	for (i = 0; i < dbResult[0].values.length; i++) {
		var Z_PK = dbResult[0].values[i][0];
		var ZPARTNERNAME = dbResult[0].values[i][1];

		html += '<div class="conversation">';
		html += '<a onclick="displayConversationDetail(' + Z_PK + ')" href="#">' + ZPARTNERNAME + '</a>';
		html += '</div>';
	}

	document.getElementById('conversations-list-pane').innerHTML = html;
}

// Display the selected conversation in the right pane
function displayConversationDetail(id) {
	var dbResult = db.exec('SELECT ZGROUPEVENTTYPE, ZTEXT, ZISFROMME, ZGROUPMEMBER, ZMESSAGEDATE, ZPUSHNAME FROM ZWAMESSAGE WHERE ZCHATSESSION = ' + id);
	//console.log(dbResult);

	var html = '';
	var previousMessageDate;

	for (i = 0; i < dbResult[0].values.length; i++) {
		var ZGROUPEVENTTYPE = dbResult[0].values[i][0];
		var ZTEXT = dbResult[0].values[i][1];

		if (ZGROUPEVENTTYPE != 0 || !ZTEXT) {
			continue;
		}

		var ZISFROMME = dbResult[0].values[i][2];
		var ZGROUPMEMBER = dbResult[0].values[i][3];
		var ZMESSAGEDATE = dbResult[0].values[i][4];
		var ZPUSHNAME = dbResult[0].values[i][5];

		var messageDate = new Date((978307200 + ZMESSAGEDATE) * 1000);
		if (!previousMessageDate || messageDate.getMonth() != previousMessageDate.getMonth() || messageDate.getDate() != previousMessageDate.getDate()) {
			previousMessageDate = messageDate;

			html += '<div class="message timestamp">' + pad(messageDate.getDate(), 2) + '.' + pad(messageDate.getMonth() + 1, 2) + '.' + messageDate.getFullYear() + '</div>';
		}

		html += '<div class="message ' + (ZISFROMME == 1 ? 'message-from-me' : 'message-from-other') + '">';

		if (ZISFROMME == 0 && ZGROUPMEMBER) {
			html += '<div class="from-name-in-group">' + ZPUSHNAME + '</div>';
		}

 		html += ZTEXT.replace('\n', '<br><br>');
		html += '</div><br>';
	}

	document.getElementById('conversation-detail-pane').innerHTML = html;
}

function pad(num, size) {
	var s = "000" + num;
	return s.substr(s.length - size);
}
