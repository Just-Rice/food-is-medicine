#!/usr/bin/env python3
"""Build data/foods.js from the USDA FoodData Central SR Legacy release.

Every number the site displays comes out of this script -- nothing is typed by
hand -- so each food carries the FDC ID it was drawn from and links back to the
public record at fdc.nal.usda.gov.
"""
import csv, json, os, re, sys

SR = sys.argv[1] if len(sys.argv) > 1 else 'sr/FoodData_Central_sr_legacy_food_csv_2018-04/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'foods.js')
LIST = os.path.join(os.path.dirname(__file__), 'foods.txt')

# USDA nutrient id -> (key we use on the site, unit)
NUTRIENTS = {
    '1008': ('kcal', 'kcal'), '1003': ('protein', 'g'), '1004': ('fat', 'g'),
    '1005': ('carbs', 'g'), '1079': ('fiber', 'g'), '2000': ('sugar', 'g'),
    '1051': ('water', 'g'),
    '1258': ('satfat', 'g'), '1292': ('monofat', 'g'), '1293': ('polyfat', 'g'),
    '1404': ('ala', 'g'), '1316': ('la', 'g'), '1253': ('cholesterol', 'mg'),
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


def norm(desc):
    return SUFFIX.sub('', desc).strip()


def load_curated():
    """Read the hand-picked food list: group | slug | display name | USDA description."""
    items = []
    with open(LIST) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            group, slug, name, desc = line.split('|')
            items.append({'group': group, 'slug': slug, 'name': name, 'usda': desc})
    return items


def main():
    curated = load_curated()
    wanted_desc = {c['usda']: c for c in curated}

    fdc_to_item = {}
    pub = {}
    with open(os.path.join(SR, 'food.csv')) as fh:
        for row in csv.DictReader(fh):
            key = norm(row['description'])
            item = wanted_desc.get(key)
            if item and 'fdcId' not in item:
                item['fdcId'] = int(row['fdc_id'])
                fdc_to_item[row['fdc_id']] = item
                pub[row['fdc_id']] = row['publication_date']

    missing = [c['slug'] for c in curated if 'fdcId' not in c]
    if missing:
        sys.exit('No USDA match for: ' + ', '.join(missing))

    for item in curated:
        item['n'] = {}

    with open(os.path.join(SR, 'food_nutrient.csv')) as fh:
        for row in csv.DictReader(fh):
            item = fdc_to_item.get(row['fdc_id'])
            if not item:
                continue
            spec = NUTRIENTS.get(row['nutrient_id'])
            if not spec or row['amount'] in ('', None):
                continue
            item['n'][spec[0]] = round(float(row['amount']), 3)

    # A common household portion, so the site can show more than "per 100 g".
    portions = {}
    with open(os.path.join(SR, 'food_portion.csv')) as fh:
        for row in csv.DictReader(fh):
            if row['fdc_id'] not in fdc_to_item or not row['gram_weight']:
                continue
            label = ', '.join(p for p in (row['portion_description'], row['modifier']) if p)
            portions.setdefault(row['fdc_id'], []).append(
                {'label': label or 'serving', 'grams': float(row['gram_weight'])})

    for fdc_id, item in fdc_to_item.items():
        opts = portions.get(fdc_id, [])
        # Prefer a cup/piece measure in a sane range over odd lab portions.
        best = None
        for opt in opts:
            if 20 <= opt['grams'] <= 250:
                best = opt
                break
        if best is None and opts:
            best = opts[0]
        if best:
            item['portion'] = {'label': best['label'], 'grams': round(best['grams'], 1)}
        item['published'] = pub[fdc_id]

    out = []
    for c in curated:
        out.append({
            'slug': c['slug'], 'name': c['name'], 'group': c['group'],
            'fdcId': c['fdcId'], 'published': c['published'],
            'portion': c.get('portion'), 'nutrients': c['n'],
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        fh.write('// GENERATED FILE -- do not edit by hand.\n')
        fh.write('// Built by build/build_foods.py from USDA FoodData Central, SR Legacy\n')
        fh.write('// (April 2018 release). Each entry keeps its FDC ID so the site can link\n')
        fh.write('// back to the source record. Values are per 100 g, edible portion.\n')
        fh.write('window.FOODS = ')
        json.dump(out, fh, indent=1)
        fh.write(';\n')

    print(f'wrote {len(out)} foods -> {OUT}')
    thin = [o['slug'] for o in out if len(o['nutrients']) < 20]
    if thin:
        print('sparse records:', ', '.join(thin))


if __name__ == '__main__':
    main()
