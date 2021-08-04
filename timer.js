const App = {
	template: '#app-template',
	data: () => ({
		updateTitle: true,
		input: "",
		help: false,
		data: {
			vol: 10,
			alarms: [],
		}
	}),
	computed: {
	},
	methods: {
		getTimerString: function(time) {
			let ctdMs = new Date(time) - new Date();
			
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
			
			if (this.updateTitle && timeStr != "0") {
				document.title = timeStr;
				this.updateTitle = false;
			}
			
			return timeStr;
		},
		getAlarmString: function(time){
			let alarmString = "";
			let ringTime = new Date(time);

			if (ringTime.toLocaleDateString() != (new Date()).toLocaleDateString()){
				alarmString = ringTime.toLocaleDateString()+ " " +ringTime.toLocaleTimeString();
			} else {
				alarmString = ringTime.toLocaleTimeString();
			}

			return alarmString;
		},
		createTimer: function(){
			let input = this.input;
			let alarmtime = new Date();
			let validinput = false;
			
			let hrcdt = /(\d+)\s*(?:hrs|hr|h|std)/i;
			let mincdt = /(\d+)\s*(?:min|m|mins)/i;
			let seccdt = /(\d+)\s*(?:s|sec|sek)/i;
			
			let date =  /@\s*(\d\d?)(?:\.(\d\d?)(?:\.(\d\d\d\d+))?)?/i;
			
			let alarm = /\d?\d:\d\d(?::\d\d)?/i;
			
			let volume = /(?:volume|vol):?\s*(\d+)/i;
			
			let comment = /\#(.*)/i;
			
			let h = input.match(hrcdt);
			let m = input.match(mincdt);
			let s = input.match(seccdt);
			
			let d = input.match(date);
			
			let t = input.match(alarm);
			
			let v = input.match(volume);
			
			let c = input.match(comment);
			
			if (input == "ring") {
				this.soundAlarm();
			} else if (v) {
				v = v[1];
				if (v < 0) {
					v = 0;
				} else if (v > 100) {
					v = 100;
				}
				this.data.vol = v;
			} else if (h || m || s) {
				validinput = true;
				if (h) {
					h = h[1];
					h = h * 3600000;
					addTime(alarmtime, h);
				}
				if (m) {
					m = m[1];
					m = m * 60000;
					addTime(alarmtime, m);
				}
				if (s) {
					s = s[1];
					s = s * 1000;
					addTime(alarmtime, s);
				}
			} else if (t) {
				validinput = true;
				
				if (d) {
					console.log(d);
					
					let day = d[1];
					let mon = d[2];
					let year = d[3];
					
					if (day) {
						alarmtime.setDate(day);
					}
					
					if (mon) {
						alarmtime.setMonth(mon - 1);
					}
					
					if (year) {
						alarmtime.setFullYear(year);
					}
				}
				
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
			
			this.input = "";
			if (validinput) {
				console.log(alarmtime);
				this.addTimer(alarmtime.toISOString(), c?c[1]:"");
			}
		},
		addTimer: function(time, comment){
			let alarm = {time: time, comment: comment};
			this.data.alarms.push(alarm);
		},
		soundAlarm: function(){
			let audio = this.$refs.ring;
			if (audio.paused) {
				audio.play();
				return true;
			}
			return false;
		},
		removeTimer:  function(index){
			this.data.alarms.splice(index, 1);
		},
		update: function(){
			if (this.data.alarms.length > 0){
				this.$forceUpdate();
			}
		},
	},
	mounted: function () {
		window.setInterval(this.update , 100);
	},
};

new Vue({
	vuetify: new Vuetify({
		theme: { dark: true },
	}),
	render: h => h(App)
}).$mount('#app');

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
	
	let timeString = "";
	
	if (time.toLocaleDateString() != (new Date()).toLocaleDateString()){
		timeString = time.toLocaleDateString()+ " " +time.toLocaleTimeString();
	} else {
		timeString = time.toLocaleTimeString();
	}
	
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

function load(){
	let cookie = {};
	try {
		cookie = JSON.parse(document.cookie);
	} catch (error) {}
	
	if (cookie.vol == undefined){
		cookie.vol = 10;
	}
	if (cookie.alarms == undefined){
		cookie.alarms = [];
	}
	return cookie;
}

function save(d){
	console.log("writing cookie");
	let expDate = new Date();
	expDate.setFullYear(expDate.getFullYear() + 100);
	document.cookie = JSON.stringify(d) + ";expires=" + expDate.toUTCString() + ";SameSite=Strict";
}

// $(document).ready(function () {
// 	$("#inputform").on("submit", createTimer);

// 	let vol = getVolume();
// 	setVolume(vol);

// 	restoreTimers();
// 	updateCountdowns();

// 	window.setInterval(updateCountdowns, 1000);
// });