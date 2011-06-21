var UserAgentParser = {
	
	// Lot of info about the user agent:
	// 		http://www-archive.mozilla.org/build/revised-user-agent-strings.html
	
	// The resulting object structure:
	ret: {
		hardware:{
			name: "", // HTC htc_vision, HTC htc_legend, HTC htc_ace, NOKIA 
			raw: {}
		},
		os:{
			name: "", // 	Android 2.2.1, 	Windows NT 5.1, 	Intel Mac OS X, 	Symbian OS
			raw: {}
		},
		engine:{
			name:"", // 	Presto, 	Webkit,
			version:"", // 	2.4.15, 	534.3, 533.19.4
			locale: "", // de-DE, en-GB, en-de, en, de
			security: "", // N, U, I
			raw: {} // {Presto:"2.4.15", Version:"10.00"}
		},
		browser:{
			name: "", // 	Safari		Opera
			version: "", //	5.0.3 		11.0
			raw: {}
		}
	},
	
	parse: function(ua){
		//
		// "WidgetManager;" prefix is the Vodafone Widget Manager, a W3C/JIL/WAC runtime
		//
		// Example User Agents:
		//		WidgetManager; HTC htc_vision; Opera/9.80 (Android 2.2.1; U; Opera Widgets Mobi; en; 1011231422) Presto/2.4.15 Version/10.00
		//					   [------------1-----------]  [-----------------------2---------------------------] [------------3------------]
		//		WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1010290100) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC htc_bravo; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC htc_bravo; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1012090815) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC htc_ace; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1012220100) Presto/2.4.15 Version/10.00
		//		WidgetManager; HTC vfpioneer; Opera/9.80 (Android 1.6; U; Opera Widgets Mobi; de; 1010290100) Presto/2.4.15 Version/10.00    
		//		WidgetManager; Nokia N97 mini; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2251) Presto/2.7.38 Version/10.50
		//		WidgetManager; Nokia 5800; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2251) Presto/2.7.38 Version/10.50
		//		WidgetManager; NOKIA E5-00; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2250) Presto/2.7.38 Version/10.50
		//
		if(/^WidgetManager; .* Opera\/9\.80 .* Presto\/.* Version\/.*/.test(ua)){
			var match = ua.match(/^WidgetManager; ([^(]+) \(([^)]+)\) (.*)$/);
			// 1)
			// "HTC htc_vision; Opera/9.80"
			var hw = match[1].replace(/; /g, ";").split(";"); // Remove the spaces after ";" and split it there.
			// 2)
			// "Android 2.2.1; U; Opera Widgets Mobi; en; 1011231422"
			// "S60; Symbian OS; U; de; Opera Mobile/2251"
			var os = match[2].replace(/; /g, ";").split(";"); // Remove the spaces after ";" and split it there.
			var ret = {
				hardware:{name: hw[0], raw: hw},
				os: {name: os[0]},
				browser: {name: "Opera"},
				engine: {locale:os[3]}
			};
			// 3)
			// "Presto/2.4.15 Version/10.00"
			var data = this._parseSlashNotation(match[3]);
			if (data.Presto){
				ret.engine.name = "Presto";
				ret.engine.version = data.Presto;
			}
			if (data.Version){
				ret.browser.version = data.Version;
			}
			if(/Opera.*Android/.test(ua)){
				ret.engine.security = os[1];
				ret.engine.version = [ret.engine.version, os[os.length-1]];
			// Symbian Opera Widget Runtime provided by Opera
			} else if(/Opera.*Symbian/.test(ua)){
				ret.os.name = [os[1], os[0]];
				ret.engine.security = os[2];
			}
		}
		
		// Opera 11
		//		Opera/9.80 (Macintosh; Intel Mac OS X 10.6.6; U; de) Presto/2.7.62 Version/11.00
		//		[----1---] [-------------------2-------------------] [-------------3-----------]
		//		Opera/9.80 (Windows NT 5.1; U; en) Presto/2.7.62 Version/11.00
		// Opera 9.64
		//		Opera/9.64 (Macintosh; Intel Mac OS X; U; de) Presto/2.1.1
		// Opera WAC runtime
		//		Opera/9.80 (Android; Linux; Opera Widgets Mobi/AWM-1012211256; U; en) Presto/2.6.35 Version/10.1
		else if (/^Opera\/\d+\.\d+\s/.test(ua)){
			var match = ua.match(/^Opera\/(\d+\.\d+) \(([^)]+)\) (.*)/);
			// 1)
			// "Opera/9.80"
			// "Opera/9.64"
			var version = match[1];
			// 2)
			// "Macintosh; Intel Mac OS X 10.6.6; U; de"
			// "Windows NT 5.1; U; en"
			// "Android; Linux; Opera Widgets Mobi/AWM-1012211256; U; en"
			var os = match[2].replace(/; /g, ";").split(";");
			// 3)
			// "Presto/2.6.35 Version/10.1"
			var data = this._parseSlashNotation(match[3]);
			var ret = {
				hardware: {},
				os: {},
				browser: {name: "Opera", version:data.Version || version},
				engine: {locale:os[os.length-1]}
			};
			if (data.Presto){
				ret.engine.name = "Presto";
				ret.engine.version = data.Presto;
			}
			if (/^macintosh/i.test(os[0])){
				ret.os.name = [os[0], os[1]];
				ret.engine.security = os[2];
			} else if (/^windows/i.test(os[0])){
				ret.os.name = os[0];
				ret.engine.security = os[1];
			} else if (/^android/i.test(os[0])){
				ret.os.name = os[0];
				ret.engine.security = os[3];
			}
		}
        
        // Chrome
        //      Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.71 Safari/534.24
        //      Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.3 Safari/534.24
        //      Mozilla/5.0 (X11; CrOS i686 0.13.587) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.14 Safari/535.1
        //      Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_6) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.698.0 Safari/534.24
        else if (/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (.+)\/(.+) \(([^)]+)\) (Chrome)\/([^\s]+) (Safari)\/([^\s]+)$/.test(ua)){
            var match = ua.match(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (.+)\/(.+) \(([^)]+)\) (Chrome)\/([^\s]+) (Safari)\/([^\s]+)$/);
            
            var hardware = {},
                os = {};
            
            if(/(Windows [^;]+);([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/([^;]+);([^;]+)/);
                //hardware.name = osMatch[2].trim();
                os.name = osMatch[1].trim();
            }
            else if(/(X11); (CrOS) ([^;]+) ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(X11); (CrOS) ([^;]+) ([^;]+)/);
                os.name = osMatch[2].trim();
                os.version = osMatch[4].trim();
                //hardware.name = osMatch[3].trim();
            }
            else if(/(X11); (Linux) ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(X11); (Linux) ([^;]+)/);
                os.name = osMatch[2].trim();
                //hardware.name = osMatch[3].trim();
            }
            else if(/(Macintosh); ([^;]+) (Mac [^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(Macintosh); ([^;]+) (Mac [^;]+)/);
                os.name = osMatch[3].trim();
                //hardware.name = osMatch[2].trim();
                //hardware.platform = osMatch[1].trim();
            }
            var ret = {
                    hardware: hardware,
                os: os,
                engine:{
                    name: match[4].trim(), //     Presto,     Webkit,
                    version: [match[5].trim()], //  2.4.15,     534.3, 533.19.4
                    locale: "", // de-DE, en-GB, en-de, en, de
                    security:"", // N, U, I
                    raw: {} // {Presto:"2.4.15", Version:"10.00"}
                    },
                browser:{
                    name: match[7].trim(), //    Safari		Opera
                    version: match[8].trim(), // 5.0.3       11.0
                    raw: {}
                }
            };
            
        }
        // Firefox
        //      Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0b8) Gecko/20100101 Firefox/4.0b8
        //      Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:2.0b8pre) Gecko/20101128 Firefox/4.0b8pre
        //      Mozilla/5.0 (Windows NT 6.1; WOW64; rv:2.0b7) Gecko/20101111 Firefox/4.0b7
        //      Mozilla/5.0 (Windows NT 6.1; rv:2.0) Gecko/20110319 Firefox/4.0
        //      Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:2.0b10) Gecko/20110126 Firefox/4.0b10
        //      Mozilla/5.0 (X11; U; FreeBSD i386; en-US; rv:1.9.2.9) Gecko/20100913 Firefox/3.6.9
        //      Mozilla/5.0 (Windows; U; Windows NT 6.1; he; rv:1.9.2.8) Gecko/20100722 Firefox/3.6.8
        //      Mozilla/5.0 (X11; U; OpenBSD i386; en-US; rv:1.9.2.8) Gecko/20101230 Firefox/3.6.8
        //      Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2a1pre) Gecko/20090428 Firefox/3.6a1pre
        else if (/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (Gecko)\/([^\s]+) (Firefox)\/([^\s]+)$/.test(ua)){
            var match = ua.match(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (Gecko)\/([^\s]+) (Firefox)\/([^\s]+)$/);
            
            var hardware = {},
                os = {};
            
            // TODO: device and os parser
            
            var ret = {
                    hardware: hardware,
                os: os,
                engine:{
                    name: match[4].trim(), //     Presto,     Webkit,
                    version: [match[5].trim()], //  2.4.15,     534.3, 533.19.4
                    locale: "", // de-DE, en-GB, en-de, en, de
                    security:"", // N, U, I
                    raw: {} // {Presto:"2.4.15", Version:"10.00"}
                    },
                browser:{
                    name: match[6].trim(), //    Safari    	Opera
                    version: match[7].trim(), // 5.0.3       11.0
                    raw: {}
                }
            };
        }
        // iPad iPhone Safari
        //      Mozilla/5.0 (iPad; U; CPU OS 4_3_3 like Mac OS X; de-de) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5
        //      Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3 like Mac OS X; en-us) AppleWebKit/534.32 (KHTML, like Gecko) Version/5.0.2 Mobile/8F190 Safari/6533.18.5
        else if(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Mobile)\/([^\s]+) (Safari)\/([^\s]+)$/.test(ua)){
            var match = ua.match(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Mobile)\/([^\s]+) (Safari)\/([^\s]+)$/);
            
            var hardware = {},
                os = {},
                locale = ""
                security = "";
            // iPad    
            //      (iPad; U; CPU OS 4_3_3 like Mac OS X; de-de)
            if(/(iPad); ([^;]+); ([^;]+); ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(iPad); ([^;]+); ([^;]+); ([^;]+)/);
                hardware.name = osMatch[1].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            }
            // iPhone
            //      iPhone; U; CPU iPhone OS 4_3 like Mac OS X; en-us
            else if(/(iPhone); ([^;]+); ([^;]+); ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(iPhone); ([^;]+); ([^;]+); ([^;]+)/);
                hardware.name = osMatch[1].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            }
                
            var ret = {
                    hardware: hardware,
                os: os,
                engine:{
                    name: match[4].trim(), //     Presto,     Webkit,
                    version: [match[5].trim()], //  2.4.15,     534.3, 533.19.4
                    locale: locale, // de-DE, en-GB, en-de, en, de
                    security: security, // N, U, I
                    raw: {} // {Presto:"2.4.15", Version:"10.00"}
                    },
                browser:{
                    name: match[11].trim(), //    Safari        Opera
                    version: match[12].trim(), // 5.0.3       11.0
                    raw: {}
                }
            };
        }
        // Android Safari
        //      Mozilla/5.0 (Linux; U; Android 2.3.4; de-de; Nexus One Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1
        //      Mozilla/5.0 (Linux; U; Android 2.3.3; de-de; HTC_WildfireS_A510e Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1
        //      Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en-US) AppleWebKit/534.1+ (KHTML, like Gecko) Version/6.0.0.185 Mobile Safari/534.1+
		else if(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Mobile) (Safari)\/([^\s]+)$/.test(ua)){
            var match = ua.match(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Mobile) (Safari)\/([^\s]+)$/);
            
            var hardware = {},
                os = {},
                locale = ""
                security = "";
            // Android    
            //      (Linux; U; Android 2.3.4; de-de; Nexus One Build/GRJ22)
            if(/(Linux); ([^;]+); (Android[^;]+); ([^;]+); ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(Linux); ([^;]+); (Android[^;]+); ([^;]+); ([^;]+)/);
                hardware.name = osMatch[5].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            } 
            // BlackBerry
            //      (BlackBerry; U; BlackBerry 9800; en-US)
            else if(/(BlackBerry); ([^;]+); (BlackBerry[^;]+); ([^;]+)$/.test(match[3])){
                var osMatch = match[3].match(/(BlackBerry); ([^;]+); (BlackBerry[^;]+); ([^;]+)$/);
                hardware.name = osMatch[1].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            }
            
            var ret = {
                    hardware: hardware,
                os: os,
                engine:{
                    name: match[4].trim(), //     Presto,     Webkit,
                    version: [match[5].trim()], //  2.4.15,     534.3, 533.19.4
                    locale: locale, // de-DE, en-GB, en-de, en, de
                    security: security, // N, U, I
                    raw: {} // {Presto:"2.4.15", Version:"10.00"}
                    },
                browser:{
                    name: match[10].trim(), //    Safari        Opera
                    version: match[11].trim(), // 5.0.3       11.0
                    raw: {}
                }
            };
        }
        // Tablet Safari
        //      Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0; en-US) AppleWebKit/534.8+ (KHTML, like Gecko) Version/0.0.1 Safari/534.8+
        //      Mozilla/5.0 (Linux; U; Android 3.1; en-us; GT-P7510 Build/HMJ37) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13
    	else if(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Safari)\/([^\s]+)$/.test(ua)){
            var match = ua.match(/(Mozilla)\/(\d+\.\d+) \(([^)]+)\) (AppleWebKit)\/([^\s]+) \(([^)]+)\) (Version)\/([^\s]+) (Safari)\/([^\s]+)$/);
            var hardware = {},
                os = {},
                locale = ""
                security = "";
            // RIM PlayBook    
            //      (PlayBook; U; RIM Tablet OS 1.0.0; en-US)
            if(/(PlayBook); ([^;]+); (RIM [^;]+); ([^;]+)/.test(match[3])){
                var osMatch = match[3].match(/(PlayBook); ([^;]+); (RIM [^;]+); ([^;]+)/);
                hardware.name = osMatch[1].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            } 
            // Android    
            //      (Linux; U; Android 3.1; en-us; GT-P7510 Build/HMJ37)
            if(/(Linux); ([^;]+); (Android [^;]+); ([^;]+); ([^;]+)$/.test(match[3])){
                var osMatch = match[3].match(/(Linux); ([^;]+); (Android [^;]+); ([^;]+); ([^;]+)$/);
                hardware.name = osMatch[5].trim();
                os.name = osMatch[3].trim();
                locale = osMatch[4].trim();
                security = osMatch[2].trim();
            }
            var ret = {
                    hardware: hardware,
                os: os,
                engine:{
                    name: match[4].trim(), //     Presto,     Webkit,
                    version: [match[5].trim()], //  2.4.15,     534.3, 533.19.4
                    locale: locale, // de-DE, en-GB, en-de, en, de
                    security: security, // N, U, I
                    raw: {} // {Presto:"2.4.15", Version:"10.00"}
                    },
                browser:{
                    name: match[9].trim(), //    Safari        Opera
                    version: match[10].trim(), // 5.0.3       11.0
                    raw: {}
                }
            };
        }
        return ret;
	},
	
	_parseSlashNotation:function(s){
		// Parse this "Presto/2.4.15 Version/10.00" and return it as {Presto:"2.4.15", Version:"10.00"}
		var parts = s.split(" ");
		var ret = {};
		for (var i=0, l=parts.length, p; i<l; i++){
			p = parts[i].split("/");
			ret[p[0]] = p[1];
		}
		return ret;
	},
};

