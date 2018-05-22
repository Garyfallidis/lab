from django.forms import ModelForm, ClearableFileInput, Form, ChoiceField, IntegerField
from .models import *


class EditFixedSectionForm(ModelForm):
    class Meta:
        model = WebsiteSection
        fields = ['title', 'body_markdown']


class AddEditPageSectionForm(ModelForm):
    class Meta:
        model = WebsiteSection
        fields = ['title', 'body_markdown',
                  'website_position_id',
                  'show_in_nav']


class AddEditBlogPostForm(ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'body', 'authors', 'show_in_lab_blog', 'show_in_my_blog',
                  'is_highlighted', 'keywords', 'attachments']
        widgets = {
            'attachments': ClearableFileInput(attrs={'multiple': True}),
        }
        labels = {'is_highlighted': 'Highlight Blog Post'}


class AddEditEventPostForm(ModelForm):
    class Meta:
        model = EventPost
        fields = ['title', 'description', 'description_img', 'start_date', 'end_date', 'is_highlighted',
                  'keywords', 'body_markdown', 'attachments']
        widgets = {
            'attachments': ClearableFileInput(attrs={'multiple': True}),
        }
        labels = {'is_highlighted': 'Highlight Event'}


class AddEditPublicationForm(ModelForm):
    class Meta:
        model = Publication
        fields = ['title', 'url', 'is_highlighted',  'author', 'doi', 'entry_type', 'abstract',
                  'published_in', 'publisher', 'year_of_publication',
                  'month_of_publication', 'bibtex', 'pdf', 'project_url']
        labels = {'is_highlighted': 'Highlight publication'}


class AddEditCourseForm(ModelForm):
    class Meta:
        model = Course
        fields = ['title', 'acronym', 'level', 'semester', 'prerequisite', 'description',
                  'syllabus']


class AddEditCarouselImageForm(ModelForm):
    class Meta:
        model = CarouselImage
        fields = ['image_url', 'image_caption', 'image_description', 'target_url']


class AddEditResearchForm(ModelForm):
    class Meta:
        model = Research
        fields = ['title', 'position', 'show_in_page', 'background_img', 'description_page_markdown']


class AddEditJournalForm(ModelForm):
    class Meta:
        model = JournalImage
        fields = ['title', 'cover', 'caption', 'link_url', 'display']


class UserForm(ModelForm):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')


class EditProfileForm(ModelForm):
    class Meta:
        model = Profile
        fields = ['job_title', 'avatar_img', 'contact_number', 'contact_url', 'description',
                  'profile_page_markdown']
        labels = {'profile_page_markdown': 'About me',
                  'description': 'Detailed Position & Research Interests'}


class CareerForm(ModelForm):
    class Meta:
        model = CareerModel
        fields = ['body_internal', 'body_external', 'attachments']
        labels = {'body_internal': 'Current Positions',
                  'body_external': 'Faculty Positions'}


class TeamForm(Form):
    def __init__(self, *args, **kwargs):
        team = kwargs.pop('team')
        super(TeamForm, self).__init__(*args, **kwargs)
        for counter, profile in enumerate(team):
            self.fields['status-' + str(profile.user.username)] = ChoiceField(label="{} Status".format(profile.user.username),
                                                                              choices=profile.STATUS_CHOICE,
                                                                              initial=profile.status)
            self.fields['rank-' + str(profile.user.username)] = IntegerField(label="{} Rank".format(profile.user.username),
                                                                             initial=profile.rank,
                                                                             max_value=99,
                                                                             min_value=0)

    def get_new_status_and_rank(self):
        for name, value in self.cleaned_data.items():
            if name.startswith('status-'):
                username = name.replace('status-', '')
                yield (username, value, self.cleaned_data['rank-' + username])
