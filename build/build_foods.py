#!/usr/bin/env python3
"""Build data/foods.js from the USDA FoodData Central bulk releases.

Reads build/foods.txt, which locks each food to an FDC ID rather than to a
search string, so a future USDA release cannot silently substitute one food for
another. Every number the site displays comes out of this script -- nothing is
typed by hand -- and each food carries the FDC ID it was drawn from so the site
can link back to the public record.

Usage:
    python3 build/build_foods.py <sr_legacy_dir> [foundation_dir]
"""
import csv, json, os, re, sys

csv.field_size_limit(10 ** 7)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'data', 'foods.js')
LIST = os.path.join(HERE, 'foods.txt')

# USDA nutrient id -> (key used on the site, unit)
NUTRIENTS = {
    '1008': ('kcal', 'kcal'), '1003': ('protein', 'g'), '1004': ('fat', 'g'),
    '1005': ('carbs', 'g'), '1079': ('fiber', 'g'), '2000': ('sugar', 'g'),
    '1051': ('water', 'g'),
    '1258': ('satfat', 'g'), '1292': ('monofat', 'g'), '1293': ('polyfat', 'g'),
    '1404': ('ala', 'g'), '1316': ('la', 'g'), '1278': ('epa', 'g'),
    '1272': ('dha', 'g'), '1253': ('cholesterol', 'mg'),
    '1106': ('vita', 'ug'), '1162': ('vitc', 'mg'), '1114': ('vitd', 'ug'),
    '1109': ('vite', 'mg'), '1185': ('vitk', 'ug'), '1165': ('thiamin', 'mg'),
    '1166': ('riboflavin', 'mg'), '1167': ('niacin', 'mg'),
    '1170': ('pantothenic', 'mg'), '1175': ('b6', 'mg'), '1177': ('folate', 'ug'),
    '1178': ('b12', 'ug'), '1180': ('choline', 'mg'),
    '1087': ('calcium', 'mg'), '1089': ('iron', 'mg'), '1090': ('magnesium', 'mg'),
    '1091': ('phosphorus', 'mg'), '1092': ('potassium', 'mg'),
    '1093': ('sodium', 'mg'), '1095': ('zinc', 'mg'), '1098': ('copper', 'mg'),
    '1101': ('manganese', 'mg'), '1103': ('selenium', 'ug'),
}

SUFFIX = re.compile(r"\s*\(Includes foods for USDA's Food Distribution Program\)\s*$")

ALIASES = os.path.join(HERE, 'aliases.txt')
AUTO_TAGS = os.path.join(HERE, 'auto_tags.txt')


def load_aliases():
    """Alternative names and family tags, from build/aliases.txt.

    Two things fall out of this. A search for "ladyfinger" or "bhindi" has to
    find okra, because that is what it is called in most of the world. And a
    search for "gourd" should return the whole cucurbit shelf -- pumpkins,
    squashes, cucumber, chayote -- not only the two foods with "gourd" in the
    USDA description.
    """
    aka, tags = {}, {}
    # Auto-derived tags load first so that hand-written entries in aliases.txt
    # override them rather than the other way round.
    for path in (AUTO_TAGS, ALIASES):
        if os.path.exists(path):
            _read_alias_file(path, aka, tags)
    return aka, tags


def _read_alias_file(path, aka, tags):
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('|')
            if len(parts) < 3:
                continue
            slug = parts[0].strip()
            names = [n.strip() for n in parts[1].split(',') if n.strip()]
            tag_list = [t.strip() for t in parts[2].split(',') if t.strip()]
            if names:
                aka[slug] = sorted(set(names))
            if tag_list:
                tags[slug] = sorted(set(tag_list))

# ---------------------------------------------------------------------------
# Dietary classification.
#
# Groups that are plants or fungi are vegan by default; the exceptions below
# override that. Allergen tags follow the major allergens recognised by the FDA
# (FALCPA as amended by the FASTER Act, which added sesame in 2021) plus lactose,
# which is an intolerance rather than an allergy but is what people actually
# filter on.
# ---------------------------------------------------------------------------
PLANT_GROUPS = {'fruit', 'veg', 'mushroom', 'nut', 'legume', 'grain', 'herb'}
ANIMAL_FLESH = {'meat', 'poultry', 'offal', 'fish', 'shellfish'}

