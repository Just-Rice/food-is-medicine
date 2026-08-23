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
                label = ', '.join(p for p in (row['portion_description'], row['modifier']) if p)
                portions.setdefault(row['fdc_id'], []).append(
                    {'label': label or 'serving', 'grams': float(row['gram_weight'])})


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
        best = next((o for o in opts if 20 <= o['grams'] <= 250), opts[0] if opts else None)
        diet, allergens = classify(c['group'], c['slug'])
        entry = {
            'slug': c['slug'], 'name': c['name'], 'group': c['group'],
            'fdcId': int(fdc), 'usda': foods[fdc], 'published': pub[fdc],
            'diet': diet, 'allergens': allergens,
            'nutrients': c.get('n', {}),
        }
        if best:
            entry['portion'] = {'label': best['label'], 'grams': round(best['grams'], 1)}
        out.append(entry)

    with open(OUT, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand.\n')
        fh.write('// Built by build/build_foods.py from USDA FoodData Central\n')
        fh.write('// (SR Legacy 2018-04 and Foundation Foods). Each entry keeps its FDC ID so\n')
        fh.write('// the site can link back to the source record. Values are per 100 g,\n')
        fh.write('// edible portion. Dietary and allergen tags are derived in the build script.\n')
        fh.write('window.FOODS = ')
        json.dump(out, fh, indent=1)
        fh.write(';\n')

    thin = [o['slug'] for o in out if len(o['nutrients']) < 15]
    print('wrote %d foods -> %s' % (len(out), OUT))
    if thin:
        print('sparse records (<15 nutrients):', ', '.join(thin))


if __name__ == '__main__':
    main()
