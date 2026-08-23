"""Turn USDA descriptions into readable names, slugs and family tags."""
import json, re, unicodedata

# Trailing qualifiers that describe preparation state rather than the food.
STRIP_TAIL = re.compile(
    r',\s*(raw|dry|dried|uncooked|unprepared|whole|edible portion|'
    r'all grades|all commercial varieties|mixed species|'
    r'separable lean only|meat only|meat and skin|boneless|bone-in|'
    r'trimmed to [^,]*|choice|select|prime|'
    r'mature seeds|immature seeds|in ?pod|'
    r'\(includes foods for usda\'s food distribution program\))'
    r'(?=,|$)', re.I)

# Leading category words USDA prefixes; some read better re-attached at the end.
LEAD_DROP = {'spices', 'nuts', 'seeds', 'fish', 'crustaceans', 'mollusks',
             'game meat', 'beverages', 'snacks', 'babyfood'}
LEAD_KEEP = {'oil': 'oil', 'cheese': 'cheese', 'flour': 'flour', 'milk': 'milk',
             'cream': 'cream', 'yogurt': 'yoghurt', 'butter': 'butter'}


def tidy(desc):
    d = re.sub(r"\s*\(includes foods for usda's food distribution program\)", '', desc, flags=re.I)
    prev = None
    while prev != d:
        prev = d
        d = STRIP_TAIL.sub('', d)
    d = re.sub(r'\s{2,}', ' ', d).strip(' ,')
    return d


def display_name(desc):
    d = tidy(desc)
    parts = [p.strip() for p in d.split(',') if p.strip()]
    if not parts:
        return desc
    head = parts[0].lower()

    if head in LEAD_DROP and len(parts) > 1:
        rest = parts[1:]
        name = ', '.join(rest)
    elif head in LEAD_KEEP and len(parts) > 1:
        # "Oil, olive, extra light" -> "Olive oil, extra light"
        name = parts[1] + ' ' + LEAD_KEEP[head]
        if len(parts) > 2:
            name += ', ' + ', '.join(parts[2:])
    else:
        name = ', '.join(parts)

    name = name.strip(' ,')
    return name[:1].upper() + name[1:]


def slugify(name, taken):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '', s).lower()[:28] or 'food'
    base, n = s, 2
    while s in taken:
        s = base + str(n)
        n += 1
    taken.add(s)
    return s


# Family tags derived from the description, so search by family keeps working
# for foods nobody hand-tagged.
TAG_RULES = [
    (r'\bcitrus|orange|lemon|lime|grapefruit|tangerine|mandarin|pummelo|kumquat', 'citrus'),
    (r'berr(y|ies)|currant|gooseberr', 'berry'),
    (r'melon|cantaloupe|honeydew|watermelon', 'melon,gourd,cucurbit'),
    (r'squash|pumpkin|zucchini|gourd|cucumber|chayote', 'gourd,cucurbit'),
    (r'cabbage|broccoli|cauliflower|kale|collard|brussels|kohlrabi|turnip|'
     r'rutabaga|radish|mustard green|watercress|arugula|bok ?choy|pak.?choi', 'brassica,cruciferous'),
    (r'onion|garlic|leek|shallot|chive|scallion', 'allium'),
    (r'tomato|potato|eggplant|pepper|tomatillo|aubergine', 'nightshade'),
    (r'beans?|lentil|pea\b|peas\b|chickpea|cowpea|soy|lupin', 'legume,pulse'),
    (r'lettuce|spinach|chard|greens|leaves|cress|endive|chicory|radicchio', 'leafy green'),
    (r'root|tuber|yam\b|taro|cassava|parsnip|beet\b', 'root'),
    (r'mushroom|fungus|truffle', 'mushroom,fungi'),
    (r'seaweed|kelp|laver|algae|spirulina', 'seaweed,sea vegetable'),
    (r'\bnut\b|nuts,|almond|cashew|pecan|walnut|pistachio|hazel', 'nut'),
    (r'seeds?,|sesame|flax|chia|sunflower|pumpkin seed', 'seed'),
    (r'wheat|rice|oat|barley|rye|millet|sorghum|corn|maize|quinoa|flour', 'grain,cereal'),
    (r'spices?,|herb', 'spice'),
    (r'\boil\b', 'oil,fat'),
    (r'cheese', 'dairy,cheese'),
    (r'milk|cream|yogurt|yoghurt', 'dairy'),
    (r'beef|veal', 'beef,red meat,meat'),
    (r'pork|ham\b|bacon', 'pork,red meat,meat'),
    (r'lamb|mutton', 'lamb,red meat,meat'),
    (r'chicken|turkey|duck|goose|quail|pheasant|poultry', 'poultry,meat'),
    (r'game meat|bison|venison|elk|boar|rabbit', 'game,red meat,meat'),
    (r'liver|kidney|heart|tongue|tripe|gizzard|brain|variety meats', 'offal,organ meat,meat'),
    (r'fish,|salmon|tuna|cod\b|mackerel|herring|sardine|trout|halibut|bass', 'fish,seafood'),
    (r'crustacean|shrimp|crab|lobster|crayfish', 'shellfish,crustacean,seafood'),
    (r'mollusk|oyster|clam|mussel|scallop|squid|octopus', 'shellfish,mollusc,seafood'),
]

GROUP_TAG = {'fruit': 'fruit', 'veg': '', 'herb': 'spice', 'fat': 'fat',
             'dairy': 'dairy', 'fish': 'fish,seafood', 'meat': 'meat',
             'poultry': 'poultry,meat', 'nut': 'nut', 'legume': 'legume',
             'grain': 'grain'}


def tags_for(desc, cat):
    d = desc.lower()
    out = set()
    for pattern, tags in TAG_RULES:
        if re.search(pattern, d):
            out.update(t for t in tags.split(',') if t)
    base = GROUP_TAG.get(cat, '')
    out.update(t for t in base.split(',') if t)
    return sorted(out)


def main():
    picked = json.load(open('picked.json'))
    new = [p for p in picked if p['new']]

    taken = set()
    for line in open('/Users/rishirao/workspace/food-is-medicine/build/foods.txt'):
        line = line.strip()
        if line and not line.startswith('#'):
            taken.add(line.split('|')[1])

    out = []
    for p in new:
        name = display_name(p['desc'])
        slug = slugify(name, taken)
        out.append({'group': p['cat'], 'slug': slug, 'name': name,
                    'fdc': p['fdc'], 'tags': tags_for(p['desc'], p['cat']),
                    'usda': p['desc']})
    json.dump(out, open('newfoods.json', 'w'))
    print('prepared %d new foods' % len(out))
    print()
    import random
    random.seed(3)
    for x in random.sample(out, 30):
        print('  %-12s %-40s %s' % (x['group'], x['name'][:38], ','.join(x['tags'])[:44]))


if __name__ == '__main__':
    main()
