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


# Exact Commons filenames, curated where the generic lookup returned the wrong
# subject. The recurring failure is that an encyclopedia article about an animal
# leads with a photo of the live animal: "Duck egg" resolved to a roast duck,
# "Chicken breast" to hens in a market. For a food reference the food itself is
# what belongs on the page.
CURATED_FILE = {
    # eggs
    'chickenegg': 'Brown-eggs.jpg',
    'duckegg': 'Duck Egg (4055112201).jpg',
    'quailegg': 'Jiro with quail eggs.jpg',
    # poultry cuts
    'chickenbreast': 'Kycklingfilé.jpg',
    'chickenthigh': 'Raw chicken thighs.jpg',
    'chickendrumstick': 'Raw chicken drumsticks (3312851753).jpg',
    'chickenwing': 'Raw chicken wings.jpg',
    'squab': 'Trussed Squab (7276586328).jpg',
    'ostrich': 'Straußensteak.JPG',
    # offal
    'chickenliver': 'Preparing Chicken Liver 01.JPG',
    'tongue': 'Beef tongue preparation.jpg',
    'brain': 'Calf Brains.jpg',
    'marrow': 'Roast Bone Marrow & Parsley Salad (3512154149).jpg',
    'sweetbread': 'Cut of veal sweetbreads.png',
    # meat
    'lambchop': 'Lamb Chops.JPG',
    'elk': 'Grilled Elk rib chops-01.jpg',
    # dairy and fats
    'ghee': 'Clarified-butter.jpg',
    'muenster': 'Munster 01.jpg',
    'paneer': 'Homemade Paneer Block Fromage Cheese India.jpg',
    # fish
    'coho': 'Young Coho Salmon Oncorhynchus kisutch.jpg',
    'snapper': 'Lutjanus campechanus.png',
    # plants
    'peanut': 'Raw peanuts with skin on white plate.jpg',
    'cannellini': 'Dried sorana beans.jpg',
    'adzuki': 'HK 紅豆 Red Adzuki beans with water June 2019 SSG 02.jpg',
    'watermelonseed': 'Char Magaz.JPG',
    'beechnut': 'Opengebarsten vrucht van beuk (Fagus sylvatica) (d.j.b) 02.jpg',
    'waterchestnut': 'Eleocharis dulcis Blanco1.15.jpg',
    'yam': 'Dioscorea alata - Purple yam tuber - Mindanao, Philippines.jpg',
    'asparagus': 'Asparagus-Bundle.jpg',
    'fennel': 'Cut Fennel bulb 01.jpg',
    'fonio': 'Fonio Grains (Digitaria Exilis).jpg',
    'peach': 'Owoce Brzoskwinia.jpg',
    'plum': 'Prunus domestica ripe fruits.jpg',
    'fig': 'Figo comum.jpg',
    # meat cuts whose article leads with the live animal
    'veal': 'A tray of breaded veal cutlets.jpg',
    'porkshoulder': 'Boston butt , boneless, tied.jpg',
    'groundlamb': 'Kibbeh Nayyeh.jpg',
    'lambshank': 'Lammhaxe mit Kloß Bischofsmühle.jpg',
    'wheyacid': 'Whey powder.jpg',
    # A previous run illustrated these with a milk-float garage and an NFL
    # promotional photo. Pinned so it cannot happen again.
    'milkwhole': 'Milk glass.jpg',
    'milk2': 'Glass of Milk (33657535532).jpg',
    'milk1': 'Milk 001.JPG',
    'milkskim': 'Skim milk.jpg',
    # regional produce and sea vegetables, where the generic lookup drifted to
    # the plant's habitat or to an unrelated dish
    'spirulina': 'Spirulina-powder-shadow.jpg',
    'irishmoss': 'Irish Moss (Chondrus crispus) - Oslo, Norway 2021-03-25.jpg',
    'sesbania': 'Sesbania grandiflora flower and fruit.jpg',
    'quince': 'Cydonia oblonga Fruit 1.jpg',
    'crabapple': 'Pommier sauvage - Malus - crabapple (5053412726).jpg',
    'roselle': 'Roselle, Hibiscus sabdariffa, 2014 01.JPG',
    'acerola': 'Malpighia glabra acerola fruit green.jpg',
    'cherimoya': 'Cherimoya cut hg.jpg',
}

