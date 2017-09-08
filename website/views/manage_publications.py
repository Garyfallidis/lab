import bibtexparser
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, redirect

from .tools import github_permission_required
from website.forms import AddEditPublicationForm
from website.models import Publication


@login_required
@github_permission_required
def dashboard_publications(request):
    all_publications = Publication.objects.all()
    context = {'all_publications': all_publications}
    if request.method == 'POST':
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

    form = AddEditPublicationForm()
    context['form'] = form

    return render(request, 'website/dashboard_publications.html', context)


@login_required
@github_permission_required
def edit_publication(request, publication_id):
    try:
        publication = Publication.objects.get(id=publication_id)
    except:
        raise Http404("Publication does not exist")

    context = {"box_legend": "Edit Publication",}
    if request.method == 'POST':
        submitted_form = AddEditPublicationForm(request.POST,
                                                instance=publication)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_publications'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/editforms.html', context)

    form = AddEditPublicationForm(instance=publication)
    context['form'] = form
    return render(request, 'website/editforms.html', context)


@login_required
@github_permission_required
def delete_publication(request, publication_id):
    try:
        p = Publication.objects.get(id=publication_id)
    except:
        raise Http404("Publication does not exist")
    p.delete()
    return redirect(reverse('dashboard_publications'))


@login_required
@github_permission_required
def highlight_publications(request):
    if request.method == 'POST':
        highlighted_publications = request.POST.getlist('highlights[]')
        all_publications = Publication.objects.all()

        for p in all_publications:
            if str(p.id) in highlighted_publications:
                p.is_highlighted = True
            else:
                p.is_highlighted = False
            p.save()
        return redirect(reverse('dashboard_publications'))
    else:
        all_publications = Publication.objects.all()
        context = {'all_publications': all_publications}
        return render(request, 'website/highlightpublications.html',
                      context)