/*
Firefox on Android
	Mozilla/5.0 (Android; Linux armv7l; rv:2.0b8) Gecko/20101221 Firefox/4.0b8 Fennec/4.0b3

Android Browser on Desire Z
	Mozilla/5.0 (Linux; U; Android 2.2.1; en-de; HTC Desire Z 1.34.161.6 Build/FRG83D) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1
	
Opera WAC runtime
	Opera/9.80 (Android; Linux; Opera Widgets Mobi/AWM-1012211256; U; en) Presto/2.6.35 Version/10.1
	
JIL WRT Android, Vodafone Apps Manager
	WidgetManager; HTC htc_vision; Opera/9.80 (Android 2.2.1; U; Opera Widgets Mobi; en; 1011231422) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1010290100) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_bravo; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_bravo; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1012090815) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_ace; Opera/9.80 (Android 2.2; U; Opera Widgets Mobi; en; 1101100100) Presto/2.4.15 Version/10.00
	WidgetManager; HTC htc_legend; Opera/9.80 (Android 2.1; U; Opera Widgets Mobi; en; 1012220100) Presto/2.4.15 Version/10.00
	WidgetManager; Sony Ericsson LT15i_1245-7030; Opera/9.80 (Android 2.3.1; U; Opera Widgets Mobi; de; 1011231422) Presto/2.4.15 Version/10.00
	
	
Vodafone Magic
	WidgetManager; HTC vfpioneer; Opera/9.80 (Android 1.6; U; Opera Widgets Mobi; de; 1010290100) Presto/2.4.15 Version/10.00    
	
JIL WRT NOkia
	WidgetManager; Nokia N97 mini; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2251) Presto/2.7.38 Version/10.50
	
Firefox on Mac OS
	Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0b8) Gecko/20100101 Firefox/4.0b8
	
Safari on Mac
	Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; de-de) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4
	Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; de-de) AppleWebKit/534.13+ (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4
	Mozilla/5.0 (Unknown; U; Unknown; en-US.UTF-8) AppleWebKit/525.1+ (KHTML, like Gecko, Safari/525.1+)
	
Chrome on Mac
	Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; en-US) AppleWebKit/534.15 (KHTML, like Gecko) Chrome/10.0.609.0 Safari/534.15

Nokia N8, Nokia WRT (+JIL)
	Mozilla/5.0 (Symbian/3; U; NokiaN8-00; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/532.4 (KHTML, like Gecko) QtWRT/1.0 Mobile Safari/532.4
	Mozilla/5.0 (Symbian/3; U; NokiaN8-00/RM-596; Configuration/CLDC-1.1 Profile/MIDP-2.1; en-GB) AppleWebKit/534.3 (KHTML, like Gecko) QtWRT/1.0 Mobile Safari/534.3
	
	Mozilla/5.0 (SymbianOS/9.5;; U; NokiaN8-00/RM-59601;; en-GB; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/534.3 (KHTML, like Gecko) QtWRT/8.0.r19209 Mobile Safari/534.3
	
	WidgetManager; NOKIA E5-00; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2250) Presto/2.7.38 Version/10.50
	
	WidgetManager; Nokia 5800; Opera/9.80 (S60; Symbian OS; U; de; Opera Mobile/2251) Presto/2.7.38 Version/10.50
	
iPhone
	Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; de-de) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5


???????
	Mozilla/5.0 (X11; U; Linux; en-IN) AppleWebKit/534.3 (KHTML, like Gecko) QtWRT/1.2 Safari/534.3

Desktop
	Camino
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en; rv:1.9.0.16) Gecko/2009120123 Camino/2.0.1 (like Firefox/3.0.16)
	Opera 11
		Opera/9.80 (Macintosh; Intel Mac OS X 10.6.6; U; de) Presto/2.7.62 Version/11.00
		Opera/9.80 (Windows NT 5.1; U; en) Presto/2.7.62 Version/11.00
	Opera 9.64
		Opera/9.64 (Macintosh; Intel Mac OS X; U; de) Presto/2.1.1
	Safari
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; de-de) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4
		Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4
	Webkit nightly
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; de-de) AppleWebKit/534.13+ (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4
	Firefox
		Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0b8) Gecko/20100101 Firefox/4.0b8
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-GB; rv:1.9.2.13) Gecko/20101203 Firefox/3.6.13
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en-US; rv:1.8.1.16) Gecko/20080702 Firefox/2.0.0.16
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.1b1) Gecko/20081007 Firefox/3.1b1
		Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.2.13) Gecko/20101203 Firefox/3.6.13
	Chromium
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Chrome/10.0.634.0 Safari/534.16
	Chrome
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-US) AppleWebKit/534.15 (KHTML, like Gecko) Chrome/10.0.609.0 Safari/534.15
	OmniWeb
		Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en-US) AppleWebKit/525.18 (KHTML, like Gecko, Safari/525.20) OmniWeb/v622.4.0.109283
		
	IE
		Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)

*/

/*
    Export the user agent parser to use as a node.js module
*/

exports.UserAgentParser = UserAgentParser;