// global
var cWindow = window.parent;
var cDoc = cWindow.document;
// global

(function() {
  tryExecuteInInterval(function tryInsertButtonsInVideoCaption() {
    var container = cDoc.querySelector('.title.style-scope.ytd-video-primary-info-renderer');
    if (!container)
      return false;

    var div = cDoc.createElement('div');
    // div.style.float = 'right';

    div.classList.add('navigation-buttons-container');



    var previous = cDoc.createElement('button');
    previous.innerHTML = '&#8249;';
    previous.classList.add('navigation-button');
    previous.onclick = function() {
      goToVideo(false);
    }


    var next = cDoc.createElement('button');
    next.innerHTML = '&#8250;';
    next.classList.add('navigation-button');
    next.onclick = function() {
      goToVideo(true);
    }


    div.appendChild(previous);
    div.appendChild(next);
    container.parentElement.insertBefore(div, container);
    return true;
  });
})();


function goToVideo(toNext) {

  var currentVieoId = getCurrentVideoId();
  var currentChannelId = getCurrentChannelId();

  var savedPreviousVideoForBack;

  recursiveRetrieveVideos();


  function recursiveRetrieveVideos(nextPageToken, getFirstVideoFromCollection) {
    sendRequest({
      url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyCgIESCoZyXSm9mXl4txgfncFhSdGrbUjw&maxResults=50&order=date&type=video' +
        '&channelId=' + currentChannelId +
        '&pageToken=' + (nextPageToken || ''),
      callback: function() {

        var data = JSON.parse(this.responseText);
        var items = data.items;
        if (getFirstVideoFromCollection) {
          if (items.length) {
            navigateToVideoInContentTab(items[0].id.videoId);
          }
          return;
        }

        for (var i = 0; i < items.length; i++) {
          var video = items[i];
          if (video.id.videoId === currentVieoId) {
            if (toNext) {
              if (items.length === i + 1) {
                getFirstVideoFromCollection = true;
                break;
              }
              video = items[i + 1];
            } else {
              if (i === 0) {
                video = savedPreviousVideoForBack;
              } else {
                video = items[i - 1];
              }
            }

            navigateToVideoInContentTab(video.id.videoId);
            return;
          }
        }
        if (items.length && data.nextPageToken) {
          savedPreviousVideoForBack = items[items.length - 1];
          recursiveRetrieveVideos(data.nextPageToken, getFirstVideoFromCollection);
        }
      }
    });
  }
}




function convertFuncToString(func, params) {
  return '(' +
    func.toString() +
    ')(' + getFunctionParams(params) + ');';
}

function getFunctionParams(params) {
  if (!params)
    return '';
  return params.map(function(el) {
    if (typeof el === 'string') {
      return '"' + el + '"';
    } else {
      if (typeof el === 'object') {
        return JSON.stringify(el);
      }
    }
  }).join(',');
}

function navigateToVideo(videoId) {
  var data = {
    watchEndpoint: {
      videoId: videoId
    },
    webNavigationEndpointData: {
      url: '/watch?v=' + videoId,
      webPageType: 'WATCH'
    }
  };
  document.querySelector('yt-navigation-manager').navigate(data, false);
}

function navigateToVideoInContentTab(videoId) {
  createScriptInContentTab(navigateToVideo, [videoId]);
}

function createScriptInContentTab(func, params) {
  var scr = cDoc.createElement('script');

  scr.textContent = convertFuncToString(func, params);

  cDoc.body.appendChild(scr);
  scr.parentNode.removeChild(scr);
}


function getCurrentChannelId() {
  var a = cDoc.querySelector('#owner-container a.yt-simple-endpoint');
  if (!a)
    return;

  var href = a.href;
  var before = "channel/";

  return href.substring(href.indexOf(before) + before.length);

}

function getCurrentVideoId() {
  var search = cWindow.location.search;
  var before = "?v=";
  var fInd = search.indexOf(before) + before.length;

  var endInd = search.indexOf('&', fInd);
  if (endInd === -1) {
    return search.substring(fInd);
  }
  return search.substring(fInd, endInd);
}


function tryExecuteInInterval(callback) {
  // maxCount = maxCount || 50;
  var count = 0;
  var id = setInterval(function() {
    // if (count++ > maxCount && false) {
    //   clearInterval(id);
    //   return;
    // }
    if (callback()) {
      clearInterval(id);
    }
  }, 1000);
}


function sendRequest(options) {
  var xhr = new XMLHttpRequest();
  xhr.open(options.method || 'GET', options.url, true);

  if (typeof options.callback === 'function') {
    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;
      options.callback.call(this, this);
    }
  }

  xhr.send();
}
