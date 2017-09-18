import scholarly
from lxml import html
import json
import os
import datetime
import pytz


FIXTURES_PATH = os.path.dirname(os.path.abspath(__file__))
author_name_list = ("Eleftherios Garyfallidis", )


def generate_fixtures():
    """ Get article """

    pk = 0
    all_fixtures = []
    for author_name in author_name_list:
        # Search author on Google scholar
        search_query = scholarly.search_author(author_name)
        author = next(search_query).fill()
        if not author:
            continue

        # Look for author publications
        for i, pub_obj in enumerate(author.publications):

            current_pub = pub_obj.fill()
            import pdb
            pdb.set_trace()
            if not hasattr(current_pub, 'bib'):
                continue

            pub = current_pub.bib
            if not pub:
                continue
            fixture = {"model" : "website.publication",
                       "pk": pk,
                       "fields": {}
                       }
            fixture['fields']['title'] = pub['title'] if 'title' in pub else ""
            fixture['fields']['url'] = pub['url'] if 'url' in pub else ""
            fixture['fields']['author'] = pub['author'] if 'author' in pub else author_name
            fixture['fields']['doi'] = ""
            fixture['fields']['entry_type'] = ""
            fixture['fields']['publisher'] = pub['publisher'] if 'publisher' in pub else ""
            fixture['fields']['published_in'] =  ""
            fixture['fields']['year_of_publication'] = ""
            fixture['fields']['month_of_publication'] =  ""
            fixture['fields']['bibtex'] = ""
            fixture['fields']['project_url'] = ""
            fixture['fields']['pdf'] = ""

            if 'abstract' in pub:
                content = pub['abstract'] if isinstance(pub['abstract'], str) else str(pub['abstract'])
                doc = html.fromstring(content)
                fixture['fields']['abstract'] = doc.text_content()
            else:
                fixture['fields']['abstract'] = ""

            fixture['fields']['created'] = datetime.datetime.now(tz=pytz.utc).isoformat()
            fixture['fields']['modified'] = datetime.datetime.now(tz=pytz.utc).isoformat()

            pk += 1
            all_fixtures.append(fixture)


    return all_fixtures


def save_fixtures(fname, fixtures_list):
    """ Save fixture to a json file """
    if os.path.isfile(fname):
        os.remove(fname)
    with open(fname, 'w') as outfile:
        json.dump(fixtures_list, outfile)


if __name__ == '__main__':
    data = generate_fixtures()
    # print(data)
    save_fixtures('initial_publication_data.json', data)