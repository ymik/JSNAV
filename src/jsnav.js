/**
 * Copyright 2010 Konstantin Andryunin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * JSNAV library
 * Created by: Konstantin Andryunin
 * https://sourceforge.net/apps/trac/jsnavigator/
 */

window.__jsnavUriObserver = function () {
    window.JSNAV.checkUri();
    window.setTimeout(window.__jsnavUriObserver, 200);
};

window.JSNAV = function() {
    var IE = /msie/i.test(navigator.userAgent);
    var lastURI = "";
    var lastEvent = {params:[]};
    var events = [];

    /**
     * search processor for collections
     * @returns result of onFoundHandler or notFoundHandler
     *
     * @param array - array for search
     * @param selector - function(arrayElement) : boolean; selector for array's elements
     * @param onFoundHandler - function(array, elementIndex) : result; handler for found element
     * @param notFoundHandler - function(array) : result; handler for unsuccess search
     */
    function findAndProcess(array, selector, onFoundHandler, notFoundHandler) {
        for (var i = 0; i < array.length; i++) {
            if (selector(array[i])) {
                if (onFoundHandler)
                    return onFoundHandler(array, i);
                else
                    return null;
            }
        }
        if (notFoundHandler)
            return notFoundHandler(array);
        else
            return null;
    }

    /**
     * compare two events and return true if those is equals
     * @param e1
     * @param e2
     */
    function isEventsEqual(e1, e2) {
        if (e1.event != e2.event || e1.anchor != e2.anchor || e1.params.length != e2.params.length) return false;
        for (var i = 0; i < e1.params.length; i++) {
            if (e1.params[i] != e2.params[i]) return false;
        }
        return true;
    }

    /**
     * find anchor in document
     * @param anchorName - element's name of ID
     */
    function findAnchor(anchorName) {
        var anchor = window.document.getElementById(anchorName);
        if (!anchor) {
            findAndProcess(window.document.anchors,
                    function(elm) {
                        return elm && elm.name && elm.name == event.anchor;
                    },
                    function(anchors, i) {
                        anchor = anchors[i];
                    },
                    null);
        }
        return anchor;
    }

    function scrollTo(element) {
        if (element && element.offsetLeft && element.offsetTop)
            window.scrollTo(element.offsetLeft, element.offsetTop);
    }

    /**
     * on ready handler
     * @param handler
     */
    function bindReady(handler) {
        var called;

        function ready() {
            if (!called) {
                called = true;
                handler();
            }
        }

        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", function() {
                ready();
            }, false)
        }
        else if (document.attachEvent) {
            if (document.documentElement.doScroll && window == window.top) {
                function tryScroll() {
                    if (!called) {
                        if (!document.body) return;
                        try {
                            document.documentElement.doScroll("left");
                            ready();
                        } catch(e) {
                            setTimeout(tryScroll, 0)
                        }
                    }
                }

                tryScroll()
            }
            document.attachEvent("onreadystatechange", function() {
                if (document.readyState === "complete") {
                    ready()
                }
            })
        }

        if (!IE) {
            ready();
        }
    }

    /**
     * public API
     */
    var lib = function() {
        bindReady(function() {
            window.setTimeout(window.__jsnavUriObserver, 200);
        });
    };
    lib.prototype = {
        /**
         * parse URI and returns event object
         * @returns {anchor:anchorName, event:eventName, params:[array of unescaped params]}
         */
        parseUri : function(uri) {
            var result = {params:[]};
            var a = uri.indexOf('#');

            if (a > 0) {
                var slices = uri.substring(a + 1).split(';');
                result.anchor = slices[0];
                if (slices.length > 1) {
                    result.event = unescape(slices[1]);
                    for (var i = 2; i < slices.length; i++) {
                        result.params[result.params.length] = unescape(slices[i]);
                    }
                }
            }

            return result;
        },

        /**
         * check current URI to changes & fire events
         */
        checkUri : function() {
            if (lastURI != window.location.href) {
                var e = this.parseUri(window.location.href);
                if (!isEventsEqual(lastEvent, e)) {
                    if (lastEvent.event && e.anchor && !e.event) {//restore last event
                        lastURI = window.location.href;
                        lastURI += ';' + escape(lastEvent.event);
                        for (var i = 0; i < lastEvent.params.length; i++) {
                            lastURI += ";" + escape(lastEvent.params[i]);
                        }
                        lastEvent = this.parseUri(lastURI);
                        window.location.href = lastURI;

                        scrollTo(findAnchor(e.anchor));
                    } else {//fire new event
                        lastURI = window.location.href;
                        lastEvent = e;
                        this.fire(lastEvent);
                    }
                }
            }
        },

        /**
         * bind handler to URI event
         * @param event - unescaped string for event name
         * @param handler - function(param1, param2, ...)
         */
        bind : function(event, handler) {
            if (typeof event == 'string' && typeof handler == 'function')
                findAndProcess(events,
                        function(elm) {
                            return elm.event == event;
                        },
                        function(events, ei) {
                            findAndProcess(events[ei].handlers,
                                    function(elm) {
                                        return elm == handler;
                                    },
                                    null,
                                    function(handlers) {
                                        handlers.push(handler);
                                    });
                        },
                        function(events) {
                            events.push({event: event, handlers : [handler]});
                        });
        },

        /**
         * remove handler for URI event
         * @param event - unescaped string for event name
         * @param handler - function(param1, param2, ...)
         */
        unbind : function(event, handler) {
            if (typeof event == 'string')
                findAndProcess(events,
                        function(elm) {
                            return elm.event == event;
                        },
                        function(events, ei) {
                            if (handler) {
                                if (typeof handler == 'function')
                                    findAndProcess(events[ei].handlers,
                                            function(elm) {
                                                return elm == handler;
                                            },
                                            function(handlers, hi) {
                                                handlers.splice(hi, 1);
                                            },
                                            null);
                                if (events[ei].handlers < 1) {
                                    events.splice(ei, 1);
                                }
                            } else {
                                events.splice(ei, 1);
                            }
                        },
                        null);
        },
        /**
         * fires event & process registred handlers
         * @param event : {anchor:anchorName, event:eventName, params:[array of unescaped params]}
         */
        fire : function(event) {
            var context = window.document.body;

            if (event.anchor) {
                var anchor = findAnchor(event.anchor);
                if (anchor) {
                    scrollTo(anchor);
                    context = anchor;
                }
            }

            if (event.event) {
                findAndProcess(events,
                        function(elm) {
                            return elm.event == event.event;
                        },
                        function(events, ei) {
                            for (var i = 0; i < events[ei].handlers.length; i++) {
                                events[ei].handlers[i].apply(context, event.params);
                            }
                        },
                        null);
            }
        }
    };

    return new lib();
}();