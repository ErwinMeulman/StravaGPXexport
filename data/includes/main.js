// copyright Eugene Ivanov
// e-ivanov.ru/
// Eugene Ivanov <eugene.ivanov@gmail.com>
//
jQuery(function() {
    var $ = jQuery;

    var time_el_selector = '.activity-summary-container time';

    var ignition = function() {
        //console.log('ignition');

        var base_url = 'https://www.strava.com';

        var gd = $('#map-type-control');
        if (gd.length) {

            // test
            // https://www.strava.com/activities/2699234929
            // https://www.strava.com/segments/1635369
            // https://www.strava.com/routes/10714422

            // https://www.strava.com/activities/2699234929/streams?stream_types%5B%5D=latlng&_=1550434658684
            // https://www.strava.com/stream/segments/1635369?streams%5B%5D=latlng&streams%5B%5D=distance&streams%5B%5D=altitude&_=1550434940430

            var mm = window.location.href.match(/^.*?\/(activities|routes|segments)\/(\d+).*?$/i);

            if (!mm) {
                return false;
            }

            var type = mm[1];
            var id = mm[2];

            var href = ' ';
            if (type == 'routes') {
                href = ' href="'+base_url+'/routes/'+id+'/export_gpx'+'" ';
            }

            var button = $('<div class="drop-down-menu" id="gpx-export" title="GPX export via extension">\
<a class="selection">GPX export</a>\
<ul class="options">\
<li>\
<a class="gpx-download">Download GPX</a>\
</li>\
<li>\
<a class="donate-me" href="http://e-ivanov.ru/projects/strava-export-gpx/?donate" target="_blank">DONATE</a>\
</li>\
</ul>\
</div>');
            button.insertBefore(gd);


            /*
            var fullscreen_button = $('<a class="button" id="toggle-fullscreen" rel="noreferrer"></a>');
            fullscreen_button.insertBefore(gd);

            fullscreen_button.bind('click', function(event) {
                var s = Strava.Maps.FullScreenHandler.getInstance(r);
                s.handler();
            });
            */

            var generateEngUrl = function(str) {
                str = ''+str;

                str = str.replace(/&amp;/ig, '-');
                str = str.replace(/[&\'\s\n\r]/ig, '-');
                //str = str.replace(/[^a-z-0-9]/ig, '');
                str = str.replace(/-+/ig, '-');
                return str;
            }

            var process = function(start_time, isAddLF) {
                var title = document.title;


                // https://www.strava.com/stream/segments/12246849?streams%5B%5D=latlng&streams%5B%5D=distance&streams%5B%5D=altitude&_=1467826323538

                // https://www.strava.com/activities/2699234929/streams?stream_types%5B%5D=altitude&stream_types%5B%5D=heartrate&stream_types%5B%5D=cadence&stream_types%5B%5D=temp&stream_types%5B%5D=distance&stream_types%5B%5D=grade_smooth&stream_types%5B%5D=time&stream_types%5B%5D=grade_adjusted_distance&_=1550436065239
                // https://www.strava.com/activities/2699234929/streams?stream_types%5B%5D=latlng&_=1550434658684
                // https://www.strava.com/activities/2699234929/streams?stream_types%5B%5D=latlng&stream_types%5B%5D=time&stream_types%5B%5D=altitude&_=1552077196406

                var lurl = '';

                var track_title = '';

                // old version 20190217
                // base_url+path+id+'?streams%5B%5D=latlng&streams%5B%5D=distance&streams%5B%5D=altitude&streams%5B%5D=time&streams%5B%5D=moving',

                if (type == 'segments') {
                    lurl = base_url+'/stream/segments/'+id+'?streams%5B%5D=latlng&streams%5B%5D=distance&streams%5B%5D=altitude&streams%5B%5D=time&streams%5B%5D=moving&_=1467826323538';

                    track_title = $('#js-full-name').data('full-name');

                } else {
                    lurl = base_url+'/activities/'+id+'/streams?stream_types%5B%5D=latlng&stream_types%5B%5D=time&stream_types%5B%5D=altitude&_=1550434658684';

                    track_title = $('h1.activity-name').html();
                }

                var track_title_url = generateEngUrl(track_title);

                httpLoad(

                    lurl,

                    function(html) {
                        var o = JSON.parse(html);

                        if (o && typeof o['latlng'] != 'undefined' && o['latlng'].length) {
                            var r = [];

                            var LF = !isAddLF ? '' : '\n';
                            var SPACE = !isAddLF ? '' : '  ';

                            r.push('<?xml version="1.0" encoding="UTF-8"?>'+LF);
                            r.push('<gpx version="1.1" creator="Exported from Strava via extension e-ivanov.ru"');
                            r.push('  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd"');
                            r.push('  xmlns="http://www.topografix.com/GPX/1/1"');
                            r.push('  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"');
                            r.push('  xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'+LF);
                            r.push('<metadata><link href="http://e-ivanov.ru/projects/strava-export-gpx/"><text>Strava gpx export</text></link><time>'+(new Date().toISOString())+'</time></metadata>'+LF);
                            r.push('<trk>'+LF);
                            r.push('<name>'+(type == 'segments' ? track_title+' / ' : '')+title+'</name>'+LF);
                            r.push('<trkseg>'+LF);

                            var date = new Date();

                            var i, c = o['latlng'], l = c.length, e, alt, time;
                            for (i=0; i < l; i++) {
                                e = c[i];

                                alt = o['altitude'][i];
                                if (typeof alt == 'undefined') {
                                    alt = 0;
                                }

                                time = !o['time'] ? i : o['time'][i];

                                if (typeof time == 'undefined') {
                                    time = 0;
                                }
                                time = start_time + time*1000;
                                date.setTime(time);
                                time = date.toISOString();

                                r.push('<trkpt lon="'+e[1]+'" lat="'+e[0]+'">'+LF);
                                r.push(SPACE+'<ele>'+alt+'</ele>'+LF);
                                r.push(SPACE+'<time>'+time+'</time>'+LF);
                                r.push('</trkpt>'+LF);
                            }
                            r.push('</trkseg>'+LF);
                            r.push('</trk>'+LF);
                            r.push('</gpx>');

                            var s = r.join('');
                            r = null;


                            var output = $('<output style="display:none"></output>').insertAfter(button);
                            output = output[0];


                            var cleanUp = function(a) {
                                a.dataset.disabled = true;

                                // Need a small delay for the revokeObjectURL to work properly.
                                setTimeout(function() {
                                    window.URL.revokeObjectURL(a.href);
                                    $(a).remove();
                                }, 1500);
                            };

                            var downloadFile = function(text, filename) {

                                const MIME_TYPE = 'text/xml';

                                var prevLink = output.querySelector('a');
                                if (prevLink) {
                                  window.URL.revokeObjectURL(prevLink.href);
                                  output.innerHTML = '';
                                }

                                var bb = new Blob([text], {type: MIME_TYPE});

                                var a = document.createElement('a');
                                a.download = filename;
                                a.href = window.URL.createObjectURL(bb);
                                a.textContent = 'Download';

                                a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
                                a.draggable = true; // Don't really need, but good practice.
                                a.classList.add('dragout');

                                output.appendChild(a);

                                setTimeout(function() {
                                    a.click();

                                }, 100);

                                a.onclick = function(e) {
                                  if ('disabled' in this.dataset) {
                                    return false;
                                  }

                                  cleanUp(this);
                                };
                            };

                            downloadFile(s, "strava."+type+'.'+id+'.'+track_title_url+".gpx");
                        }
                    },

                    function() {
                        alert('Error load file');
                    }
                );
            };



            button.find('.gpx-download').bind('click', function(event) {
                if (type == 'routes') {
                    return true;
                }

                //------------------------------
                var please_donate = 0;
                var clicks = window.localStorage['clicks'] || 0;
                clicks++;
                if (clicks == 5) {
                    please_donate = 1;
                    clicks = 0;
                }
                window.localStorage['clicks'] = clicks;

                if (please_donate) {
                    window.location.href = 'http://e-ivanov.ru/projects/strava-export-gpx/#pleasedonate';
                    return true;
                }
                //------------------------------

                var lp = $('#language-picker button');
                var lpt = lp.html().trim();

                if (lpt != 'English (US)') {
                    alert('Switching to English. Please, try again to download');
                    $("#language-picker [language-code='en-US']").trigger('click');
                    return true;
                }


                var isAddLF = !!event.ctrlKey;


                var start_time = (new Date()).getTime();

                var time_el = $(time_el_selector);
                if (!time_el.length) {

                } else {
                    var html = time_el.html();

                    // 3:19 PM on Monday, January 25, 2010

                    var mm = html.match(/\s*(\d+):(\d+)\s+(AM|PM)\s+on\s+\w+,\s*(\w+)\s+(\d+),\s*(\d+)\s*/im);
                    if (mm && typeof mm[1] != 'undefined') {

                        // 21 May 1958 10:12

                        var s = mm[5] + ' ' + mm[4] + ' ' + mm[6] + ' ' + mm[1] + ':' + mm[2] + ' ' + mm[3];

                        start_time = (new Date(s)).getTime();
                    } else {

                        // 201910 change format
                        // Wednesday, September 11, 2019
                        // 11 сентября 2019 г., среда
                        // 23 июня 2017 г., пятница

                        var mm = html.match(/\s*(\w+),\s*(\w+)\s+(\d+),\s*(\d+)\s*/im);

                        if (mm && typeof mm[1] != 'undefined') {

                            // 21 May 1958 12:00

                            var s = mm[3] + ' ' + mm[2] + ' ' + mm[4] + ' ' + '12' + ':' + '00' + ' ' + 'PM';
                            start_time = (new Date(s)).getTime();
                        } else {

                            var mm_no_eng = html.match(/\s*(\d+)\s+([^\s]+)\s+(\d+)\s+.+,\s+([^\s]+)\s*/im);
                            if (0&&mm_no_eng && typeof mm_no_eng[1] != 'undefined') {

                                var s = mm_no_eng[1] + ' ' + mm_no_eng[2] + ' ' + mm_no_eng[3] + ' ' + '12' + ':' + '00' + ' ' + 'PM';
                                start_time = (new Date(s)).getTime();

                            } else {

                                // https://nene.strava.com/flyby/matches/1355069518

                                httpLoad(
                                    'https://nene.strava.com/flyby/matches/'+id,

                                    function(html) {
                                        var o = JSON.parse(html);

                                        if (o && typeof o['activity'] != 'undefined' && typeof o['activity']['startTime'] != 'undefined') {
                                            start_time = o['activity']['startTime']*1000;

                                            process(start_time, isAddLF);
                                        }
                                    },

                                    function() {
                                        process(start_time, isAddLF);
                                    }
                                );

                                return false;
                            }
                        }
                    }
                }

                process(start_time, isAddLF);

                return false;
            });


        }


        var httpLoad = function(url, handler_ok, handler_error) {
            var ajaxData = {
                'url':          url,
                'type' :        'GET',
                "dataType" :    'text',
                'success':      function(html) {
                    html = (''+html).replace(/[\r\n\t]+/igm, '');
                    return handler_ok(html);
                },

                'error':      function(xhr, type) {
                    handler_error();
                }
            };


            if (typeof content != 'undefined' && typeof content.fetch != 'undefined') {

                // firefox extention
                // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#XHR_and_Fetch
                /* This is accomplished by exposing more privileged XHR and fetch instances in
                    the content script, which has the side-effect of not setting the Origin and
                    Referer headers like a request from the page itself would, this is often
                    preferable to prevent the request from revealing its cross-orign nature. From
                    version 58 onwards extensions that need to perform requests that behave as if
                    they were sent by the content itself can use content.XMLHttpRequest and
                    content.fetch() instead. For cross-browser extensions their presence must be
                    feature-detected.
                    */

                var checkStatus = function(response) {
                  if (response.status >= 200 && response.status < 300) {
                    return response
                  } else {
                    var error = new Error(response.statusText)
                    error.response = response
                    throw error
                  }
                }

                var parseJSON = function(response) {
                  return response.json()
                }

                var parseText = function(response) {
                  return response.text()
                }

                content.fetch(url)
                  .then(checkStatus)
                  .then(parseText)
                  //.then(parseJSON)
                  .then(function(data) {
                    handler_ok(data)
                  }).catch(function(error) {
                    handler_error(error);
                  })

            } else {

	            $.ajax(ajaxData);

            }

        };
    };


    var check = function() {
        //console.log('check');

        var gd = $('#map-type-control');
        if (gd.length) {
            return setTimeout(ignition, 500);
        }


        setTimeout(check, 500);
    };

    setTimeout(check, 500);



});
