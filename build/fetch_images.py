#!/usr/bin/env python3
"""Fetch one photograph per food from Wikimedia Commons.

Commons is used rather than arbitrary web images for three reasons: the files
are freely licensed so they can be redistributed, the API exposes the author and
licence so attribution can be recorded, and the URLs are stable.

Writes downscaled JPEGs into img/ and an attribution manifest to
data/images.js. Re-running only fetches foods that are still missing, so the
script is safe to interrupt.

Usage: python3 build/fetch_images.py [--limit N]
"""
import json, os, re, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
IMG_DIR = os.path.join(ROOT, 'img')
MANIFEST = os.path.join(ROOT, 'data', 'images.js')
UA = 'FoodIsMedicine/1.0 (https://github.com/Just-Rice/food-is-medicine) python-urllib'

API = 'https://en.wikipedia.org/w/api.php'
COMMONS = 'https://commons.wikimedia.org/w/api.php'

# Search terms that do better than the display name, usually because the plain
# name is ambiguous (a "date" is not a fruit to a search engine) or because the
# USDA name is a technical one no encyclopedia uses.
QUERY_OVERRIDES = {
    'date': 'Medjool date fruit', 'fig': 'Common fig fruit',
    'plum': 'Plum fruit', 'peach': 'Peach fruit', 'pear': 'Pear fruit',
    'corn': 'Sweet corn', 'oats': 'Oat grain', 'quark': 'Quark cheese',
    'straw': 'Straw mushroom', 'brain': 'Beef brain food',
    'heart': 'Beef heart food', 'kidney': 'Beef kidney food',
    'tongue': 'Beef tongue food', 'marrow': 'Bone marrow food',
    'tripe': 'Tripe', 'sweetbread': 'Sweetbread', 'gizzard': 'Gizzard',
    'romanesco': 'Romanesco broccoli', 'poblano': 'Poblano pepper',
    'skyr': 'Skyr', 'halloumi': 'Halloumi', 'pecorino': 'Pecorino Romano',
    'mascarpone': 'Cream cheese', 'quesoblanco': 'Queso blanco',
    'wheyprotein': 'Whey powder', 'wheyacid': 'Whey',
    'schmaltz': 'Schmaltz', 'gelatin': 'Gelatin powder',
    'la': 'Linoleic acid', 'eggwhite': 'Egg white', 'eggyolk': 'Egg yolk',
    'uvwhite': 'Agaricus bisporus', 'uvportabella': 'Portobello mushroom',
    'whitemushroom': 'Agaricus bisporus', 'crimini': 'Agaricus bisporus',
    'greenpeas': 'Pea', 'greenbeans': 'Green bean', 'snappea': 'Snap pea',
    'splitpea': 'Split pea', 'blackeyed': 'Black-eyed pea',
    'cranberrybean': 'Cranberry bean', 'lima': 'Lima bean',
    'whiterice': 'White rice', 'wheatberry': 'Wheat berry',
    'cornmeal': 'Cornmeal', 'sourcherry': 'Sour cherry',
    'currantblack': 'Blackcurrant', 'currantred': 'Redcurrant',
    'prune': 'Prune', 'goji': 'Goji berry', 'coconut': 'Coconut meat',
    'jicama': 'Jicama', 'sunchoke': 'Jerusalem artichoke',
    'daikon': 'Daikon', 'yam': 'Yam vegetable', 'taro': 'Taro root',
    'scallion': 'Scallion', 'yellowsquash': 'Yellow squash',
    'bittermelon': 'Bitter melon', 'woodear': 'Auricularia auricula-judae',
    'chevre': 'Goat cheese', 'buttersalted': 'Butter',
    'groundbeef': 'Ground beef', 'ribeye': 'Rib eye steak',
    'flanksteak': 'Flank steak', 'porkbelly': 'Pork belly',
    'lambchop': 'Lamb chop', 'lamblegs': 'Leg of lamb',
    'lambshank': 'Lamb shank', 'groundlamb': 'Ground lamb',
    'chickenbreast': 'Chicken breast', 'chickenthigh': 'Chicken thigh',
    'chickendrumstick': 'Chicken drumstick', 'chickenwing': 'Chicken wing',
    'turkeybreast': 'Turkey breast', 'groundturkey': 'Ground turkey',
    'squab': 'Squab food', 'guineafowl': 'Guineafowl',
    'fishroe': 'Roe', 'caviar': 'Caviar', 'snail': 'Escargot',
    'oysters': 'Oyster', 'clam': 'Clam', 'scallop': 'Scallop',
    'crawfish': 'Crayfish', 'snowcrab': 'Snow crab',
    'albacore': 'Albacore', 'bluefin': 'Bluefin tuna',
    'flounder': 'Flounder', 'atlanticsalmon': 'Atlantic salmon',
    'pacificcod': 'Pacific cod', 'seabass': 'Sea bass',
    'tallow': 'Tallow', 'lard': 'Lard', 'honey': 'Honey',
    'basil': 'Basil', 'mint': 'Peppermint', 'sage': 'Sage herb',
    'oregano': 'Oregano', 'dill': 'Dill', 'tarragon': 'Tarragon',
    'turmericroot': 'Turmeric', 'cinnamonspice': 'Cinnamon',
    'blackpepper': 'Black pepper', 'coriander seed': 'Coriander',
    'mustardseed': 'Mustard seed', 'poppyseed': 'Poppy seed',
}


