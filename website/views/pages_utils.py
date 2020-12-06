from itertools import chain
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from website.models import WebsiteSection, EventPost, BlogPost, Publication


# Definition of functions:
def get_website_section(requested_website_position_id):
    """
    Fetch WebsiteSection with website_position_id

    Parameters
    ----------
    requested_website_position_id : string

    Returns
    ------
    returns WebsiteSection object or None if not found
    """
    try:
        section = WebsiteSection.objects.get(
            website_position_id=requested_website_position_id)
    except ObjectDoesNotExist:
        section = None
    return section


def get_latest_event_posts(limit):
    """
    Fetch Latest EventPost according to post_date

    Parameters
    ----------
    limit : int

    Returns
    ------
    returns a list of NewsPost objects
    """
    return EventPost.objects.order_by('-post_date')[0:limit]


def get_latest_blog_posts(limit):
    """
    Fetch Latest BLogPosts according to post_date

    Parameters
    ----------
    limit : int

    Returns
    ------
    returns a list of BlogPost objects
    """
    return BlogPost.objects.filter(show_in_lab_blog=True).order_by('-posted')[0:limit]


def get_news_posts(limit=None):
    """
    Fetch Latest BLogPosts and EventPosts according to post_date

    Returns
    ------
    returns a list of News objects
    """
    all_blog_posts = BlogPost.objects.filter(show_in_lab_blog=True)
    all_events = EventPost.objects.exclude(end_date__lt=timezone.now()).order_by('-created')
    news_list = sorted(chain(all_blog_posts, all_events), key=lambda news: news.created, reverse=True)
    return news_list if limit is None else news_list[0:limit]


def get_highlight(limit):
    """
    Fetch Latest highlited according to post_date

    Returns
    ------
    returns a list of News objects
    """
    all_blog_posts = BlogPost.objects.filter(is_highlighted=True)
    all_events = EventPost.objects.filter(is_highlighted=True).order_by('-created')
    all_publication = Publication.objects.filter(is_highlighted=True).order_by('-created')
    highlight_list = sorted(chain(all_blog_posts, all_events, all_publication), key=lambda highlight: highlight.created, reverse=True)
    return highlight_list[0:limit]
