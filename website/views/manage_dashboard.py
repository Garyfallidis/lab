import bibtexparser
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, redirect

from .tools import github_permission_required
from website.forms import AddEditEventPostForm, AddEditBlogPostForm, AddEditPublicationForm, AddEditCourseForm,\
    TeamForm, AddEditResearchForm, AddEditJournalForm
from website.models import EventPost, BlogPost, Publication, Course, Profile, User, Research, JournalImage


@login_required
@github_permission_required
def dashboard_blog(request):
    all_blog_post = BlogPost.objects.all().order_by('-posted')
    context = {'all_blog_post': all_blog_post}
    if request.method == 'POST':
        submitted_form = AddEditBlogPostForm(request.POST)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_blog'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/dashboard_blog.html', context)


    form = AddEditBlogPostForm()
    context['form'] = form
    return render(request, 'website/dashboard_blog.html', context)

@login_required
@github_permission_required
def dashboard_events(request):
    all_event_post = EventPost.objects.all()
    context = {'all_event_post': all_event_post}
    if request.method == 'POST':
        submitted_form = AddEditEventPostForm(request.POST, request.FILES)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_events'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/dashboard_events.html', context)


    form = AddEditEventPostForm()
    context['form'] = form
    return render(request, 'website/dashboard_events.html', context)


@login_required
@github_permission_required
def dashboard_publications(request):
    all_journal = JournalImage.objects.all()
    print(all_journal)
    all_publications = Publication.objects.all()
    context = {'all_journal': all_journal,
               'all_publications': all_publications}

    if request.method == 'POST':
        if 'journal' in request.POST:
            print('pass here')
            submitted_form = AddEditJournalForm(request.POST, request.FILES)
            print(submitted_form)
            if submitted_form.is_valid():
                print('valid')
                submitted_form.save()
                return redirect(reverse('dashboard_publications'))
            else:
                print('not valid')
                print(submitted_form.errors)
                context['journal_form'] = submitted_form
                return render(request, 'website/dashboard_publications.html', context)

        if 'manual' in request.POST:
            submitted_form = AddEditPublicationForm(request.POST)
            if submitted_form.is_valid():
                submitted_form.save()
                return redirect(reverse('dashboard_publications'))
            else:
                context['form'] = submitted_form
                return render(request, 'website/dashboard_publications.html', context)

        elif 'bibtex' in request.POST:
            bibtex_entered = request.POST.get('bibtex')
            try:
                bib_parsed = bibtexparser.loads(bibtex_entered)
                bib_info = bib_parsed.entries[0]

                if 'title' in bib_info:
                    title = bib_info['title']
                else:
                    title = None

                if 'author' in bib_info:
                    authors = bib_info['author']
                elif 'authors' in bib_info:
                    authors = bib_info['aithors']
                else:
                    authors = None

                if 'url' in bib_info:
                    url = bib_info['url']
                elif 'link' in bib_info:
                    url = bib_info['link']
                elif 'doi' in bib_info:
                    url = "http://dx.doi.org/" + bib_info['doi']
                else:
                    url = None

                if title and authors and url:
                    publication_obj = Publication(title=title, author=authors, url=url)
                    if 'ENTRYTYPE' in bib_info:
                        publication_obj.entry_type = bib_info['ENTRYTYPE']
                    if 'doi' in bib_info:
                        publication_obj.doi = bib_info['doi']
                    if 'journal' in bib_info:
                        publication_obj.published_in = bib_info['journal']
                    if 'booktitle' in bib_info:
                        publication_obj.published_in = bib_info['booktitle']
                    if 'publisher' in bib_info:
                        publication_obj.publisher = bib_info['publisher']
                    if 'year' in bib_info:
                        publication_obj.year_of_publication = bib_info['year']
                    if 'month' in bib_info:
                        publication_obj.month_of_publication = bib_info['month']
                        publication_obj.bibtex = bibtex_entered
                        publication_obj.save()
                    return redirect(reverse('dashboard_publications'))

                else:
                    return render(request, 'website/dashboard_publications.html', context)
            except:
                return render(request, 'website/dashboard_publications.html', context)

        else:
            raise Http404("Not a valid method for adding publications.")

    journal_form = AddEditJournalForm()
    form = AddEditPublicationForm()
    context['form'] = form
    context['journal_form'] = journal_form

    return render(request, 'website/dashboard_publications.html', context)


