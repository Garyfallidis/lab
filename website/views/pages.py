from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.cache import cache_page

from .tools import *
from website.models import *


# Definition of views:

def index(request):
    context = {}
    all_carousel = CarouselImage.objects.filter()
    latest_blog_posts = get_latest_blog_posts(5)
    latest_news_posts = get_latest_news_posts(5)
    highlighted_publications = Publication.objects.filter(is_highlighted=True)

    context['all_carousel'] = all_carousel
    context['latest_blog_posts'] = latest_blog_posts
    context['latest_news_posts'] = latest_news_posts
    context['highlighted_publications'] = highlighted_publications
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/index.html', context)


def page(request, position_id):
    context = {}
    section = get_website_section(position_id)
    if not section:
        raise Http404("Page does not exist")

    context['section'] = section
    page_title = "DIPY - %s" % (section.title,)
    context['meta'] = get_meta_tags_dict(title=page_title)
    return render(request, 'website/section_page.html', context)


def blog(request):
    context = {}

    context['all_blog_posts'] = BlogPost.objects.all()
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/blog.html', context)


def blog_post(request, identifier):
    context = {}

    context['blog_post'] = BlogPost.objects.get(identifier=identifier)
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/blog_post.html', context)


def publications(request):
    context = {}
    all_publications = Publication.objects.all()
    context['all_publications'] = all_publications
    context['meta'] = get_meta_tags_dict(title="DIPY - Publications")
    return render(request, 'website/publications.html', context)


def people(request):
    context = {}

    context['all_profile'] = Profile.objects.all()
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/people.html', context)


def people_profile(request, username):
    context = {}

    user = User.objects.get(username=username)
    context['profile'] = Profile.objects.get(user=user)
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/people_profile.html', context)


def honeycomb(request):
    context = {}
    context['all_youtube_videos'] = get_youtube_videos(
        'UCHnEuCRDGFOR5cfEo0nD3pw', 100)
    context['all_documentation_examples'] = get_doc_examples_images()

    context['meta'] = get_meta_tags_dict(title="DIPY - Gallery")
    return render(request, 'website/honeycomb.html', context)


def follow_us(request):
    context = {}
    context['latest_news'] = get_latest_news_posts(5)
    context['gplus_feed'] = get_google_plus_activity("107763702707848478173",
                                                     4)
    context['fb_posts'] = get_facebook_page_feed("diffusionimaginginpython", 5)
    context['tweets'] = get_twitter_feed('dipymri', 5)

    context['meta'] = get_meta_tags_dict(title="DIPY - Follow Us")
    return render(request, 'website/follow_us.html', context)


def news_page(request, news_id):
    context = {}
    try:
        news_post = NewsPost.objects.get(id=news_id)
    except ObjectDoesNotExist:
        raise Http404("News Post does not exist")
    context['news_post'] = news_post
    news_title = news_post.title
    meta_title = "DIPY - %s" % (news_title, )
    context['meta'] = get_meta_tags_dict(title=meta_title,
                                         description=news_post.description)
    return render(request, 'website/news.html', context)


@login_required
def dashboard(request):
    context = {}
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/dashboard.html', context)


def dashboard_login(request):
    context = {}
    next_url = request.GET.get('next')
    context['next'] = next_url
    context['meta'] = get_meta_tags_dict()
    return render(request, 'website/dashboard_login.html', context)


def custom404(request):
    context = {}
    context['meta'] = get_meta_tags_dict(title="DIPY - 404 Page Not Found")
    return render(request, 'website/error_pages/404.html', context, status=400)


def custom500(request):
    context = {}
    context['meta'] = get_meta_tags_dict(title="DIPY - 500 Error Occured")
    return render(request, 'website/error_pages/404.html', context, status=400)
