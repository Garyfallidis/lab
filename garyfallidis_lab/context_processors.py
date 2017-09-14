from django.conf import settings # import the settings file


def social_media_id(request):
    # return the value you want as a dictionnary. you may add multiple values in there.
    return {'FACEBOOK_APP_ID': settings.FACEBOOK_APP_ID,
            'TWITTER_CONSUMER_KEY': settings.TWITTER_CONSUMER_KEY,
            'SOCIAL_AUTH_GITHUB_KEY': settings.SOCIAL_AUTH_GITHUB_KEY,
            'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY': settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            }

