const App = {
	template: '#app-template',
	data: () => ({
		staticTitle: "Alarm",
		input: "",
		help: false,
		data: {
			vol: 10,
			alarms: [],
		}
	}),
	methods: {
		getTimerString: function(alarm) {
			let alarmDate = new Date(alarm.time);
			let ctdMs = alarmDate - new Date();

			if (ctdMs <= 0){
				ctdMs = 0;
				if (alarm.rings > 0){
					if (this.soundAlarm()){
						alarm.rings--;
						this.save();
					}
				}
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
			} else if (input == "reset") {
				this.resetStorage();
			} else if (v) {
				v = v[1];
				if (v < 0) {
					v = 0;
				} else if (v > 100) {
					v = 100;
				}
				this.data.vol = v;
				this.save();
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
					} else if (alarmtime - new Date() < 0) {
						alarmtime.setMonth(alarmtime.getMonth() + 1);
					}
					
					if (year) {
						alarmtime.setFullYear(year);
					} else if (alarmtime - new Date() < 0) {
						alarmtime.setFullYear(alarmtime.getFullYear() + 1);
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
			let alarm = {time: time, comment: comment, rings: 3};
			this.data.alarms.push(alarm);

			this.data.alarms.sort((a, b) => {
				let adate = new Date(a.time);
				let bdate = new Date(b.time);
				return adate - bdate;
			});
			this.save();
		},
		removeTimer:  function(index){
			this.data.alarms.splice(index, 1);
			this.save();
		},
		soundAlarm: function(){
			let audio = this.$refs.ring;
			audio.volume = this.data.vol / 100;
			if (audio.paused) {
				audio.play();
				return true;
			}
			return false;
		},
		update: function(){
			if (this.data.alarms.length > 0){
				if (document.visibilityState == "visible"){
					this.$forceUpdate();
				}
				document.title = this.getTitle();
			} else {
				document.title = this.staticTitle;
			}
		},
		load: function (){
			console.log("reading data from storage");
			let data = {};
			try {
				data = JSON.parse(window.localStorage.getItem("data"));
			} catch (error) {
				console.error("error reading data");
			}
			
			if (data.vol == undefined){
				data.vol = 10;
			}
			if (data.alarms == undefined){
				data.alarms = [];
			}
			this.data = data;
		},
		save: function (){
			console.log("writing data to storage");
			let data = JSON.stringify(this.data);
			window.localStorage.setItem("data", data);
		},
		resetStorage: function (){
			this.data = {
				vol: 10,
				alarms: []
			};
			this.save();
		},
		getTitle: function(){
			for (let alarm of this.data.alarms){
				let timerString = this.getTimerString(alarm);

				if (timerString != "0") {
					if (alarm.comment != ""){
						return timerString + " : " + alarm.comment;
					}
					return timerString;
				}
			}
			return this.staticTitle;
		}
	},
	mounted: function () {
		this.load();
		const timer = window.setInterval(this.update , 100);
		this.$on('hook:destroyed', () => window.clearInterval(timer));
	},
};

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

let app = new Vue({
	vuetify: new Vuetify({
		theme: { dark: systemDark.matches },
	}),
	render: h => h(App)
}).$mount('#app');

systemDark.addEventListener('change', (e) => {
	app.$vuetify.theme.dark = e.matches
});

function addTime(date, addms) {
	let curr = date.getTime();
	date.setTime(curr + addms);
}