# Foods for which Commons has no photograph that is actually of the food. The
# lookup would otherwise settle on something confidently wrong -- ground turkey
# resolved to a tin of cat food, acid whey to a scan of a 1920s dairy-board
# report. A blank tile is honest; a picture of the wrong thing is not.
NO_IMAGE = {
    'groundturkey', 'gooseegg', 'clam', 'seabass', 'butter', 'buttersalted',
    'laver', 'pigeonpeagreen',
}

# Curated foods carry hand-written names a picture search can work with. The
# bulk-imported ones carry USDA descriptions, and searching Wikimedia for
# "Pork, fresh, loin, center rib (chops or roasts)" returns whatever it likes --
# an earlier run illustrated 2% milk with a photograph of a milk-float garage.
# So a bulk food only gets a photo if its name is short and plain enough to
# stand a fair chance; the rest show the placeholder tile.
CURATED_MARKER = '# ---- Bulk import'
COMPLEX_NAME = re.compile(
    r'\b(fresh|separable|trimmed|grade|includes|unenriched|enriched|without added|'
    r'with added|all varieties|mixed species|type of|partially|defatted|low fat|'
    r'low sodium|whole-grain|glandless|puree)\b', re.I)


def load_curated_slugs():
    path = os.path.join(HERE, 'foods.txt')
    out = set()
    if not os.path.exists(path):
        return out
    for line in open(path):
        if line.startswith(CURATED_MARKER):
            break
        line = line.strip()
        if line and not line.startswith('#'):
            out.add(line.split('|')[1])
    return out


def searchable(name):
    if len(name) > 26 or name.count(',') > 1:
        return False
    if len(name.split(',')[0].split()) > 3:
        return False
    return not COMPLEX_NAME.search(name)


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



def thumb_for_file(filename, width=400):
    """Thumbnail URL for an exact Commons filename."""
    try:
        d = get(COMMONS, {
            'action': 'query', 'format': 'json', 'formatversion': '2',
            'titles': 'File:' + filename, 'prop': 'imageinfo',
            'iiprop': 'url', 'iiurlwidth': str(width),
        })
        page = d['query']['pages'][0]
        if page.get('missing'):
            return None
        return page['imageinfo'][0].get('thumburl') or page['imageinfo'][0].get('url')
    except Exception:
        return None


