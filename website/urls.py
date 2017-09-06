from django.core.urlresolvers import reverse_lazy
from django.conf.urls import url
from django.contrib.auth.views import logout
from . import views

urlpatterns = [
    # Home Page
    url(r'^$', views.index, name='index'),

    # Section Page
    url(r'^page/(?P<position_id>.*?)/$', views.page,
        name='section_page'),

    # Blog Page
    url(r'^blog/$', views.blog,
        name='blog'),

    url(r'^blog/(?P<identifier>.*?)/$', views.blog_post,
        name='blog_post'),

    # People page
    url(r'^people/$', views.people, name='people'),
    url(r'^people/(?P<username>.*?)/$', views.people_profile,
        name='people_profile'),

    # Cite Page for research
    url(r'^research/$', views.research, name='research'),

    # Cite Page for teaching
    url(r'^teaching/$', views.teaching, name='teaching'),

    # Cite Page for publications
    url(r'^publications/$', views.publications, name='publications'),

    # News Post display page
    url(r'^news/(?P<news_id>.*?)/$', views.news_page, name='news_page'),

    # Honeycomb gallery
    url(r'^gallery/$', views.honeycomb, name='gallery'),

    # Follow us page for social feeds
    url(r'^follow/$', views.follow_us, name='follow_us'),

    # Admin Panel Dash Board
    url(r'^dashboard/$', views.dashboard, name='dashboard'),

    # Admin Panel Login Page
    url(r'^dashboard/login/?$', views.dashboard_login, name='dashboard_login'),

    # Section and Page Management
    url(r'^dashboard/sections/edit/(?P<section_type_requested>.*?)/(?P<position_id>.*?)/$',
        views.edit_website_section, name='edit_website_section'),
    url(r'^dashboard/sections/add/$',
        views.add_website_page, name='add_website_page'),
    url(r'^dashboard/sections/delete/(?P<position_id>.*?)/$',
        views.delete_website_page, name='delete_website_page'),
    url(r'^dashboard/sections/(?P<section_type_requested>.*?)/$',
        views.dashboard_sections, name='dashboard_sections'),

    # News Management
    url(r'^dashboard/news/$', views.dashboard_news, name='dashboard_news'),
    url(r'^dashboard/news/edit/(?P<news_id>.*?)/$',
        views.edit_news_post, name='edit_news_post'),
    url(r'^dashboard/news/add/$', views.add_news_post,
        name='add_news_post'),
    url(r'^dashboard/news/delete/(?P<news_id>.*?)/$',
        views.delete_news_post, name='delete_news_post'),

    # Publication Management
    url(r'^dashboard/publications/$', views.dashboard_publications,
        name='dashboard_publications'),
    url(r'^dashboard/publications/edit/(?P<publication_id>.*?)/$',
        views.edit_publication, name='edit_publication'),
    url(r'^dashboard/publications/add/(?P<method>.*?)/$',
        views.add_publication, name='add_publication'),
    url(r'^dashboard/publications/delete/(?P<publication_id>.*?)/$',
        views.delete_publication, name='delete_publication'),
    url(r'^dashboard/publications/highlight/$',
        views.highlight_publications, name='highlight_publications'),

    # Carousel Management
    url(r'^dashboard/carousel/$', views.dashboard_carousel,
        name='dashboard_carousel'),
    url(r'^dashboard/carousel/edit/(?P<carousel_image_id>.*?)/$',
        views.edit_carousel_image, name='edit_carousel_image'),
    url(r'^dashboard/carousel/add/$', views.add_carousel_image,
        name='add_carousel_image'),
    url(r'^dashboard/carousel/delete/(?P<carousel_image_id>.*?)/$',
        views.delete_carousel_image, name='delete_carousel_image'),

    # Profile Management
    url(r'^dashboard/profile/$', views.edit_profile,
        name='edit_profile'),

    # logout url
    url(r'^dashboard/logout/$', logout,
        {'next_page': reverse_lazy('index')}, name='dashboard_logout')

]