TREE_NUTS = {
    'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'brazilnut', 'hazelnut',
    'macadamia', 'pinenut', 'chestnut', 'pilinut', 'hickory', 'beechnut', 'coconut',
}
PEANUTS = {'peanut'}
SOY = {'soybean', 'edamame'}
SESAME = {'sesame'}
# Gluten-containing grains. Oats are gluten-free botanically but are so routinely
# cross-contaminated in milling that coeliac guidance treats them as suspect
# unless certified, so they are flagged.
GLUTEN = {
    'oats', 'barley', 'wheatberry', 'bulgur', 'spelt', 'farro', 'kamut', 'rye', 'freekeh',
}
CRUSTACEAN = {
    'shrimp', 'lobster', 'spinylobster', 'bluecrab', 'dungeness', 'kingcrab',
    'snowcrab', 'crawfish',
}
# Rendered animal fats and gelatin sit in the `fat` group but are not vegan.
ANIMAL_FATS = {'tallow', 'lard', 'schmaltz', 'gelatin'}


def classify(group, slug):
    """Return (dietary flags, allergen tags) for one food."""
    diet, allergens = set(), set()

    if group in ANIMAL_FLESH or slug in ANIMAL_FATS:
        pass  # neither vegetarian nor vegan
    elif group == 'dairy':
        diet.add('vegetarian')
    elif group == 'egg':
        diet.add('vegetarian')
    elif group == 'bee':
        diet.add('vegetarian')  # honey is vegetarian but not vegan
    elif group in PLANT_GROUPS or group == 'fat':
        diet.add('vegetarian')
        diet.add('vegan')

    if group == 'dairy':
        allergens.update(['milk', 'lactose'])
        # Ghee and butter are nearly pure fat; hard aged cheeses are effectively
        # lactose-free. Both still carry milk protein, so `milk` stays.
        if slug in {'ghee', 'butter', 'buttersalted', 'parmesan', 'pecorino'}:
            allergens.discard('lactose')
    if group == 'egg' and slug != 'caviar' and slug != 'fishroe':
        allergens.add('egg')
    if slug in {'caviar', 'fishroe'} or group == 'fish':
        allergens.add('fish')
    if group == 'shellfish':
        allergens.add('crustacean' if slug in CRUSTACEAN else 'mollusc')
    if slug in TREE_NUTS:
        allergens.add('treenut')
    if slug in PEANUTS:
        allergens.add('peanut')
    if slug in SOY:
        allergens.add('soy')
    if slug in SESAME:
        allergens.add('sesame')
    if slug in GLUTEN:
        allergens.add('gluten')

    return sorted(diet), sorted(allergens)


# Portion labels that describe a fraction of something rather than a thing you
# can count, and so make a poor unit for a "how many do you have" control.
NOT_COUNTABLE = re.compile(
    r'\b(slice|strip|wedge|ring|tbsp|tsp|teaspoon|tablespoon|piece\s+\d|'
    r'cubic|fl oz|serving)\b', re.I)
COUNTABLE = re.compile(
    r'\b(medium|large|small|whole|each|piece|fruit|clove|stalk|head|bunch|'
    r'leaf|pod|fillet|egg|breast|thigh|wing|link)\b', re.I)
DIMENSIONS = re.compile(r'\s*\((?:[^()]*(?:"|dia|long|thick|inch)[^()]*)\)')


def clean_label(label):
    """Trim the dimension notes USDA appends, which are noise in a UI."""
    out = DIMENSIONS.sub('', label)
    out = re.sub(r'\s{2,}', ' ', out).strip().strip(',').strip()
    return out or label


