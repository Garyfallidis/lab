from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render

from .tools import *
from website.models import *


# Definition of views:

def index(request):
    latest_blog_posts = get_latest_blog_posts(3)
    all_journal = JournalImage.objects.filter(display=True)

    context = {'latest_blog_posts': latest_blog_posts,
               'all_journal': all_journal,
               'meta': get_meta_tags_dict(),
               }
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


def news_page(request):
    context = {'all_blog_posts': BlogPost.objects.filter(show_in_lab_blog=True),
               'meta': get_meta_tags_dict(title="DIPY - News - Follow Us"),
               }
    return render(request, 'website/news.html', context)


def blog_post(request, slug):
    context = {'blog_post': BlogPost.objects.get(slug=slug),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/blog_post.html', context)


def events_page(request):
    all_events = EventPost.objects.all()
    context = {'all_events': all_events,
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/events.html', context)


def event_post(request, slug):
    context = {'event_post': EventPost.objects.get(slug=slug),
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/event_post.html', context)


def research(request):
    all_research = Research.objects.filter(show_in_page=True).order_by('position')
    context = {'all_research': all_research,
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
    all_profile_dict = {choice[1]: Profile.objects.filter(status=choice[0]) for choice in Profile.STATUS_CHOICE}
    context = {'all_profile_dict': all_profile_dict,
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/people.html', context)


def people_profile(request, username):
    user = User.objects.get(username=username)
    profile = Profile.objects.get(user=user)
    my_blog_posts = BlogPost.objects.filter(authors=profile, show_in_my_blog=True)
    context = {'profile': profile,
               'my_blog_posts': my_blog_posts,
               'meta': get_meta_tags_dict(),
               }
    return render(request, 'website/people_profile.html', context)


def honeycomb(request):
    context = {'all_youtube_videos': get_youtube_videos('UCHnEuCRDGFOR5cfEo0nD3pw', 100),
               'meta': get_meta_tags_dict(title="DIPY - Gallery"),
               }
    return render(request, 'website/honeycomb.html', context)


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
