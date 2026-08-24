"""Select whole, single-ingredient foods from USDA FoodData Central.

The hand-curated list got the site to 435 foods. This mines the rest of the
release for genuine ingredients, while keeping out the three things that would
turn a reference into a junk drawer: prepared dishes, preparation variants of
something already listed, and branded or institutional products.
"""
import csv, glob, re, sys, json
csv.field_size_limit(10**7)

SR = glob.glob('sr/*/')[0]
FND = glob.glob('fnd/*/')[0]

CATS = {r['id']: r['description']
        for r in csv.DictReader(open(SR + 'food_category.csv'))}

# Categories that contain ingredients rather than meals.
KEEP_CATS = {
    '2': 'herb', '9': 'fruit', '11': 'veg', '12': 'nut', '16': 'legume',
    '20': 'grain', '15': 'fish', '1': 'dairy', '4': 'fat',
    '5': 'poultry', '10': 'meat', '13': 'meat', '17': 'meat',
}

# Never include: composite dishes, institutional and branded lines, anything
# reconstituted or fortified into a different product.
JUNK = re.compile(r'\b(baby ?food|infant|formula|fast ?food|restaurant|school|'
    r'McDONALD|BURGER KING|KENTUCKY|PIZZA HUT|SUBWAY|TACO BELL|WENDY|DENNY|'
    r'CAMPBELL|KRAFT|NESTLE|GENERAL MILLS|KELLOGG|POST |QUAKER|MORNINGSTAR|'
    r'soup|gravy|casserole|salad dressing|sandwich|burrito|pizza|entree|'
    r'dinner|meal,|pie |cake|cookie|cracker|candy|snack|beverage|drink|'
    r'imitation|substitute|analog|meat extender|puff|chip|bar,|shake|'
    r'supplement|meal replacement|infant|toddler|PAM |ENOVA|diglyceride|cooking spray)\b', re.I)

# Preparations that make an entry a variant of something else rather than a
# distinct ingredient.
PREP = re.compile(r'\b(cooked|boiled|drained|braised|stewed|simmered|steamed|'
    r'baked|broiled|fried|roasted|grilled|microwave|sauteed|heated|reheated|'
    r'canned|frozen|dehydrated|freeze-dried|rehydrated|'
    r'with salt|without salt|syrup pack|water pack|solids and liquids|'
    r'prepared|unprepared|from concentrate|reconstituted|diluted)\b', re.I)

# Forms that ARE the ingredient even though they sound processed.
INHERENT = re.compile(r'\b(dried|dry|raw|whole|ground|powder|flour|oil|seeds?|'
    r'kernels?|uncooked|unroasted|mature seeds|hulled|pearled|rolled)\b', re.I)

# Meat/poultry/fish trim noise -- keep one representative per cut.
TRIM = re.compile(r'trimmed to \d+[/\d"]*"? fat|,\s*(choice|select|prime)\b|'
    r'all grades|separable lean and fat|\bcomposite\b', re.I)


def load_have():
    have = set()
    for line in open('/Users/rishirao/workspace/food-is-medicine/build/foods.txt'):
        line = line.strip()
        if line and not line.startswith('#'):
            have.add(line.split('|')[3])
    return have


def base_key(desc, cat):
    """A key that collapses preparation variants of the same ingredient."""
    d = desc.lower()
    d = re.sub(r"\s*\(includes foods for usda's food distribution program\)", '', d)
    d = TRIM.sub('', d)
    # Cut at the first preparation word.
    parts = re.split(PREP, d)
    d = parts[0]
    # Drop trailing qualifiers that do not change what the food is.
    d = re.sub(r',\s*(raw|dry|dried|uncooked|unprepared|whole|all grades|'
               r'meat only|meat and skin|edible portion)\s*$', '', d).strip(' ,')
    d = re.sub(r'\s{2,}', ' ', d).strip(' ,')
    return cat + '|' + d


def quality(desc):
    """Higher is a better representative of its base ingredient."""
    d = desc.lower()
    s = 0
    if re.search(r'\braw\b', d): s += 60
    if re.search(r'\b(uncooked|dry|dried)\b', d): s += 30
    if 'separable lean only' in d: s += 25
    if 'meat only' in d: s += 20
    if re.search(r'\bwith skin\b', d): s += 5
    if PREP.search(d): s -= 40
    if re.search(r'\b(sprouted|leafy tips|peel|juice|pod)\b', d): s -= 12
    s -= len(d) / 200.0          # prefer the plainer name
    return s


# ---------------------------------------------------------------------------
# Per-category admission rules. The categories differ enormously in how USDA
# structures them: produce is one row per plant, while beef is one row per cut
# per trim level per grade per country of origin. Applying a single rule to
# both fills the site with 400 near-identical steaks and misses nothing useful.
# ---------------------------------------------------------------------------