def choose_portion(opts):
    """Pick the portion a cook would actually count in.

    USDA lists several per food and the first is often a fraction of a cup.
    "2 x 0.5 cup, diced" is a poor way to say "two potatoes", so a countable
    whole item wins, preferring the medium size as the canonical one. Volume
    measures are the fallback for foods that have no natural unit.
    """
    if not opts:
        return None

    def score(o):
        label = o['label']
        grams = o['grams']
        if NOT_COUNTABLE.search(label):
            return -1
        s = 0
        if COUNTABLE.search(label):
            s += 100
            if re.search(r'\bmedium\b', label, re.I):
                s += 30
            elif re.search(r'\blarge\b', label, re.I):
                s += 10
            elif re.search(r'\bsmall\b', label, re.I):
                s += 5
            if re.search(r'\bextra\b', label, re.I):
                s -= 8
        elif re.search(r'\bcup\b', label, re.I):
            s += 40
            # A whole cup beats a fraction of one.
            if o.get('amount', 1) and abs(o['amount'] - 1) < 1e-9:
                s += 10
        # Keep portions in a plausible single-serving range.
        if 20 <= grams <= 400:
            s += 20
        elif grams < 20 or grams > 900:
            s -= 20
        return s

    ranked = sorted(opts, key=lambda o: -score(o))
    top = ranked[0]
    if score(top) < 0:
        top = opts[0]
    return {'label': clean_label(top['label']), 'grams': top['grams']}


def choose_serving(opts):
    """Pick a plausible amount for one person to eat at once.

    This is a different question from choose_portion. A whole cabbage is a
    perfectly good unit to have in your kitchen, and a hopeless answer to "best
    sources of vitamin C" -- nobody eats one in a sitting. So the basket counts
    in countable units, and nutrition rankings use this instead.
    """
    if not opts:
        return None

    def score(o):
        label, grams = o['label'], o['grams']
        if not (15 <= grams <= 250):
            return -1
        s = 20
        if re.search(r'\bcup\b', label, re.I):
            s += 30
            if o.get('amount', 1) and abs(o['amount'] - 1) < 1e-9:
                s += 10
        if re.search(r'\b(medium|piece|fillet|large|slice|oz)\b', label, re.I):
            s += 15
        if re.search(r'\b(tbsp|tsp|teaspoon|tablespoon)\b', label, re.I):
            s -= 25
        return s

    ranked = sorted(opts, key=lambda o: -score(o))
    top = ranked[0]
    if score(top) < 0:
        return None
    return {'label': clean_label(top['label']), 'grams': top['grams']}


def read_dataset(directory, wanted_ids, foods, portions, pub):
    """Pull the wanted foods, their nutrients and portions out of one release."""
    if not directory or not os.path.isdir(directory):
        return
    present = set()
    with open(os.path.join(directory, 'food.csv')) as fh:
        for row in csv.DictReader(fh):
            if row['fdc_id'] in wanted_ids:
                present.add(row['fdc_id'])
                foods[row['fdc_id']] = SUFFIX.sub('', row['description']).strip()
                pub[row['fdc_id']] = row['publication_date']
    if not present:
        return

    with open(os.path.join(directory, 'food_nutrient.csv')) as fh:
        for row in csv.DictReader(fh):
            if row['fdc_id'] not in present:
                continue
            spec = NUTRIENTS.get(row['nutrient_id'])
            if not spec or row['amount'] in ('', None):
                continue
            wanted_ids[row['fdc_id']].setdefault('n', {})
            wanted_ids[row['fdc_id']]['n'][spec[0]] = round(float(row['amount']), 3)

    path = os.path.join(directory, 'food_portion.csv')
    if os.path.exists(path):
        with open(path) as fh:
            for row in csv.DictReader(fh):
                if row['fdc_id'] not in present or not row['gram_weight']:
                    continue
                # USDA splits a portion across three columns: amount, modifier and
                # portion_description. "4 oz" is amount=4, modifier="oz" -- dropping
                # the amount turns a 113 g portion into a label reading "oz",
                # which understates it fourfold.
                label = ', '.join(p for p in (row['portion_description'], row['modifier']) if p)
                label = label or 'serving'
                try:
                    amount = float(row['amount'])
                except (TypeError, ValueError):
                    amount = 1.0
                if amount and abs(amount - 1.0) > 1e-9:
                    qty = int(amount) if amount == int(amount) else round(amount, 2)
                    label = '%s %s' % (qty, label)
                portions.setdefault(row['fdc_id'], []).append(
                    {'label': label, 'grams': float(row['gram_weight']), 'amount': amount})


