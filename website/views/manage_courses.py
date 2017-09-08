from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, redirect

from .tools import github_permission_required
from website.forms import AddEditCourseForm
from website.models import Course


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
def edit_course(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
    except:
        raise Http404("Course does not exist")

    context = {"box_legend": "Edit Course",}
    if request.method == 'POST':
        submitted_form = AddEditCourseForm(request.POST,instance=course)
        if submitted_form.is_valid():
            submitted_form.save()
            return redirect(reverse('dashboard_courses'))
        else:
            context['form'] = submitted_form
            return render(request, 'website/editforms.html', context)

    form = AddEditCourseForm(instance=course)
    context['form'] = form
    return render(request, 'website/editforms.html', context)


@login_required
@github_permission_required
def delete_course(request, course_id):
    try:
        p = Course.objects.get(id=course_id)
    except:
        raise Http404("Course does not exist")
    p.delete()
    return redirect(reverse('dashboard_courses'))