# Industrial and reformulated fats are not kitchen ingredients.
FAT_REJECT = re.compile(r'\b(industrial|hydrogenated|shortening|margarine|spread|'
    r'partially|for frying|for cakes|for baking|filling|confectionery|'
    r'high oleic|mid-oleic|linoleic|salad or cooking, linoleic|cocoa butter substitute|'
    r'emulsifier|vitamin|fat-free|reduced calorie)\b', re.I)

# Animal-product noise: grades, trim levels, import lines, injected solutions.
MEAT_REJECT = re.compile(r'\b(australian|new zealand|imported|grass-fed|grain-fed|'
    r'with added solution|mechanically (deboned|separated)|seam fat|'
    r'composite|retail cuts|variety meats and by-products, (jowl|lips|ears|snout)|'
    r'enhanced|value cuts|restructured|ground, \d+% lean.*\d+% fat, (crumbles|patty))\b', re.I)
MEAT_PREFER = re.compile(r'separable lean only|meat only', re.I)

# Dairy that is a manufactured product rather than a dairy ingredient.
DAIRY_REJECT = re.compile(r'\b(ice ?cream|frozen yogurt|pudding|custard|eggnog|'
    r'cheese food|cheese product|cheese spread|pasteurized process|'
    r'CHOBANI|DANNON|YOPLAIT|FAGE|OIKOS|LIGHT ?& ?FIT|'
    r'fruit variety|flavou?red|vanilla|chocolate|strawberry|raspberry|blueberry|'
    r'sweetened|with added|no sugar added|fat free|low ?fat|nonfat|reduced fat|'
    r'lite|light|whipped topping|coffee whitener|creamer|non-dairy)\b', re.I)

# Reference materials and industrial specifications are not foods.
LAB = re.compile(r'\(0% moisture\)|\(industrial\)|quality control|reference material', re.I)
GRAIN_REJECT = re.compile(r'\b(self-rising|bolted, with wheat flour|industrial|'
    r'bleached, enriched|\d+(\.\d+)?% protein)\b', re.I)
FAT_EXTRA = re.compile(r'\b(mayonnaise|fish oil|cod liver|contains added|'
    r'cupu assu|babassu|ucuhuba|tea ?seed|nutmeg butter|sheanut|'
    r'vegetable oil-butter spread)\b', re.I)
DAIRY_EXTRA = re.compile(r'\b(dessert topping|dulce de leche|milk shake|malted)\b'
    r"|without added vitamin"
    r'|egg, (whole|white|yolk), dried', re.I)

CATEGORY_RULES = {
    'fat':     lambda d: (not FAT_REJECT.search(d) and not FAT_EXTRA.search(d)
                          and re.search(r'\boil\b|\bghee\b|tallow|lard', d, re.I)),
    'dairy':   lambda d: not DAIRY_REJECT.search(d) and not DAIRY_EXTRA.search(d),
    'grain':   lambda d: not GRAIN_REJECT.search(d),
    'meat':    lambda d: not MEAT_REJECT.search(d) and bool(MEAT_PREFER.search(d)),
    'poultry': lambda d: not MEAT_REJECT.search(d) and bool(MEAT_PREFER.search(d)),
    'fish':    lambda d: not MEAT_REJECT.search(d),
}


def admissible(desc, cat):
    rule = CATEGORY_RULES.get(cat)
    return rule(desc) if rule else True


def main():
    have = load_have()
    rows = []
    for r in csv.DictReader(open(SR + 'food.csv')):
        if r['data_type'] == 'sr_legacy_food':
            rows.append((r, 'SR'))
    for r in csv.DictReader(open(FND + 'food.csv')):
        if r['data_type'] == 'foundation_food':
            rows.append((r, 'FND'))

    groups = {}
    for r, src in rows:
        cat = KEEP_CATS.get(r['food_category_id'])
        if not cat:
            continue
        desc = r['description']
        if JUNK.search(desc) or LAB.search(desc):
            continue
        # An entry must either be raw/dry, or be a form that is inherently the
        # ingredient (an oil, a flour, a spice).
        if PREP.search(desc) and not re.search(r'\braw\b', desc, re.I):
            continue
        if not INHERENT.search(desc) and cat not in ('herb', 'fat', 'dairy'):
            continue
        if not admissible(desc, cat):
            continue
        groups.setdefault(base_key(desc, cat), []).append((r, src, cat))

    picked = []
    for key, items in groups.items():
        items.sort(key=lambda x: -quality(x[0]['description']))
        r, src, cat = items[0]
        picked.append({'fdc': r['fdc_id'], 'desc': r['description'],
                       'cat': cat, 'src': src,
                       'new': r['fdc_id'] not in have})

    new = [p for p in picked if p['new']]
    from collections import Counter
    print('distinct ingredients found: %d  (already have %d, new %d)'
          % (len(picked), len(picked) - len(new), len(new)))
    print()
    c = Counter(p['cat'] for p in new)
    for k, v in c.most_common():
        print('  %-10s %4d new' % (k, v))
    json.dump(picked, open('picked.json', 'w'))


if __name__ == '__main__':
    main()
