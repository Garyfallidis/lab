from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render

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
    context = {'all_blog_posts': BlogPost.objects.all(),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/blog.html', context)


def blog_post(request, identifier):
    context = {'blog_post': BlogPost.objects.get(identifier=identifier),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/blog_post.html', context)


def research(request):
    context = {
               'meta': get_meta_tags_dict(title="DIPY - Research"),
               }
    return render(request, 'website/research.html', context)


def publications(request):
    context = {'all_publications': Publication.objects.all(),
               'meta': get_meta_tags_dict(title="DIPY - Publications"),
               }
    return render(request, 'website/publications.html', context)


def teaching(request):
    context = {'all_courses': Course.objects.all(),
               'meta': get_meta_tags_dict(title="DIPY - Teaching"),
               }
    return render(request, 'website/teaching.html', context)

def people(request):
    context = {'all_profile': Profile.objects.all(),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/people.html', context)


def people_profile(request, username):
    user = User.objects.get(username=username)
    context = {'profile': Profile.objects.get(user=user),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/people_profile.html', context)


def honeycomb(request):
    context = {'all_youtube_videos': get_youtube_videos('UCHnEuCRDGFOR5cfEo0nD3pw', 100),
               'meta': get_meta_tags_dict(title="DIPY - Gallery"),
               }
    return render(request, 'website/honeycomb.html', context)


def follow_us(request):
    context = {'latest_news': get_latest_news_posts(5),
               'gplus_feed': get_google_plus_activity("107763702707848478173", 4),
               'fb_posts': get_facebook_page_feed("diffusionimaginginpython", 5),
               'tweets': get_twitter_feed('dipymri', 5),
               'meta': get_meta_tags_dict(title="DIPY - Follow Us"),
               }
    return render(request, 'website/follow_us.html', context)


def news_page(request, news_id):
    try:
        news_post = NewsPost.objects.get(id=news_id)
    except ObjectDoesNotExist:
        raise Http404("News Post does not exist")
    meta_title = "DIPY - %s" % (news_post.title,)
    context = {'news_post': news_post,
               'meta': get_meta_tags_dict(title=meta_title,
                                          description=news_post.description),
               }
    return render(request, 'website/news.html', context)


@login_required
@github_permission_required
def dashboard(request):
    context = {'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/dashboard.html', context)


def dashboard_login(request):
    next_url = request.GET.get('next')
    context = {'next': next_url,
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/dashboard_login.html', context)


def custom404(request):
    context = {'meta': get_meta_tags_dict(title="DIPY - 404 Page Not Found"),
               }
    return render(request, 'website/error_pages/404.html', context, status=400)


def custom500(request):
    context = {'meta': get_meta_tags_dict(title="DIPY - 500 Error Occured"),
               }
    return render(request, 'website/error_pages/404.html', context, status=400)
