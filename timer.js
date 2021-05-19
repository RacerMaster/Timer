function createTimer() {
	let input = $("#inputbox")[0].value;
	let alarmtime = new Date();
	let validinput = false;

	let hrctd = /\d+\s*(hrs|hr|h|std)/i;
	let minctd = /\d+\s*(min|m|mins)/i;
	let secctd = /\d+\s*(s|sec|sek)/i;

	let alarm = /(\d)?\d:\d\d(:\d\d)?/i;

	let volume = /(volume|vol)(:)?\s*(\d)?(\d)?\d/i;

	let comment = /\#.*/i;

	let h = input.match(hrctd);
	let m = input.match(minctd);
	let s = input.match(secctd);

	let t = input.match(alarm);

	let v = input.match(volume);

	let c = input.match(comment);

	if (input == "ring") {
		soundAlarm();
	} else if (v) {
		v = extractNumbers(v[0]);
		if (v < 0) {
			v = 0;
		} else if (v > 100) {
			v = 100;
		}
		setVolume(v / 100);
	} else if (h || m || s) {
		validinput = true;
		if (h) {
			h = extractNumbers(h[0]);
			h = h * 3600000;
			addTime(alarmtime, h);
		}
		if (m) {
			m = extractNumbers(m[0]);
			m = m * 60000;
			addTime(alarmtime, m);
		}
		if (s) {
			s = extractNumbers(s[0]);
			s = s * 1000;
			addTime(alarmtime, s);
		}
	} else if (t) {
		validinput = true;

		t = t[0].split(":");
		if (t[0] >= 0 && t[0] <= 24) {
			alarmtime.setHours(t[0]);
		} else {
			validinput = false;
		}
		if (t[1] >= 0 && t[1] <= 59) {
			alarmtime.setMinutes(t[1]);
		} else {
			validinput = false;
		}
		if (t[2]) {
			if (t[2] >= 0 && t[2] <= 59) {
				alarmtime.setSeconds(t[2], 0);
			} else {
				validinput = false;
			}
		} else {
			alarmtime.setSeconds(0, 0);
		}

		if (new Date() - alarmtime > 0) {
			alarmtime.setDate(alarmtime.getDate() + 1);
		}
	}

	$("#inputbox")[0].value = "";
	if (validinput) {
		console.log(alarmtime);
		addTimer(alarmtime, c);
		updateCountdowns();
	}
}

function extractNumbers(str) {
	let numb = str.match(/\d/g);
	numb = numb.join("");
	return numb;
}

function addTime(date, addms) {
	let curr = date.getTime();
	date.setTime(curr + addms);
}

function createTimerDOM(time, comment, id) {
	let parent = $("#alarms")[0];
	let tmpl = $("#template")[0];

	let newAlarm = tmpl.cloneNode();
	newAlarm.innerHTML = tmpl.innerHTML;

	newAlarm.setAttribute("id", id);
	newAlarm.setAttribute("time", time.getTime());

	let timeString = time.toLocaleTimeString();
	if (comment) {
		comment = comment[0].slice(1);
		comment = timeString + " : " + comment;
	} else {
		comment = timeString;
	}
	newAlarm.firstElementChild.innerHTML = comment;

	newAlarm.children[2].addEventListener("click", deleteTimer);

	let alarms = $("#alarms")[0].children;
	for (let i = 0; i < alarms.length; i++) {
		let otherTime = alarms[i].getAttribute("time");
		otherTime = parseInt(otherTime);
		if (time < otherTime) {
			parent.insertBefore(newAlarm, alarms[i]);
			return;
		}
	}

	parent.appendChild(newAlarm);
}

function updateCountdowns() {
	let alarms = $("#alarms")[0].children;
	//giveFocusToBox();
	let updateTitle = true;

	for (let i = 1; i < alarms.length; i++) {
		let time = alarms[i].getAttribute("time");
		time = parseInt(time);
		let ctdMs = new Date(time) - new Date();

		if (ctdMs < 0) {
			let rings = alarms[i].getAttribute("ringcount");
			rings = parseInt(rings);

			if (rings > 0) {
				let played = soundAlarm();

				if (played) {
					alarms[i].setAttribute("ringcount", rings - 1);
					console.log("ring ring ring");
				}
			}
			ctdMs = 0;
		}

		let h = Math.floor(ctdMs / 3600000);
		ctdMs = ctdMs % 3600000;

		let m = Math.floor(ctdMs / 60000);
		ctdMs = ctdMs % 60000;

		let s = Math.floor(ctdMs / 1000);

		let timeStr = "";
		let cut = true;
		if (h != 0) {
			timeStr += h;
			timeStr += ":";
			cut = false;
		}
		if (m != 0 || !cut) {
			if (!cut && m < 10) {
				timeStr += "0";
			}
			timeStr += m;
			timeStr += ":";
			cut = false;
		}
		if (!cut && s < 10) {
			timeStr += "0";
		}
		timeStr += s;

		if (updateTitle && timeStr != "0") {
			document.title = timeStr;
			updateTitle = false;
		}
		alarms[i].children[1].innerHTML = timeStr;
	}

	if (updateTitle) {
		document.title = "Alarm";
	}
}

function giveFocusToBox() {
	$("#inputbox")[0].focus();
}

function soundAlarm() {
	let audio = $("#ring")[0];
	if (audio.paused) {
		audio.play();
		return true;
	}
	return false;
}

function addTimer(time, comment) {
	let alarms = getAlarms();
	let alarm = {};
	alarm.time = time;
	alarm.comment = comment;

	alarms.max++;
	let id = "a" + alarms.max;

	alarms[id] = alarm;
	createTimerDOM(time, comment, id);

	setAlarms(alarms);
}

function deleteTimer(e) {
	let id = e.target.parentNode.id;
	console.log("removing timer: " + id);
	e.target.parentNode.remove();
	let alarms = getAlarms();
	delete alarms[id];

	setAlarms(alarms);
}

function restoreTimers() {
	let alarms = getAlarms();
	for (a in alarms) {
		if (a != "max") {
			createTimerDOM(new Date(alarms[a].time), alarms[a].comment, a);
		}
	}
}

function setVolume(vol) {
	$("#ring")[0].volume = vol;

	let cookie = getCookieData();
	cookie.volume = vol;
	setCookieData(cookie);

	$("#volume")[0].innerHTML = vol * 100;
	console.log("volume: " + vol);
}

function getVolume() {
	let cookie = getCookieData();
	return cookie.volume || 0.1;
}

function setAlarms(alarms) {
	let cookie = getCookieData();
	cookie.alarms = alarms;
	setCookieData(cookie);
}

function getAlarms() {
	let cookie = getCookieData();
	return cookie.alarms || {
		max: 0
	};
}

function getCookieData() {
	let cookie = {};
	try {
		cookie = JSON.parse(document.cookie);
	} catch (error) {}
	return cookie;
}

function setCookieData(data) {
	let expDate = new Date();
	expDate.setFullYear(expDate.getFullYear() + 100);
	document.cookie = JSON.stringify(data) + ";expires=" + expDate.toUTCString() + ";SameSite=Strict";
}

$(document).ready(function () {
	$("#inputform").on("submit", createTimer);

	let vol = getVolume();
	setVolume(vol);

	restoreTimers();
	updateCountdowns();

	window.setInterval(updateCountdowns, 1000);
});