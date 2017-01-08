from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, redirect

from .tools import github_permission_required
from website.forms import EditProfileForm
from website.models import Profile


@login_required
@github_permission_required
def edit_profile(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except:
        raise Http404("Profile does not exist. Contact Admin")

    context = {}
    if request.method == 'POST':
        submitted_form = EditProfileForm(request.POST, request.FILES,
                                         instance=profile)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/editprofile.html', context)

    form = EditProfileForm(instance=profile)
    context['form'] = form
    return render(request, 'website/editprofile.html', context)