# Search hints appended per food group. Without them a plain name search drifts:
# "blackberry" returns a phone, "kiwi" a bird, "date" a calendar. The group word
# pins the query to the food sense.
GROUP_HINT = {
    'fruit': 'fruit', 'veg': 'vegetable', 'mushroom': 'mushroom fungus',
    'nut': 'nut seed food', 'legume': 'bean legume', 'grain': 'grain cereal',
    'herb': 'herb plant', 'dairy': 'dairy food', 'meat': 'meat cut raw',
    'poultry': 'poultry meat', 'offal': 'offal food', 'fish': 'fish',
    'shellfish': 'seafood', 'egg': 'egg food', 'fat': 'food', 'bee': 'food',
}


def get(url, params):
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(url + '?' + q, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def image_from_titles(titles):
    """Lead image for exact Wikipedia article titles, which is far more precise
    than a search: the article "Blackberry" is the fruit while "BlackBerry" is
    the phone, and a search query cannot tell them apart."""
    try:
        d = get(API, {
            'action': 'query', 'format': 'json', 'formatversion': '2',
            'titles': '|'.join(titles), 'redirects': '1',
            'prop': 'pageimages', 'piprop': 'thumbnail|name',
            'pithumbsize': '400', 'pilicense': 'free',
        })
    except Exception:
        return None, None
    pages = {p.get('title'): p for p in (d.get('query', {}).get('pages') or [])}
    # Preserve the caller's preference order rather than the API's.
    norm = {t.lower(): t for t in titles}
    ordered = sorted(pages.values(),
                     key=lambda p: titles.index(norm.get(p.get('title', '').lower(), titles[0]))
                     if norm.get(p.get('title', '').lower()) in titles else 99)
    for page in ordered:
        thumb = page.get('thumbnail', {}).get('source')
        name = page.get('pageimage')
        if thumb and name and not name.lower().endswith('.svg'):
            return name, thumb
    return None, None


def image_from_search(term):
    """Fallback when no exact article title has a lead image."""
    try:
        d = get(API, {
            'action': 'query', 'format': 'json', 'formatversion': '2',
            'generator': 'search', 'gsrsearch': term, 'gsrlimit': '3',
            'prop': 'pageimages', 'piprop': 'thumbnail|name',
            'pithumbsize': '400', 'pilicense': 'free',
        })
    except Exception:
        return None, None
    for page in (d.get('query', {}).get('pages') or []):
        thumb = page.get('thumbnail', {}).get('source')
        name = page.get('pageimage')
        if thumb and name and not name.lower().endswith('.svg'):
            return name, thumb
    return None, None


def credit(filename):
    """Author and licence for a Commons file, for the attribution manifest."""
    try:
        d = get(COMMONS, {
            'action': 'query', 'format': 'json', 'formatversion': '2',
            'titles': 'File:' + filename, 'prop': 'imageinfo',
            'iiprop': 'extmetadata|url',
        })
        info = d['query']['pages'][0]['imageinfo'][0]
        meta = info.get('extmetadata', {})
        artist = re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip()
        artist = re.sub(r'\s+', ' ', artist)[:120] or 'Unknown'
        return {
            'author': artist,
            'license': meta.get('LicenseShortName', {}).get('value', 'see Commons'),
            'page': info.get('descriptionurl', ''),
        }
    except Exception:
        return {'author': 'Unknown', 'license': 'see Commons', 'page': ''}


def main():
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])

    src = open(os.path.join(ROOT, 'data', 'foods.js')).read()
    foods = json.loads(src[src.index('['):src.rindex(';')])

    os.makedirs(IMG_DIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        m = open(MANIFEST).read()
        manifest = json.loads(m[m.index('{'):m.rindex(';')])

    todo = [f for f in foods
            if f['slug'] not in manifest
            or not os.path.exists(os.path.join(IMG_DIR, f['slug'] + '.jpg'))]
    if limit:
        todo = todo[:limit]
    print('%d foods need an image' % len(todo))

    for i, food in enumerate(todo):
        base = QUERY_OVERRIDES.get(food['slug'], food['name'])
        base = re.sub(r'\s*\([^)]*\)', '', base).strip()
        hint = GROUP_HINT.get(food['group'], '')
        # Exact article titles first, most specific to least; then a search.
        candidates = [base, '%s (%s)' % (base, hint.split()[0])] if hint else [base]
        name, thumb = image_from_titles(candidates)
        if not thumb:
            name, thumb = image_from_search((base + ' ' + hint).strip())
        term = base
        if not thumb:
            print('  no image: %s (%s)' % (food['slug'], term))
            continue
        try:
            req = urllib.request.Request(thumb, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            with open(os.path.join(IMG_DIR, food['slug'] + '.jpg'), 'wb') as fh:
                fh.write(data)
            manifest[food['slug']] = credit(name)
            manifest[food['slug']]['file'] = name
            print('  [%d/%d] %s <- %s' % (i + 1, len(todo), food['slug'], name[:50]))
        except Exception as e:
            print('  failed %s: %s' % (food['slug'], e))
        time.sleep(0.12)

        if (i + 1) % 25 == 0:
            write_manifest(manifest)

    write_manifest(manifest)
    print('manifest holds %d images' % len(manifest))


def write_manifest(manifest):
    with open(MANIFEST, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand.\n')
        fh.write('// Photograph credits, written by build/fetch_images.py.\n')
        fh.write('// Every image is from Wikimedia Commons under a free licence; the author\n')
        fh.write('// and licence below are reproduced from the Commons file metadata.\n')
        fh.write('window.IMAGE_CREDITS = ')
        json.dump(manifest, fh, indent=1, sort_keys=True)
        fh.write(';\n')


if __name__ == '__main__':
    main()