def main():
    sr_dir = sys.argv[1] if len(sys.argv) > 1 else None
    fnd_dir = sys.argv[2] if len(sys.argv) > 2 else None
    if not sr_dir:
        sys.exit('usage: build_foods.py <sr_legacy_dir> [foundation_dir]')

    curated = []
    with open(LIST) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            group, slug, name, fdc = line.split('|')
            curated.append({'group': group, 'slug': slug, 'name': name, 'fdcId': fdc})

    wanted = {c['fdcId']: c for c in curated}
    if len(wanted) != len(curated):
        sys.exit('duplicate FDC id in foods.txt')

    aka, tags = load_aliases()
    known = {c['slug'] for c in curated}
    stale = sorted((set(aka) | set(tags)) - known)
    if stale:
        print('aliases.txt names %d slugs that are not in foods.txt: %s'
              % (len(stale), ', '.join(stale)))

    foods, portions, pub = {}, {}, {}
    read_dataset(sr_dir, wanted, foods, portions, pub)
    read_dataset(fnd_dir, wanted, foods, portions, pub)

    missing = [c['slug'] for c in curated if c['fdcId'] not in foods]
    if missing:
        sys.exit('no USDA record for: ' + ', '.join(missing))

    out = []
    for c in curated:
        fdc = c['fdcId']
        opts = portions.get(fdc, [])
        best = choose_portion(opts)
        serve = choose_serving(opts)
        diet, allergens = classify(c['group'], c['slug'])
        entry = {
            'slug': c['slug'], 'name': c['name'], 'group': c['group'],
            'fdcId': int(fdc), 'usda': foods[fdc], 'published': pub[fdc],
            'diet': diet, 'allergens': allergens,
            'aka': aka.get(c['slug'], []),
            'tags': tags.get(c['slug'], []),
            'nutrients': c.get('n', {}),
        }
        if best:
            entry['portion'] = {'label': best['label'], 'grams': round(best['grams'], 1)}
        if serve:
            entry['serving'] = {'label': serve['label'], 'grams': round(serve['grams'], 1)}
        out.append(entry)

    # Two USDA records can reduce to the same display name -- either because the
    # same food appears in both releases, or because a real distinction (bone-in
    # versus boneless) lives in a part of the description the name dropped.
    # Disambiguate where the descriptions genuinely differ, drop where they do not.
    by_name = {}
    for e in out:
        by_name.setdefault(e['name'], []).append(e)

    dropped_dupes = []
    for name, group in by_name.items():
        if len(group) < 2:
            continue
        group.sort(key=lambda e: -len(e['nutrients']))
        token_sets = []
        for e in group:
            toks = set(re.findall(r"[a-z0-9-]+", (e.get('usda') or '').lower()))
            token_sets.append(toks)
        for i, e in enumerate(group):
            others = set().union(*(token_sets[:i] + token_sets[i + 1:]))
            unique = [t for t in sorted(token_sets[i] - others)
                      if len(t) > 2 and t not in ('raw', 'the', 'and', 'with')]
            if unique:
                e['name'] = '%s (%s)' % (name, ', '.join(unique[:2]))
            elif i > 0:
                dropped_dupes.append(e['slug'])

    if dropped_dupes:
        out = [e for e in out if e['slug'] not in dropped_dupes]
        print('dropped %d entries that duplicated another exactly: %s'
              % (len(dropped_dupes), ', '.join(dropped_dupes[:6])))

    with open(OUT, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand.\n')
        fh.write('// Built by build/build_foods.py from USDA FoodData Central\n')
        fh.write('// (SR Legacy 2018-04 and Foundation Foods). Each entry keeps its FDC ID so\n')
        fh.write('// the site can link back to the source record. Values are per 100 g,\n')
        fh.write('// edible portion. Dietary and allergen tags are derived in the build script.\n')
        fh.write('window.FOODS = ')
        # Written compactly: at a thousand foods the pretty-printing was adding
        # about half a megabyte of whitespace to a file that blocks first paint.
        json.dump(out, fh, separators=(',', ':'))
        fh.write(';\n')

    thin = [o['slug'] for o in out if len(o['nutrients']) < 15]
    tagged = sum(1 for o in out if o['tags'])
    all_tags = sorted({t for o in out for t in o['tags']})
    print('wrote %d foods -> %s' % (len(out), OUT))
    print('%d foods carry family tags; %d distinct tags: %s'
          % (tagged, len(all_tags), ', '.join(all_tags)))
    untagged = [o['slug'] for o in out if not o['tags']]
    if untagged:
        print('%d foods have no tag yet' % len(untagged))
    if thin:
        print('sparse records (<15 nutrients):', ', '.join(thin))


if __name__ == '__main__':
    main()