def image_from_commons(term):
    """Search Commons' File namespace directly. More precise than an article
    lookup for foods that share a name with the animal or plant they come from."""
    try:
        d = get(COMMONS, {
            'action': 'query', 'format': 'json', 'formatversion': '2',
            'generator': 'search', 'gsrsearch': 'filetype:bitmap ' + term,
            'gsrnamespace': '6', 'gsrlimit': '5',
            'prop': 'imageinfo', 'iiprop': 'url', 'iiurlwidth': '400',
        })
        out = []
        for page in (d.get('query', {}).get('pages') or []):
            info = (page.get('imageinfo') or [{}])[0]
            url = info.get('thumburl') or info.get('url')
            name = page.get('title', '')[5:]
            if url and name and not name.lower().endswith('.svg'):
                out.append((name, url))
        return out
    except Exception:
        return []


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
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    refetch = '--refetch' in sys.argv

    src = open(os.path.join(ROOT, 'data', 'foods.js')).read()
    foods = json.loads(src[src.index('['):src.rindex(';')])

    os.makedirs(IMG_DIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        m = open(MANIFEST).read()
        manifest = json.loads(m[m.index('{'):m.rindex(';')])

    # No two foods may share a photograph. A repeated image reads as an error
    # even when it is technically of the right subject -- and in practice a
    # repeat usually means the lookup fell back to something generic.
    def claimed(skip_slug=None):
        return {v.get('file') for k, v in manifest.items()
                if k != skip_slug and v.get('file')}

    if only:
        todo = [f for f in foods if f['slug'] in only]
    elif refetch:
        todo = foods
    else:
        todo = [f for f in foods
                if f['slug'] not in manifest
                or not os.path.exists(os.path.join(IMG_DIR, f['slug'] + '.jpg'))]
    if limit:
        todo = todo[:limit]
    print('%d foods to process' % len(todo))

    curated_slugs = load_curated_slugs()

    for i, food in enumerate(todo):
        slug = food['slug']
        if slug not in curated_slugs and not searchable(food['name']):
            manifest.pop(slug, None)
            path = os.path.join(IMG_DIR, slug + '.jpg')
            if os.path.exists(path):
                os.remove(path)
            continue
        if slug in NO_IMAGE:
            manifest.pop(slug, None)
            path = os.path.join(IMG_DIR, slug + '.jpg')
            if os.path.exists(path):
                os.remove(path)
            print('  [%d/%d] %s -- no accurate photo exists, placeholder' % (i + 1, len(todo), slug))
            continue
        used = claimed(skip_slug=slug)
        candidates = []

        # 1. A hand-curated exact file always wins.
        if slug in CURATED_FILE:
            name = CURATED_FILE[slug]
            url = thumb_for_file(name)
            if url:
                candidates.append((name, url))

        base = QUERY_OVERRIDES.get(slug, food['name'])
        base = re.sub(r'\s*\([^)]*\)', '', base).strip()
        hint = GROUP_HINT.get(food['group'], '')

        # 2. Exact encyclopedia article titles.
        if not candidates:
            titles = [base, '%s (%s)' % (base, hint.split()[0])] if hint else [base]
            name, url = image_from_titles(titles)
            if url:
                candidates.append((name, url))

        # 3. Commons File-namespace search, which knows about food photographs
        #    rather than about the animal an article happens to be named for.
        if not candidates or candidates[0][0] in used:
            candidates.extend(image_from_commons((base + ' ' + hint).strip()))

        # 4. Last resort: a plain article search.
        if not candidates:
            name, url = image_from_search((base + ' ' + hint).strip())
            if url:
                candidates.append((name, url))

        pick = next(((n, u) for n, u in candidates if n not in used), None)
        if not pick:
            # Better an honest placeholder than a picture of the wrong thing.
            print('  [%d/%d] %s -- NO UNIQUE IMAGE, leaving placeholder' % (i + 1, len(todo), slug))
            manifest.pop(slug, None)
            path = os.path.join(IMG_DIR, slug + '.jpg')
            if os.path.exists(path):
                os.remove(path)
            continue

        name, url = pick
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            with open(os.path.join(IMG_DIR, slug + '.jpg'), 'wb') as fh:
                fh.write(data)
            manifest[slug] = credit(name)
            manifest[slug]['file'] = name
            print('  [%d/%d] %s <- %s' % (i + 1, len(todo), slug, name[:56]))
        except Exception as e:
            print('  failed %s: %s' % (slug, e))
        time.sleep(0.12)

        if (i + 1) % 25 == 0:
            write_manifest(manifest)

    write_manifest(manifest)

    # Report anything that ended up shared, which should now be impossible.
    seen = {}
    for slug, cr in manifest.items():
        seen.setdefault(cr.get('file'), []).append(slug)
    dupes = {f: s for f, s in seen.items() if len(s) > 1}
    print('manifest holds %d images' % len(manifest))
    if dupes:
        print('DUPLICATES:', dupes)
    missing = [f['slug'] for f in foods if f['slug'] not in manifest]
    if missing:
        print('%d foods without an image (placeholder shown): %s'
              % (len(missing), ', '.join(missing)))


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
