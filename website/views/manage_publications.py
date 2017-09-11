
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, redirect

from .tools import github_permission_required
from website.forms import AddEditPublicationForm
from website.models import Publication


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