@login_required
@github_permission_required
def dashboard_courses(request):
    all_courses = Course.objects.all()
    context = {'all_courses': all_courses}
    if request.method == 'POST':
        submitted_form = AddEditCourseForm(request.POST)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_courses'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/dashboard_courses.html', context)


    form = AddEditCourseForm()
    context['form'] = form
    return render(request, 'website/dashboard_courses.html', context)


@login_required
@github_permission_required
def dashboard_research(request):
    all_research = Research.objects.all()
    context = {'all_research': all_research}
    if request.method == 'POST':
        submitted_form = AddEditResearchForm(request.POST)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_research'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/dashboard_research.html', context)


    form = AddEditResearchForm()
    context['form'] = form
    return render(request, 'website/dashboard_research.html', context)


@login_required
@github_permission_required
def dashboard_team(request):
    all_profile = Profile.objects.all()
    context = {}
    if request.method == 'POST':
        submitted_form = TeamForm(request.POST, team=all_profile)
        if submitted_form.is_valid():
            for (username, status, rank) in submitted_form.get_new_status_and_rank():
                user = User.objects.get(username=username)
                p = Profile.objects.get(user=user)
                p.status = status
                p.rank = rank
                p.save()
            return redirect(reverse('dashboard_team'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/dashboard_team.html', context)

    form = TeamForm(team=all_profile)
    context['form'] = form
    return render(request, 'website/dashboard_team.html', context)


def get_current_model_and_form(model_name):
    container = {}
    if model_name.lower() == "blog":
        container['model'] = BlogPost
        container['form'] = AddEditBlogPostForm
        container['reverse'] = 'dashboard_blog'
    if model_name.lower() == "publication":
        container['model'] = Publication
        container['form'] = AddEditPublicationForm
        container['reverse'] = 'dashboard_publications'
    if model_name.lower() == "course":
        container['model'] = Course
        container['form'] = AddEditCourseForm
        container['reverse'] = 'dashboard_courses'
    if model_name.lower() == 'event':
        container['model'] = EventPost
        container['form'] = AddEditEventPostForm
        container['reverse'] = 'dashboard_events'
    if model_name.lower() == 'research':
        container['model'] = Research
        container['form'] = AddEditResearchForm
        container['reverse'] = 'dashboard_research'
    if model_name.lower() == 'journal':
        container['model'] = JournalImage
        container['form'] = AddEditJournalForm
        container['reverse'] = 'dashboard_publications'

    return container


@login_required
@github_permission_required
def edit_page(request, model_name, model_id):
    current_container = get_current_model_and_form(model_name)
    if not current_container:
        raise Http404("Website {} does not exist".format(model_name))

    try:
        current_object = current_container['model'].objects.get(id=model_id)
    except:
        raise Http404("Website {} does not exist".format(model_name))

    context = {}
    if request.method == 'POST':
        submitted_form = current_container['form'](request.POST, request.FILES, instance=current_object)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse(current_container['reverse']))
        else:
            context['form'] = submitted_form
            return render(request, 'website/editforms.html', context)

    form = current_container['form'](instance=current_object)
    context['form'] = form
    return render(request, 'website/editforms.html', context)


@login_required
@github_permission_required
def delete_page(request, model_name, model_id):
    current_container = get_current_model_and_form(model_name)
    if not current_container:
        raise Http404("Website {} does not exist".format(model_name))
    try:
        n = current_container['model'].objects.get(id=model_id)
    except:
        raise Http404("{} does not exist".format(model_name))
    n.delete()
    return redirect(reverse(current_container['reverse']))
