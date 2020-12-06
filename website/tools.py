import os
import base64
import requests

from django.conf import settings
from django.core.exceptions import PermissionDenied

from meta.views import Meta


def has_commit_permission(access_token, repository_name):
    """
    Determine if user has commit access to the repository in nipy organisation.

    Parameters
    ----------
    access_token : string
        GitHub access token of user.
    repository_name : string
        Name of repository to check if user has commit access to it.
    """
    if access_token == '':
        return False
    headers = {'Authorization': 'token {0}'.format(access_token)}
    response = requests.get('https://api.github.com{}repos'.format(settings.REPOSITORY_URL),
                            headers=headers)
    response_json = response.json()
    for repo in response_json:
        if repo["name"] == repository_name:
            permissions = repo["permissions"]
            if permissions["pull"]:
                return True
    return False


def github_permission_required(view_function):
    """
    Decorator for checking github commit permission of users
    """
    def wrapper(request, *args, **kwargs):
        try:
            social = request.user.social_auth.get(provider='github')
            access_token = social.extra_data['access_token']
        except Exception:
            access_token = ''
        has_permission = has_commit_permission(access_token, settings.REPOSITORY_NAME)
        if has_permission:
            return view_function(request, *args, **kwargs)
        else:
            raise PermissionDenied
    return wrapper


def get_google_plus_activity(user_id, count):
    """
    Fetch google plus activity list of a user

    Parameters
    ----------
    user_id : string
        The ID of the user to get activities for.

    count : int
        Maximum number of activities to fetch.
    """
    api_key = settings.GOOGLE_API_KEY
    url = "https://www.googleapis.com/plus/v1/people/" + user_id +\
          "/activities/public?maxResults=" + str(count) +\
          "&fields=etag%2Cid%2Citems%2Ckind%2CnextLink%2CnextPageToken%2CselfLink%2Ctitle%2Cupdated&key=" + api_key
    try:
        r = requests.get(url)
    except requests.exceptions.ConnectionError:
        return {}
    json_response = r.json()
    if 'error' not in json_response:
        return json_response['items']
    else:
        print(json_response)
        return {}


def get_facebook_page_feed(page_id, count):
    """
    Fetch the feed of posts published by this page, or by others on this page.

    Parameters
    ----------
    page_id : string
        The ID of the page.
    count : int
        Maximum number of posts to fetch.
    """
    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET

    params = (page_id, count, app_id, app_secret)
    url = ("https://graph.facebook.com/%s/feed?limit=%s&access_token=%s|%s" %
           params)
    try:
        response = requests.get(url)
    except requests.exceptions.ConnectionError:
        return {}
    response_json = response.json()
    if 'data' in response_json:
        return response_json["data"]
    else:
        return {}


def get_twitter_bearer_token():
    """
    Fetch the bearer token from twitter and save it to TWITER_TOKEN
    environment variable
    """
    consumer_key = settings.TWITTER_CONSUMER_KEY
    consumer_secret = settings.TWITTER_CONSUMER_SECRET

    bearer_token_credentials = "%s:%s" % (consumer_key, consumer_secret)

    encoded_credentials = base64.b64encode(
        str.encode(bearer_token_credentials)).decode()
    auth_header = "Basic %s" % (encoded_credentials,)

    headers = {'Authorization': auth_header,
               'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}
    try:
        response = requests.post('https://api.twitter.com/oauth2/token',
                                 headers=headers,
                                 data={'grant_type': 'client_credentials'})
        response_json = response.json()
    except requests.exceptions.ConnectionError:
        response_json = {}
    if 'access_token' in response_json:
        token = response_json['access_token']
    else:
        token = ''
    os.environ["TWITER_TOKEN"] = token
    return token


def get_twitter_feed(screen_name, count):
    """
    Fetch the most recent Tweets posted by the user indicated
    by the screen_name

    Parameters
    ----------
    screen_name : string
        The screen name of the user for whom to return Tweets for.

    count : int
        Maximum number of Tweets to fetch.
    """
    try:
        token = os.environ["TWITER_TOKEN"]
    except KeyError:
        token = get_twitter_bearer_token()
    parms = (screen_name, str(count))
    url = "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=%s&count=%s" % parms
    headers = {'Authorization': 'Bearer %s' % (token,)}
    try:
        response = requests.get(url, headers=headers)
    except requests.exceptions.ConnectionError:
        return {}
    response_json = response.json()
    return response_json


def get_meta_tags_dict(title=settings.DEFAULT_TITLE,
                       description=settings.DEFAULT_DESCRIPTION,
                       keywords=settings.DEFAULT_KEYWORDS,
                       url="/", image=settings.DEFAULT_LOGO_URL,
                       object_type="website"):
    """
    Get meta data dictionary for a page

    Parameters
    ----------
    title : string
        The title of the page used in og:title, twitter:title, <title> tag etc.
    description : string
        Description used in description meta tag as well as the
        og:description and twitter:description property.
    keywords : list
        List of keywords related to the page
    url : string
        Full or partial url of the page
    image : string
        Full or partial url of an image
    object_type : string
        Used for the og:type property.
    """
    meta = Meta(title=title,
                description=description,
                keywords=keywords + settings.DEFAULT_KEYWORDS,
                url=url,
                image=image,
                object_type=object_type,
                use_og=True, use_twitter=True, use_facebook=True,
                use_googleplus=True, use_title_tag=True)
    return meta


def get_youtube_videos(channel_id, count):
    """
    Fetch the list of videos posted in a youtube channel

    Parameters
    ----------
    channel_id : string
        Channel ID of the youtube channel for which the videos will
        be retrieved.

    count : int
        Maximum number of videos to fetch.
    """

    parms = (channel_id, settings.GOOGLE_API_KEY)
    url = "https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=%s&maxResults=25&key=%s" % parms
    try:
        response = requests.get(url)
    except requests.exceptions.ConnectionError:
        return {}
    response_json = response.json()
    return response_json['items']
