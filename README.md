JSNAV: javascript navigation helper


What problems it helps to solve?

An example, a typical use case of navigation through javascript: imagine a page with AJAX changable content:

example of AJAX site

Document's URI doesn't change when user click on menu item. When user open document follow link from address bar, then page will show inital contents. Some developers try to encode content's ID in URI's anchors to solve this problem. They write IDs of content to anchors and try to restore document when link is opened in new page. Unfortunately, this method makes impossible to use standard anchors for navigating in the page.

JSNAV - a library that allows to specify and save some javascript calls in the page's URI.

This library helps to standardize the coding javascript URI handler in the anchors. Also it helps to keep the classic navigation anchors.


How does it work?

JSNAV use own form of URI with backward compatibility with RFC1630:

http://user:pass@host:port/path/resource?query#anchor;navEventName;param1;param2;...
  
It allows to link some javascript handlers with some events described in URI.


Objects:

object Event
object Handler

API

JSNAV provides next public API:

bind(<string> navEventName, <Handler> handler) : undefined
unbind(<string> navEventName, <Handler> handler = undefined) : undefined
parseUri(<string> uri): Event
fire(<Event> event) : undefined
checkUri() : undefined